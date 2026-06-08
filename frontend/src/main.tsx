import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import Room from './Room.tsx';
import GameResults from './GameResults.tsx';
import { BrowserRouter, Route, Routes } from 'react-router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/rooms/:roomId" element={<Room />} />
        <Route path="/games/:gameId" element={<GameResults />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
