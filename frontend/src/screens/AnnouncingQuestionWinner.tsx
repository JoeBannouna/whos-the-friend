import { useEffect } from 'react';
import PlayerPfp from '../components/PlayerPfp';
import type { StreamableRoomData } from '../types';
import { useSpring, useSprings } from '@react-spring/web';
import { animated } from '@react-spring/web';

function AnnouncingQuestionWinner({ gameStateEvent }: { gameStateEvent: StreamableRoomData }) {
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
            <div className="text-black/50 text-sm pt-2">Vote results shown below</div>
          </animated.div>
        </>
      ) : null}

      <h2 className="text-black/50 pb-2 pt-4 font-semibold">PODIUM</h2>

      {gameStateEvent.gameResults.currentPodium.map((podiumSlot, index) => {
        if (podiumSlot === null) return null;
        return (
          <animated.div className="py-1.5" key={podiumSlot.playerId} style={playersSpring[index]}>
            <div className="flex items-center bg-white border border-orange-700/15 py-3 px-4 rounded-2xl">
              <div className="text-3xl pr-3">
                {index == 0 ? '🥇' : index == 1 ? '🥈' : index == 2 ? '🥉' : null}
              </div>
              <PlayerPfp player={gameStateEvent.players.find(p => p.id == podiumSlot.playerId)!} />
              <div className="px-4">{podiumSlot.playerName}</div>
              <div className="flex items-center ml-auto">
                <div className="">
                  <div className="px-3 py-1 rounded-xl bg-gray-200 text-gray-600">
                    {podiumSlot.votes} votes
                  </div>
                </div>
              </div>
            </div>
          </animated.div>
        );
      })}
    </>
  );
}

export default AnnouncingQuestionWinner;
