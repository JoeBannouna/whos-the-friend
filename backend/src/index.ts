import express from 'express';
import { Server } from 'socket.io';
import SocketManagerView from './Views/SocketManagerView.js';
import RoomView from './Views/RoomView.js';
import RoomInputValidator from './Validators/RoomInputValidator.js';

const app = express();

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

app.use(express.static('public'));

const server = app.listen(5000, '0.0.0.0', () => console.log('Running...'));
const io = new Server(server, { cors: { origin: '*' } });

await SocketManagerView.inializeSocketListeners(io);

app.use(express.json());
app.get('/rooms', async (req, res) => {
  const response = await RoomView.getAllRooms();
  res.status(200).send(response);
});
app.get('/rooms/check/:roomId', async (req, res) => {
  const response = await RoomView.getRoom(req.params.roomId);
  if (response == null) res.status(404).send();
  else res.status(200);
});
app.get('/rooms/player/:roomId/:playerId', async (req, res) => {
  const response = await RoomView.playerExists(req.params.roomId as string, req.params.playerId);
  if (response == false) res.status(400).send();
  else res.status(200).send();
});
app.post('/rooms/create', async (req, res) => {
  const validation = RoomInputValidator.createRoom(req.body.roomName, req.body.roomPass);
  if (validation.success == false) res.status(400).send({ msg: validation.msg });
  else {
    const response = await RoomView.createRoom(req.body.roomName, req.body.roomPass);
    if (response === null) res.status(500).send({ msg: 'failed to create a room' });
    else res.status(200).send();
  }
});

import fs from 'node:fs/promises';
import path from 'node:path';

app.get('/past-games', async (req, res) => {
  const __dirname = import.meta.dirname;
  const dirpath = path.join(__dirname, '..', '..', 'public', 'assets', 'games');

  try {
    const files = await fs.readdir(dirpath);
    const allGames = files.filter(el => path.extname(el) === '.json');
    res.status(200).send(allGames.map(f => f.split('.')[0]));
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});
