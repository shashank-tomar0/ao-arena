/*
 * AO Arena — Main App
 * Single-page: Landing → Arena Broadcast
 * No framework, vanilla TS — intentional, minimal, fast
 */

import './styles.css';
import { createFeed } from './feed';
import { LANE_LABEL, type Lane, type RefereeEvent, type SessionCard } from './types';

// === STATE ===
type View = 'landing' | 'arena';
let currentView: View = 'landing';

// === DOM REFERENCES ===
const app = document.getElementById('app')!;
const feed = createFeed();

// === LANDING PAGE HTML ===
function renderLanding(): string {
  return `
    <div class="landing" id="landing">
      <!-- HERO -->
      <header class="hero">
        <div class="container">
          <div class="hero-content">
            <div class="hero-badge animate-slide-up">
              <span class="badge badge-primary">The Orchestra Hackathon • Aug 12–13</span>
            </div>
            <h1 class="display-1 animate-slide-up delay-1">
              Verification-as-officiating<br>for AI agent fleets
            </h1>
            <p class="body animate-slide-up delay-2" style="max-width: 48ch; color: var(--text-muted); margin-top: var(--space-4);">
              Agent velocity has outrun human inspection. PRs land containing hallucinated APIs,
              theater tests, and ghost claims. The Referee turns "trust me" into "show me the evidence."
            </p>
            <div class="flex gap-3 animate-slide-up delay-3" style="margin-top: var(--space-6); flex-wrap: wrap;">
              <button class="btn btn-primary" id="enter-arena">Enter the Arena</button>
              <a href="https://github.com/shashank-tomar0/ao-arena" target="_blank" class="btn btn-secondary">View on GitHub</a>
            </div>
          </div>

          <!-- Hero Visual: Mini Arena Preview -->
          <div class="hero-visual animate-scale-in delay-4" style="margin-top: var(--space-10);">
            <div class="mini-arena">
              <div class="mini-board" data-fleet="a">
                <div class="mini-header"><span class="mini-title">Fleet A</span></div>
                <div class="mini-lanes">
                  <div class="mini-lane"><span class="mini-lane-label">working</span></div>
                  <div class="mini-lane"><span class="mini-lane-label">ci_failed</span></div>
                  <div class="mini-lane"><span class="mini-lane-label">review_pending</span></div>
                  <div class="mini-lane"><span class="mini-lane-label">mergeable</span></div>
                </div>
              </div>
              <div class="mini-vs">VS</div>
              <div class="mini-board" data-fleet="b">
                <div class="mini-header"><span class="mini-title">Fleet B</span></div>
                <div class="mini-lanes">
                  <div class="mini-lane"><span class="mini-lane-label">working</span></div>
                  <div class="mini-lane"><span class="mini-lane-label">working</span></div>
                  <div class="mini-lane"><span class="mini-lane-label">review_pending</span></div>
                  <div class="mini-lane"><span class="mini-lane-label mergeable">mergeable</span></div>
                </div>
              </div>
            </div>
            <div class="mini-scoreboard">
              <div class="mini-score" style="color: var(--fleet-a)">30</div>
              <div class="mini-divider">/</div>
              <div class="mini-score" style="color: var(--fleet-b)">100</div>
            </div>
          </div>
        </div>
      </header>

      <!-- FEATURES -->
      <section class="section features">
        <div class="container">
          <div class="section-head animate-slide-up">
            <span class="caption">Core Primitives</span>
            <h2 class="display-2" style="margin-top: var(--space-2);">Deterministic verification, not LLM-as-judge</h2>
          </div>
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-top: var(--space-8);">
            ${[
              { icon: '🔍', title: 'Symbol Reality', desc: 'Catches hallucinated imports and API calls that resolve to nothing. Every reference verified against the actual codebase symbol graph.', tag: 'Critical' },
              { icon: '🎭', title: 'Test Reality', desc: 'Mutation-differential proof: if tests pass after assertions are neutralized, the suite is theater. Catches expect(true).toBe(true) and empty test bodies.', tag: 'Critical' },
              { icon: '👻', title: 'Claim vs Diff', desc: 'Agent PR summaries often describe work the diff doesn\'t contain. Ghost claims flagged with file:line evidence.', tag: 'Critical' },
              { icon: '🚪', title: 'Merge Gate', desc: 'CI status, conflicts, coverage sanity. An agent PR must be merge-ready, not just green.', tag: 'Warning' },
            ].map((f, i) => `
              <article class="card feature-card animate-slide-up" style="animation-delay: ${i * 80}ms;">
                <div class="feature-icon">${f.icon}</div>
                <h3 class="heading-2" style="margin: var(--space-3) 0 var(--space-2);">${f.title}</h3>
                <p class="body-sm" style="color: var(--text-muted);">${f.desc}</p>
                <span class="badge badge-${f.tag.toLowerCase()}" style="margin-top: var(--space-3); display: inline-block;">${f.tag}</span>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- SPECS -->
      <section class="section specs" style="background: var(--bg-elevated);">
        <div class="container">
          <div class="section-head animate-slide-up">
            <span class="caption">Challenge Specs</span>
            <h2 class="display-2" style="margin-top: var(--space-2);">Real engineering challenges, not toy problems</h2>
          </div>
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-top: var(--space-8);">
            ${[
              { id: 'rest-api-auth', name: 'REST API with Auth', desc: 'JWT register/login/me endpoints. Acceptance: 4 behaviors, 100% coverage target.', checks: ['Symbol Reality', 'Test Reality', 'Claim vs Diff'] },
              { id: 'realtime-chat', name: 'Real-time Chat', desc: 'WebSocket server with presence. Bidirectional messaging, graceful shutdown, 100ms echo.', checks: ['Symbol Reality', 'Test Reality', 'Claim vs Diff'] },
              { id: 'cli-task-tracker', name: 'CLI Task Tracker', desc: 'Persistent add/list/done/rm with file storage. Error paths tested, no panics.', checks: ['Symbol Reality', 'Test Reality', 'Claim vs Diff'] },
            ].map((s, i) => `
              <article class="card spec-card animate-slide-up" style="animation-delay: ${i * 80}ms;">
                <div class="spec-header">
                  <span class="caption" style="color: var(--primary);">${s.id}</span>
                  <span class="badge badge-neutral">${s.checks.length} checks</span>
                </div>
                <h3 class="heading-2" style="margin: var(--space-3) 0 var(--space-2);">${s.name}</h3>
                <p class="body-sm" style="color: var(--text-muted); margin-bottom: var(--space-4);">${s.desc}</p>
                <div class="flex gap-2 flex-wrap">
                  ${s.checks.map(c => `<span class="badge badge-info">${c}</span>`).join('')}
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section class="section how-it-works">
        <div class="container">
          <div class="section-head animate-slide-up" style="text-align: center;">
            <span class="caption">The Flow</span>
            <h2 class="display-2" style="margin-top: var(--space-2);">From agent code to trust score in seconds</h2>
          </div>
          <div class="flow" style="display: flex; gap: var(--space-4); margin-top: var(--space-8); flex-wrap: wrap; justify-content: center;">
            ${[
              { step: '1', label: 'Agent delivers', desc: 'Code pushed to isolated worktree' },
              { step: '2', label: 'Tests run', desc: 'go test -cover in real environment' },
              { step: '3', label: 'Referee audits', desc: '4 deterministic checks execute' },
              { step: '4', label: 'Score computed', desc: '0–100 trust score, merge gate' },
              { step: '5', label: 'Broadcast', desc: 'Live Kanban + evidence rail' },
            ].map((f, i) => `
              <div class="flow-step card animate-slide-up" style="animation-delay: ${i * 80}ms; min-width: 180px; max-width: 220px; text-align: center;">
                <div class="flow-step-num" style="font-size: var(--text-3xl); font-weight: 700; color: var(--primary); font-family: var(--font-display);">${f.step}</div>
                <h4 class="heading-2" style="margin: var(--space-2) 0;">${f.label}</h4>
                <p class="caption" style="color: var(--text-muted);">${f.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- FOOTER CTA -->
      <footer class="footer" style="background: var(--bg-elevated); border-top: 1px solid var(--border);">
        <div class="container" style="text-align: center; padding: var(--space-12) 0;">
          <h3 class="display-3">Ready to see agents compete?</h3>
          <p class="body" style="color: var(--text-muted); margin: var(--space-3) 0 var(--space-6); max-width: 40ch; margin-left: auto; margin-right: auto;">
            Built with Agent Orchestrator for The Orchestra hackathon. Real worktrees, real CI, real referee.
          </p>
          <button class="btn btn-primary btn-lg" id="enter-arena-footer" style="padding: var(--space-3) var(--space-8); font-size: var(--text-base);">
            Enter the Arena →
          </button>
        </div>
      </footer>
    </div>
  `;
}

// === ARENA PAGE HTML ===
function renderArena(): string {
  return `
    <div class="arena" id="arena">
      <header id="topbar" class="topbar">
        <div class="container flex" style="height: 100%; gap: var(--space-4);">
          <span class="logo">AO<span class="logo-accent">▲</span>ARENA</span>
          <span id="match-title" class="match-title">Season 0 · Round 1</span>
          <div class="flex gap-2" style="margin-left: auto;">
            <button class="btn btn-ghost" id="back-to-landing">← Landing</button>
            <span id="clock" class="clock">--:--</span>
            <button class="btn btn-accent" id="run-match">Run Match</button>
          </div>
        </div>
      </header>

      <main class="container" style="flex: 1; padding: var(--space-4); max-width: 1600px;">
        <section id="boards" class="boards">
          <div class="board" id="board-a" data-fleet="a">
            <div class="board-header">
              <h2 class="board-title">Fleet A</h2>
              <div class="score-pill" id="score-a-pill">0</div>
            </div>
            <div class="kanban" id="kanban-a"></div>
          </div>

          <div class="vs-divider">VS</div>

          <div class="board" id="board-b" data-fleet="b">
            <div class="board-header">
              <h2 class="board-title">Fleet B</h2>
              <div class="score-pill" id="score-b-pill">0</div>
            </div>
            <div class="kanban" id="kanban-b"></div>
          </div>
        </section>

        <aside class="sidebar">
          <section id="evidence" class="card">
            <div class="evidence-header">
              <h3>Referee Evidence</h3>
              <span class="badge badge-neutral" id="evidence-count">0 findings</span>
            </div>
            <ul id="evidence-list" class="evidence-list"></ul>
          </section>

          <section id="spec-info" class="card" style="margin-top: var(--space-4);">
            <h3>Active Spec</h3>
            <div id="spec-detail" class="spec-detail">
              <div class="spec-row"><span class="caption">ID</span><span id="spec-id">rest-api-auth</span></div>
              <div class="spec-row"><span class="caption">Description</span><span id="spec-desc">REST API with authentication</span></div>
              <div class="spec-row"><span class="caption">Checks</span><span id="spec-checks">Symbol Reality, Test Reality, Claim vs Diff, Merge Gate</span></div>
            </div>
          </section>

          <section id="match-status" class="card" style="margin-top: var(--space-4);">
            <h3>Match Status</h3>
            <div id="status-display" class="status-display">
              <span class="badge badge-neutral">Idle</span>
              <p class="body-sm" style="color: var(--text-muted); margin-top: var(--space-2);">Click "Run Match" to start a head-to-head</p>
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
const cards = new Map<string, SessionCard>();
const evidence: RefereeEvent[] = [];
let currentScore: [number, number] = [0, 0];

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
  const recent = [...evidence].slice(-8).reverse();
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
  scoreA.textContent = `${currentScore[0]}`;
  scoreB.textContent = `${currentScore[1]}`;
  scoreA.style.color = currentScore[0] >= 70 ? 'var(--success)' : currentScore[0] > 0 ? 'var(--warning)' : 'var(--danger)';
  scoreB.style.color = currentScore[1] >= 70 ? 'var(--success)' : currentScore[1] > 0 ? 'var(--warning)' : 'var(--danger)';
}

function renderClock(ms: number) {
  const clockEl = document.getElementById('clock')!;
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  clockEl.textContent = `${mm}:${ss}`;
}

function renderStatus(status: any) {
  const display = document.getElementById('status-display')!;
  if (!status || status.status === 'idle') {
    display.innerHTML = `<span class="badge badge-neutral">Idle</span><p class="body-sm" style="color: var(--text-muted); margin-top: var(--space-2);">Click "Run Match" to start a head-to-head</p>`;
    return;
  }
  if (status.status === 'complete') {
    const winnerColor = status.winner === 'a' ? 'var(--fleet-a)' : status.winner === 'b' ? 'var(--fleet-b)' : 'var(--accent)';
    display.innerHTML = `
      <span class="badge badge-success" style="background: ${winnerColor}22; color: ${winnerColor};">Complete — ${status.winner === 'draw' ? 'Draw' : `Winner: Fleet ${status.winner.toUpperCase()}`}</span>
      <p class="body-sm" style="color: var(--text-muted); margin-top: var(--space-2);">Duration: ${Math.round(status.duration / 1000)}s | Spec: ${status.spec_id}</p>
      <div class="flex gap-2" style="margin-top: var(--space-3); flex-wrap: wrap;">
        <span class="badge badge-info">Fleet A: ${status.fleet_a.trust_score}/100</span>
        <span class="badge badge-info">Fleet B: ${status.fleet_b.trust_score}/100</span>
      </div>
    `;
    return;
  }
  display.innerHTML = `<span class="badge badge-primary">Running...</span><p class="body-sm" style="color: var(--text-muted); margin-top: var(--space-2);">Fleets are working...</p>`;
}

// === FEED CALLBACKS ===
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

feed.onClock((ms) => renderClock(ms));

feed.onStatus((st) => renderStatus(st));

// === VIEW SWITCHING ===
function showLanding() {
  currentView = 'landing';
  app.innerHTML = renderLanding();
  document.getElementById('enter-arena')?.addEventListener('click', showArena);
  document.getElementById('enter-arena-footer')?.addEventListener('click', showArena);
  // Animate entrance
  requestAnimationFrame(() => {
    document.querySelectorAll('.animate-slide-up, .animate-scale-in').forEach(el => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.transform = 'none';
    });
  });
}

function showArena() {
  currentView = 'arena';
  app.innerHTML = renderArena();
  initKanbanBoards();
  feed.start();

  document.getElementById('back-to-landing')?.addEventListener('click', showLanding);
  document.getElementById('run-match')?.addEventListener('click', () => {
    const statusEl = document.getElementById('status-display')!;
    statusEl.innerHTML = `<span class="badge badge-primary">Starting...</span>`;
    feed.runMatch().catch((e: Error) => {
      statusEl.innerHTML = `<span class="badge badge-danger">Error</span><p class="body-sm" style="color: var(--danger); margin-top: var(--space-2);">${e.message}</p>`;
    });
  });
}

// === INIT ===
showLanding();

// Handle browser back/forward
window.addEventListener('popstate', () => {
  if (currentView === 'arena') showLanding();
});

// Expose for debugging
(window as any).aoArena = { feed, cards, evidence, currentScore };