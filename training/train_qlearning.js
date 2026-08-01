/*
 * Trains a tabular Q-learning agent to play tic-tac-toe via self-play.
 *
 * Both players share one Q-table, keyed by the CANONICAL board (from the
 * current mover's perspective: 1 = my piece, -1 = opponent's, 0 = empty).
 * That's what lets a single table serve as either X or O.
 *
 * Update rule: standard Q-learning, but bootstrapped two plies ahead -
 * after a player moves, their (state, action) isn't updated until their
 * NEXT turn (after the opponent has replied), since that's the next point
 * the same player's canonical perspective applies again. On a terminal
 * move, both the player who just won/drew AND the opponent's pending move
 * get their final reward applied directly.
 */
const fs = require("fs");
const path = require("path");
const { checkWinner, validMoves, canonicalKey } = require("../docs/game-logic.js");

const EPISODES = 150000;
const ALPHA = 0.3;   // learning rate
const GAMMA = 0.95;  // discount factor
const EPSILON_START = 1.0;
const EPSILON_END = 0.05;

function getQ(Q, key) {
  if (!Q[key]) Q[key] = new Array(9).fill(0);
  return Q[key];
}

function chooseAction(qValues, valid, epsilon) {
  if (Math.random() < epsilon) {
    return valid[Math.floor(Math.random() * valid.length)];
  }
  let best = valid[0];
  for (const a of valid) if (qValues[a] > qValues[best]) best = a;
  return best;
}

function trainEpisode(Q, epsilon) {
  const board = new Array(9).fill(0);
  let current = 1;
  const last = { 1: null, "-1": null };

  while (true) {
    const key = canonicalKey(board, current);
    const qValues = getQ(Q, key);
    const valid = validMoves(board);
    const action = chooseAction(qValues, valid, epsilon);

    const pending = last[current];
    if (pending) {
      const target = GAMMA * Math.max(...valid.map((a) => qValues[a]));
      Q[pending.key][pending.action] += ALPHA * (target - Q[pending.key][pending.action]);
    }

    board[action] = current;
    last[current] = { key, action };

    const winner = checkWinner(board);
    if (winner !== null) {
      const finalize = (player) => {
        const entry = last[player];
        if (!entry) return;
        const reward = winner === 0 ? 0.5 : winner === player ? 1 : 0;
        Q[entry.key][entry.action] += ALPHA * (reward - Q[entry.key][entry.action]);
      };
      finalize(current);
      finalize(-current);
      break;
    }

    current = -current;
  }
}

function train() {
  const Q = {};
  for (let ep = 0; ep < EPISODES; ep++) {
    const epsilon = EPSILON_START + (EPSILON_END - EPSILON_START) * (ep / EPISODES);
    trainEpisode(Q, epsilon);
  }
  return Q;
}

function main() {
  console.log(`Training for ${EPISODES} self-play episodes...`);
  const t0 = Date.now();
  const Q = train();
  console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s. ${Object.keys(Q).length} states learned.`);

  const outPath = path.join(__dirname, "..", "docs", "q_table.json");
  fs.writeFileSync(outPath, JSON.stringify(Q));
  console.log(`Saved Q-table to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`);
}

main();
