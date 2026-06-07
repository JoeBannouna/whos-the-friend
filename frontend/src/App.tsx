import React, { useEffect, useState } from 'react';
import './App.css';
import { Link } from 'react-router';

type RoomStatus =
  | 'waiting_for_players'
  | 'accepting_votes'
  | 'announcing_question_winners'
  | 'announcing_category_winners'
  | 'announcing_game_winner'
  | 'game_finished';

const hostname = import.meta.env.VITE_BACKEND_ORIGIN;

function App() {
  const [rooms, setRooms] = useState<
    { roomName: string; roomId: string; playersNumber: number; roomStatus: RoomStatus }[]
  >([]);

  const [roomNameInput, setRoomNameInput] = useState<string>('');
  const [roomPassInput, setRoomPassInput] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchRooms = async () => {
    const res = await fetch(`${hostname}/rooms`);
    const data: any = await res.json();
    setRooms(data);
  };
  useEffect(() => {
    fetchRooms();
  }, []);

  const createRoomSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    const req = { roomName: roomNameInput, roomPass: roomPassInput };
    const res = await fetch(`${hostname}/rooms/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });
    if (res.ok) {
      // success
      setRoomNameInput('');
      setRoomPassInput('');
      fetchRooms();
    } else {
      const data = await res.json();
      setErrorMessage(data.msg);
      console.log('Failed to create room :(');
    }
  };

  return (
    <section className="p-4 md:max-w-150 mx-auto">
      <h1 className="text-base font-bold">Rooms List</h1>
      <div>
        {rooms.map(r => (
          <div className="py-4">
            <Link
              to={`/rooms/${r.roomId}`}
              className="cursor-pointer p-4 block rounded-2xl bg-orange-500/30 text-yellow-900"
            >
              {r.roomName}
            </Link>
          </div>
        ))}
      </div>

      <form className="bg-cyan-700/10 p-4 my-4 rounded-2xl" onSubmit={createRoomSubmit}>
        {errorMessage == '' ? null : (
          <div className="py-2">
            <div className="p-4 bg-red-400 rounded-2xl">{errorMessage}</div>
          </div>
        )}
        <div className="py-2">
          <input
            className="rounded-2xl bg-white w-full p-4 outline-none"
            value={roomNameInput}
            onChange={e => setRoomNameInput(e.target.value)}
            placeholder="Room Name.."
          />
        </div>
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
          <button className="rounded-2xl cursor-pointer bg-blue-800/40 w-full p-4 outline-none">
            Create Room
          </button>
        </div>
      </form>
    </section>
  );
}

export default App;
