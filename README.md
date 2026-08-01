# Tic-Tac-Toe AI: Minimax vs Q-Learning

A lightweight, dependency-free tic-tac-toe game with two AI opponents -
perfect-play minimax, and a Q-learning agent trained from scratch via
self-play - so you can play either one, or watch them play each other.

**Live demo**: https://prathiba-dr.github.io/tic-tac-toe-ai/

## Why two opponents

Minimax and Q-learning solve the same problem in genuinely different ways,
and tic-tac-toe is small enough to make that difference visible instead of
theoretical:

- **Minimax** searches the game tree at move time. No training, always
  correct, deterministic - but it doesn't scale (chess's tree is why
  nobody solves it this way).
- **Q-learning** never sees the rules of tic-tac-toe explicitly. It plays
  itself 150,000 times, and learns move values purely from win/draw/loss
  outcomes. It generalizes to a lookup table instead of search - which
  does scale to bigger problems (with a neural net standing in for the
  table), at the cost of needing training and no longer being trivially
  provably correct.

The "Watch Minimax vs Q-learning" button runs them against each other
directly, and they draw - which is the expected result: minimax is
provably unbeatable, so a Q-learning agent that's actually learned the
game correctly can only draw against it, never win. That's also exactly
how it was validated (see below).

## How the Q-learning agent was trained

`training/train_qlearning.js`: tabular Q-learning, both players sharing
one table keyed by a **canonical** board - from the current mover's
perspective, `1` = my piece, `-1` = opponent's, regardless of whether
they're actually X or O. That's what lets one 4,520-state table serve as
either role instead of needing two.

Update rule: standard Q-learning, bootstrapped across each player's own
two-ply transitions (their move, then the opponent's reply, then it's
their turn again) - a well-known approach for training two agents against
each other with one shared table (see [Sutton & Barto's tic-tac-toe
example](http://incompleteideas.net/book/first/ebook/node11.html) for the
same idea).

## Validation

A trained agent claiming to "play tic-tac-toe well" is a checkable claim,
not a vibe: play it against the perfect minimax solver and see if it ever
loses. `training/validate.js` does exactly that - **greedy** (no
exploration) Q-learning agent vs. minimax, as both X and O, across all 9
possible forced opening moves from the opponent (18 games; a bigger
"random games" count would be misleading here, since both players are
fully deterministic and would just repeat 2 fixed trajectories).

```
Q-learning agent (greedy) vs perfect minimax, 18 games (both roles x all 9 forced opponent opening moves):
{ qWins: 0, draws: 18, qLosses: 0 }
PASS: Q-learning agent never lost to the perfect player.
```

Full output: [`reports/validation_results.txt`](reports/validation_results.txt).

## Structure

```
docs/                  # the actual site (served via GitHub Pages)
  index.html
  style.css
  script.js             # game state, DOM rendering, AI dispatch, compare mode
  game-logic.js          # win-checking / valid moves / canonical encoding - shared with training
  minimax.js              # alpha-beta minimax, used both in-browser and for validation
  q_table.json            # the trained Q-learning policy (434 KB)
training/
  train_qlearning.js     # self-play training (run with `node training/train_qlearning.js`)
  validate.js              # Q-learning vs minimax validation (run with `node training/validate.js`)
reports/
  validation_results.txt
```

No npm dependencies for the site itself - `docs/` is plain HTML/CSS/JS,
served as-is. The training/validation scripts only need Node (no
packages either - `game-logic.js` and `minimax.js` are written to work as
both browser `<script>` tags and Node `require()`s, one definition either
way).

## Run it locally

```
# play it
cd docs && python3 -m http.server 8000
# open http://localhost:8000

# retrain the Q-learning agent from scratch (~1s)
node training/train_qlearning.js

# re-validate against minimax
node training/validate.js
```

## Deployment

Served via GitHub Pages directly from `docs/` on `master` - no build step,
what's committed is what's live.
