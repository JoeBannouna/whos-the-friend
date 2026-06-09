import { Socket, type DefaultEventsMap, type Server } from 'socket.io';
import RoomView, { type StreamableRoomData } from './RoomView.js';

interface ISocketManagerView {
  inializeSocketListeners(
    io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
  ): Promise<boolean>;
}

const SocketManagerView: ISocketManagerView = {
  async inializeSocketListeners(io): Promise<boolean> {
    io.on('connection', async socket => {
      const playerName: string = socket.handshake.auth.playerName;
      const roomId: string = socket.handshake.auth.roomId;
      const roomPassword: string = socket.handshake.auth.roomPassword || '';
      let playerIdTemp: string | null = socket.handshake.auth.playerId || null;

      if ((await RoomView.getRoom(roomId)) === null) {
        socket.disconnect();
      } else {
        const emitToRoom = (gameState: StreamableRoomData | null) => {
          if (gameState !== null) io.to(roomId).emit('game_state', gameState);
          else console.log('error emitting to roomId:' + roomId);
        };

        if (playerIdTemp === null) {
          playerIdTemp = await RoomView.addPlayer(roomId, playerName, roomPassword);
        } else {
          console.log('playerId isnt null! reconnecting');
          const playerExists = await RoomView.playerExists(roomId, playerIdTemp);
          if (playerExists) {
            const reconnectionEvent = await RoomView.reconnectPlayer(roomId, playerIdTemp);
            if (reconnectionEvent !== null) emitToRoom(reconnectionEvent);
            else socket.disconnect();
          } else {
            playerIdTemp = await RoomView.addPlayer(roomId, playerName, roomPassword);
          }
        }

        const playerId = playerIdTemp; // must use const for typescript to be happy
        if (playerId === null) {
          socket.disconnect();
        } else {
          const updatedGameState = await RoomView.getStreamableGameState(roomId);

          socket.join(roomId);
          emitToRoom(updatedGameState);
          socket.emit('id_assignment', playerId);

          // socket.emit('request', /* … */); // emit an event to the socket
          // io.emit('broadcast', /* … */); // emit an event to all connected sockets
          // socket.on('reply', () => { /* … */ }); // listen to the event

          // TODO: for now removing players is disabled completely
          socket.on('remove_player', async (removedPlayerId: string) => {
            if (await RoomView.isGameMaster(roomId, playerId)) {
              const playerRemoveEvent = await RoomView.removePlayer(roomId, removedPlayerId);
              emitToRoom(playerRemoveEvent);
            }
          });
          socket.on('start_game', async () => {
            if (await RoomView.isGameMaster(roomId, playerId)) {
              const startGameEvent = await RoomView.startGame(roomId);
              emitToRoom(startGameEvent);
            }
          });
          socket.on('next_step', async () => {
            if (await RoomView.isGameMaster(roomId, playerId)) {
              const nextEvent = await RoomView.next(roomId);
              emitToRoom(nextEvent);
            }
          });
          socket.on('player_vote', async (vote: StreamableRoomData['currentQuestionVotes'][0]) => {
            const voteEvent = await RoomView.updatePlayerVoteForCurrentQuestion(
              roomId,
              vote.voterId,
              vote.nomineeId
            );
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
