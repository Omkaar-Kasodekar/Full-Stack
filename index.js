const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = {}; // roomId -> { board: [], players: {X: socketId, O: socketId}, currentTurn: 'X' }

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
  let room = rooms[roomId];
  if (!room) {
    rooms[roomId] = {
      board: Array(9).fill(null),
      players: { X: socket.id },
      currentTurn: "X",
    };
    socket.join(roomId);
    socket.emit("init", { symbol: "X" });
  } else if (Object.keys(room.players).length === 1) {
    room.players.O = socket.id;
    socket.join(roomId);
    socket.emit("init", { symbol: "O" });

    // Notify both players that game started
    io.to(roomId).emit("start", {
      currentTurn: room.currentTurn,
      board: room.board,
    });
  } else {
    socket.emit("roomError", "Room full");
  }
});

  socket.on("makeMove", ({ room, index }) => {
    const game = rooms[room];
    if (!game) return;

    const playerSymbol = game.players.X === socket.id ? "X" : "O";

    if (
      playerSymbol === game.currentTurn &&
      game.board[index] === null
    ) {
      game.board[index] = playerSymbol;
      game.currentTurn = playerSymbol === "X" ? "O" : "X";

      io.to(room).emit("updateBoard", {
        board: game.board,
        currentTurn: game.currentTurn,
      });

      const winner = checkWinner(game.board);
      if (winner) {
        io.to(room).emit("win", winner);
        delete rooms[room];
      } else if (game.board.every(cell => cell !== null)) {
        io.to(room).emit("draw");
        delete rooms[room];
      }
    }
  });

  socket.on("disconnect", () => {
    for (const room in rooms) {
      const game = rooms[room];
      if (game.players.X === socket.id || game.players.O === socket.id) {
        io.to(room).emit("playerLeft");
        delete rooms[room];
      }
    }
  });
});

function checkWinner(board) {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],            // diagonals
  ];
  for (let [a, b, c] of winPatterns) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }
  return null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
console.log("http://localhost:3000/")
