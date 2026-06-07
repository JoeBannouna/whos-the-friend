import { useNavigate } from 'react-router';
import type { StreamableRoomData } from './types';
import { socket } from './socket';
import CachedRoomStorage from './CachedRoomStorage';
import { useEffect, useState } from 'react';

import WaitingForPlayers from './screens/WaitingForPlayers.tsx';
import AcceptingVotes from './screens/AcceptingVotes.tsx';
import AnnouncingQuestionWinner from './screens/AnnouncingQuestionWinner.tsx';
import AnnouncingCategoryWinner from './screens/AnnouncingCategoryWinner.tsx';
import AnnouncingGameWinner from './screens/AnnouncingGameWinner.tsx';

function MainGameSection({
  gameStateEvent,
  localPlayerId,
}: {
  gameStateEvent: StreamableRoomData;
  localPlayerId: string | null;
}) {
  if (gameStateEvent.status == 'waiting_for_players')
    return <WaitingForPlayers gameStateEvent={gameStateEvent} localPlayerId={localPlayerId} />;

  if (gameStateEvent.status == 'accepting_votes')
    return <AcceptingVotes gameStateEvent={gameStateEvent} localPlayerId={localPlayerId} />;

  if (gameStateEvent.status == 'announcing_question_winner')
    return <AnnouncingQuestionWinner gameStateEvent={gameStateEvent} />;

  if (gameStateEvent.status == 'announcing_category_winner')
    return <AnnouncingCategoryWinner gameStateEvent={gameStateEvent} />;

  if (gameStateEvent.status == 'announcing_game_winner')
    return <AnnouncingGameWinner gameStateEvent={gameStateEvent} />;
}

function GameScreen({ gameStateEvent }: { gameStateEvent: StreamableRoomData }) {
  const navigate = useNavigate();

  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const playerId = await CachedRoomStorage.getCachedPlayerIdForRoom(gameStateEvent.roomId);
      setLocalPlayerId(playerId);
    })();
  }, [gameStateEvent]);

  let headerStatus: string = 'Loading...';

  switch (gameStateEvent.status) {
    case 'waiting_for_players':
      headerStatus = 'Waiting for players...';
      break;
    case 'accepting_votes':
      headerStatus = 'Voting...';
      break;
    case 'announcing_question_winner':
      headerStatus = 'Announcing winner...';
      break;
    case 'announcing_category_winner':
      headerStatus = 'Announcing winner...';
      break;
    case 'announcing_game_winner':
      headerStatus = 'Final game winner...';
      break;
    case 'game_finished':
      headerStatus = 'Game finished.';
      break;
  }

  const playersWhoVoted = gameStateEvent.players.filter(p =>
    gameStateEvent.currentQuestionVotes.map(v => v.voterId).includes(p.id)
  );

  const allConnectedPlayersVoted =
    playersWhoVoted.length >= gameStateEvent.players.filter(p => p.connected).length;

  const currentPlayer = gameStateEvent.players.find(p => p.id == localPlayerId);
  if (currentPlayer == undefined) return <div>Something terribly wrong happened</div>;

  return (
    <>
      <header className="mb-3">
        <div className="flex items-center flex-col">
          <div className="py-2 flex">
            <div className="w-2 h-2 mx-1 rounded-full bg-purple-700"></div>
            <div className="w-2 h-2 mx-1 rounded-full bg-purple-700"></div>
            <div className="w-2 h-2 mx-1 rounded-full bg-purple-700"></div>
          </div>
          <div className="font-medium text-purple-950 text-lg">{headerStatus}</div>
        </div>
      </header>

      <MainGameSection gameStateEvent={gameStateEvent} localPlayerId={localPlayerId} />
      <div className="flex py-4">
        {/* No way to leave the room as of right now */}
        {/* <div className="flex w-full pr-2"> */}
        {/*   <button */}
        {/*     className="rounded-2xl bg-red-400/50 text-red-700 font-semibold p-4 cursor-pointer w-full" */}
        {/*     onClick={() => { */}
        {/*       socket.emit('remove_player'); */}
        {/*       navigate('/'); */}
        {/*     }} */}
        {/*   > */}
        {/*     Leave room */}
        {/*   </button> */}
        {/* </div> */}
        {currentPlayer.gameMaster ? (
          <div className="flex w-full">
            {gameStateEvent.status == 'waiting_for_players' ? (
              <button
                className="rounded-2xl bg-green-600 text-white font-semibold p-4 cursor-pointer w-full"
                onClick={() => {
                  socket.emit('start_game');
                }}
              >
                Start Game
              </button>
            ) : (
              <button
                className="rounded-2xl bg-green-600 text-white p-4 cursor-pointer w-full disabled:opacity-60 disabled:cursor-default"
                disabled={gameStateEvent.status == 'accepting_votes' && !allConnectedPlayersVoted}
                onClick={() => {
                  socket.emit('next_step');
                }}
              >
                Next
              </button>
            )}
          </div>
        ) : null}
      </div>
      <div className="text-gray-900/50 text-center">
        {gameStateEvent.players.filter(p => p.connected).length} of {gameStateEvent.players.length}{' '}
        players connected
      </div>
      <div className="pb-4 pt-16 font-semibold">
        <button
          className={`rounded-2xl cursor-pointer bg-yellow-500/40 text-yellow-900 w-full p-4 outline-none`}
          onClick={() => navigate('/')}
        >
          Back to all rooms
        </button>
      </div>
    </>
  );
}

export default GameScreen;
