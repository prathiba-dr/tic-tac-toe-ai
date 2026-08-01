/*
 * Validates the trained Q-learning agent by pitting it (greedy, no
 * exploration) against the perfect minimax player, as both X and O, over
 * every possible opening move. A well-trained agent should never lose -
 * minimax is unbeatable, so the only two outcomes against it are "draw"
 * (agent played optimally) or "loss" (agent has a gap in its policy).
 */
const path = require("path");
const fs = require("fs");
const { checkWinner, validMoves, canonicalKey } = require("../docs/game-logic.js");
const { bestMove } = require("../docs/minimax.js");

const Q = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "docs", "q_table.json")));

function qMove(board, player) {
  const key = canonicalKey(board, player);
  const valid = validMoves(board);
  const qValues = Q[key] || new Array(9).fill(0);
  let best = valid[0];
  for (const a of valid) if (qValues[a] > qValues[best]) best = a;
  return best;
}

// Both players are deterministic (greedy argmax / minimax with fixed
// tie-breaking), so replaying from the same empty board always produces
// the same game. To actually exercise more of the tree, force the
// opponent's OPENING move across all 9 cells rather than letting it pick
// its own (otherwise this "validates" only 2 fixed trajectories twice).
function playGame(qPlayer, forcedOpeningMove) {
  const board = new Array(9).fill(0);
  let current = 1;
  let moveNum = 0;
  while (true) {
    let move;
    if (moveNum === 0 && current !== qPlayer) {
      move = forcedOpeningMove;
    } else {
      move = current === qPlayer ? qMove(board, current) : bestMove(board, current);
    }
    board[move] = current;
    moveNum++;
    const winner = checkWinner(board);
    if (winner !== null) return winner;
    current = -current;
  }
}

function main() {
  const results = { qWins: 0, draws: 0, qLosses: 0 };
  const lossDetails = [];

  for (const qPlayer of [1, -1]) {
    for (let opening = 0; opening < 9; opening++) {
      const winner = playGame(qPlayer, opening);
      if (winner === 0) results.draws++;
      else if (winner === qPlayer) results.qWins++;
      else {
        results.qLosses++;
        lossDetails.push({ qPlayer, opening });
      }
    }
  }

  const total = results.qWins + results.draws + results.qLosses;
  console.log(`Q-learning agent (greedy) vs perfect minimax, ${total} games `
    + `(both roles x all 9 forced opponent opening moves):`);
  console.log(results);
  if (results.qLosses > 0) console.log("Losses:", lossDetails);
  console.log(results.qLosses === 0
    ? "PASS: Q-learning agent never lost to the perfect player."
    : "FAIL: Q-learning agent lost at least once - policy has a gap.");
}

main();
