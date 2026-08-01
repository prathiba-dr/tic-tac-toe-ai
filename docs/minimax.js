// Perfect-play tic-tac-toe via minimax with alpha-beta pruning. The board
// is tiny (max depth 9) so this is instant even unpruned, but pruning is
// free and makes the "why is this unbeatable" story cleaner to explain.
(function (root) {
  const { checkWinner, validMoves } = typeof module !== "undefined" && module.exports
    ? require("./game-logic.js")
    : window.GameLogic;

  function minimax(board, player, depth, alpha, beta) {
    const winner = checkWinner(board);
    if (winner !== null) {
      if (winner === 0) return 0;
      // prefer faster wins / slower losses
      return winner === player ? 10 - depth : depth - 10;
    }

    const valid = validMoves(board);
    let best = -Infinity;
    for (const move of valid) {
      board[move] = player;
      const score = -minimax(board, -player, depth + 1, -beta, -alpha);
      board[move] = 0;
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break; // prune
    }
    return best;
  }

  function bestMove(board, player) {
    let best = -Infinity;
    let bestMoveIdx = null;
    let alpha = -Infinity;
    const beta = Infinity;
    for (const move of validMoves(board)) {
      board[move] = player;
      const score = -minimax(board, -player, 1, -beta, -alpha);
      board[move] = 0;
      if (score > best) {
        best = score;
        bestMoveIdx = move;
      }
      if (best > alpha) alpha = best;
    }
    return bestMoveIdx;
  }

  const Minimax = { bestMove };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Minimax;
  } else {
    root.Minimax = Minimax;
  }
})(typeof window !== "undefined" ? window : globalThis);
