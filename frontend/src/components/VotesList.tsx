import { useEffect } from 'react';
import type { StreamableRoomData } from '../types';
import { animated, useSprings } from '@react-spring/web';

function VotesList({
  gameStateEvent,
  delay,
}: {
  gameStateEvent: StreamableRoomData;
  delay: number;
}) {
  const [podiumSprings, podiumSpringsApi] = useSprings(
    gameStateEvent.gameResults.currentPodium.length,
    () => ({ opacity: 0, y: 24, width: '0%' })
  );

  const votesPercent = gameStateEvent.gameResults.currentPodium.map(podiumSpot => {
    if (podiumSpot == null) return null;
    const votesPercent = (
      (podiumSpot.votes / gameStateEvent.gameResults.currentPodium[0].votes) *
      100
    ).toFixed();
    return votesPercent;
  });

  useEffect(() => {
    podiumSpringsApi.set({ opacity: 0, y: 24, width: '0%' });

    setTimeout(() => {
      podiumSpringsApi.start(i => ({
        width: `${votesPercent[i] == null ? 0 : votesPercent[i]}%`,
        opacity: 1,
        y: 0,
        delay: i * 130,
        config: key =>
          key === 'width'
            ? { tension: 60, friction: 20 } // slow, satisfying bar grow
            : {}, // default behavior
      }));
    }, delay);
  });

  return (
    <div className="py-4">
      {podiumSprings.map((props, i) => {
        const p = gameStateEvent.gameResults.currentPodium[i];
        if (p == null) return null;

        return (
          <animated.div
            className="py-1.5"
            key={p.playerId}
            style={{ opacity: props.opacity, y: props.y }}
          >
            <div className="flex items-center py-2 px-4">
              <div className="pr-2 overflow-x-scroll w-20">{p.playerName}</div>
              <div className="flex bg-gray-200 w-full h-3 rounded-full mx-4 relative">
                <animated.div
                  style={{ width: props.width }}
                  className={`flex bg-red-600/50 h-3 rounded-full absolute`}
                ></animated.div>
              </div>
              <div className="flex items-center ml-auto">
                <div className="text-gray-700">{p.votes}</div>
              </div>
            </div>
          </animated.div>
        );
      })}
    </div>
  );
}

export default VotesList;
