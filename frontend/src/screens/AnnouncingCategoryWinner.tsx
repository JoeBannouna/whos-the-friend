import { useSpring } from '@react-spring/web';
import PlayerPfp from '../components/PlayerPfp';
import VotesList from '../components/VotesList';
import type { StreamableRoomData } from '../types';
import { animated } from '@react-spring/web';
import { useEffect } from 'react';

function AnnouncingCategoryWinner({ gameStateEvent }: { gameStateEvent: StreamableRoomData }) {
  const mainPanel = useSpring({
    from: { opacity: 0, y: 24 },
    to: { opacity: 1, y: 0 },
  });

  const [scale, scaleApi] = useSpring(() => ({ scale: 0 }));
  const [fade, fadeApi] = useSpring(() => ({ opacity: 0, y: 24 }));

  useEffect(() => {
    setTimeout(() => {
      scaleApi.start({ scale: 1 });
    }, 200);
    setTimeout(() => {
      fadeApi.start({ opacity: 1, y: 0 });
    }, 500);
  });

  return (
    <>
      {gameStateEvent.currentCategory && gameStateEvent.currentQuestion ? (
        <>
          <animated.div
            className="bg-white rounded-2xl border border-orange-700/15 p-4"
            style={mainPanel}
          >
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
                player={
                  gameStateEvent.players.find(
                    p => p.id == gameStateEvent.gameResults.currentPodium[0].playerId
                  )!
                }
                anim={scale}
              />
              <animated.div className="pt-6 pl-6" style={fade}>
                <div className="font-medium text-2xl">
                  {gameStateEvent.gameResults.currentPodium[0].playerName}
                </div>
                <div className="text-black/50 text-sm pt-2">
                  {gameStateEvent.gameResults.currentPodium[0].votes} votes in this category
                </div>
              </animated.div>
            </div>
            <VotesList gameStateEvent={gameStateEvent} delay={400} />
          </animated.div>
        </>
      ) : null}
    </>
  );
}

export default AnnouncingCategoryWinner;
