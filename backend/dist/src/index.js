import express from 'express';
import { Server } from 'socket.io';
import SocketManagerView from './Views/SocketManagerView.js';
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
//   console.log("A user connected.");
//   // socket.emit('request', /* … */); // emit an event to the socket
//   // io.emit('broadcast', /* … */); // emit an event to all connected sockets
//   // socket.on('reply', () => { /* … */ }); // listen to the event
//   socket.on('disconnect', () => {
//     console.log('A user disconnected');
//   });
// });
await SocketManagerView.inializeSocketListeners(io);
//# sourceMappingURL=index.js.map