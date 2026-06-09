import { useEffect } from 'react';
import PlayerPfp from '../components/PlayerPfp';
import { socket } from '../socket';
import type { StreamableRoomData } from '../types';
import { animated, useSpring, useSprings } from '@react-spring/web';

function AcceptingVotes({
  gameStateEvent,
  localPlayer,
}: {
  gameStateEvent: StreamableRoomData;
  localPlayer: StreamableRoomData['players'][number];
}) {
  const questionSpring = useSpring({
    from: { opacity: 0, y: 24 },
    to: { opacity: 1, y: 0 },
  });
  const [playersSpring, playersSpringApi] = useSprings(gameStateEvent.players.length, () => ({
    opacity: 0,
    y: 24,
  }));

  useEffect(() => {
    setTimeout(() => {
      playersSpringApi.start(i => ({ delay: i * 130, opacity: 1, y: 0 }));
    }, 300);
  });

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

          <animated.div
            className="bg-white rounded-2xl border border-orange-700/15 p-4"
            style={questionSpring}
          >
            <div className="text-center text-2xl pb-3">{gameStateEvent.currentQuestion.icon}</div>
            <div className="font-medium text-lg">{gameStateEvent.currentQuestion.text}</div>
            <div className="text-black/50 text-sm pt-2">Tap a player to vote</div>
          </animated.div>
        </>
      ) : null}
      <h2 className="text-black/50 pb-2 pt-4 font-semibold">VOTES CAST</h2>
      {gameStateEvent.players.map((p, i) => (
        <animated.div className="py-1.5" key={p.id} style={playersSpring[i]}>
          <button
            className="flex block w-full items-center bg-white border border-orange-700/15 py-3 px-2.5 rounded-2xl select-none"
            onClick={() => {
              if (localPlayer.id != p.id) {
                console.log('trying');
                const vote: StreamableRoomData['currentQuestionVotes'][0] = {
                  voterId: localPlayer.id,
                  nomineeId: p.id,
                  categoryId: gameStateEvent.currentCategory!.id,
                  questionId: gameStateEvent.currentQuestion!.id,
                };
                socket.emit('player_vote', vote);
              }
            }}
          >
            <PlayerPfp player={p} />
            <div className="px-4 max-w-30 overflow-x-hidden">{p.name}</div>
            <div className="flex items-center ml-auto">
              <div className="pr-3 flex">
                {gameStateEvent.currentQuestionVotes
                  .filter(v => v.nomineeId == p.id)
                  .map(v => {
                    const voterPlayer = gameStateEvent.players.find(p => p.id == v.voterId);
                    {
                      /* if (!voterPlayer) return <div>NonExistentPlayerVote</div>; */
                    }
                    if (!voterPlayer) return null;

                    return (
                      <div key={v.voterId} className="w-6">
                        <PlayerPfp mode="small" player={voterPlayer} />
                      </div>
                    );
                  })}
              </div>
              {localPlayer.id == p.id ? (
                <div className="pr-2">
                  <div className="px-3 py-1 rounded-xl bg-gray-200 text-gray-600">you</div>
                </div>
              ) : null}
              <div
                className={`w-2 h-2 rounded-full ${p.connected ? 'bg-green-400' : 'bg-red-600'}`}
              ></div>
            </div>
            {localPlayer.gameMaster && localPlayer.id != p.id ? (
              <button
                className="pl-2"
                onClick={() => {
                  const confirmation = confirm('Remove this player?');
                  if (confirmation) {
                    socket.emit('remove_player', p.id);
                  }
                }}
              >
                ❌
              </button>
            ) : null}
          </button>
        </animated.div>
      ))}
    </>
  );
}

export default AcceptingVotes;
