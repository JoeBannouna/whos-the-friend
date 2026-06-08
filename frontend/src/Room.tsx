import { useEffect, useState } from 'react';
import { socket } from './socket';
import { useNavigate, useParams } from 'react-router';
import type { StreamableRoomData } from './types';
import GameScreen from './GameScreen';
import CachedRoomStorage from './CachedRoomStorage';

const hostname = import.meta.env.VITE_BACKEND_ORIGIN;

function Room() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [gameStateEvent, setGameStateEvent] = useState<StreamableRoomData | null>(null);
  let params = useParams();
  const navigate = useNavigate();

  const roomId = params.roomId;
  if (roomId == undefined) {
    navigate('/');
    return;
  }
  const roomIdString = roomId; // typescript fuckery

  useEffect(() => {
    (async () => {
      const res = await fetch(`${hostname}/rooms/check/${roomIdString}`);
      if (!res.ok) navigate('/');
      return;
    })();
  }, []);

  const [existingPlayer, setExistingPlayer] = useState<boolean>(false);
  useEffect(() => {
    (async () => {
      const existingPlayerId = await CachedRoomStorage.getCachedPlayerIdForRoom(roomIdString);
      if (existingPlayerId) {
        const res = await fetch(`${hostname}/rooms/player/${roomIdString}/${existingPlayerId}`);
        if (res.ok) setExistingPlayer(true);
        return;
      }
    })();
  }, []);

  const [errorMessage, setErrorMessage] = useState<string>('');

  const [playerNameInput, setPlayerNameInput] = useState<string>('');
  const [roomPassInput, setRoomPassInput] = useState<string>('');

  const enterRoomSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    const existingPlayerId = await CachedRoomStorage.getCachedPlayerIdForRoom(roomIdString);

    socket.auth = {
      roomId: roomIdString,
      playerName: playerNameInput,
      playerId: existingPlayerId,
    };

    socket.connect();
  };

  useEffect(() => {
    function onConnect() {
      console.log('CONNECTED');
      setIsConnected(true);
    }

    function onDisconnect() {
      console.log('DISCONNECTED');
      setIsConnected(false);
    }

    function onGameState(value: StreamableRoomData) {
      console.log(value);
      setGameStateEvent(value);
    }

    function onIdAssignment(playerId: string) {
      console.log('Id Assignment');
      CachedRoomStorage.setCachedPlayerIdForRoom(roomIdString, playerId);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game_state', onGameState);
    socket.on('id_assignment', onIdAssignment);

    // disconnect incase connected from a previous session??
    socket.disconnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game_state', onGameState);
      socket.off('id_assignment', onIdAssignment);
    };
  }, []);

  return (
    <div className="md:max-w-150 mx-auto">
      {gameStateEvent === null || !isConnected ? (
        <>
          <h1 className="text-center py-4">{roomIdString}</h1>
          <form className="bg-cyan-700/10 p-4 my-4 rounded-2xl" onSubmit={enterRoomSubmit}>
            {errorMessage == '' ? null : (
              <div className="py-2">
                <div className="p-4 bg-red-400 rounded-2xl">{errorMessage}</div>
              </div>
            )}
            {existingPlayer ? null : (
              <div className="py-2">
                <input
                  className="rounded-2xl bg-white w-full p-4 outline-none"
                  value={playerNameInput}
                  onChange={e => setPlayerNameInput(e.target.value)}
                  placeholder="Your Name.. (Firstname Lastname)"
                />
              </div>
            )}
            <div className="py-2">
              <input
                className="rounded-2xl bg-white w-full p-4 outline-none"
                value={roomPassInput}
                onChange={e => setRoomPassInput(e.target.value)}
                placeholder="Room Pass.."
                type="password"
              />
            </div>

            <div className="py-2">
              <button
                className={`rounded-2xl cursor-pointer ${existingPlayer ? 'bg-yellow-500/40' : 'bg-blue-800/40'} w-full p-4 outline-none`}
              >
                {existingPlayer ? 'Rejoin' : 'Enter Room'}
              </button>
            </div>
          </form>

          <div className="pb-4 pt-8 font-semibold">
            <button
              className={`rounded-2xl cursor-pointer bg-yellow-500/40 text-yellow-900 w-full p-4 outline-none`}
              onClick={() => navigate('/')}
            >
              Back to all rooms
            </button>
          </div>
        </>
      ) : (
        <GameScreen gameStateEvent={gameStateEvent} />
      )}
    </div>
  );
}

export default Room;
