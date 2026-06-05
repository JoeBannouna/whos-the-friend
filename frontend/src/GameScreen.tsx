import { useNavigate } from 'react-router';
import type { StreamableRoomData } from './types';
import { socket } from './socket';
import CachedRoomStorage from './CachedRoomStorage';
import { useEffect, useState } from 'react';

function PlayerPfp({
  playerName,
  mode = 'normal',
}: {
  playerName: string;
  mode?: 'small' | 'normal' | 'big';
}) {
  if (playerName.length > 0) {
    const names = playerName.split(' ');
    const name =
      names.length > 1
        ? names
            .map((n: string) => n[0])
            .filter((_v, i) => i < 2)
            .join('')
        : playerName[0] + playerName[1];

    let styles = '';

    switch (mode) {
      case 'normal':
        styles = 'w-9 h-9 text-base';
        break;

      case 'small':
        styles = 'w-8 h-8 border-2 border-white text-xs';
        break;

      case 'big':
        styles = 'z-40 w-32 h-32 border-4 border-white text-5xl';
        break;

      default:
        break;
    }

    return (
      <div
        className={`rounded-full relative bg-gray-400 text-gray-800 flex justify-center items-center font-medium ${styles}`}
      >
        {name.toLocaleUpperCase()}
        {mode == 'big' ? <div className="absolute top-0 -right-1/5">🏆</div> : null}
      </div>
    );
  }

  return (
    <div className="w-9 h-9 rounded-full text-base bg-gray-400 text-gray-800 flex justify-center items-center font-medium"></div>
  );
}

function MainGameSection({ gameStateEvent }: { gameStateEvent: StreamableRoomData }) {
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const playerId = await CachedRoomStorage.getCachedPlayerIdForRoom(gameStateEvent.roomId);
      setLocalPlayerId(playerId);
    })();
  }, [gameStateEvent]);
  if (gameStateEvent.status == 'waiting_for_players') {
    return (
      <>
        <h2 className="text-xl pb-2 pt-4 font-bold">Players</h2>
        {gameStateEvent.players.map(p => (
          <div className="py-1.5" key={p.id}>
            <div className="flex items-center bg-white border border-orange-700/15 py-3 px-4 rounded-2xl">
              <PlayerPfp playerName={p.name} />
              <div className="px-4">{p.name}</div>
              <div className="flex items-center ml-auto">
                {localPlayerId == p.id ? (
                  <div className="px-4">
                    <div className="px-3 py-1 rounded-xl bg-gray-200 text-gray-600">you</div>
                  </div>
                ) : null}
                <div
                  className={`w-2 h-2 rounded-full ${p.connected ? 'bg-green-400' : 'bg-red-600'}`}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }

  if (gameStateEvent.status == 'accepting_votes') {
    return (
      <>
        {gameStateEvent.currentCategory && gameStateEvent.currentQuestion ? (
          <>
            <div className="flex py-4">
              <div className="bg-purple-700/20 font-medium text-purple-950 rounded-full py-2 px-4 flex items-center">
                <div className="text-sm">{gameStateEvent.currentCategory.name}</div>
                <div className="w-2 h-2 mx-2 rounded-full bg-purple-700"></div>
                <div className="text-sm">
                  Q
                  {gameStateEvent.currentCategory.questions.findIndex(
                    q => q.id == gameStateEvent.currentQuestion!.id
                  ) + 1}{' '}
                  of {gameStateEvent.currentCategory.questions.length}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-orange-700/15 p-4">
              <div className="text-center text-2xl pb-3">{gameStateEvent.currentQuestion.icon}</div>
              <div className="font-medium text-lg">{gameStateEvent.currentQuestion.text}</div>
              <div className="text-black/50 text-sm pt-2">Tap a player to vote</div>
            </div>
          </>
        ) : null}
        <h2 className="text-black/50 pb-2 pt-4 font-semibold">VOTES CAST</h2>
        {gameStateEvent.players.map(p => (
          <div className="py-1.5" key={p.id}>
            <div
              className="flex items-center bg-white border border-orange-700/15 py-3 px-4 rounded-2xl"
              onClick={() => {
                if (localPlayerId != p.id) {
                  console.log('trying');
                  const vote: StreamableRoomData['currentQuestionVotes'][0] = {
                    voterId: localPlayerId!,
                    nomineeId: p.id,
                    categoryId: gameStateEvent.currentCategory!.id,
                    questionId: gameStateEvent.currentQuestion!.id,
                  };
                  socket.emit('player_vote', vote);
                }
              }}
            >
              <PlayerPfp playerName={p.name} />
              <div className="px-4">{p.name}</div>
              <div className="flex items-center ml-auto">
                <div className="pr-3 flex">
                  {gameStateEvent.currentQuestionVotes
                    .filter(v => v.nomineeId == p.id)
                    .map(v => {
                      const voterPlayer: StreamableRoomData['players'][0] | undefined =
                        gameStateEvent.players.find(p => p.id == v.voterId);
                      if (!voterPlayer) return <div>Error</div>;
                      return (
                        <div key={v.voterId} className="w-6">
                          <PlayerPfp mode="small" playerName={voterPlayer.name} />
                        </div>
                      );
                    })}
                </div>
                {localPlayerId == p.id ? (
                  <div className="pr-4">
                    <div className="px-3 py-1 rounded-xl bg-gray-200 text-gray-600">you</div>
                  </div>
                ) : null}
                <div
                  className={`w-2 h-2 rounded-full ${p.connected ? 'bg-green-400' : 'bg-red-600'}`}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }

  if (gameStateEvent.status == 'announcing_question_winner') {
    return (
      <>
        {gameStateEvent.currentCategory && gameStateEvent.currentQuestion ? (
          <>
            <div className="flex py-4">
              <div className="bg-purple-700/20 font-medium text-purple-950 rounded-full py-2 px-4 flex items-center">
                <div className="text-sm">{gameStateEvent.currentCategory.name}</div>
                <div className="w-2 h-2 mx-2 rounded-full bg-purple-700"></div>
                <div className="text-sm">
                  Q
                  {gameStateEvent.currentCategory.questions.findIndex(
                    q => q.id == gameStateEvent.currentQuestion!.id
                  ) + 1}{' '}
                  of {gameStateEvent.currentCategory.questions.length}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-orange-700/15 p-4">
              <div className="text-center text-2xl pb-3">{gameStateEvent.currentQuestion.icon}</div>
              <div className="font-medium text-lg">{gameStateEvent.currentQuestion.text}</div>
              <div className="text-black/50 text-sm pt-2">Vote results shown below</div>
            </div>
          </>
        ) : null}

        <div className="flex flex-col relative items-center pt-8">
          {gameStateEvent.gameResults.currentPodium.length > 0 ? (
            <div className="relative">
              <PlayerPfp
                mode="big"
                playerName={gameStateEvent.gameResults.currentPodium[0].playerName}
              />
              <div className="text-center text-lg font-bold text-black z-40 inset-x-0 absolute">
                {gameStateEvent.gameResults.currentPodium[0].playerName}
              </div>
              <div className="rounded-full bg-purple-700/50 w-20 h-20 absolute z-10 -top-5 -left-5"></div>
              <div className="rounded-full bg-purple-700/50 w-30 h-30 absolute z-10 -bottom-5 -left-5"></div>
              <div className="rounded-full bg-purple-700/50 w-30 h-30 absolute z-10 top-1 -right-5"></div>
            </div>
          ) : null}
        </div>

        <h2 className="text-black/50 pb-2 pt-4 font-semibold">PODIUM</h2>

        {gameStateEvent.gameResults.currentPodium.map((podiumSlot, index) => {
          if (podiumSlot === null) return null;
          return (
            <div className="py-1.5" key={podiumSlot.playerId}>
              <div className="flex items-center bg-white border border-orange-700/15 py-3 px-4 rounded-2xl">
                <div className="text-3xl pr-3">
                  {index == 0 ? '🥇' : index == 1 ? '🥈' : index == 2 ? '🥉' : null}
                </div>
                <PlayerPfp playerName={podiumSlot.playerName} />
                <div className="px-4">{podiumSlot.playerName}</div>
                <div className="flex items-center ml-auto">
                  <div className="">
                    <div className="px-3 py-1 rounded-xl bg-gray-200 text-gray-600">
                      {podiumSlot.votes} votes
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  if (gameStateEvent.status == 'announcing_category_winner') {
    return (
      <>
        {gameStateEvent.currentCategory && gameStateEvent.currentQuestion ? (
          <>
            <div className="bg-white rounded-2xl border border-orange-700/15 p-4">
              <div className="pt-2 pb-4 flex">
                <div className="bg-yellow-300/40 font-semibold text-yellow-950 rounded-full py-2 px-4 flex items-center">
                  <div className="text-sm">
                    🏆{' '}
                    {gameStateEvent.currentCategory.name.substring(
                      0,
                      gameStateEvent.currentCategory.name.length - 2
                    )}
                  </div>
                  <div className="text-sm pl-1">Winner</div>
                </div>
              </div>

              <div className="flex">
                <PlayerPfp
                  mode="big"
                  playerName={gameStateEvent.gameResults.currentPodium[0].playerName}
                />
                <div className="pt-6 pl-6">
                  <div className="font-medium text-2xl">
                    {gameStateEvent.gameResults.currentPodium[0].playerName}
                  </div>
                  <div className="text-black/50 text-sm pt-2">
                    {gameStateEvent.gameResults.currentPodium[0].votes} votes in this category
                  </div>
                </div>
              </div>
              <div className="py-4">
                {gameStateEvent.gameResults.currentPodium.map(p => {
                  if (p == null) return null;
                  const votesPercent = (
                    (p.votes / gameStateEvent.gameResults.currentPodium[0].votes) *
                    100
                  ).toFixed();
                  return (
                    <div className="py-1.5" key={p.playerId}>
                      <div className="flex items-center py-2 px-4">
                        <div className="pr-2">{p.playerName}</div>
                        <div className="flex bg-gray-200 w-full h-3 rounded-full mx-4 relative">
                          <div
                            style={{ width: votesPercent + '%' }}
                            className={`flex bg-red-600/50 h-3 rounded-full absolute`}
                          ></div>
                        </div>
                        <div className="flex items-center ml-auto">
                          <div className="text-gray-700">{p.votes}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </>
    );
  }

  if (gameStateEvent.status == 'announcing_game_winner') {
    if (gameStateEvent.gameResults.gameWinnerId == null)
      return <div>Could not find the game winner</div>;

    const gameWinner = gameStateEvent.players.find(
      p => p.id == gameStateEvent.gameResults.gameWinnerId
    );
    if (!gameWinner) return <div>Could not find the game winner</div>;

    return (
      <>
        {gameStateEvent.currentCategory && gameStateEvent.currentQuestion ? (
          <>
            <div className="bg-white rounded-2xl border border-orange-700/15 p-4">
              <div className="pt-2 pb-4 flex justify-center">
                <div className="bg-yellow-300/40 font-semibold text-yellow-950 rounded-full py-2 px-4 flex items-center">
                  <div className="text-sm">🏆 Game winner</div>
                </div>
              </div>

              <div className="flex justify-center py-12">
                <div className="relative">
                  <PlayerPfp
                    mode="big"
                    playerName={gameStateEvent.gameResults.currentPodium[0].playerName}
                  />
                  <div className="py-2.5 text-center text-2xl font-semibold text-black z-40 inset-x-0 absolute">
                    {gameStateEvent.gameResults.currentPodium[0].playerName}
                  </div>
                  <div className="rounded-full bg-purple-700/50 w-20 h-20 absolute z-10 -top-5 -left-5"></div>
                  <div className="rounded-full bg-purple-700/50 w-30 h-30 absolute z-10 -bottom-5 -left-5"></div>
                  <div className="rounded-full bg-purple-700/50 w-30 h-30 absolute z-10 top-1 -right-5"></div>
                  <div className="text-shadow-lg text-3xl absolute z-50 inset-0 -translate-x-20">
                    🌟
                  </div>
                  <div className="text-shadow-lg text-3xl absolute z-50 inset-0 translate-x-36 translate-y-20">
                    🌟
                  </div>
                  <div className="text-shadow-lg text-3xl absolute z-50 inset-0 translate-x-46 translate-y-3">
                    🌟
                  </div>
                </div>
                {/* <PlayerPfp mode="big" playerName={gameWinner.name} /> */}
                {/* <div className="pt-6 pl-6"> */}
                {/*   <div className="font-medium text-2xl"> */}
                {/*     {gameStateEvent.gameResults.currentPodium[0].playerName} */}
                {/*   </div> */}
                {/*   <div className="text-black/50 text-sm pt-2"> */}
                {/*     {gameStateEvent.gameResults.currentPodium[0].votes} votes in this category */}
                {/*   </div> */}
                {/* </div> */}
              </div>
              <div className="py-4">
                {gameStateEvent.gameResults.currentPodium.map(p => {
                  if (p == null) return null;
                  const votesPercent = (
                    (p.votes / gameStateEvent.gameResults.currentPodium[0].votes) *
                    100
                  ).toFixed();
                  return (
                    <div className="py-1.5" key={p.playerId}>
                      <div className="flex items-center py-2 px-4">
                        <div className="pr-2">{p.playerName}</div>
                        <div className="flex bg-gray-200 w-full h-3 rounded-full mx-4 relative">
                          <div
                            style={{ width: votesPercent + '%' }}
                            className={`flex bg-red-600/50 h-3 rounded-full absolute`}
                          ></div>
                        </div>
                        <div className="flex items-center ml-auto">
                          <div className="text-gray-700">{p.votes}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </>
    );
  }
}

function GameScreen({ gameStateEvent }: { gameStateEvent: StreamableRoomData }) {
  const navigate = useNavigate();

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

      <MainGameSection gameStateEvent={gameStateEvent} />
      <div className="flex py-4">
        <div className="flex w-full pr-2">
          <button
            className="rounded-2xl bg-red-400/50 text-red-700 font-semibold p-4 cursor-pointer w-full"
            onClick={() => {
              socket.emit('remove_player');
              navigate('/');
            }}
          >
            Leave room
          </button>
        </div>
        <div className="flex w-full pl-2">
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
      </div>
      <div className="text-gray-900/50 text-center">
        {gameStateEvent.players.filter(p => p.connected).length} of {gameStateEvent.players.length}{' '}
        players connected
      </div>
    </>
  );
}

export default GameScreen;
