// Shared game rules - used by both the training script (Node) and the
// browser page, so there's exactly one definition of "how tic-tac-toe
// works" instead of two copies that could drift apart.
(function (root) {
  const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6],            // diagonals
  ];

  // board: array of 9 cells, 1 = X, -1 = O, 0 = empty
  // returns 1 (X wins), -1 (O wins), 0 (draw), or null (game not over)
  function checkWinner(board) {
    for (const [a, b, c] of WIN_LINES) {
      const sum = board[a] + board[b] + board[c];
      if (sum === 3) return 1;
      if (sum === -3) return -1;
    }
    if (board.every((c) => c !== 0)) return 0;
    return null;
  }

  function validMoves(board) {
    const moves = [];
    for (let i = 0; i < 9; i++) if (board[i] === 0) moves.push(i);
    return moves;
  }

  // canonical encoding: from the perspective of `player`, 1 = "my piece",
  // -1 = "opponent's piece" - lets one Q-table serve both X and O.
  function canonicalKey(board, player) {
    return board.map((c) => c * player).join(",");
  }

  const GameLogic = { WIN_LINES, checkWinner, validMoves, canonicalKey };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = GameLogic;
  } else {
    root.GameLogic = GameLogic;
  }
})(typeof window !== "undefined" ? window : globalThis);
