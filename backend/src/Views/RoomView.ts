import fs from 'node:fs/promises';
import path from 'node:path';

// represents a singular vote from one player to another
type VoteData = {
  voterId: string;
  nomineeId: string;
  questionId: string;
  categoryId: string;
};

const bgColors = [
  '#2caeb7',
  '#23b253',
  '#aac92c',
  '#c6a52b',
  '#ce6d2d',
  '#d62f2f',
  '#316be0',
  '#8b31d6',
  '#c932ba',
] as const;
const textColors = [
  '#0f3e42',
  '#0c351a',
  '#363f0f',
  '#4f4112',
  '#442510',
  '#420f0f',
  '#14284f',
  '#311449',
  '#3d1038',
] as const;

export const colors = bgColors.map((bgColor, i) => ({ bg: bgColor, text: textColors[i] })) as {
  bg: (typeof bgColors)[number];
  text: (typeof textColors)[number];
}[];

type Color = (typeof colors)[number];

const colorsPool = bgColors.map((bgColor, i) => ({
  bg: bgColor,
  text: textColors[i],
  used: false,
})) as {
  bg: (typeof bgColors)[number];
  text: (typeof textColors)[number];
  used: boolean;
}[];

function selectUnusedColor(): Color | null {
  const unusedColorIndex = colorsPool.findIndex(c => c.used == false);

  if (unusedColorIndex == -1 || colorsPool[unusedColorIndex] == undefined) return null;
  else {
    colorsPool[unusedColorIndex].used = true;
    return { bg: colorsPool[unusedColorIndex].bg, text: colorsPool[unusedColorIndex].text };
  }
}

function deselectUnusedColor(bgColor: (typeof bgColors)[number]): boolean {
  const unusedColorIndex = colorsPool.findIndex(c => c.bg == bgColor);

  if (unusedColorIndex == -1 || colorsPool[unusedColorIndex] == undefined) return false;
  else {
    colorsPool[unusedColorIndex].used = false;
    return true;
  }
}

type PlayerData = {
  name: string;
  id: string;
  connected: boolean;
  color: Color;
  gameMaster: boolean;
};
type QuestionData = { id: string; text: string; icon: string };
type CategoryData = { id: string; name: string; questions: QuestionData[] };
type RoomStatus =
  | 'waiting_for_players'
  | 'accepting_votes'
  | 'announcing_question_winner'
  | 'announcing_category_winner'
  | 'announcing_game_winner'
  | 'game_finished';

type PodiumSpot = { playerId: string; playerName: string; votes: number };

type GameResultsData = {
  questionWinners: { questionId: string; winnerId: string }[];
  currentPodium: PodiumSpot[];
  categoryWinners: { categoryId: string; winnerId: string }[];
  gameWinnerId: string | null;
};

type RoomData = {
  name: string;
  password: string;
  id: string;
  players: PlayerData[];
  categories: CategoryData[];
  currentCategoryId: string;
  currentQuestionId: string;
  playerVotes: VoteData[];
  gameResults: GameResultsData;
  status: RoomStatus;
  gamePaused: boolean;
};

type AppStateData = {
  rooms: RoomData[];
};

// only the data needed to be streamed over websockets
export type StreamableRoomData = {
  roomId: string;
  players: PlayerData[];
  currentCategory: CategoryData | null;
  currentQuestion: QuestionData | null;
  currentQuestionVotes: VoteData[];
  gameResults: GameResultsData;
  status: RoomStatus;
  gamePaused: boolean;
};

const appState: AppStateData = { rooms: [] };

function makeRoomIdFromName(roomName: string) {
  return roomName.replaceAll(' ', '-').toLowerCase();
}

function randomPlayerId() {
  return Math.ceil(Math.random() * 10000000).toString();
}

type FileCategory = { name: string; id: string };
type FileQuestion = { text: string; cat: string; icon: string };

async function populateRoomContent(roomId: string): Promise<boolean> {
  try {
    const __dirname = import.meta.dirname;
    const fullPath = path.join(__dirname, '..', '..', '..', 'public', 'assets', 'questions2.json');

    const response = await fs.readFile(fullPath, {
      encoding: 'utf8',
    });
    const data: { categories: FileCategory[]; questions: FileQuestion[] } = JSON.parse(response);

    const targetRoom = appState.rooms.find(r => r.id == roomId) || null;
    if (!targetRoom) return false;

    data.categories.forEach(category => {
      const newCategory: CategoryData = {
        name: category.name,
        id: category.id,
        questions: [],
      };
      data.questions
        .filter(q => q.cat == newCategory.id)
        .forEach(q => newCategory.questions.push({ id: q.text, text: q.text, icon: q.icon }));
      targetRoom.categories.push(newCategory);
    });

    return true;
  } catch (err) {
    return false;
  }
}

async function constructBroadcastMessage(targetRoom: RoomData) {
  const currCategory =
    targetRoom.categories.find(c => c.id == targetRoom.currentCategoryId) || null;
  const currQuestion =
    currCategory === null
      ? null
      : currCategory.questions.find(q => q.id == targetRoom.currentQuestionId) || null;
  const currQuestionVotes =
    targetRoom.playerVotes.filter(vote => vote.questionId == targetRoom.currentQuestionId) || [];

  const broadcastMessage: StreamableRoomData = {
    roomId: targetRoom.id,
    status: targetRoom.status,
    players: targetRoom.players,
    currentCategory: currCategory,
    currentQuestion: currQuestion,
    currentQuestionVotes: currQuestionVotes,
    gameResults: targetRoom.gameResults,
    gamePaused: targetRoom.gamePaused,
  };
  return broadcastMessage;
}

interface IRoomView {
  getAllRooms(): Promise<
    {
      roomName: string;
      roomId: string;
      playersNumber: number;
      roomStatus: RoomStatus;
    }[]
  >;
  createRoom(roomName: string, password: string): Promise<string | null>;
  getRoom(roomId: string): Promise<RoomData | null>;
  addPlayer(
    roomId: string,
    playerName: string,
    roomPasswordAttempt: string
  ): Promise<string | null>;
  playerExists(roomId: string, playerId: string): Promise<boolean>;
  disconnectPlayer(roomId: string, playerId: string): Promise<StreamableRoomData | null>;
  reconnectPlayer(roomId: string, playerId: string): Promise<StreamableRoomData | null>;
  getConnectedPlayers(roomId: string): Promise<PlayerData[] | null>;
  removePlayer(roomId: string, playerId: string): Promise<StreamableRoomData | null>;
  updatePlayerVoteForCurrentQuestion(
    roomId: string,
    voterId: string,
    nomineeId: string
  ): Promise<StreamableRoomData | null>;
  startGame(roomId: string): Promise<StreamableRoomData | null>;
  pauseGame(roomId: string): Promise<StreamableRoomData | null>;
  resumeGame(roomId: string): Promise<StreamableRoomData | null>;
  next(roomId: string): Promise<StreamableRoomData | null>;
  isGameMaster(roomId: string, playerId: string): Promise<boolean>;
  getStreamableGameState(roomId: string): Promise<StreamableRoomData | null>;
}

const RoomView: IRoomView = {
  async getAllRooms(): Promise<
    { roomName: string; roomId: string; playersNumber: number; roomStatus: RoomStatus }[]
  > {
    return appState.rooms.map(room => ({
      roomId: room.id,
      roomName: room.name,
      playersNumber: room.players.length,
      roomStatus: room.status,
    }));
  },
  createRoom: async function (roomName: string, password: string): Promise<string | null> {
    const roomId = makeRoomIdFromName(roomName);
    const newRoom: RoomData = {
      name: roomName,
      password: password,
      id: roomId,
      players: [],
      categories: [],
      currentCategoryId: '',
      currentQuestionId: '',
      playerVotes: [],
      gameResults: {
        questionWinners: [],
        categoryWinners: [],
        gameWinnerId: null,
        currentPodium: [
          { playerId: '', playerName: '', votes: 0 },
          { playerId: '', playerName: '', votes: 0 },
          { playerId: '', playerName: '', votes: 0 },
        ],
      },
      status: 'waiting_for_players',
      gamePaused: false,
    };
    appState.rooms.push(newRoom);

    if ((await populateRoomContent(roomId)) == false) return null;

    return roomId;
  },
  getRoom: async function (roomId: string): Promise<RoomData | null> {
    return appState.rooms.find(room => room.id == roomId) || null;
  },
  addPlayer: async function (
    roomId: string,
    playerName: string,
    roomPasswordAttempt: string
  ): Promise<string | null> {
    const targetRoom = await RoomView.getRoom(roomId);
    if (!targetRoom) return null;
    // if (targetRoom.status != 'waiting_for_players') return null;
    if (targetRoom.password != roomPasswordAttempt) return null;

    const playerColor = selectUnusedColor();
    if (playerColor == null) return null;

    const isFirstPlayerInRoom = targetRoom.players.length == 0;

    const playerId = randomPlayerId();
    const newPlayer: PlayerData = {
      name: playerName,
      id: playerId,
      connected: true,
      color: playerColor,
      gameMaster: isFirstPlayerInRoom,
    };
    targetRoom.players.push(newPlayer);

    return playerId;
  },
  playerExists: async function (roomId: string, playerId: string): Promise<boolean> {
    const targetRoom = await RoomView.getRoom(roomId);
    if (!targetRoom) return false;

    return targetRoom.players.find(p => p.id === playerId) !== undefined;
  },
  removePlayer: async function (
    roomId: string,
    playerId: string
  ): Promise<StreamableRoomData | null> {
    const targetRoom = await RoomView.getRoom(roomId);
    if (!targetRoom) return null;
    // if (targetRoom.status != 'waiting_for_players') return null;

    const targetPlayerIndex = targetRoom.players.findIndex(p => p.id == playerId);
    if (targetPlayerIndex === -1) return null;

    deselectUnusedColor(targetRoom.players[targetPlayerIndex]!.color.bg);
    targetRoom.players.splice(targetPlayerIndex, 1);

    return constructBroadcastMessage(targetRoom);
  },
  disconnectPlayer: async function (
    roomId: string,
    playerId: string
  ): Promise<StreamableRoomData | null> {
    const targetRoom = await RoomView.getRoom(roomId);
    if (!targetRoom) return null;

    const targetPlayer = targetRoom.players.find(p => p.id == playerId) || null;
    if (!targetPlayer) return null;

    targetPlayer.connected = false;
    return constructBroadcastMessage(targetRoom);
  },
  reconnectPlayer: async function (
    roomId: string,
    playerId: string
  ): Promise<StreamableRoomData | null> {
    const targetRoom = await RoomView.getRoom(roomId);
    if (!targetRoom) return null;

    const targetPlayer = targetRoom.players.find(p => p.id == playerId) || null;
    if (!targetPlayer) return null;

    targetPlayer.connected = true;
    return constructBroadcastMessage(targetRoom);
  },
  getConnectedPlayers: async function (roomId: string): Promise<PlayerData[] | null> {
    const targetRoom = await RoomView.getRoom(roomId);
    if (!targetRoom) return null;

    return targetRoom.players.filter(p => p.connected);
  },
  startGame: async function (roomId: string): Promise<StreamableRoomData | null> {
    const targetRoom = await RoomView.getRoom(roomId);
    if (!targetRoom) return null;

    if (targetRoom.status !== 'waiting_for_players') return null;

    await RoomView.next(roomId);

    return constructBroadcastMessage(targetRoom);
  },
  pauseGame: async function (roomId: string): Promise<StreamableRoomData | null> {
    const targetRoom = await RoomView.getRoom(roomId);
    if (!targetRoom) return null;

    if (targetRoom.gamePaused) return null;

    targetRoom.gamePaused = true;
    return constructBroadcastMessage(targetRoom);
  },
  resumeGame: async function (roomId: string): Promise<StreamableRoomData | null> {
    const targetRoom = await RoomView.getRoom(roomId);
    if (!targetRoom) return null;

    if (!targetRoom.gamePaused) return null;

    targetRoom.gamePaused = false;
    return constructBroadcastMessage(targetRoom);
  },
  next: async function (roomId: string): Promise<StreamableRoomData | null> {
    const targetRoom = await RoomView.getRoom(roomId);
    if (!targetRoom) return null;

    const allConnectedPlayersHaveVoted = !targetRoom.players
      .filter(p => p.connected)
      .map(
        p =>
          targetRoom.playerVotes.find(
            vote => vote.voterId == p.id && vote.questionId == targetRoom.currentQuestionId
          )?.voterId || null
      )
      .includes(null);

    const updateQuestionWinners = () => {
      const podium: PodiumSpot[] = targetRoom.players
        .map(p => ({
          playerId: p.id,
          playerName: p.name,
          votes: targetRoom.playerVotes.filter(vote => {
            return vote.questionId == targetRoom.currentQuestionId && vote.nomineeId == p.id;
          }).length,
        }))
        .sort((p1, p2) => p2.votes - p1.votes);

      const winnerId = podium[0]!.playerId;
      targetRoom.gameResults.questionWinners.push({
        winnerId: winnerId,
        questionId: targetRoom.currentQuestionId,
      });

      targetRoom.gameResults.currentPodium = podium;
    };

    const updateCategoryWinners = () => {
      const podium: PodiumSpot[] = targetRoom.players
        .map(p => ({
          playerId: p.id,
          playerName: p.name,
          votes: targetRoom.playerVotes.filter(vote => {
            return vote.categoryId == targetRoom.currentCategoryId && vote.nomineeId == p.id;
          }).length,
        }))
        .sort((p1, p2) => p2.votes - p1.votes);

      const winnerId = podium[0]!.playerId;
      targetRoom.gameResults.categoryWinners.push({
        winnerId: winnerId,
        categoryId: targetRoom.currentCategoryId,
      });

      targetRoom.gameResults.currentPodium = podium;
    };

    const updateGameWinner = () => {
      const podium: PodiumSpot[] = targetRoom.players
        .map(p => ({
          playerId: p.id,
          playerName: p.name,
          votes: targetRoom.playerVotes.filter(vote => {
            return vote.nomineeId == p.id;
          }).length,
        }))
        .sort((p1, p2) => p2.votes - p1.votes);

      targetRoom.gameResults.gameWinnerId = podium[0]!.playerId;

      targetRoom.gameResults.currentPodium = podium;
    };

    let nextQuestionInCurrCategoryExists;
    let nextCategoryExists;

    const currCategoryIndex = targetRoom.categories.findIndex(
      c => c.id == targetRoom.currentCategoryId
    );

    const currCategory = currCategoryIndex != -1 ? targetRoom.categories[currCategoryIndex]! : null;
    const currQuestionIndex = currCategory
      ? currCategory.questions.findIndex(q => q.id == targetRoom.currentQuestionId)
      : -1;

    if (currQuestionIndex === -1) {
      nextCategoryExists = false;
    } else {
      if (currCategory !== null && currCategoryIndex !== -1)
        nextCategoryExists = currCategoryIndex + 1 < targetRoom.categories.length;
      else nextCategoryExists = false;
    }

    if (currCategoryIndex === -1) {
      nextQuestionInCurrCategoryExists = false;
    } else {
      if (currCategory && currQuestionIndex !== -1)
        nextQuestionInCurrCategoryExists = currQuestionIndex + 1 < currCategory.questions.length;
      else nextQuestionInCurrCategoryExists = false;
    }

    const advanceToNextQuestion = () => {
      targetRoom.currentQuestionId =
        targetRoom.categories[currCategoryIndex!]!.questions[currQuestionIndex! + 1]!.id;
    };

    const advanceToNextCategory = () => {
      targetRoom.currentCategoryId = targetRoom.categories[currCategoryIndex! + 1]!.id;
      targetRoom.currentQuestionId =
        targetRoom.categories[currCategoryIndex! + 1]!.questions[0]!.id;
    };

    const advanceToFirstQuestion = () => {
      targetRoom.currentCategoryId = targetRoom.categories[0]!.id;
      targetRoom.currentQuestionId = targetRoom.categories[0]!.questions[0]!.id;
    };

    const finishGame = () => {
      // save to a database or something?
    };

    switch (targetRoom.status) {
      case 'accepting_votes':
        if (allConnectedPlayersHaveVoted) {
          updateQuestionWinners();
          targetRoom.status = 'announcing_question_winner';
        } else return null;
        break;

      case 'announcing_question_winner':
        if (nextQuestionInCurrCategoryExists) {
          advanceToNextQuestion();
          targetRoom.status = 'accepting_votes';
        } else {
          updateCategoryWinners();
          targetRoom.status = 'announcing_category_winner';
        }
        break;

      case 'announcing_category_winner':
        if (nextCategoryExists) {
          advanceToNextCategory();
          targetRoom.status = 'accepting_votes';
        } else {
          updateGameWinner();
          targetRoom.status = 'announcing_game_winner';
        }
        break;

      case 'waiting_for_players':
        advanceToFirstQuestion();
        targetRoom.status = 'accepting_votes';
        break;

      case 'announcing_game_winner':
        finishGame();
        targetRoom.status = 'game_finished';
        break;

      case 'game_finished':
        // nothing to do?
        break;

      default:
        break;
    }

    return constructBroadcastMessage(targetRoom);
  },
  updatePlayerVoteForCurrentQuestion: async function (
    roomId: string,
    voterId: string,
    nomineeId: string
  ): Promise<StreamableRoomData | null> {
    const targetRoom = await RoomView.getRoom(roomId);
    if (!targetRoom) return null;
    if (targetRoom.status !== 'accepting_votes') return null;
    if (voterId == nomineeId) return null; // cant vote for self

    const newVote: VoteData = {
      categoryId: targetRoom.currentCategoryId,
      questionId: targetRoom.currentQuestionId,
      voterId: voterId,
      nomineeId: nomineeId,
    };

    const existingVoteIndex = targetRoom.playerVotes.findIndex(
      vote =>
        vote.categoryId == targetRoom.currentCategoryId &&
        vote.questionId == targetRoom.currentQuestionId &&
        vote.voterId == voterId
    );

    if (existingVoteIndex !== -1) {
      targetRoom.playerVotes[existingVoteIndex] = newVote;
    } else {
      targetRoom.playerVotes.push(newVote);
    }

    return constructBroadcastMessage(targetRoom);
  },
  getStreamableGameState: async function (roomId: string): Promise<StreamableRoomData | null> {
    const targetRoom = await RoomView.getRoom(roomId);
    if (!targetRoom) return null;

    return constructBroadcastMessage(targetRoom);
  },
  isGameMaster: async function (roomId: string, playerId: string): Promise<boolean> {
    const targetRoom = await RoomView.getRoom(roomId);
    if (!targetRoom) return false;

    const player = targetRoom.players.find(p => p.id === playerId);
    if (player == undefined) return false;

    return player.gameMaster;
  },
};

export default RoomView;
