import React, { useEffect, useState } from 'react';
import { socket } from './socket';
import './App.css';

type Category = 'all' | 'trust' | 'personality' | 'wild' | 'skills' | 'life' | 'goals';
type Question = { text: string; cat: Category; icon: string };

type RoomStatus =
  | 'waiting_for_players'
  | 'accepting_votes'
  | 'announcing_question_winners'
  | 'announcing_category_winners'
  | 'announcing_game_winner'
  | 'game_finished';

function RoomManager() {
  const [rooms, setRooms] = useState<
    { roomName: string; roomId: string; playersNumber: number; roomStatus: RoomStatus }[]
  >([]);

  const [roomNameInput, setRoomNameInput] = useState<string>('');
  const [roomPassInput, setRoomPassInput] = useState<string>('');

  const fetchRooms = async () => {
    const res = await fetch('http://localhost:5000/rooms');
    const data: any = await res.json();
    setRooms(data);
  };
  useEffect(() => {
    fetchRooms();
  }, []);

  const createRoomSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const req = { roomName: roomNameInput, roomPass: roomPassInput };
    const res = await fetch('http://localhost:5000/rooms/create', {
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
      console.log('Failed to create room :(');
    }
  };

  return (
    <section>
      <div>
        {rooms.map(r => (
          <div className="p-4">
            <div className="p-4 rounded bg-red-800/20 text-yellow-900">{r.roomName}</div>
          </div>
        ))}
      </div>

      <form className="bg-cyan-700/10 p-2" onSubmit={createRoomSubmit}>
        <div className="p-2">
          <input
            className="rounded bg-white w-full p-4 outline-none"
            value={roomNameInput}
            onChange={e => setRoomNameInput(e.target.value)}
            placeholder="Room Name.."
          />
        </div>
        <div className="p-2">
          <input
            className="rounded bg-white w-full p-4 outline-none"
            value={roomPassInput}
            onChange={e => setRoomPassInput(e.target.value)}
            placeholder="Room Pass.."
            type="password"
          />
        </div>

        <div className="p-2">
          <button className="rounded cursor-pointer bg-blue-800/40 w-full p-4">Create Room</button>
        </div>
      </form>
    </section>
  );
}

function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [highlightedQuestions, setHighlightedQuestions] = useState<string[]>([]);

  const [categories, setCategories] = useState<{ name: string; id: Category }[]>([]);

  const [activeCategory, setActiveCategory] = useState<Category>('all');

  useEffect(() => {
    (async () => {
      const res = await fetch('http://localhost:5000/assets/questions.json');
      const data: any = await res.json();
      setQuestions(data.questions);
      setCategories(data.categories);
      console.log(data);
    })();
  }, []);

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [fooEvents, setFooEvents] = useState([]);

  useEffect(() => {
    socket.connect();
    function onConnect() {
      console.log('CONNECTED');
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    // function onFooEvent(value) {
    //   setFooEvents(previous => [...previous, value]);
    // }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    // socket.on('foo', onFooEvent);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      // socket.off('foo', onFooEvent);
    };
  }, []);

  function highlightRandomQuestion() {
    const chosenQuestion = questions[Math.floor(Math.random() * questions.length)];
    setHighlightedQuestions([...highlightedQuestions, chosenQuestion.text]);
  }

  return (
    <>
      <RoomManager />
      <header>
        <h1>
          Who in the group
          <br />
          <em>would most likely…</em>
        </h1>
        <p className="subtitle">Pick a card. Point fingers. No take-backs.</p>
        <div className="divider"></div>
      </header>
      <div className="categories">
        {categories.map(c => (
          <button
            key={c.id}
            className={`cat-btn ${activeCategory == c.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="count-badge" id="count-badge">
        {questions.filter(q => q.cat == activeCategory || activeCategory == 'all').length} questions
      </div>
      <div className="questions-grid" id="questions-grid">
        {questions
          .filter(q => q.cat == activeCategory || activeCategory == 'all')
          .map((q, index) => {
            return (
              <div
                key={q.text}
                className={`question-card ${highlightedQuestions.includes(q.text) ? 'highlighted' : ''}`}
                id={`card-${index}`}
                onClick={() => {
                  if (highlightedQuestions.includes(q.text)) {
                    setHighlightedQuestions(highlightedQuestions.filter(text => text != q.text));
                  } else setHighlightedQuestions([...highlightedQuestions, q.text]);
                }}
              >
                <span className="q-num">{String(index + 1).padStart(2, '0')}</span>
                <div className="q-content">
                  <div className="q-category">{categories.find(c => c.id == q.cat)?.name}</div>
                  <div className="q-text">{q.text}</div>
                </div>
                <span className="q-icon">{q.icon}</span>
              </div>
            );
          })}
      </div>
      <button className="random-btn" onClick={highlightRandomQuestion}>
        🎲 Highlight a random one
      </button>
    </>
  );
}

export default App;
