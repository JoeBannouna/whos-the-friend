import fs from 'node:fs/promises';
export const appState = { rooms: [] };
function makeRoomIdFromName(roomName) {
    return roomName.replaceAll(' ', '-').toLowerCase();
}
function randomPlayerId() {
    return Math.ceil(Math.random() * 10000000).toString();
}
async function populateRoomContent(roomId) {
    try {
        const response = await fs.readFile('../../public/assets/questions.json', { encoding: 'utf8' });
        const data = JSON.parse(response);
        const targetRoom = appState.rooms.find(r => r.id == roomId) || null;
        if (!targetRoom)
            return false;
        data.categories.forEach(category => {
            const newCategory = { name: category.name, id: category.id, questions: [] };
            data.questions
                .filter(q => q.cat == newCategory.id)
                .forEach(q => newCategory.questions.push({ id: q.text, text: q.text, icon: q.icon }));
            targetRoom.categories.push(newCategory);
        });
        return true;
    }
    catch (err) {
        return false;
    }
}
const RoomView = {
    createRoom: async function (roomName, password) {
        const roomId = makeRoomIdFromName(roomName);
        const newRoom = {
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
        };
        appState.rooms.push(newRoom);
        await populateRoomContent(roomId);
        return roomId;
    },
    getRoom: async function (roomId) {
        return appState.rooms.find(room => room.id == roomId) || null;
    },
    addPlayer: async function (roomId, playerName, roomPasswordAttempt) {
        const targetRoom = appState.rooms.find(r => r.id == roomId);
        if (!targetRoom)
            return null;
        if (targetRoom.status != 'waiting_for_players')
            return null;
        if (targetRoom.password != roomPasswordAttempt)
            return null;
        const playerId = randomPlayerId();
        const newPlayer = {
            name: playerName,
            id: playerId,
            connected: true
        };
        targetRoom.players.push(newPlayer);
        return playerId;
    },
    removePlayer: async function (roomId, playerId) {
        const targetRoom = appState.rooms.find(r => r.id == roomId);
        if (!targetRoom)
            return false;
        if (targetRoom.status != 'waiting_for_players')
            return false;
        const targetPlayerIndex = targetRoom.players.findIndex(p => p.id == playerId) || null;
        if (!targetPlayerIndex)
            return false;
        targetRoom.players.splice(targetPlayerIndex, 1);
        return true;
    },
    disconnectPlayer: async function (roomId, playerId) {
        const targetRoom = appState.rooms.find(r => r.id == roomId);
        if (!targetRoom)
            return false;
        const targetPlayer = targetRoom.players.find(p => p.id == playerId) || null;
        if (!targetPlayer)
            return false;
        targetPlayer.connected = false;
        return true;
    },
    reconnectPlayer: async function (roomId, playerId) {
        const targetRoom = appState.rooms.find(r => r.id == roomId);
        if (!targetRoom)
            return false;
        const targetPlayer = targetRoom.players.find(p => p.id == playerId) || null;
        if (!targetPlayer)
            return false;
        targetPlayer.connected = true;
        return true;
    },
    getConnectedPlayers: async function (roomId) {
        const targetRoom = appState.rooms.find(r => r.id == roomId);
        if (!targetRoom)
            return null;
        return targetRoom.players.filter(p => p.connected);
    },
    startGame: async function (roomId) {
        const targetRoom = appState.rooms.find(r => r.id == roomId);
        if (!targetRoom)
            return false;
        if (targetRoom.status !== 'waiting_for_players')
            return false;
        if (targetRoom.categories.length && targetRoom.categories[0].questions.length) {
            targetRoom.currentCategoryId = targetRoom.categories[0].id;
            targetRoom.currentQuestionId = targetRoom.categories[0].questions[0].id;
        }
        else
            return false;
        targetRoom.status = 'accepting_votes';
        return true;
    },
};
export default RoomView;
//# sourceMappingURL=RoomView.js.map