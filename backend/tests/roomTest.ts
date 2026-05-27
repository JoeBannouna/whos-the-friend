import fs from 'fs/promises';
import { exit } from 'node:process';
import RoomView, { type StreamableRoomData } from '../src/Views/RoomView.js';
import { strict as assert } from 'node:assert';

let haltTestOnFail = true;

let isCurrentTestPassed = true;
function check(fn: () => boolean, silentSuccess: boolean = false): void {
  const src = fn.toString().replace(/^\(\s*\)\s*=>\s*/, '');
  try {
    assert.ok(fn(), src);
    if (!silentSuccess) console.log('\x1b[32m' + 'ASSERT: ' + src + ' passed.' + '\x1b[0m');
  } catch (err) {
    console.log('\x1b[31m' + 'ASSERT: ' + src + ' failed.' + '\x1b[0m');
    isCurrentTestPassed = false;
    if (haltTestOnFail) exit(1);
  }
}

function verifyObject(obj1: any, obj2: any, silentSuccess: boolean = false) {
  try {
    assert.deepStrictEqual(obj1, obj2);
    if (!silentSuccess)
      console.log('\x1b[36m' + 'OBJECT-MATCH: ' + 'verifyObject()' + ' passed.' + '\x1b[0m');
  } catch (err) {
    console.log('\x1b[31m' + 'OBJECT-MATCH: ' + 'verifyObject()' + ' failed.' + '\x1b[0m');
    console.log(obj1, obj2);
    console.log(err);
    if (haltTestOnFail) exit(1);
  }
}

function assertDefined<T>(
  value: T,
  label: string,
  silentSuccess: boolean = false
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    console.log('\x1b[31m' + 'ASSERT-DEFINED: ' + label + ' is defined failed.\x1b[0m');
    isCurrentTestPassed = false;
    throw new Error(`${label} is ${value}`);
  }
  if (!silentSuccess)
    console.log('\x1b[35m' + 'ASSERT-DEFINED: ' + label + ' is defined passed.\x1b[0m');
}

type FileCategory = { name: string; id: string };
type FileQuestion = { text: string; cat: string; icon: string };

let jsonQuestions: { categories: FileCategory[]; questions: FileQuestion[] } = {
  categories: [],
  questions: [],
};
async function setQuestionsVariable() {
  try {
    const response = await fs.readFile('../../public/assets/questions.json', {
      encoding: 'utf8',
    });
    const data: { categories: FileCategory[]; questions: FileQuestion[] } = JSON.parse(response);
    jsonQuestions = data;
  } catch (err) {}
}

const mainRoomGameCycleTest = async () => {
  isCurrentTestPassed = true;

  await setQuestionsVariable();

  const roomName = 'My Awesome Room';
  const roomPass = '12345678';
  const roomId = await RoomView.createRoom(roomName, roomPass);
  assertDefined(roomId, 'roomId');
  check(() => roomId == 'my-awesome-room');

  const room = await RoomView.getRoom(roomId);
  assertDefined(room, 'room');
  check(() => room.id === roomId);
  check(() => room.password === roomPass);

  check(() => room.players.length === 0);
  check(() => room.categories.length !== 0);
  check(() => room.categories[0]!.questions.length !== 0);
  check(() => room.playerVotes.length === 0);

  check(() => room.gameResults.questionWinners.length === 0);
  check(() => room.gameResults.categoryWinners.length === 0);
  check(() => room.gameResults.gameWinnerId === null);

  check(() => room.status === 'waiting_for_players');
  check(() => room.gamePaused === false);

  check(() => room.currentCategoryId === '');
  check(() => room.currentQuestionId === '');

  const expectedBroadcastMessage: StreamableRoomData = {
    status: 'waiting_for_players',
    players: [],
    gameResults: {
      gameWinnerId: null,
      categoryWinners: [],
      questionWinners: [],
      currentPodium: [
        { playerId: '', playerName: '', votes: 0 },
        { playerId: '', playerName: '', votes: 0 },
        { playerId: '', playerName: '', votes: 0 },
      ],
    },
    gamePaused: false,
    currentQuestion: null,
    currentCategory: null,
    currentQuestionVotes: [],
  };

  const players = ['John', 'Jay', 'Jimmy', 'Jordan', 'Jimbo'];

  const failedAttempt = await RoomView.addPlayer(roomId, 'Jared', 'wrong-password');
  check(() => failedAttempt === null);
  check(() => room.players.length === 0);

  let addedPlayerId: string | null = null;
  for (const playerName of players)
    addedPlayerId = await RoomView.addPlayer(roomId, playerName, roomPass);

  expectedBroadcastMessage.players = [
    { name: 'John', id: room.players[0]!.id, connected: true },
    { name: 'Jay', id: room.players[1]!.id, connected: true },
    { name: 'Jimmy', id: room.players[2]!.id, connected: true },
    { name: 'Jordan', id: room.players[3]!.id, connected: true },
    { name: 'Jimbo', id: room.players[4]!.id, connected: true },
  ];

  check(() => room.players.length === players.length);
  assertDefined(addedPlayerId, 'addedPlayerId');
  check(() => addedPlayerId === room.players[4]!.id);

  const addedPlayerExists = await RoomView.playerExists(roomId, addedPlayerId);
  check(() => addedPlayerExists === true);

  let allPlayersWereAdded = true;
  for (const playerName of players)
    if (!room.players.map(pData => pData.name).includes(playerName)) allPlayersWereAdded = false;
  check(() => allPlayersWereAdded);

  const connectedPlayers1 = await RoomView.getConnectedPlayers(roomId);
  assertDefined(connectedPlayers1, 'connectedPlayers');
  check(() => connectedPlayers1.length === players.length);

  const disconnectPlayerResponse = await RoomView.disconnectPlayer(roomId, room.players[0]!.id);
  expectedBroadcastMessage.players[0]!.connected = false;
  verifyObject(disconnectPlayerResponse, expectedBroadcastMessage);

  const connectedPlayers2 = await RoomView.getConnectedPlayers(roomId);
  assertDefined(connectedPlayers2, 'connectedPlayers');
  check(() => connectedPlayers2.length === players.length - 1);

  const reconnectedPlayerResponse = await RoomView.reconnectPlayer(roomId, room.players[0]!.id);
  expectedBroadcastMessage.players[0]!.connected = true;
  verifyObject(reconnectedPlayerResponse, expectedBroadcastMessage);

  const connectedPlayers3 = await RoomView.getConnectedPlayers(roomId);
  assertDefined(connectedPlayers3, 'connectedPlayers');
  check(() => connectedPlayers3.length === players.length);

  const removedPlayerIndex = room.players.length - 1;
  const removedPlayerId = room.players[removedPlayerIndex]!.id;
  const removePlayerResponse = await RoomView.removePlayer(roomId, removedPlayerId);

  expectedBroadcastMessage.players.splice(removedPlayerIndex, 1);
  verifyObject(removePlayerResponse, expectedBroadcastMessage);
  verifyObject(removePlayerResponse, await RoomView.getStreamableGameState(roomId));
  check(() => room.players.length === players.length - 1);

  const removedPlayerExists = await RoomView.playerExists(roomId, removedPlayerId);
  check(() => removedPlayerExists === false);

  const initialCategory = jsonQuestions.categories[0]!;
  const initialCategoryQuestions = jsonQuestions.questions.filter(
    q => q.cat == initialCategory.id
  )!;
  expectedBroadcastMessage.currentQuestion = {
    id: initialCategoryQuestions[0]!.text,
    text: initialCategoryQuestions[0]!.text,
    icon: initialCategoryQuestions[0]!.icon,
  };
  expectedBroadcastMessage.currentCategory = {
    name: initialCategory.name,
    id: initialCategory.id,
    questions: room.categories.find(c => c.id === initialCategory.id)?.questions || [],
  };

  let startGameResponse = await RoomView.startGame(roomId);
  expectedBroadcastMessage.status = 'accepting_votes';
  verifyObject(startGameResponse, expectedBroadcastMessage);

  startGameResponse = await RoomView.startGame(roomId);
  check(() => startGameResponse === null);

  let pauseGameResponse = await RoomView.pauseGame(roomId);
  expectedBroadcastMessage.gamePaused = true;
  verifyObject(pauseGameResponse, expectedBroadcastMessage);
  check(() => room.gamePaused === true);

  pauseGameResponse = await RoomView.pauseGame(roomId);
  check(() => pauseGameResponse === null);
  check(() => room.gamePaused === true);

  let resumeGameResponse = await RoomView.resumeGame(roomId);
  expectedBroadcastMessage.gamePaused = false;
  verifyObject(resumeGameResponse, expectedBroadcastMessage);
  check(() => room.gamePaused === false);

  resumeGameResponse = await RoomView.resumeGame(roomId);
  check(() => resumeGameResponse === null);
  check(() => room.gamePaused === false);

  // attempt to announce results with zero votes
  let nextResponse = await RoomView.next(roomId);
  check(() => nextResponse === null);

  const johnId = connectedPlayers1.find(p => p.name == 'John')!.id;
  const jayId = connectedPlayers1.find(p => p.name == 'Jay')!.id;
  const jimmyId = connectedPlayers1.find(p => p.name == 'Jimmy')!.id;
  const jordanId = connectedPlayers1.find(p => p.name == 'Jordan')!.id;

  await RoomView.disconnectPlayer(roomId, jimmyId);
  expectedBroadcastMessage.players.find(p => p.name == 'Jimmy')!.connected = false;

  const voteForSelfResponse = await RoomView.updatePlayerVoteForCurrentQuestion(
    roomId,
    johnId,
    johnId
  );
  check(() => voteForSelfResponse === null);

  const voteResponse1 = await RoomView.updatePlayerVoteForCurrentQuestion(roomId, johnId, jayId);
  check(() => voteResponse1 !== null);
  expectedBroadcastMessage.currentQuestionVotes.push({
    voterId: johnId,
    nomineeId: jayId,
    questionId: expectedBroadcastMessage.currentQuestion.id,
    categoryId: expectedBroadcastMessage.currentCategory.id,
  });
  verifyObject(voteResponse1, expectedBroadcastMessage);

  const voteResponse2 = await RoomView.updatePlayerVoteForCurrentQuestion(roomId, jayId, jordanId);
  check(() => voteResponse2 !== null);
  expectedBroadcastMessage.currentQuestionVotes.push({
    voterId: jayId,
    nomineeId: jordanId,
    questionId: expectedBroadcastMessage.currentQuestion.id,
    categoryId: expectedBroadcastMessage.currentCategory.id,
  });
  verifyObject(voteResponse2, expectedBroadcastMessage);

  // everyone voted except jimmy (disconnected) and jordan (connected)

  // .. now attempt to vote
  nextResponse = await RoomView.next(roomId);
  check(() => nextResponse === null);

  // now make jordan vote..
  const voteResponse3 = await RoomView.updatePlayerVoteForCurrentQuestion(roomId, jordanId, jayId);
  check(() => voteResponse3 !== null);
  expectedBroadcastMessage.currentQuestionVotes.push({
    voterId: jordanId,
    nomineeId: jayId,
    questionId: expectedBroadcastMessage.currentQuestion.id,
    categoryId: expectedBroadcastMessage.currentCategory.id,
  });
  verifyObject(voteResponse3, expectedBroadcastMessage);

  // all connected players have votes, should be able to move to next step
  nextResponse = await RoomView.next(roomId);
  check(() => nextResponse !== null);
  expectedBroadcastMessage.status = 'announcing_question_winner';
  expectedBroadcastMessage.gameResults.questionWinners.push({
    winnerId: jayId,
    questionId: expectedBroadcastMessage.currentQuestion.id,
  });
  expectedBroadcastMessage.gameResults.currentPodium = [
    { playerId: jayId, playerName: 'Jay', votes: 2 },
    { playerId: jordanId, playerName: 'Jordan', votes: 1 },
    { playerId: johnId, playerName: 'John', votes: 0 },
  ];
  verifyObject(nextResponse, expectedBroadcastMessage);

  // after announcing said winners, we can move on to the next question!!
  nextResponse = await RoomView.next(roomId);
  check(() => nextResponse !== null);
  check(() => room.currentQuestionId == initialCategoryQuestions[1]!.text);

  expectedBroadcastMessage.status = 'accepting_votes';
  expectedBroadcastMessage.gameResults.categoryWinners = [];
  expectedBroadcastMessage.currentQuestionVotes = [];

  expectedBroadcastMessage.currentCategory = {
    name: initialCategory.name,
    id: initialCategory.id,
    questions: room.categories.find(c => c.id === initialCategory.id)?.questions || [],
  };
  expectedBroadcastMessage.currentQuestion = {
    id: initialCategoryQuestions[1]!.text,
    text: initialCategoryQuestions[1]!.text,
    icon: initialCategoryQuestions[1]!.icon,
  };
  verifyObject(nextResponse, expectedBroadcastMessage);

  // keep advancing questions and voting untill the last question
  // in the category is reached
  let announceWinnersResponse: StreamableRoomData | null = null;
  let acceptVotesResponse: StreamableRoomData | null = null;
  for (let i = 0; i < expectedBroadcastMessage.currentCategory.questions.length - 1; i++) {
    const isLastLoop = i == expectedBroadcastMessage.currentCategory.questions.length - 2;

    const vote1 = await RoomView.updatePlayerVoteForCurrentQuestion(roomId, johnId, jayId);
    const vote2 = await RoomView.updatePlayerVoteForCurrentQuestion(roomId, jayId, jordanId);
    const vote3 = await RoomView.updatePlayerVoteForCurrentQuestion(roomId, jordanId, jayId);
    announceWinnersResponse = await RoomView.next(roomId); // announce winners
    acceptVotesResponse = await RoomView.next(roomId); // accept votes for next question

    check(() => vote1 !== null, true);
    check(() => vote2 !== null, true);
    check(() => vote3 !== null, true);

    assertDefined(announceWinnersResponse, 'announceWinnersResponse', true);
    check(() => announceWinnersResponse!.status === 'announcing_question_winner', true);

    assertDefined(acceptVotesResponse, 'acceptVotesResponse', true);
    if (!isLastLoop) check(() => acceptVotesResponse!.status === 'accepting_votes', true);
  }

  // last question has been voted and wins have been annonced
  // then then moved to announcing category winner
  check(() => room.status === 'announcing_category_winner');
  check(
    () =>
      room.gameResults.categoryWinners.length === 1 &&
      room.gameResults.categoryWinners[0]!.winnerId === jayId
  );
  verifyObject(room.gameResults.currentPodium, [
    { playerId: jayId, playerName: 'Jay', votes: 16 },
    { playerId: jordanId, playerName: 'Jordan', votes: 8 },
    { playerId: johnId, playerName: 'John', votes: 0 },
  ]);

  assertDefined(acceptVotesResponse, 'acceptVotesResponse');
  check(() => acceptVotesResponse.status === 'announcing_category_winner');
  check(
    () =>
      acceptVotesResponse.gameResults.questionWinners.length ==
        acceptVotesResponse.currentCategory?.questions.length &&
      acceptVotesResponse.gameResults.categoryWinners.length === 1 &&
      acceptVotesResponse.gameResults.categoryWinners[0]!.winnerId === jayId
  );
  verifyObject(acceptVotesResponse.gameResults.currentPodium, [
    { playerId: jayId, playerName: 'Jay', votes: 16 },
    { playerId: jordanId, playerName: 'Jordan', votes: 8 },
    { playerId: johnId, playerName: 'John', votes: 0 },
  ]);

  const moveToNextCategory = await RoomView.next(roomId);
  assertDefined(moveToNextCategory, 'moveToNextCategory');
  check(() => moveToNextCategory.status == 'accepting_votes');
  check(() => moveToNextCategory.currentCategory?.id == jsonQuestions.categories[1]!.id);
  check(() => moveToNextCategory.gameResults.categoryWinners.length === 1);
  check(() => moveToNextCategory.currentQuestionVotes.length == 0);

  // no one voted yet
  const attemptFailedMove = await RoomView.next(roomId);
  check(() => attemptFailedMove === null);

  let advanceToNextCategory: StreamableRoomData | null = null;
  // now we finish off all the other categories and finish the game
  for (let k = 1; k < jsonQuestions.categories.length; k++) {
    const currJsonQuestions = jsonQuestions.questions.filter(
      q => q.cat == jsonQuestions.categories[k]!.id
    )!;

    let announceWinnersResponseLoop: StreamableRoomData | null = null;
    let acceptVotesResponseLoop: StreamableRoomData | null = null;
    for (let i = 0; i < currJsonQuestions.length; i++) {
      const isLastLoop = expectedBroadcastMessage.currentCategory.questions.length - 1;

      const vote1 = await RoomView.updatePlayerVoteForCurrentQuestion(roomId, johnId, jayId);
      const vote2 = await RoomView.updatePlayerVoteForCurrentQuestion(roomId, jayId, jordanId);
      const vote3 = await RoomView.updatePlayerVoteForCurrentQuestion(roomId, jordanId, jayId);
      announceWinnersResponseLoop = await RoomView.next(roomId); // announce winners
      acceptVotesResponseLoop = await RoomView.next(roomId); // accept votes for next question

      check(() => vote1 !== null, true);
      check(() => vote2 !== null, true);
      check(() => vote3 !== null, true);

      assertDefined(announceWinnersResponseLoop, 'announceWinnersResponse', true);
      check(() => announceWinnersResponseLoop!.status === 'announcing_question_winner', true);

      assertDefined(acceptVotesResponseLoop, 'acceptVotesResponse', true);
      if (!isLastLoop) check(() => acceptVotesResponseLoop!.status === 'accepting_votes', true);
    }
    assertDefined(acceptVotesResponseLoop, 'acceptVotesResponse');
    check(() => acceptVotesResponseLoop.status === 'announcing_category_winner');

    advanceToNextCategory = await RoomView.next(roomId);
  }

  const announceGameWinner = advanceToNextCategory;
  assertDefined(announceGameWinner, 'announceGameWinner');
  check(() => announceGameWinner.status === 'announcing_game_winner');
  check(() => announceGameWinner.gameResults.gameWinnerId === jayId);
  check(
    () => announceGameWinner.gameResults.categoryWinners.length === jsonQuestions.categories.length
  );

  const finishingGame = await RoomView.next(roomId);
  assertDefined(finishingGame, 'finishingGame');
  check(() => finishingGame.status === 'game_finished');

  return isCurrentTestPassed;
};

const tests: (() => Promise<boolean>)[] = [mainRoomGameCycleTest];

const roomTest = async (): Promise<boolean> => {
  console.log('Testing module: room\n');

  let totalTestsPassed = 0;
  for (let i = 0; i < tests.length; i++) {
    if (await tests[i]!()) {
      totalTestsPassed++;
      console.log(`Test ${i + 1} passed!`);
    } else console.log(`Test ${i + 1} failed!`);
  }

  const passed = totalTestsPassed == tests.length;

  console.log(
    (passed ? '\x1b[32m' : '\x1b[31m') +
      `\n\n${totalTestsPassed}/${tests.length} passed.` +
      '\x1b[0m'
  );
  return passed;
};

export default roomTest;
