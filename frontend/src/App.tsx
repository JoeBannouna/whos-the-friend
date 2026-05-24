import { useEffect, useState } from "react";
import { socket } from './socket';
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import "./App.css";

type Category = 'all' | 'trust' | 'personality' | 'wild' | 'skills' | 'life' | 'goals'
type Question = { text: string, cat: Category, icon: string };

function App() {
  const [count, setCount] = useState(0);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [highlightedQuestions, setHighlightedQuestions] = useState<string[]>([]);

  const categories: { name: string, id: Category }[] = [
    { name: 'All', id: 'all' },
    { name: 'Trust & Loyalty', id: 'trust' },
    { name: 'Personality', id: 'personality' },
    { name: 'Wild Card', id: 'wild' },
    { name: 'Skills & Smarts', id: 'skills' },
    { name: 'Life Goals', id: 'goals' }
  ];

  const [activeCategory, setActiveCategory] = useState<Category>('all');

  useEffect(() => {
    (async () => {
      const res = await fetch('http://localhost:5000/assets/questions.json');
      const data: any = await res.json();
      setQuestions(data);
      console.log(data);
    })();
  }, []);

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [fooEvents, setFooEvents] = useState([]);

  useEffect(() => {
    function onConnect() {
      console.log("CONNECTED")
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onFooEvent(value) {
      setFooEvents(previous => [...previous, value]);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('foo', onFooEvent);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('foo', onFooEvent);
    };
  }, []);

  function highlightRandomQuestion() {
    const chosenQuestion = questions[Math.floor(Math.random() * questions.length)];
    setHighlightedQuestions([...highlightedQuestions, chosenQuestion.text]);
  }

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button type="button" className="counter" onClick={() => setCount((count) => count + 1)}>
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg className="button-icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>

      <header>
        <h1>Who in the group<br /><em>would most likely…</em></h1>
        <p className="subtitle">Pick a card. Point fingers. No take-backs.</p>
        <div className="divider"></div>
      </header>

      <div className="categories">
        {categories.map(c => <button key={c.id} className={`cat-btn ${activeCategory == c.id ? 'active' : ''}`} onClick={() => setActiveCategory(c.id)}>{c.name}</button>)}
      </div>

      <div className="count-badge" id="count-badge">{questions.filter(q => q.cat == activeCategory || activeCategory == 'all').length} questions</div>

      <div className="questions-grid" id="questions-grid">
        {questions.filter(q => q.cat == activeCategory || activeCategory == 'all').map((q, index) => {
          return <div
            key={q.text}
            className={`question-card ${highlightedQuestions.includes(q.text) ? 'highlighted' : ''}`} id={`card-${index}`}
            onClick={() => {
              if (highlightedQuestions.includes(q.text)) {
                setHighlightedQuestions(highlightedQuestions.filter(text => text != q.text))
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
        })}
      </div>

      <button className="random-btn" onClick={highlightRandomQuestion}>🎲 Highlight a random one</button>
    </>
  );
}

export default App;
