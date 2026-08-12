// Arena — the live broadcast. Two Kanban boards, referee evidence rail,
// authoritative scoreboard. "Run Match" runs a genuine head-to-head.

import { runMatch } from '../api';
import { createFeed, type Feed } from '../feed';
import { countUp } from '../motion';
import { LANE_LABEL, type Lane, type RefereeEvent, type SessionCard } from '../types';

const cards = new Map<string, SessionCard>();
const evidence: RefereeEvent[] = [];
// Card id -> last rendered status, so only genuinely new/moved cards animate.
const rendered = new Map<string, string>();
let currentScore: [number, number] = [0, 0];
let feed: Feed | null = null;

export function renderArena(): string {
  return `
    <div class="page arena">
      <main class="container container-wide">
        <div class="page-head">
          <div>
            <div class="kicker">Live broadcast</div>
            <h1 class="display-1" style="margin-top: var(--space-3);">Arena · Season 0</h1>
          </div>
          <div class="flex gap-3" style="align-items: center;">
            <span class="badge badge-danger"><span class="live-dot" aria-hidden="true"></span> live</span>
            <span class="badge badge-neutral">spec rest-api-auth</span>
          </div>
        </div>

        <div class="arena-grid">
          <!-- FLEET A -->
          <section class="board a reveal">
            <div class="board-head">
              <div>
                <div class="fleet-name">Fleet A <span class="fleet-role">· dishonest</span></div>
              </div>
              <div class="score-pill" id="score-a-pill">0</div>
            </div>
            <div class="kanban" id="kanban-a"></div>
          </section>

          <!-- FLEET B -->
          <section class="board b reveal" style="--reveal-delay: 60ms;">
            <div class="board-head">
              <div>
                <div class="fleet-name">Fleet B <span class="fleet-role">· honest</span></div>
              </div>
              <div class="score-pill" id="score-b-pill">0</div>
            </div>
            <div class="kanban" id="kanban-b"></div>
          </section>

          <!-- SIDEBAR -->
          <aside class="flex" style="flex-direction: column; gap: var(--space-5);">
            <section class="rail reveal" style="--reveal-delay: 120ms;">
              <div class="rail-head">
                <h3>Match status</h3>
                <span class="badge badge-neutral" id="status-badge">idle</span>
              </div>
              <div class="status-block">
                <div class="status-line" id="status-display">
                  <p class="status-detail">The referee runs real go test in isolated worktrees and audits both deliveries.</p>
                </div>
                <button class="btn btn-accent btn-lg" id="run-match" style="width: 100%; margin-top: var(--space-4);">Run Match</button>
              </div>
            </section>

            <section class="rail reveal" style="--reveal-delay: 180ms;">
              <div class="rail-head">
                <h3>Referee evidence</h3>
                <span class="badge badge-neutral" id="evidence-count">0 findings</span>
              </div>
              <ul class="evidence-list" id="evidence-list"></ul>
            </section>

            <section class="rail reveal" style="--reveal-delay: 240ms;">
              <div class="rail-head"><h3>Active spec</h3></div>
              <div class="spec-detail">
                <div class="sd-row"><span>id</span><span id="spec-id">rest-api-auth</span></div>
                <div class="sd-row"><span>description</span><span id="spec-desc">REST API with auth</span></div>
                <div class="sd-row"><span>checks</span><span id="spec-checks">4 · deterministic</span></div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  `;
}

function initKanbanBoards() {
  const lanes: Lane[] = ['pending', 'working', 'needs_input', 'ci_failed', 'changes_requested', 'review_pending', 'mergeable', 'merged'];
  ['a', 'b'].forEach((fleet) => {
    const board = document.getElementById(`kanban-${fleet}`)!;
    lanes.forEach((lane) => {
      const div = document.createElement('div');
      div.className = 'lane';
      div.dataset.lane = lane;
      div.innerHTML = `
        <div class="lane-head"><span class="lane-dot" aria-hidden="true"></span><span>${LANE_LABEL[lane]}</span></div>
        <div class="cards"></div>`;
      board.appendChild(div);
    });
  });
}

function renderBoard(fleet: 'a' | 'b') {
  const lanes = document.querySelectorAll<HTMLDivElement>(`#board-${fleet} .lane`);
  const fleetCards = [...cards.values()].filter((c) => c.fleet === fleet);
  lanes.forEach((lane) => {
    const laneName = lane.dataset.lane as Lane;
    const list = lane.querySelector('.cards');
    if (!list) return;
    const items = fleetCards.filter((c) => c.status === laneName).sort((a, b) => a.ts - b.ts);

    // Flash the lane when a card lands here for the first time.
    const movedIn = items.some((c) => rendered.get(c.id) !== laneName);
    if (movedIn) {
      lane.classList.remove('flash');
      void lane.offsetWidth; // restart the animation
      lane.classList.add('flash');
    }

    list.innerHTML = items.map(
      (c) => {
        const isNew = rendered.get(c.id) !== c.status;
        return `
        <div class="task-card ${c.status === 'ci_failed' ? 'alert' : ''} ${isNew ? 'is-new' : ''}" title="${c.id}">
          <span class="tc-label">${c.label}</span>
          <span class="tc-branch">${c.branch}</span>
          ${c.pr ? `<span class="tc-pr">${c.pr}</span>` : ''}
        </div>`;
      }
    ).join('');

    items.forEach((c) => rendered.set(c.id, laneName));
  });
}

function renderEvidence() {
  const list = document.getElementById('evidence-list')!;
  const countEl = document.getElementById('evidence-count')!;
  const recent = [...evidence].slice(-10).reverse();
  list.innerHTML = recent.map(
    (e) => `
    <li class="evidence-item ${e.severity}">
      <div class="ev-head">
        <span class="ev-cat">${e.category}</span>
        <span class="badge ${e.severity === 'critical' ? 'badge-danger' : e.severity === 'warning' ? 'badge-amber' : 'badge-cyan'}">${e.severity}</span>
      </div>
      <span class="ev-msg">${e.message}</span>
      ${e.evidence ? `<code>${e.evidence}</code>` : ''}
    </li>`
  ).join('');
  countEl.textContent = `${evidence.length} finding${evidence.length !== 1 ? 's' : ''}`;
}

function renderScores() {
  const a = document.getElementById('score-a-pill')!;
  const b = document.getElementById('score-b-pill')!;
  countUp(a, Math.round(currentScore[0]));
  countUp(b, Math.round(currentScore[1]));
  // Brief pulse on the scoreboard when the authoritative score arrives.
  [a, b].forEach((el) => {
    el.classList.remove('score-pulse');
    void el.offsetWidth;
    el.classList.add('score-pulse');
  });
}

function renderStatus(status: any) {
  const badge = document.getElementById('status-badge')!;
  const display = document.getElementById('status-display')!;
  if (!status || status.status === 'idle') {
    badge.className = 'badge badge-neutral';
    badge.textContent = 'idle';
    return;
  }
  if (status.status === 'running') {
    badge.className = 'badge badge-cyan';
    badge.textContent = 'running';
    display.innerHTML = `
      <span class="badge badge-cyan"><span class="live-dot" aria-hidden="true"></span> running</span>
      <p class="status-detail">${status.detail || 'Fleets are working — real worktrees, real go test.'}</p>`;
    return;
  }
  if (status.status === 'complete') {
    badge.className = 'badge badge-ok';
    badge.textContent = 'complete';
    display.innerHTML = `
      <span class="badge badge-ok">complete</span>
      <p class="status-detail">Winner: <strong>${winnerLabel()}</strong> · Fleet A ${Math.round(currentScore[0])} : ${Math.round(currentScore[1])} Fleet B</p>`;
    return;
  }
  if (status.status === 'error') {
    badge.className = 'badge badge-danger';
    badge.textContent = 'error';
    display.innerHTML = `<p class="status-detail" style="color: var(--danger);">${status.detail || 'match failed'}</p>`;
  }
}

function winnerLabel(): string {
  if (currentScore[0] > currentScore[1]) return 'Fleet A';
  if (currentScore[1] > currentScore[0]) return 'Fleet B';
  return 'Draw';
}

function bindFeed() {
  feed = createFeed();
  feed.onSession((card) => {
    cards.set(card.id, card);
    renderBoard(card.fleet);
  });
  feed.onReferee((ev) => {
    evidence.push(ev);
    renderEvidence();
  });
  // The server owns the scoreboard — the authoritative pair arrives via SSE.
  feed.onScore((a, b) => {
    currentScore = [a, b];
    renderScores();
  });
  feed.onClock((ms) => {
    const el = document.getElementById('clock');
    if (!el) return;
    const s = Math.floor(ms / 1000);
    el.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  });
  feed.onStatus((st) => renderStatus(st));
  feed.start();
}

export function mountArena(): () => void {
  initKanbanBoards();
  bindFeed();

  document.getElementById('run-match')?.addEventListener('click', async () => {
    const btn = document.getElementById('run-match') as HTMLButtonElement;
    btn.disabled = true;
    btn.classList.add('is-loading');
    const badge = document.getElementById('status-badge')!;
    badge.className = 'badge badge-cyan';
    badge.textContent = 'starting';
    try {
      await runMatch();
      const t = setInterval(() => {
        if (badge.textContent === 'complete') {
          btn.disabled = false;
          btn.classList.remove('is-loading');
          clearInterval(t);
        }
      }, 400);
    } catch {
      badge.className = 'badge badge-danger';
      badge.textContent = 'error';
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  });

  return () => {
    feed?.stop();
    feed = null;
    cards.clear();
    evidence.length = 0;
    rendered.clear();
    currentScore = [0, 0];
  };
}
