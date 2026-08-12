import './styles.css';
import { createFeed } from './feed';
import { LANE_LABEL, type Lane, type RefereeEvent, type SessionCard } from './types';

const clockEl = document.getElementById('clock')!;
const scoreA = document.getElementById('score-a')!;
const scoreB = document.getElementById('score-b')!;
const evidenceList = document.getElementById('evidence-list')!;

const cards = new Map<string, SessionCard>();
const evidence: RefereeEvent[] = [];
let currentScore: [number, number] = [0, 0];

const feed = createFeed(import.meta.env.VITE_MOCK !== 'false');

function fleetText(fleet: 'a' | 'b'): string {
  return fleet === 'a' ? 'Fleet A' : 'Fleet B';
}

function renderBoard(fleet: 'a' | 'b') {
  const lanes = document.querySelectorAll<HTMLDivElement>(`.board[data-fleet="${fleet}"] .kanban`);
  const fleetCards = [...cards.values()].filter((c) => c.fleet === fleet);
  lanes.forEach((lane) => {
    const laneName = lane.dataset.lane as Lane;
    const list = lane.querySelector('.cards');
    if (!list) return;
    const items = fleetCards
      .filter((c) => c.status === laneName)
      .sort((a, b) => a.ts - b.ts);
    list.innerHTML = items
      .map(
        (c) => `
          <div class="card ${c.status === 'ci_failed' ? 'alert' : ''}" title="${c.id}">
            <span class="card-label">${c.label}</span>
            <span class="card-branch">${c.branch}</span>
            ${c.pr ? `<span class="card-pr">${c.pr}</span>` : ''}
          </div>`,
      )
      .join('');
  });
}

function renderEvidence() {
  const recent = [...evidence].slice(-6).reverse();
  evidenceList.innerHTML = recent
    .map(
      (e) => `
        <li class="ev ${e.severity}">
          <strong>${e.category}</strong>
          <span>${e.message}</span>
          ${e.evidence ? `<code>${e.evidence}</code>` : ''}
        </li>`,
    )
    .join('');
}

function renderScores() {
  scoreA.textContent = `${currentScore[0]}`;
  scoreB.textContent = `${currentScore[1]}`;
}

feed.onSession((card) => {
  cards.set(card.id, card);
  const board = card.fleet === 'a' ? '#board-a' : '#board-b';
  const boardEl = document.querySelector(board);
  // Build the lane columns once per board.
  if (boardEl && !boardEl.querySelector('.kanban[data-lane]')) {
    const kanban = boardEl.querySelector('.kanban');
    if (kanban) {
      (['pending', 'working', 'needs_input', 'ci_failed', 'changes_requested', 'review_pending', 'mergeable', 'merged'] as Lane[]).forEach((lane) => {
        const div = document.createElement('div');
        div.className = 'kanban';
        div.dataset.lane = lane;
        div.innerHTML = `<h3>${LANE_LABEL[lane]}</h3><div class="cards"></div>`;
        boardEl.appendChild(div);
      });
      kanban.remove();
    }
  }
  renderBoard(card.fleet);
});

feed.onReferee((ev) => {
  evidence.push(ev);
  renderEvidence();
  // A critical finding on a fleet drops that fleet's visible score.
  if (ev.severity === 'critical') {
    const idx = ev.fleet === 'a' ? 0 : 1;
    currentScore[idx] = Math.max(0, currentScore[idx] - 30);
    renderScores();
  }
});

feed.onScore((a, b) => {
  currentScore = [a, b];
  renderScores();
});

feed.onClock((ms) => {
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  clockEl.textContent = `${mm}:${ss}`;
});

// Seed a board container with its lane columns at build time.
function initBoard(fleet: 'a' | 'b') {
  const boardEl = document.querySelector<HTMLDivElement>(fleet === 'a' ? '#board-a' : '#board-b')!;
  (['pending', 'working', 'needs_input', 'ci_failed', 'changes_requested', 'review_pending', 'mergeable', 'merged'] as Lane[]).forEach((lane) => {
    const div = document.createElement('div');
    div.className = 'kanban';
    div.dataset.lane = lane;
    div.innerHTML = `<h3>${LANE_LABEL[lane]}</h3><div class="cards"></div>`;
    boardEl.appendChild(div);
  });
}
initBoard('a');
initBoard('b');

renderScores();
feed.start();