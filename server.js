const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let rooms = {};

io.on("connection", (socket) => {
    console.log("Игрок подключился");

    socket.on("joinRoom", (room) => {
        socket.join(room);

        if (!rooms[room]) {
            rooms[room] = [];
        }

        rooms[room].push(socket.id);

        io.to(room).emit("players", rooms[room]);
    });

    socket.on("move", ({ room, index, player }) => {
        socket.to(room).emit("move", { index, player });
    });

    socket.on("disconnect", () => {
        console.log("Игрок отключился");
    });
});

server.listen(3000, () => {
    console.log("Сервер запущен на http://localhost:3000");
});