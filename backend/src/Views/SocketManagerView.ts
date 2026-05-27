import { Socket, type DefaultEventsMap, type Server } from 'socket.io';
import RoomView, { type StreamableRoomData } from './RoomView.js';
import { disconnect } from 'node:cluster';

interface SocketStateData {
  sockets: {
    playerId: string;
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  }[];
}

interface ISocketManagerView {
  inializeSocketListeners(
    io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
  ): Promise<boolean>;
}

const socketState: SocketStateData = {
  sockets: [],
};

async function removeSocket(playerId: string): Promise<boolean> {
  const socketIndex = socketState.sockets.findIndex(s => s.playerId == playerId);
  if (socketIndex === -1) return false;

  socketState.sockets.splice(socketIndex, 1);
  return true;
}

const SocketManagerView: ISocketManagerView = {
  async inializeSocketListeners(io): Promise<boolean> {
    io.on('connection', async socket => {
      const playerName: string = socket.data.playerName;
      const roomId: string = socket.data.roomId;
      const roomPassword: string = socket.data.roomPassword;
      let playerId: string | null = socket.data.playerId || null;

      if ((await RoomView.getRoom(roomId)) === null) socket.disconnect();
      else {
        const emitToRoom = (gameState: StreamableRoomData | null) => {
          if (gameState !== null) io.to(roomId).emit('game_state', gameState);
          else console.log('error emitting to roomId:' + roomId);
        };

        if (playerId === null)
          playerId = await RoomView.addPlayer(roomId, playerName, roomPassword);
        else {
          const reconnectionEvent = await RoomView.reconnectPlayer(roomId, playerId);
          if (reconnectionEvent !== null) emitToRoom(reconnectionEvent);
          else socket.disconnect();
        }

        if (playerId === null) socket.disconnect();
        else {
          const updatedGameState = await RoomView.getStreamableGameState(roomId);

          socket.join(roomId);
          emitToRoom(updatedGameState);

          // socket.emit('request', /* … */); // emit an event to the socket
          // io.emit('broadcast', /* … */); // emit an event to all connected sockets
          // socket.on('reply', () => { /* … */ }); // listen to the event
          socket.on('remove_player', arg1 => {
            console.log(arg1);

            // removePlayer(roomId: string, playerId: string): Promise<StreamableRoomData | null>;
          });
          // updatePlayerVoteForCurrentQuestion(
          //   roomId: string,
          //   voterId: string,
          //   nomineeId: string
          // ): Promise<StreamableRoomData | null>;
          // startGame(roomId: string): Promise<StreamableRoomData | null>;
          // pauseGame(roomId: string): Promise<StreamableRoomData | null>;
          // resumeGame(roomId: string): Promise<StreamableRoomData | null>;
          // next(roomId: string): Promise<StreamableRoomData | null>;
          socket.on('disconnect', async () => {
            const disconnectEvent = await RoomView.disconnectPlayer(roomId, playerId);
            emitToRoom(disconnectEvent);
          });
        }
      }
    });

    return true;
  },
};

export default SocketManagerView;
