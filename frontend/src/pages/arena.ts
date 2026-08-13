// Arena — the live broadcast. Two Kanban boards, referee evidence rail,
// authoritative scoreboard. "Run Match" runs a genuine head-to-head; every
// event is recorded server-side so a finished match can be replayed.

import { matchReplay, runMatch } from '../api';
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
            <span class="badge badge-neutral" id="spec-badge">spec rest-api-auth</span>
          </div>
        </div>

        <div class="arena-grid">
          <!-- FLEET A -->
          <section class="board a reveal" id="board-a">
            <div class="board-head">
              <div>
                <div class="fleet-name">Fleet A <span class="fleet-role">· dishonest</span></div>
              </div>
              <div class="score-pill" id="score-a-pill">0</div>
            </div>
            <div class="kanban" id="kanban-a"></div>
          </section>

          <!-- FLEET B -->
          <section class="board b reveal" id="board-b" style="--reveal-delay: 60ms;">
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
                  <p class="status-detail">The referee runs real acceptance tests in isolated worktrees and audits both deliveries.</p>
                </div>
                <button class="btn btn-accent btn-lg" id="run-match" style="width: 100%; margin-top: var(--space-4);">Run Match</button>
                <button class="btn btn-ghost btn-lg" id="replay-match" style="width: 100%; margin-top: var(--space-2); display: none;">Replay last match</button>
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
                <div class="sd-row"><span>checks</span><span id="spec-checks">5 · deterministic</span></div>
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

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderEvidence() {
  const list = document.getElementById('evidence-list')!;
  const countEl = document.getElementById('evidence-count')!;
  const recent = [...evidence].slice(-10).reverse();
  list.innerHTML = recent.map(
    (e) => `
    <li class="evidence-item ${e.severity}">
      <div class="ev-head">
        <span class="ev-cat">${esc(e.category)}</span>
        <span class="badge ${e.severity === 'critical' ? 'badge-danger' : e.severity === 'warning' ? 'badge-amber' : 'badge-cyan'}">${e.severity}</span>
      </div>
      <span class="ev-msg">${esc(e.message)}</span>
      ${e.evidence
        ? `<details class="evidence-detail">
             <summary>evidence</summary>
             <pre class="evidence-snippet"><code>${esc(e.evidence)}</code></pre>
           </details>`
        : ''}
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
  const replayBtn = document.getElementById('replay-match') as HTMLButtonElement;
  if (!status || status.status === 'idle') {
    badge.className = 'badge badge-neutral';
    badge.textContent = 'idle';
    return;
  }
  if (status.status === 'running') {
    badge.className = 'badge badge-cyan';
    badge.textContent = 'running';
    replayBtn.style.display = 'none';
    display.innerHTML = `
      <span class="badge badge-cyan"><span class="live-dot" aria-hidden="true"></span> running</span>
      <p class="status-detail">${status.detail || 'Fleets are working — real worktrees, real tests.'}</p>`;
    return;
  }
  if (status.status === 'complete') {
    badge.className = 'badge badge-ok';
    badge.textContent = 'complete';
    replayBtn.style.display = 'block';
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

// dispatch routes a recorded broadcast event through the same renderers the
// live SSE feed uses — replay is the same code path, just re-timed.
function dispatch(kind: string, data: any) {
  switch (kind) {
    case 'session':
      cards.set(data.id as string, data as SessionCard);
      renderBoard((data as SessionCard).fleet);
      break;
    case 'referee':
      evidence.push(data as RefereeEvent);
      renderEvidence();
      break;
    case 'score':
      currentScore = [data[0] as number, data[1] as number];
      renderScores();
      break;
    case 'status':
      renderStatus(data);
      break;
  }
}

function bindFeed() {
  feed = createFeed();
  feed.onSession((card) => dispatch('session', card));
  feed.onReferee((ev) => dispatch('referee', ev));
  feed.onScore((a, b) => dispatch('score', [a, b]));
  feed.onClock((ms) => {
    const el = document.getElementById('clock');
    if (!el) return;
    const s = Math.floor(ms / 1000);
    el.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  });
  feed.onStatus((st) => dispatch('status', st));
  feed.start();
}

// replayLast re-runs the recorded timeline of the most recent completed
// match on the boards, at broadcast pace — a match you can watch again.
async function replayLast() {
  const btn = document.getElementById('replay-match') as HTMLButtonElement;
  const badge = document.getElementById('status-badge')!;
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  btn.textContent = 'Replaying…';
  try {
    const { events } = await matchReplay();
    if (!events.length) {
      btn.textContent = 'No replay yet';
      setTimeout(() => {
        btn.textContent = 'Replay last match';
        btn.disabled = false;
      }, 1600);
      return;
    }
    // Reset the boards to a clean state, then run the timeline.
    cards.clear();
    evidence.length = 0;
    rendered.clear();
    currentScore = [0, 0];
    renderScores();
    renderEvidence();
    ['a', 'b'].forEach((f) => {
      document.querySelectorAll(`#board-${f} .cards`).forEach((el) => (el.innerHTML = ''));
    });
    badge.className = 'badge badge-cyan';
    badge.textContent = 'replay';

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      dispatch(ev.kind, ev.data);
      await new Promise((r) => setTimeout(r, 420));
    }
  } catch {
    badge.className = 'badge badge-neutral';
    badge.textContent = 'idle';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Replay last match';
  }
}

export function mountArena(): () => void {
  initKanbanBoards();
  bindFeed();

  // A fresh page load won't hear the last match's live events — load the
  // authoritative final state so the scoreboard and replay button appear.
  fetch('/api/match/status')
    .then((r) => r.json())
    .then((st) => {
      if (st?.status === 'complete' && st.fleet_a && st.fleet_b) {
        currentScore = [st.fleet_a.trust_score ?? 0, st.fleet_b.trust_score ?? 0];
        renderScores();
        renderStatus({ status: 'complete', detail: 'Match complete — press replay to watch it again.' });
      }
    })
    .catch(() => {});

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

  document.getElementById('replay-match')?.addEventListener('click', replayLast);

  return () => {
    feed?.stop();
    feed = null;
    cards.clear();
    evidence.length = 0;
    rendered.clear();
    currentScore = [0, 0];
  };
}
