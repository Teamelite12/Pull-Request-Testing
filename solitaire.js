'use strict';

// ─── Constants ────────────────────────────────────────────────────

const SUITS  = ['♠', '♥', '♦', '♣'];
const RED    = new Set(['♥', '♦']);
const LABELS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// ─── State ────────────────────────────────────────────────────────

let state   = null;  // { stock, waste, foundations[4], tableau[7], score }
let history = [];    // undo stack (max 50 entries)
let drag    = null;  // { type, pileIdx, cardIdx } while drag is in progress
let sel     = null;  // { type, pileIdx, cardIdx } click-selection

// ─── Deck helpers ─────────────────────────────────────────────────

function makeDeck() {
  return SUITS.flatMap(s => Array.from({ length: 13 }, (_, i) => ({ suit: s, value: i + 1 })));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deepClone(x) {
  return JSON.parse(JSON.stringify(x));
}

// ─── Game initialisation ──────────────────────────────────────────

function dealGame() {
  const deck    = shuffle(makeDeck());
  const tableau = Array.from({ length: 7 }, () => []);
  let idx = 0;

  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      tableau[col].push({ ...deck[idx++], faceUp: row === col });
    }
  }

  return {
    stock      : deck.slice(idx).map(c => ({ ...c, faceUp: false })),
    waste      : [],
    foundations: [[], [], [], []],
    tableau,
    score      : 0,
  };
}

function startGame() {
  state   = dealGame();
  history = [];
  sel     = null;
  drag    = null;
  document.getElementById('win-overlay').classList.add('hidden');
  render();
}

// ─── Rules ────────────────────────────────────────────────────────

function isRed(suit) { return RED.has(suit); }

// Can `card` be placed on top of a tableau pile?
function canStack(card, pile) {
  if (!pile.length) return card.value === 13; // only King on empty column
  const top = pile[pile.length - 1];
  return top.faceUp
    && isRed(card.suit) !== isRed(top.suit)
    && card.value === top.value - 1;
}

// Can `card` be placed on top of a foundation pile?
function canFoundation(card, pile) {
  if (!pile.length) return card.value === 1; // Ace starts a foundation
  const top = pile[pile.length - 1];
  return top.suit === card.suit && card.value === top.value + 1;
}

// ─── Move helpers ─────────────────────────────────────────────────

// Return the card(s) that would be picked up from this source.
function getMoving(type, pileIdx, cardIdx) {
  switch (type) {
    case 'waste'      : return [state.waste[state.waste.length - 1]];
    case 'tableau'    : return state.tableau[pileIdx].slice(cardIdx);
    case 'foundation' : return [state.foundations[pileIdx][state.foundations[pileIdx].length - 1]];
    default           : return [];
  }
}

// Remove the cards from their source (after saving history).
function removeMoving(type, pileIdx, cardIdx) {
  switch (type) {
    case 'waste':
      state.waste.pop();
      break;
    case 'tableau': {
      const col = state.tableau[pileIdx];
      col.splice(cardIdx, col.length - cardIdx);
      // Flip the new top card if it is face-down.
      if (col.length && !col[col.length - 1].faceUp) {
        col[col.length - 1].faceUp = true;
        state.score += 5;
      }
      break;
    }
    case 'foundation':
      state.foundations[pileIdx].pop();
      break;
  }
}

// Attempt to move cards from `src` to `dst`.
// Both are { type, pileIdx, cardIdx }.  Returns true on success.
function tryMove(src, dst) {
  const cards = getMoving(src.type, src.pileIdx, src.cardIdx);
  if (!cards.length) return false;

  let ok = false;
  if (dst.type === 'tableau') {
    ok = canStack(cards[0], state.tableau[dst.pileIdx]);
  } else if (dst.type === 'foundation') {
    ok = cards.length === 1 && canFoundation(cards[0], state.foundations[dst.pileIdx]);
  }
  if (!ok) return false;

  saveHistory();
  removeMoving(src.type, src.pileIdx, src.cardIdx);

  if (dst.type === 'tableau') {
    state.tableau[dst.pileIdx].push(...cards);
    state.score += 5;
  } else {
    state.foundations[dst.pileIdx].push(cards[0]);
    state.score += 10;
  }
  return true;
}

// Auto-move a single card to whichever foundation accepts it.
function autoFoundation(type, pileIdx, cardIdx) {
  const cards = getMoving(type, pileIdx, cardIdx);
  if (cards.length !== 1) return false;
  const fi = state.foundations.findIndex(p => canFoundation(cards[0], p));
  if (fi === -1) return false;
  saveHistory();
  removeMoving(type, pileIdx, cardIdx);
  state.foundations[fi].push(cards[0]);
  state.score += 10;
  return true;
}

// Draw one card from stock (or recycle waste → stock).
function drawStock() {
  saveHistory();
  if (!state.stock.length) {
    if (!state.waste.length) return;
    state.stock = state.waste.slice().reverse().map(c => ({ ...c, faceUp: false }));
    state.waste = [];
    state.score = Math.max(0, state.score - 100);
  } else {
    const card = state.stock.pop();
    card.faceUp = true;
    state.waste.push(card);
  }
}

// ─── History / Undo ───────────────────────────────────────────────

function saveHistory() {
  history.push(deepClone(state));
  if (history.length > 50) history.shift();
}

function undo() {
  if (!history.length) return;
  state = history.pop();
  sel   = null;
  render();
}

// ─── Win detection ────────────────────────────────────────────────

function checkWin() {
  if (state.foundations.every(p => p.length === 13)) {
    setTimeout(() => {
      document.getElementById('final-score').textContent = state.score;
      document.getElementById('win-overlay').classList.remove('hidden');
    }, 400);
  }
}

// ─── Click-to-move interaction ────────────────────────────────────

function handleCardClick(type, pileIdx, cardIdx) {
  if (sel) {
    // Clicking the same pile — deselect.
    if (sel.type === type && sel.pileIdx === pileIdx) {
      sel = null;
      render();
      return;
    }
    // Try to move selected cards onto this pile.
    const dst = { type, pileIdx, cardIdx };
    if ((type === 'tableau' || type === 'foundation') && tryMove(sel, dst)) {
      sel = null;
      checkWin();
      render();
      return;
    }
    // Can't move there — re-select the new card.
    sel = null;
  }
  sel = { type, pileIdx, cardIdx };
  render();
}

// Called when the user clicks an empty pile area.
function handlePileClick(type, pileIdx) {
  if (!sel) return;
  if (tryMove(sel, { type, pileIdx, cardIdx: 0 })) {
    sel = null;
    checkWin();
    render();
  }
}

// ─── Drag-and-drop ────────────────────────────────────────────────

function makeDraggable(el, type, pileIdx, cardIdx) {
  el.draggable = true;

  el.addEventListener('dragstart', e => {
    drag = { type, pileIdx, cardIdx };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    // Mark dragged cards after the browser has captured the drag image.
    setTimeout(() => {
      if (type === 'tableau') {
        const len = state.tableau[pileIdx].length;
        for (let i = cardIdx; i < len; i++) {
          const node = document.querySelector(`.card[data-col="${pileIdx}"][data-row="${i}"]`);
          if (node) node.classList.add('dragging');
        }
      } else {
        el.classList.add('dragging');
      }
    }, 0);
  });

  el.addEventListener('dragend', () => {
    document.querySelectorAll('.dragging').forEach(n => n.classList.remove('dragging'));
    drag = null;
  });
}

function makeDropTarget(el, type, pileIdx) {
  el.addEventListener('dragover', e => {
    e.preventDefault();
    el.classList.add('drag-over');
  });

  el.addEventListener('dragleave', e => {
    if (!el.contains(e.relatedTarget)) el.classList.remove('drag-over');
  });

  el.addEventListener('drop', e => {
    e.preventDefault();
    el.classList.remove('drag-over');
    if (!drag) return;
    if (tryMove(drag, { type, pileIdx, cardIdx: 0 })) {
      drag = null;
      sel  = null;
      checkWin();
      render();
    } else {
      drag = null;
    }
  });

  // Also handle click-to-place on empty pile areas.
  el.addEventListener('click', () => handlePileClick(type, pileIdx));
}

// ─── Rendering ────────────────────────────────────────────────────

function buildCard(card, type, pileIdx, cardIdx, isTop) {
  const el = document.createElement('div');
  el.className = 'card';

  if (!card.faceUp) {
    el.classList.add('face-down');
    return el;
  }

  el.classList.add('face-up');
  if (isRed(card.suit)) el.classList.add('red');

  const lbl = LABELS[card.value];
  el.innerHTML =
    `<span class="card-tl">${lbl}<br>${card.suit}</span>` +
    `<span class="card-suit">${card.suit}</span>` +
    `<span class="card-br">${lbl}<br>${card.suit}</span>`;

  // Used to locate sibling cards during dragstart.
  el.dataset.col = pileIdx;
  el.dataset.row = cardIdx;

  makeDraggable(el, type, pileIdx, cardIdx);

  el.addEventListener('click', e => {
    e.stopPropagation();
    handleCardClick(type, pileIdx, cardIdx);
  });

  // Double-click the top card to auto-send to foundation.
  if (isTop) {
    el.addEventListener('dblclick', e => {
      e.stopPropagation();
      if (autoFoundation(type, pileIdx, cardIdx)) {
        sel = null;
        checkWin();
        render();
      }
    });
  }

  // Highlight the card if it is part of the current selection.
  const isSel = sel
    && sel.type === type
    && sel.pileIdx === pileIdx
    && (type !== 'tableau' || sel.cardIdx <= cardIdx);
  if (isSel) el.classList.add('selected');

  return el;
}

function render() {
  document.getElementById('score').textContent = state.score;

  // ── Stock ──────────────────────────────────────────────────────
  const stockEl = document.getElementById('stock');
  stockEl.innerHTML = '';
  if (state.stock.length) {
    const c = document.createElement('div');
    c.className = 'card face-down';
    c.style.cursor = 'pointer';
    stockEl.appendChild(c);
  } else {
    stockEl.innerHTML = '<div class="empty-hint">↺</div>';
  }

  // ── Waste ──────────────────────────────────────────────────────
  const wasteEl = document.getElementById('waste');
  wasteEl.innerHTML = '';
  if (state.waste.length) {
    const card = state.waste[state.waste.length - 1];
    wasteEl.appendChild(buildCard(card, 'waste', 0, state.waste.length - 1, true));
  }

  // ── Foundations ────────────────────────────────────────────────
  SUITS.forEach((suit, i) => {
    const el   = document.getElementById(`foundation-${i}`);
    el.innerHTML = '';
    const pile = state.foundations[i];
    if (pile.length) {
      el.appendChild(buildCard(pile[pile.length - 1], 'foundation', i, pile.length - 1, true));
    } else {
      el.innerHTML = `<div class="empty-hint">${suit}</div>`;
    }
  });

  // ── Tableau ────────────────────────────────────────────────────
  for (let col = 0; col < 7; col++) {
    const colEl = document.getElementById(`col-${col}`);
    colEl.innerHTML = '';
    const cards = state.tableau[col];

    if (!cards.length) {
      colEl.style.minHeight = '120px';
      colEl.innerHTML = '<div class="empty-hint">K</div>';
      continue;
    }

    let topOffset = 0;
    cards.forEach((card, idx) => {
      const el = buildCard(card, 'tableau', col, idx, idx === cards.length - 1);
      el.style.top = `${topOffset}px`;
      colEl.appendChild(el);
      topOffset += card.faceUp ? 28 : 18;
    });
    colEl.style.minHeight = `${topOffset + 112}px`;
  }
}

// ─── Wire up static elements ──────────────────────────────────────

document.getElementById('stock').addEventListener('click', () => {
  drawStock();
  render();
});

document.getElementById('btn-new').addEventListener('click', () => {
  if (confirm('Start a new game?')) startGame();
});

document.getElementById('btn-undo').addEventListener('click', undo);
document.getElementById('btn-play-again').addEventListener('click', startGame);

SUITS.forEach((_, i) => makeDropTarget(document.getElementById(`foundation-${i}`), 'foundation', i));
for (let col = 0; col < 7; col++) {
  makeDropTarget(document.getElementById(`col-${col}`), 'tableau', col);
}

startGame();
