import express from 'express';
import { Server } from "socket.io";
const app = express();
// app.get('/', (req, res) => {
//   res.send('Hello world');
// })
app.use(express.static('public'));
const server = app.listen(5000, () => console.log('Running...'));
const io = new Server(server);
io.on('connection', socket => {
    console.log("A user connected.");
    // socket.emit('request', /* … */); // emit an event to the socket
    // io.emit('broadcast', /* … */); // emit an event to all connected sockets
    // socket.on('reply', () => { /* … */ }); // listen to the event
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});
//# sourceMappingURL=index.js.map