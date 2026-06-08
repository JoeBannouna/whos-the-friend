import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { StreamableRoomData } from './types';
import VotesList from './components/VotesList';

const hostname = import.meta.env.VITE_BACKEND_ORIGIN;

function GameResults() {
  let params = useParams();
  const navigate = useNavigate();

  const gameIdTemp = params.gameId;
  if (gameIdTemp == undefined) {
    navigate('/');
    return;
  }
  const gameId = gameIdTemp; // typescript fuckery

  const [gameData, setGameData] = useState<StreamableRoomData['gameResults'] | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${hostname}/assets/games/${gameId}.json`);
      if (!res.ok) navigate('/');
      else {
        const data = await res.json();
        setGameData(data.gameResults);
        console.log(data.gameResults);
      }
      return;
    })();
  }, []);

  if (gameData == null) return <div>Could not find game.</div>;

  return (
    <div className="md:max-w-150 mx-auto">
      <div className="pb-4 px-4 font-semibold">
        <button
          className={`rounded-2xl cursor-pointer bg-yellow-500/40 text-yellow-900 w-full p-4 outline-none`}
          onClick={() => navigate('/')}
        >
          Back to all rooms
        </button>
      </div>
      <div className="bg-green-800/40 rounded-xl mx-4 p-4 mt-16 text-xl">Categories</div>
      {gameData.categoryPodiums.map(categoryPodium => {
        return (
          <div className="flex flex-col rounded-xl bg-white m-3 p-4 mb-8">
            <div className="rounded-full bg-yellow-500/20 font-semibold text-lg px-4 py-2">
              {categoryPodium.catgeory.name}
            </div>
            <div>
              <VotesList
                gameStateEvent={{} as StreamableRoomData} // calms typescript down
                currentPodiumReplacement={categoryPodium.podium}
                delay={0}
              />
            </div>
          </div>
        );
      })}
      <div className="bg-green-800/40 rounded-xl mx-4 p-4 mt-16 text-xl">Game Results</div>
      <div className="flex flex-col rounded-xl bg-white m-3 p-4 mt-6">
        <div className="rounded-full bg-yellow-500/20 px-4 py-2">Game Winner Podium!</div>
        <div>
          <VotesList
            gameStateEvent={{} as StreamableRoomData} // calms typescript down
            currentPodiumReplacement={gameData.gamePodium}
            delay={0}
          />
        </div>
      </div>
    </div>
  );
}

export default GameResults;
