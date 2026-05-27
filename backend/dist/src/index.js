import express from 'express';
import { Server } from 'socket.io';
import SocketManagerView from './Views/SocketManagerView.js';
import RoomView from './Views/RoomView.js';
const app = express();
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
});
app.use(express.static('public'));
const server = app.listen(5000, () => console.log('Running...'));
const io = new Server(server, { cors: { origin: '*' } });
// io.on('connection', socket => {
//   console.log('A user connected.');
//   // socket.emit('request', /* … */); // emit an event to the socket
//   // io.emit('broadcast', /* … */); // emit an event to all connected sockets
//   // socket.on('reply', () => { /* … */ }); // listen to the event
//   socket.on('disconnect', () => {
//     console.log('A user disconnected');
//   });
// });
await SocketManagerView.inializeSocketListeners(io);
// app.use(else )
app.use(express.json());
app.get('/rooms', async (req, res) => {
    const response = await RoomView.getAllRooms();
    res.status(200).send(response);
});
app.post('/rooms/create', async (req, res) => {
    const response = await RoomView.createRoom(req.body.roomName, req.body.roomPass);
    if (response === null)
        res.status(500).send();
    else
        res.status(200).send();
});
//# sourceMappingURL=index.js.map