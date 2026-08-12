import './styles.css';
import { createFeed } from './feed';
import { LANE_LABEL, type Lane, type RefereeEvent, type SessionCard } from './types';

const clockEl = document.getElementById('clock')!;
const scoreA = document.getElementById('score-a')!;
const scoreB = document.getElementById('score-b')!;
const evidenceList = document.getElementById('evidence-list')!;
const runBtn = document.getElementById('run-match') as HTMLButtonElement;
const statusEl = document.getElementById('match-status')!;

const cards = new Map<string, SessionCard>();
const evidence: RefereeEvent[] = [];
let currentScore: [number, number] = [0, 0];

const feed = createFeed();

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
  renderBoard(card.fleet);
});

feed.onReferee((ev) => {
  evidence.push(ev);
  renderEvidence();
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

feed.onStatus((st) => {
  statusEl.textContent = `Status: ${JSON.stringify(st)}`;
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

// Wire the Run Match button (real API call to /api/match).
runBtn?.addEventListener('click', () => {
  statusEl.textContent = 'Starting match...';
  feed.runMatch().catch((e) => {
    statusEl.textContent = 'Error: ' + e.message;
  });
});

feed.start();
// Poll server match status so the board reflects reality even without SSE.
setInterval(async () => {
  try {
    const res = await fetch('/api/match/status');
    const st = await res.json();
    statusEl.textContent = 'Status: ' + JSON.stringify(st);
  } catch {
    // server not ready yet
  }
}, 2000);