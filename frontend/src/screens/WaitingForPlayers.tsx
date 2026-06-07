import PlayerPfp from '../components/PlayerPfp';
import type { StreamableRoomData } from '../types';

function WaitingForPlayers({
  gameStateEvent,
  localPlayerId,
}: {
  gameStateEvent: StreamableRoomData;
  localPlayerId: string | null;
}) {
  return (
    <>
      <h2 className="text-xl pb-2 pt-4 font-bold">Players</h2>
      {gameStateEvent.players.map(p => (
        <div className="py-1.5" key={p.id}>
          <div className="flex items-center bg-white border border-orange-700/15 py-3 px-4 rounded-2xl">
            <PlayerPfp player={p} />
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

export default WaitingForPlayers;
