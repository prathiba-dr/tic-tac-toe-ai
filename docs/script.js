(function () {
  const { checkWinner, validMoves, canonicalKey } = window.GameLogic;
  const { bestMove: minimaxMove } = window.Minimax;

  let qTable = null;
  fetch("q_table.json")
    .then((r) => r.json())
    .then((data) => { qTable = data; })
    .catch((err) => {
      document.getElementById("status").textContent =
        "Could not load Q-table (q_table.json) - Q-learning opponent unavailable.";
      console.error(err);
    });

  function qMove(board, player) {
    const key = canonicalKey(board, player);
    const valid = validMoves(board);
    const qValues = (qTable && qTable[key]) || new Array(9).fill(0);
    let best = valid[0];
    for (const a of valid) if (qValues[a] > qValues[best]) best = a;
    return best;
  }

  function aiMove(board, player, opponentType) {
    if (opponentType === "qlearning" && qTable) return qMove(board, player);
    return minimaxMove(board, player);
  }

  // ---- Game state ----
  let board = new Array(9).fill(0);
  let humanMark = 1;
  let gameOver = false;

  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const opponentSelect = document.getElementById("opponent-select");
  const markSelect = document.getElementById("mark-select");

  const scores = JSON.parse(localStorage.getItem("ttt-scores") || '{"win":0,"draw":0,"loss":0}');
  renderScores();

  function renderScores() {
    document.getElementById("score-win").textContent = scores.win;
    document.getElementById("score-draw").textContent = scores.draw;
    document.getElementById("score-loss").textContent = scores.loss;
    localStorage.setItem("ttt-scores", JSON.stringify(scores));
  }

  function buildBoardDOM() {
    boardEl.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.index = i;
      cell.addEventListener("click", () => onCellClick(i));
      boardEl.appendChild(cell);
    }
  }

  function renderBoard() {
    const cells = boardEl.querySelectorAll(".cell");
    board.forEach((v, i) => {
      const cell = cells[i];
      cell.textContent = v === 1 ? "X" : v === -1 ? "O" : "";
      cell.classList.toggle("filled", v !== 0);
      cell.classList.toggle("x", v === 1);
      cell.classList.toggle("o", v === -1);
    });
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function markLabel(v) { return v === 1 ? "X" : "O"; }

  function endGame(winner) {
    gameOver = true;
    if (winner === 0) {
      setStatus("Draw.");
      scores.draw++;
    } else if (winner === humanMark) {
      setStatus("You win!");
      scores.win++;
    } else {
      setStatus("AI wins.");
      scores.loss++;
    }
    renderScores();
  }

  function onCellClick(i) {
    if (gameOver || board[i] !== 0) return;
    if (currentTurn() !== humanMark) return;
    makeMove(i, humanMark);
  }

  function currentTurn() {
    const filled = board.filter((c) => c !== 0).length;
    return filled % 2 === 0 ? 1 : -1; // X always moves first
  }

  function makeMove(i, player) {
    board[i] = player;
    renderBoard();
    const winner = checkWinner(board);
    if (winner !== null) { endGame(winner); return; }

    if (currentTurn() !== humanMark) {
      setStatus("AI thinking...");
      setTimeout(aiTurn, 250);
    } else {
      setStatus("Your turn.");
    }
  }

  function aiTurn() {
    if (gameOver) return;
    const aiPlayer = -humanMark;
    const move = aiMove(board, aiPlayer, opponentSelect.value);
    makeMove(move, aiPlayer);
  }

  function newGame() {
    board = new Array(9).fill(0);
    gameOver = false;
    humanMark = parseInt(markSelect.value, 10);
    buildBoardDOM();
    renderBoard();
    if (humanMark === -1) {
      setStatus("AI thinking...");
      setTimeout(aiTurn, 250);
    } else {
      setStatus("Your turn.");
    }
  }

  document.getElementById("new-game-btn").addEventListener("click", newGame);
  markSelect.addEventListener("change", newGame);
  opponentSelect.addEventListener("change", newGame);

  // ---- Compare mode: Minimax vs Q-learning, fully automated ----
  const compareBtn = document.getElementById("compare-btn");
  const compareStatus = document.getElementById("compare-status");

  async function runCompareGame() {
    compareBtn.disabled = true;
    board = new Array(9).fill(0);
    gameOver = true; // block human clicks during the auto-game
    buildBoardDOM();
    renderBoard();

    const minimaxPlayer = Math.random() < 0.5 ? 1 : -1;
    compareStatus.textContent = `Minimax is ${markLabel(minimaxPlayer)}, Q-learning is ${markLabel(-minimaxPlayer)}...`;

    let current = 1;
    while (true) {
      await new Promise((r) => setTimeout(r, 400));
      const type = current === minimaxPlayer ? "minimax" : "qlearning";
      const move = aiMove(board, current, type);
      board[move] = current;
      renderBoard();
      const winner = checkWinner(board);
      if (winner !== null) {
        if (winner === 0) compareStatus.textContent += " Result: draw.";
        else compareStatus.textContent += ` Result: ${winner === minimaxPlayer ? "Minimax" : "Q-learning"} wins.`;
        break;
      }
      current = -current;
    }
    compareBtn.disabled = false;
  }

  compareBtn.addEventListener("click", runCompareGame);

  newGame();
})();
