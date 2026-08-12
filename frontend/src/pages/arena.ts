// Arena page: two Kanban boards, live referee evidence rail, real matches.
// "Run Match" starts a genuine head-to-head on the server — real worktrees,
// real go test, real referee verdicts. The SSE stream renders the play-by-play.

import { runMatch } from '../api';
import { createFeed, type Feed } from '../feed';
import { LANE_LABEL, type Lane, type RefereeEvent, type SessionCard } from '../types';

// === STATE ===
const cards = new Map<string, SessionCard>();
const evidence: RefereeEvent[] = [];
let currentScore: [number, number] = [0, 0];
let feed: Feed | null = null;

export function renderArena(): string {
  return `
    <div class="arena" id="arena">
      <main class="container" style="flex: 1; padding: var(--space-4); max-width: 1600px;">
        <section id="boards" class="boards">
          <div class="board" id="board-a" data-fleet="a">
            <div class="board-header">
              <h2 class="board-title">Fleet A <span class="caption" style="margin-left: var(--space-2);">dishonest</span></h2>
              <div class="score-pill" id="score-a-pill">0</div>
            </div>
            <div class="kanban" id="kanban-a"></div>
          </div>

          <div class="vs-divider">VS</div>

          <div class="board" id="board-b" data-fleet="b">
            <div class="board-header">
              <h2 class="board-title">Fleet B <span class="caption" style="margin-left: var(--space-2);">honest</span></h2>
              <div class="score-pill" id="score-b-pill">0</div>
            </div>
            <div class="kanban" id="kanban-b"></div>
          </div>
        </section>

        <aside class="sidebar">
          <section id="match-status" class="card">
            <div class="evidence-header">
              <h3 class="heading-2">Match Status</h3>
              <span class="badge badge-neutral" id="status-badge">Idle</span>
            </div>
            <div id="status-display" class="status-display">
              <p class="body-sm" style="color: var(--text-muted);">The referee runs real go test in isolated worktrees and audits both deliveries. No script, no fixtures on this path — except the honest-vs-dishonest default.</p>
            </div>
            <button class="btn btn-accent" id="run-match" style="margin-top: var(--space-4); width: 100%;">Run Match</button>
          </section>

          <section id="evidence" class="card">
            <div class="evidence-header">
              <h3 class="heading-2">Referee Evidence</h3>
              <span class="badge badge-neutral" id="evidence-count">0 findings</span>
            </div>
            <ul id="evidence-list" class="evidence-list"></ul>
          </section>

          <section id="spec-info" class="card">
            <h3 class="heading-2" style="margin-bottom: var(--space-3);">Active Spec</h3>
            <div id="spec-detail" class="spec-detail">
              <div class="spec-row"><span class="caption">ID</span><span id="spec-id">rest-api-auth</span></div>
              <div class="spec-row"><span class="caption">Description</span><span id="spec-desc">REST API with authentication</span></div>
              <div class="spec-row"><span class="caption">Checks</span><span id="spec-checks">Symbol Reality, Test Reality, Claim vs Diff, Merge Gate</span></div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  `;
}

// === INITIALIZE LANES ===
function initKanbanBoards() {
  const lanes: Lane[] = ['pending', 'working', 'needs_input', 'ci_failed', 'changes_requested', 'review_pending', 'mergeable', 'merged'];
  ['a', 'b'].forEach(fleet => {
    const board = document.getElementById(`kanban-${fleet}`)!;
    lanes.forEach(lane => {
      const div = document.createElement('div');
      div.className = 'kanban';
      div.dataset.lane = lane;
      div.innerHTML = `<h3>${LANE_LABEL[lane]}</h3><div class="cards"></div>`;
      board.appendChild(div);
    });
  });
}

// === RENDER HELPERS ===
function renderBoard(fleet: 'a' | 'b') {
  const lanes = document.querySelectorAll<HTMLDivElement>(`#board-${fleet} .kanban`);
  const fleetCards = [...cards.values()].filter(c => c.fleet === fleet);
  lanes.forEach(lane => {
    const laneName = lane.dataset.lane as Lane;
    const list = lane.querySelector('.cards');
    if (!list) return;
    const items = fleetCards
      .filter(c => c.status === laneName)
      .sort((a, b) => a.ts - b.ts);
    list.innerHTML = items.map(c => `
      <div class="card ${c.status === 'ci_failed' ? 'alert' : ''} animate-scale-in" title="${c.id}" style="animation-delay: ${Math.random() * 50}ms;">
        <span class="card-label">${c.label}</span>
        <span class="card-branch">${c.branch}</span>
        ${c.pr ? `<span class="card-pr">${c.pr}</span>` : ''}
      </div>
    `).join('');
  });
}

function renderEvidence() {
  const list = document.getElementById('evidence-list')!;
  const countEl = document.getElementById('evidence-count')!;
  const recent = [...evidence].slice(-10).reverse();
  list.innerHTML = recent.map(e => `
    <li class="ev ${e.severity} animate-slide-up">
      <strong>${e.category}</strong>
      <span>${e.message}</span>
      ${e.evidence ? `<code>${e.evidence}</code>` : ''}
    </li>
  `).join('');
  countEl.textContent = `${evidence.length} finding${evidence.length !== 1 ? 's' : ''}`;
}

function renderScores() {
  const scoreA = document.getElementById('score-a-pill')!;
  const scoreB = document.getElementById('score-b-pill')!;
  scoreA.textContent = `${Math.round(currentScore[0])}`;
  scoreB.textContent = `${Math.round(currentScore[1])}`;
  scoreA.style.color = currentScore[0] >= 70 ? 'var(--success)' : currentScore[0] > 0 ? 'var(--warning)' : 'var(--danger)';
  scoreB.style.color = currentScore[1] >= 70 ? 'var(--success)' : currentScore[1] > 0 ? 'var(--warning)' : 'var(--danger)';
}

function renderClock(ms: number) {
  const clockEl = document.getElementById('clock')!;
  if (!clockEl) return;
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  clockEl.textContent = `${mm}:${ss}`;
}

function renderStatus(status: any) {
  const badge = document.getElementById('status-badge')!;
  const display = document.getElementById('status-display')!;
  if (!status || status.status === 'idle') {
    badge.className = 'badge badge-neutral';
    badge.textContent = 'Idle';
    display.innerHTML = `<p class="body-sm" style="color: var(--text-muted);">The referee runs real go test in isolated worktrees and audits both deliveries. No script, no fixtures on this path — except the honest-vs-dishonest default.</p>`;
    return;
  }
  if (status.status === 'running') {
    badge.className = 'badge badge-primary';
    badge.textContent = 'Running';
    display.innerHTML = `<span class="badge badge-primary">Running...</span><p class="body-sm" style="color: var(--text-muted); margin-top: var(--space-2);">${status.detail || 'Fleets are working...'}</p>`;
    return;
  }
  if (status.status === 'complete') {
    badge.className = 'badge badge-success';
    badge.textContent = 'Complete';
    const winnerColor = 'var(--accent)';
    display.innerHTML = `
      <span class="badge badge-accent">Complete — ${status.detail || 'match finished'}</span>
      <div class="flex gap-2" style="margin-top: var(--space-3); flex-wrap: wrap;">
        <span class="badge badge-info">Fleet A: ${Math.round(currentScore[0])}/100</span>
        <span class="badge badge-info">Fleet B: ${Math.round(currentScore[1])}/100</span>
      </div>
      <p class="body-sm" style="color: var(--text-muted); margin-top: var(--space-2);">Winner: ${winnerLabel()}</p>
    `;
    return;
  }
  if (status.status === 'error') {
    badge.className = 'badge badge-danger';
    badge.textContent = 'Error';
    display.innerHTML = `<span class="badge badge-danger">Error</span><p class="body-sm" style="color: var(--danger); margin-top: var(--space-2);">${status.detail || 'match failed'}</p>`;
  }
}

function winnerLabel(): string {
  if (currentScore[0] > currentScore[1]) return 'Fleet A';
  if (currentScore[1] > currentScore[0]) return 'Fleet B';
  return 'Draw';
}

// === FEED WIRING ===
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

  // The server owns the scoreboard — it broadcasts the authoritative pair
  // when the real match completes. The client never mutates scores itself.
  feed.onScore((a, b) => {
    currentScore = [a, b];
    renderScores();
  });

  feed.onClock((ms) => renderClock(ms));
  feed.onStatus((st) => renderStatus(st));

  feed.start();
}

export function mountArena(): () => void {
  initKanbanBoards();
  bindFeed();

  document.getElementById('run-match')?.addEventListener('click', async () => {
    const btn = document.getElementById('run-match') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Match running…';
    const statusEl = document.getElementById('status-display')!;
    const badge = document.getElementById('status-badge')!;
    badge.className = 'badge badge-primary';
    badge.textContent = 'Starting';
    statusEl.innerHTML = `<span class="badge badge-primary">Starting…</span><p class="body-sm" style="color: var(--text-muted); margin-top: var(--space-2);">Spawning worktrees, running go test, refereeing…</p>`;
    try {
      await runMatch();
      // Reset the button once the match completes; SSE broadcasts "complete".
      const t = setInterval(() => {
        const b = document.getElementById('status-badge');
        if (b && b.textContent === 'Complete') {
          btn.disabled = false;
          btn.textContent = 'Run Match';
          clearInterval(t);
        }
      }, 500);
    } catch (e) {
      badge.className = 'badge badge-danger';
      badge.textContent = 'Error';
      statusEl.innerHTML = `<span class="badge badge-danger">Error</span><p class="body-sm" style="color: var(--danger); margin-top: var(--space-2);">${(e as Error).message}</p>`;
      btn.disabled = false;
      btn.textContent = 'Run Match';
    }
  });

  // Cleanup: close the SSE connection when leaving the page.
  return () => {
    feed?.stop();
    feed = null;
    cards.clear();
    evidence.length = 0;
    currentScore = [0, 0];
  };
}
