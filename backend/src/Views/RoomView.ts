import fs from 'node:fs/promises';

// represents a singular vote from one player to another
type VoteData = { voterId: string, nomineeId: string, questionId: string, categoryId: string };

type PlayerData = { name: string, id: string, connected: boolean }
type QuestionData = { id: string, text: string, icon: string }
type CategoryData = { id: string, name: string, questions: QuestionData[] }
type RoomStatus =
  'waiting_for_players' |
  'accepting_votes' |
  'announcing_question_winner' |
  'announcing_category_winner' |
  'announcing_game_winner' |
  'game_paused' |
  'game_finished';

type GameResultsData = {
  questionWinners: { questionId: string, winnerId: string }[];
  categoryWinners: { categoryId: string, winnerId: string }[];
  gameWinnerId: string | null;
}

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
}

type AppStateData = {
  rooms: RoomData[];
}

// only the data needed to be streamed over websockets
type StreamableRoomData = {
  players: PlayerData[];
  currentCategory: CategoryData;
  currentQuestion: QuestionData;
  currentQuestionVotes: VoteData[];
  status: RoomStatus;
}

export const appState: AppStateData = { rooms: [] };

function makeRoomIdFromName(roomName: string) {
  return roomName.replaceAll(' ', '-').toLowerCase();
}

function randomPlayerId() {
  return Math.ceil(Math.random() * 10000000).toString();
}

type FileCategory = { name: string, id: string }
type FileQuestion = { text: string, cat: string, icon: string }

async function populateRoomContent(roomId: string): Promise<boolean> {
  try {
    const response = await fs.readFile('../../public/assets/questions.json', { encoding: 'utf8' });
    const data: { categories: FileCategory[], questions: FileQuestion[] } = JSON.parse(response);

    const targetRoom = appState.rooms.find(r => r.id == roomId) || null;
    if (!targetRoom) return false;

    data.categories.forEach(category => {
      const newCategory: CategoryData = { name: category.name, id: category.id, questions: [] };
      data.questions
        .filter(q => q.cat == newCategory.id)
        .forEach(q => newCategory.questions.push({ id: q.text, text: q.text, icon: q.icon }))
      targetRoom.categories.push(newCategory);
    })

    return true;
  } catch (err) {
    return false;
  }
}

interface IRoomView {
  createRoom(roomName: string, password: string): Promise<string | null>;
  getRoom(roomId: string): Promise<RoomData | null>;
  addPlayer(roomId: string, playerName: string, roomPasswordAttempt: string): Promise<string | null>;
  // getPlayer(roomId: string, playerId: string): Promise<boolean>;
  disconnectPlayer(roomId: string, playerId: string): Promise<boolean>;
  reconnectPlayer(roomId: string, playerId: string): Promise<boolean>;
  getConnectedPlayers(roomId: string): Promise<PlayerData[] | null>;
  removePlayer(roomId: string, playerId: string): Promise<boolean>;
  updatePlayerVoteForCurrentQuestion(roomId: string, voterId: string, nomineeId: string): Promise<boolean>;
  startGame(roomId: string): Promise<boolean>;
  pauseGame(roomId: string): Promise<boolean>;
  nextQuestion(roomId: string): Promise<boolean>;
  broadcastRoomStateToPlayers(roomId: string): Promise<boolean>;
}

const RoomView: IRoomView = {
  createRoom: async function(roomName: string, password: string): Promise<string | null> {
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
      gameResults: { questionWinners: [], categoryWinners: [], gameWinnerId: null },
      status: 'waiting_for_players',
    }
    appState.rooms.push(newRoom);

    await populateRoomContent(roomId);

    return roomId;
  },
  getRoom: async function(roomId: string): Promise<RoomData | null> {
    return appState.rooms.find(room => room.id == roomId) || null;
  },
  addPlayer: async function(roomId: string, playerName: string, roomPasswordAttempt: string): Promise<string | null> {
    const targetRoom = appState.rooms.find(r => r.id == roomId);
    if (!targetRoom) return null;
    if (targetRoom.status != 'waiting_for_players') return null;
    if (targetRoom.password != roomPasswordAttempt) return null;

    const playerId = randomPlayerId();
    const newPlayer: PlayerData = {
      name: playerName,
      id: playerId,
      connected: true
    }
    targetRoom.players.push(newPlayer);

    return playerId;
  },
  removePlayer: async function(roomId: string, playerId: string): Promise<boolean> {
    const targetRoom = appState.rooms.find(r => r.id == roomId);
    if (!targetRoom) return false;
    if (targetRoom.status != 'waiting_for_players') return false;

    const targetPlayerIndex = targetRoom.players.findIndex(p => p.id == playerId) || null;
    if (!targetPlayerIndex) return false;

    targetRoom.players.splice(targetPlayerIndex, 1);

    return true;
  },
  disconnectPlayer: async function(roomId: string, playerId: string): Promise<boolean> {
    const targetRoom = appState.rooms.find(r => r.id == roomId);
    if (!targetRoom) return false;

    const targetPlayer = targetRoom.players.find(p => p.id == playerId) || null;
    if (!targetPlayer) return false;

    targetPlayer.connected = false;
    return true;
  },
  reconnectPlayer: async function(roomId: string, playerId: string): Promise<boolean> {
    const targetRoom = appState.rooms.find(r => r.id == roomId);
    if (!targetRoom) return false;

    const targetPlayer = targetRoom.players.find(p => p.id == playerId) || null;
    if (!targetPlayer) return false;

    targetPlayer.connected = true;
    return true;
  },
  getConnectedPlayers: async function(roomId: string): Promise<PlayerData[] | null> {
    const targetRoom = appState.rooms.find(r => r.id == roomId);
    if (!targetRoom) return null;

    return targetRoom.players.filter(p => p.connected);
  },
  startGame: async function(roomId: string): Promise<boolean> {
    const targetRoom = appState.rooms.find(r => r.id == roomId);
    if (!targetRoom) return false;

    if (targetRoom.status !== 'waiting_for_players') return false;

    if (targetRoom.categories.length && targetRoom.categories[0]!.questions.length) {
      targetRoom.currentCategoryId = targetRoom.categories[0]!.id;
      targetRoom.currentQuestionId = targetRoom.categories[0]!.questions[0]!.id;
    } else return false;

    targetRoom.status = 'accepting_votes';

    return true;
  },
}

export default RoomView;
