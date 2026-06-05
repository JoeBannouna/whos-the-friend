import { Socket } from 'socket.io';
import RoomView, {} from './RoomView.js';
const socketState = {
    sockets: [],
};
async function removeSocket(playerId) {
    const socketIndex = socketState.sockets.findIndex(s => s.playerId == playerId);
    if (socketIndex === -1)
        return false;
    socketState.sockets.splice(socketIndex, 1);
    return true;
}
const SocketManagerView = {
    async inializeSocketListeners(io) {
        io.on('connection', async (socket) => {
            const playerName = socket.handshake.auth.playerName;
            const roomId = socket.handshake.auth.roomId;
            const roomPassword = socket.handshake.auth.roomPassword || '';
            let playerIdTemp = socket.handshake.auth.playerId || null;
            if ((await RoomView.getRoom(roomId)) === null) {
                socket.disconnect();
            }
            else {
                const emitToRoom = (gameState) => {
                    if (gameState !== null)
                        io.to(roomId).emit('game_state', gameState);
                    else
                        console.log('error emitting to roomId:' + roomId);
                };
                if (playerIdTemp === null) {
                    playerIdTemp = await RoomView.addPlayer(roomId, playerName, roomPassword);
                }
                else {
                    console.log('playerId isnt null! reconnecting');
                    const playerExists = await RoomView.playerExists(roomId, playerIdTemp);
                    if (playerExists) {
                        const reconnectionEvent = await RoomView.reconnectPlayer(roomId, playerIdTemp);
                        if (reconnectionEvent !== null)
                            emitToRoom(reconnectionEvent);
                        else
                            socket.disconnect();
                    }
                    else {
                        playerIdTemp = await RoomView.addPlayer(roomId, playerName, roomPassword);
                    }
                }
                const playerId = playerIdTemp; // must use const for typescript to be happy
                if (playerId === null) {
                    socket.disconnect();
                }
                else {
                    const updatedGameState = await RoomView.getStreamableGameState(roomId);
                    socket.join(roomId);
                    emitToRoom(updatedGameState);
                    socket.emit('id_assignment', playerId);
                    // socket.emit('request', /* … */); // emit an event to the socket
                    // io.emit('broadcast', /* … */); // emit an event to all connected sockets
                    // socket.on('reply', () => { /* … */ }); // listen to the event
                    socket.on('remove_player', async () => {
                        const playerRemoveEvent = await RoomView.removePlayer(roomId, playerId);
                        emitToRoom(playerRemoveEvent);
                        socket.disconnect();
                    });
                    socket.on('start_game', async () => {
                        const startGameEvent = await RoomView.startGame(roomId);
                        emitToRoom(startGameEvent);
                    });
                    socket.on('next_step', async () => {
                        const nextEvent = await RoomView.next(roomId);
                        emitToRoom(nextEvent);
                    });
                    socket.on('player_vote', async (vote) => {
                        const voteEvent = await RoomView.updatePlayerVoteForCurrentQuestion(roomId, vote.voterId, vote.nomineeId);
                        emitToRoom(voteEvent);
                    });
                    // pauseGame(roomId: string): Promise<StreamableRoomData | null>;
                    // resumeGame(roomId: string): Promise<StreamableRoomData | null>;
                    socket.on('disconnect', async () => {
                        const disconnectEvent = await RoomView.disconnectPlayer(roomId, playerId);
                        emitToRoom(disconnectEvent);
                        console.log('Player disconnected!!');
                    });
                }
            }
        });
        return true;
    },
};
export default SocketManagerView;
//# sourceMappingURL=SocketManagerView.js.map