const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

const rooms = {};

io.on('connection', (socket) => {
    console.log('Новый игрок подключился');

    socket.on('joinRoom', (roomId) => {
        if (!rooms[roomId]) {
            rooms[roomId] = {
                board: Array(9).fill(''),
                players: [],
                turn: 'X'
            };
        }
        const room = rooms[roomId];
        if (room.players.length >= 2) {
            socket.emit('roomFull', { message: 'Комната полна' });
            return;
        }
        socket.join(roomId);
        const playerSymbol = room.players.length === 0 ? 'X' : 'O';
        room.players.push({ id: socket.id, symbol: playerSymbol });
        socket.emit('assigned', { symbol: playerSymbol, roomId });

        if (room.players.length === 2) {
            io.to(roomId).emit('start', { board: room.board, turn: room.turn });
        }
    });

    socket.on('makeMove', ({ roomId, index, symbol }) => {
        const room = rooms[roomId];
        if (!room) return;
        if (room.turn !== symbol) return;
        if (room.board[index] !== '') return;

        room.board[index] = symbol;
        room.turn = (symbol === 'X') ? 'O' : 'X';
        io.to(roomId).emit('moveMade', { index, symbol, turn: room.turn });

    
        const winner = checkWinner(room.board);
        if (winner) {
            io.to(roomId).emit('gameOver', { winner });
            delete rooms[roomId];
        } else if (!room.board.includes('')) {
            io.to(roomId).emit('gameOver', { winner: 'draw' });
            delete rooms[roomId];
        }
    });

    socket.on('disconnect', () => {
        for (let roomId in rooms) {
            const room = rooms[roomId];
            const index = room.players.findIndex(p => p.id === socket.id);
            if (index !== -1) {
                room.players.splice(index, 1);
                if (room.players.length === 0) delete rooms[roomId];
                else io.to(roomId).emit('opponentLeft');
                break;
            }
        }
    });
});

function checkWinner(board) {
    const lines = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    for (let line of lines) {
        const [a,b,c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'nolik.html'));
});

server.listen(PORT, () => console.log(`Сервер на порту ${PORT}`));
socket.on('rematch', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;
    
    room.board = Array(9).fill('');
    room.turn = 'X';
    

    if (room.players.length === 2) {
        const [player1, player2] = room.players;
        const temp = player1.symbol;
        player1.symbol = player2.symbol;
        player2.symbol = temp;
    }
  
    io.to(roomId).emit('rematchAccepted', {
        board: room.board,
        turn: room.turn,
        players: room.players
    });
});
