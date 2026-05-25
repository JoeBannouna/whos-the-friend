import RoomView, { appState } from '../src/Views/RoomView.js';
import { strict as assert } from 'node:assert';
let isCurrentTestPassed = true;
function check(fn) {
    const src = fn.toString().replace(/^\(\s*\)\s*=>\s*/, '');
    try {
        assert.ok(fn(), src);
        console.log("\x1b[32m" + "ASSERT: " + src + " passed." + "\x1b[0m");
    }
    catch (err) {
        console.log("\x1b[31m" + "ASSERT: " + src + " failed." + "\x1b[0m");
        isCurrentTestPassed = false;
    }
}
function assertDefined(value, label) {
    if (value === undefined || value === null) {
        console.log("\x1b[31m" + "ASSERT: " + label + " is defined failed.\x1b[0m");
        isCurrentTestPassed = false;
        throw new Error(`${label} is ${value}`);
    }
    console.log("\x1b[32m" + "ASSERT: " + label + " is defined passed.\x1b[0m");
}
const createRoomAndRunGame = async () => {
    isCurrentTestPassed = true;
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
    check(() => room.categories[0].questions.length !== 0);
    check(() => room.playerVotes.length === 0);
    check(() => room.gameResults.questionWinners.length === 0);
    check(() => room.gameResults.categoryWinners.length === 0);
    check(() => room.gameResults.gameWinnerId === null);
    check(() => room.status === 'waiting_for_players');
    check(() => room.currentCategoryId === '');
    check(() => room.currentQuestionId === '');
    const players = ['John', 'Jay', 'Jimmy', 'Jordan', 'Jimbo'];
    const failedAttempt = await RoomView.addPlayer(roomId, 'Jared', 'wrong-password');
    check(() => failedAttempt === null);
    check(() => room.players.length === 0);
    for (const playerName of players)
        await RoomView.addPlayer(roomId, playerName, roomPass);
    check(() => room.players.length === players.length);
    let allPlayersWereAdded = true;
    for (const playerName of players)
        if (!room.players.map(pData => pData.name).includes(playerName))
            allPlayersWereAdded = false;
    check(() => allPlayersWereAdded);
    const connectedPlayers1 = await RoomView.getConnectedPlayers(roomId);
    assertDefined(connectedPlayers1, 'connectedPlayers');
    check(() => connectedPlayers1.length === players.length);
    await RoomView.disconnectPlayer(roomId, room.players[0].id);
    const connectedPlayers2 = await RoomView.getConnectedPlayers(roomId);
    assertDefined(connectedPlayers2, 'connectedPlayers');
    check(() => connectedPlayers2.length === players.length - 1);
    await RoomView.reconnectPlayer(roomId, room.players[0].id);
    const connectedPlayers3 = await RoomView.getConnectedPlayers(roomId);
    assertDefined(connectedPlayers3, 'connectedPlayers');
    check(() => connectedPlayers3.length === players.length);
    await RoomView.removePlayer(roomId, room.players[room.players.length - 1].id);
    check(() => room.players.length === players.length - 1);
    let startGameResponse = await RoomView.startGame(roomId);
    check(() => startGameResponse === true);
    startGameResponse = await RoomView.startGame(roomId);
    check(() => startGameResponse === false);
    console.log(room);
    return isCurrentTestPassed;
};
const tests = [createRoomAndRunGame];
const roomTest = async () => {
    console.log("Testing module: room\n");
    let totalTestsPassed = 0;
    for (let i = 0; i < tests.length; i++) {
        if (await tests[i]()) {
            totalTestsPassed++;
            console.log(`Test ${i + 1} passed!`);
        }
        else
            console.log(`Test ${i + 1} failed!`);
    }
    const passed = totalTestsPassed == tests.length;
    console.log((passed ? "\x1b[32m" : "\x1b[31m") + `\n\n${totalTestsPassed}/${tests.length} passed.` + "\x1b[0m");
    return passed;
};
export default roomTest;
//# sourceMappingURL=roomTest.js.map