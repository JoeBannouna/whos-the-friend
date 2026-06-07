import { useEffect } from 'react';
import PlayerPfp from '../components/PlayerPfp';
import type { StreamableRoomData } from '../types';
import { animated, useSpring, useSprings } from '@react-spring/web';
import VotesList from '../components/VotesList';

function AnnouncingGameWinner({ gameStateEvent }: { gameStateEvent: StreamableRoomData }) {
  if (gameStateEvent.gameResults.gameWinnerId == null)
    return <div>Could not find the game winner</div>;

  const gameWinner = gameStateEvent.players.find(
    p => p.id == gameStateEvent.gameResults.gameWinnerId
  );
  if (!gameWinner) return <div>Could not find the game winner</div>;

  // One spring per logical animation group
  const [mainPanel, mainPanelApi] = useSpring(() => ({ opacity: 0, y: 24 }));
  // const [stars, starsApi] = useSpring(() => ({ opacity: 0, y: 24 }));
  const [stars, starsApi] = useSprings(3, () => ({ opacity: 0, y: 20 }));
  const [profile, profileApi] = useSprings(4, () => ({ scale: 0 }));
  const [scale, scaleApi] = useSpring(() => ({ scale: 0 }));
  const [mainProf, mainProfApi] = useSpring(() => ({ scale: 0, zIndex: 900 }));

  useEffect(() => {
    // Reset everything first (instant, no animation)
    mainPanelApi.set({ opacity: 0, y: 24 });
    starsApi.set({ opacity: 0, y: 24 });
    profileApi.set({ scale: 0 });
    mainProfApi.set({ scale: 0, zIndex: 900 });
    scaleApi.set({ scale: 0 });

    // Then animate in waves
    mainPanelApi.start({ opacity: 1, y: 0 });

    setTimeout(() => {
      scaleApi.start({ scale: 1 });
    }, 200);

    setTimeout(() => {
      starsApi.start(i => ({ opacity: 1, y: 0, delay: i * 130 }));
    }, 500);

    setTimeout(() => {
      profileApi.start(i => ({ scale: 1, delay: i * 130 }));
    }, 700);

    setTimeout(() => {
      mainProfApi.start({ scale: 1, zIndex: 900 });

      // podiumSpringsApi.start(i => ({
      //   width: `${votesPercent[i] == null ? 0 : votesPercent[i]}%`,
      //   opacity: 1,
      //   y: 0,
      //   delay: i * 130,
      //   config: key =>
      //     key === 'width'
      //       ? { tension: 60, friction: 20 } // slow, satisfying bar grow
      //       : { tension: 200, friction: 22 }, // snappy entry
      // }));
    }, 1100);
  });

  return (
    <animated.div style={mainPanel}>
      {gameStateEvent.currentCategory && gameStateEvent.currentQuestion ? (
        <>
          <div className="bg-white rounded-2xl border border-orange-700/15 p-4">
            <div className="pt-2 pb-4 flex justify-center">
              <div className="bg-yellow-300/40 font-semibold text-yellow-950 rounded-full py-2 px-4 flex items-center">
                <div className="text-sm">🏆 Game winner</div>
              </div>
            </div>

            <div className="flex justify-center py-12">
              <animated.div className="relative" style={scale}>
                <animated.div className={`relative`} style={mainProf}>
                  <PlayerPfp
                    mode="big"
                    playerName={gameStateEvent.gameResults.currentPodium[0].playerName}
                    // anim={}
                  />
                </animated.div>
                <animated.div
                  className="py-2.5 text-center text-2xl font-semibold text-black z-40 inset-x-0 absolute"
                  style={mainProf}
                >
                  {gameStateEvent.gameResults.currentPodium[0].playerName}
                </animated.div>
                <animated.div
                  style={profile[0]}
                  className="rounded-full bg-purple-700/50 w-20 h-20 absolute z-10 -top-5 -left-5"
                ></animated.div>
                <animated.div
                  style={profile[1]}
                  className="rounded-full bg-purple-700/50 w-30 h-30 absolute z-10 -bottom-5 -left-5"
                ></animated.div>
                <animated.div
                  style={profile[2]}
                  className="rounded-full bg-purple-700/50 w-30 h-30 absolute z-10 top-1 -right-5"
                ></animated.div>
                <animated.div
                  style={{ ...stars[0], ...scale }}
                  className="text-shadow-lg text-3xl absolute z-50 inset-0 -translate-x-20"
                >
                  🌟
                </animated.div>
                <animated.div
                  style={{ ...stars[1], ...scale }}
                  className="text-shadow-lg text-3xl absolute z-50 inset-0 translate-x-36 translate-y-20"
                >
                  🌟
                </animated.div>
                <animated.div
                  style={{ ...stars[2], ...scale }}
                  className="text-shadow-lg text-3xl absolute z-50 inset-0 translate-x-46 translate-y-3"
                >
                  🌟
                </animated.div>
              </animated.div>
            </div>
            <VotesList gameStateEvent={gameStateEvent} delay={1100} />
          </div>
        </>
      ) : null}
    </animated.div>
  );
}

export default AnnouncingGameWinner;
