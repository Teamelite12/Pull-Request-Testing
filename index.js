/* ── Sudoku Game ──────────────────────────────────────────────────────────── */
"use strict";

// ── Puzzle generation ─────────────────────────────────────────────────────

/** Shuffle an array in-place (Fisher-Yates). */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Return true if placing `num` at (row, col) in `grid` is valid. */
function isValid(grid, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num) return false;
    if (grid[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

/** Fill a blank 9×9 grid with a valid complete sudoku using backtracking. */
function fillGrid(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const n of nums) {
          if (isValid(grid, r, c, n)) {
            grid[r][c] = n;
            if (fillGrid(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/** Count solutions (up to 2 – we only need to know if unique). */
function countSolutions(grid, limit = 2) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        let count = 0;
        for (let n = 1; n <= 9; n++) {
          if (isValid(grid, r, c, n)) {
            grid[r][c] = n;
            count += countSolutions(grid, limit - count);
            grid[r][c] = 0;
            if (count >= limit) return count;
          }
        }
        return count;
      }
    }
  }
  return 1; // solved
}

/** Number of cells to remove per difficulty. */
const REMOVE_COUNT = { easy: 36, medium: 46, hard: 54 };

/** Generate a puzzle grid and return [puzzle, solution]. */
function generatePuzzle(difficulty) {
  // Build full solution
  const solution = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillGrid(solution);

  // Clone for puzzle
  const puzzle = solution.map(r => [...r]);

  // Collect all cell positions and shuffle them
  const cells = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) cells.push([r, c]);
  shuffle(cells);

  const toRemove = REMOVE_COUNT[difficulty] || REMOVE_COUNT.medium;
  let removed = 0;

  for (const [r, c] of cells) {
    if (removed >= toRemove) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    // Deep-clone before counting to avoid mutation side-effects
    const clone = puzzle.map(row => [...row]);
    if (countSolutions(clone) === 1) {
      removed++;
    } else {
      puzzle[r][c] = backup; // restore if ambiguous
    }
  }

  return { puzzle, solution };
}

// ── State ─────────────────────────────────────────────────────────────────

let state = {
  puzzle:    null,   // 9×9 original (0 = empty)
  solution:  null,   // 9×9 correct answer
  board:     null,   // 9×9 current player values (0 = empty)
  notes:     null,   // 9×9 Set of note digits
  given:     null,   // 9×9 bool – is cell a given?
  selected:  null,   // {row, col} or null
  mistakes:  0,
  hints:     3,
  notesMode: false,
  difficulty: 'easy',
  timerSec:  0,
  timerRunning: false,
  won:       false,
};

let timerInterval = null;

// ── DOM refs ──────────────────────────────────────────────────────────────

const boardEl        = document.getElementById('board');
const timerEl        = document.getElementById('timer');
const mistakesEl     = document.getElementById('mistakes');
const hintCountEl    = document.getElementById('hint-count');
const notesStatusEl  = document.getElementById('notes-status');
const winModal       = document.getElementById('win-modal');
const loseModal      = document.getElementById('lose-modal');
const winTimeEl      = document.getElementById('win-time');
const winMistakesEl  = document.getElementById('win-mistakes');

// ── Helpers ───────────────────────────────────────────────────────────────

function fmt(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function startTimer() {
  stopTimer();
  state.timerRunning = true;
  timerInterval = setInterval(() => {
    if (state.timerRunning) {
      state.timerSec++;
      timerEl.textContent = fmt(state.timerSec);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  state.timerRunning = false;
}

// ── New Game ──────────────────────────────────────────────────────────────

function newGame() {
  stopTimer();
  const { puzzle, solution } = generatePuzzle(state.difficulty);
  state.puzzle   = puzzle;
  state.solution = solution;
  state.board    = puzzle.map(r => [...r]);
  state.notes    = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
  state.given    = puzzle.map(r => r.map(v => v !== 0));
  state.selected = null;
  state.mistakes = 0;
  state.hints    = 3;
  state.notesMode = false;
  state.timerSec  = 0;
  state.won       = false;

  winModal.classList.add('hidden');
  loseModal.classList.add('hidden');
  timerEl.textContent = '00:00';
  mistakesEl.textContent = '0 / 3';
  hintCountEl.textContent = '3';
  notesStatusEl.textContent = 'Off';
  notesStatusEl.classList.remove('on');

  renderBoard();
  startTimer();
}

// ── Board rendering ───────────────────────────────────────────────────────

function renderBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.setAttribute('role', 'gridcell');

      const val = state.board[r][c];
      const isGiven = state.given[r][c];

      if (val !== 0) {
        cell.textContent = val;
        cell.classList.add(isGiven ? 'given' : 'user-filled');
        // Mark error: user placed a wrong number
        if (!isGiven && val !== state.solution[r][c]) {
          cell.classList.add('error');
        }
      } else {
        const noteSet = state.notes[r][c];
        if (noteSet.size > 0) {
          const grid = document.createElement('div');
          grid.className = 'notes-grid';
          for (let n = 1; n <= 9; n++) {
            const nd = document.createElement('div');
            nd.className = 'note-digit';
            nd.textContent = noteSet.has(n) ? n : '';
            grid.appendChild(nd);
          }
          cell.appendChild(grid);
        }
      }

      cell.addEventListener('click', () => selectCell(r, c));
      boardEl.appendChild(cell);
    }
  }
  applyHighlights();
}

function applyHighlights() {
  const cells = boardEl.querySelectorAll('.cell');
  cells.forEach(cell => {
    cell.classList.remove('selected', 'highlight', 'highlight2', 'same-num');
  });

  if (!state.selected) return;
  const { row, col } = state.selected;
  const selVal = state.board[row][col];

  cells.forEach(cell => {
    const r = +cell.dataset.row;
    const c = +cell.dataset.col;

    if (r === row && c === col) {
      cell.classList.add('selected');
      return;
    }

    const sameRow = r === row;
    const sameCol = c === col;
    const sameBox = Math.floor(r / 3) === Math.floor(row / 3) &&
                    Math.floor(c / 3) === Math.floor(col / 3);

    if (sameRow || sameCol) {
      cell.classList.add('highlight');
    } else if (sameBox) {
      cell.classList.add('highlight2');
    }

    // Highlight same number
    if (selVal !== 0 && state.board[r][c] === selVal) {
      cell.classList.remove('highlight', 'highlight2');
      cell.classList.add('same-num');
    }
  });
}

// ── Cell selection & input ────────────────────────────────────────────────

function selectCell(r, c) {
  state.selected = { row: r, col: c };
  applyHighlights();
}

function inputNumber(num) {
  if (!state.selected || state.won) return;
  const { row, col } = state.selected;
  if (state.given[row][col]) return;

  if (state.notesMode && num !== 0) {
    const noteSet = state.notes[row][col];
    if (noteSet.has(num)) {
      noteSet.delete(num);
    } else {
      noteSet.add(num);
    }
    renderBoard();
    return;
  }

  // Clear notes when placing a real number
  state.notes[row][col].clear();

  if (num === 0) {
    state.board[row][col] = 0;
    renderBoard();
    return;
  }

  if (state.board[row][col] === num) {
    // Same number – deselect / treat as erase
    state.board[row][col] = 0;
    renderBoard();
    return;
  }

  const correct = state.solution[row][col];
  state.board[row][col] = num;

  if (num !== correct) {
    state.mistakes++;
    mistakesEl.textContent = `${state.mistakes} / 3`;
    if (state.mistakes >= 3) {
      stopTimer();
      renderBoard();
      loseModal.classList.remove('hidden');
      return;
    }
  } else {
    // Remove notes of this number from peers
    removePeerNotes(row, col, num);
  }

  renderBoard();
  checkWin();
}

function removePeerNotes(row, col, num) {
  for (let i = 0; i < 9; i++) {
    state.notes[row][i].delete(num);
    state.notes[i][col].delete(num);
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      state.notes[r][c].delete(num);
    }
  }
}

function checkWin() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (state.board[r][c] !== state.solution[r][c]) return;
    }
  }
  // All correct!
  stopTimer();
  state.won = true;
  winTimeEl.textContent  = `Time: ${fmt(state.timerSec)}`;
  winMistakesEl.textContent = `Mistakes: ${state.mistakes}`;
  winModal.classList.remove('hidden');
}

// ── Hint ──────────────────────────────────────────────────────────────────

function useHint() {
  if (state.hints <= 0 || state.won) return;

  // Find empty or wrong cells; prefer selected cell first
  const candidates = [];
  if (state.selected) {
    const { row, col } = state.selected;
    if (!state.given[row][col] && state.board[row][col] !== state.solution[row][col]) {
      candidates.push([row, col]);
    }
  }
  if (candidates.length === 0) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!state.given[r][c] && state.board[r][c] !== state.solution[r][c]) {
          candidates.push([r, c]);
        }
      }
    }
  }
  if (candidates.length === 0) return;

  const [r, c] = candidates[0];
  state.board[r][c] = state.solution[r][c];
  state.given[r][c] = true; // treat hint as given (can't be erased)
  state.notes[r][c].clear();
  removePeerNotes(r, c, state.solution[r][c]);
  state.hints--;
  hintCountEl.textContent = state.hints;

  state.selected = { row: r, col: c };
  renderBoard();
  checkWin();
}

// ── Check ─────────────────────────────────────────────────────────────────

function checkBoard() {
  // Flash incorrect cells
  const cells = boardEl.querySelectorAll('.cell');
  cells.forEach(cell => {
    const r = +cell.dataset.row;
    const c = +cell.dataset.col;
    const v = state.board[r][c];
    if (!state.given[r][c] && v !== 0 && v !== state.solution[r][c]) {
      cell.classList.add('error');
    }
  });
}

// ── Reset ─────────────────────────────────────────────────────────────────

function resetBoard() {
  if (!state.puzzle) return;
  state.board = state.puzzle.map(r => [...r]);
  state.notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
  state.mistakes = 0;
  state.hints = 3;
  state.timerSec = 0;
  state.won = false;
  mistakesEl.textContent = '0 / 3';
  hintCountEl.textContent = '3';
  timerEl.textContent = '00:00';
  state.selected = null;
  renderBoard();
  startTimer();
}

// ── Event Wiring ──────────────────────────────────────────────────────────

// Number pad
document.getElementById('numpad').addEventListener('click', e => {
  const btn = e.target.closest('.num-btn');
  if (!btn) return;
  const num = +btn.dataset.num;

  // Toggle active highlight on number buttons
  document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('active-num'));
  if (num !== 0) btn.classList.add('active-num');

  inputNumber(num);
});

// Keyboard input
document.addEventListener('keydown', e => {
  if (e.key >= '1' && e.key <= '9') {
    const num = +e.key;
    document.querySelectorAll('.num-btn').forEach(b => {
      b.classList.toggle('active-num', +b.dataset.num === num);
    });
    inputNumber(num);
  } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
    document.querySelectorAll('.num-btn').forEach(b => b.classList.remove('active-num'));
    inputNumber(0);
  } else if (e.key === 'ArrowUp'    && state.selected) selectCell(Math.max(0, state.selected.row - 1), state.selected.col);
  else if  (e.key === 'ArrowDown'   && state.selected) selectCell(Math.min(8, state.selected.row + 1), state.selected.col);
  else if  (e.key === 'ArrowLeft'   && state.selected) selectCell(state.selected.row, Math.max(0, state.selected.col - 1));
  else if  (e.key === 'ArrowRight'  && state.selected) selectCell(state.selected.row, Math.min(8, state.selected.col + 1));
});

// Difficulty buttons
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.difficulty = btn.dataset.diff;
    newGame();
  });
});

// Control buttons
document.getElementById('new-game-btn').addEventListener('click', newGame);
document.getElementById('hint-btn').addEventListener('click', useHint);
document.getElementById('check-btn').addEventListener('click', checkBoard);
document.getElementById('reset-btn').addEventListener('click', resetBoard);

document.getElementById('notes-btn').addEventListener('click', () => {
  state.notesMode = !state.notesMode;
  notesStatusEl.textContent = state.notesMode ? 'On' : 'Off';
  notesStatusEl.classList.toggle('on', state.notesMode);
});

document.getElementById('play-again-btn').addEventListener('click', newGame);
document.getElementById('try-again-btn').addEventListener('click', newGame);

// ── Start ─────────────────────────────────────────────────────────────────

newGame();
