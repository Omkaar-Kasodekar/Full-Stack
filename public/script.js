const socket = io();

let room = "";
let symbol = "";
let myTurn = false;

function joinRoom() {
  room = document.getElementById("roomInput").value.trim();
  if (room) {
    socket.emit("joinRoom", room);
  }
}

function createBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    cell.addEventListener("click", handleClick);
    board.appendChild(cell);
  }
}

function handleClick(e) {
  if (!myTurn || e.target.classList.contains("disabled")) return;
  const index = e.target.dataset.index;
  socket.emit("makeMove", { room, index });
}

socket.on("init", (data) => {
  symbol = data.symbol;
  document.getElementById("status").innerText = `You are ${symbol}`;
  createBoard();
});

socket.on("start", ({ currentTurn, board }) => {
  myTurn = currentTurn === symbol;
  document.getElementById("status").innerText = myTurn
    ? "Your turn"
    : "Opponent's turn";
  updateBoardUI(board);
});

socket.on("updateBoard", ({ board, currentTurn }) => {
  updateBoardUI(board);
  myTurn = currentTurn === symbol;
  document.getElementById("status").innerText = myTurn
    ? "Your turn"
    : "Opponent's turn";
});

socket.on("win", (winner) => {
  document.getElementById("status").innerText =
    winner === symbol ? "You win!" : "You lose!";
  disableBoard();
});

socket.on("draw", () => {
  document.getElementById("status").innerText = "It's a draw!";
  disableBoard();
});

socket.on("playerLeft", () => {
  document.getElementById("status").innerText = "Opponent left. Game ended.";
  disableBoard();
});

socket.on("roomError", (msg) => {
  alert(msg);
});

function updateBoardUI(board) {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell, index) => {
    cell.innerText = board[index] || "";
    if (board[index]) {
      cell.classList.add("disabled");
    }
  });
}

function disableBoard() {
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.add("disabled");
  });
}
