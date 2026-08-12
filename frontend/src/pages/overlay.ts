// Broadcast overlay — OBS-ready full-bleed view (#overlay).
// No nav, no page chrome: giant scoreboard, compact boards, live evidence
// ticker. Point OBS at /#overlay and the Kanban board IS the broadcast.

import { createFeed, type Feed } from '../feed';
import { countUp } from '../motion';
import { LANE_LABEL, type Lane, type RefereeEvent, type SessionCard } from '../types';

const cards = new Map<string, SessionCard>();
const evidence: RefereeEvent[] = [];
const lanes: Lane[] = ['working', 'ci_failed', 'review_pending', 'mergeable', 'merged'];
let feed: Feed | null = null;

export function renderOverlay(): string {
  return `
    <div class="overlay" id="overlay">
      <header class="ov-top">
        <div class="ov-brand">AO<span>▲</span>ARENA</div>
        <div class="ov-title">SEASON 0 · ROUND 1 · HONEST VS DISHONEST</div>
        <div class="ov-live"><span class="live-dot" aria-hidden="true"></span> LIVE</div>
      </header>

      <div class="ov-score">
        <div class="ov-fleet a">
          <div class="ov-fleet-name">Fleet A <span>· dishonest</span></div>
          <div class="ov-score-num" id="ov-score-a">0</div>
          <div class="ov-fleet-state" id="ov-state-a">idle</div>
        </div>
        <div class="ov-vs">VS</div>
        <div class="ov-fleet b">
          <div class="ov-fleet-name">Fleet B <span>· honest</span></div>
          <div class="ov-score-num" id="ov-score-b">0</div>
          <div class="ov-fleet-state" id="ov-state-b">idle</div>
        </div>
      </div>

      <div class="ov-boards">
        <section class="ov-board">
          <div class="ov-board-head"><span>FLEET A · WORKTREE</span><span id="ov-count-a">0 cards</span></div>
          <div class="ov-lanes" id="ov-lanes-a"></div>
        </section>
        <section class="ov-board">
          <div class="ov-board-head"><span>FLEET B · WORKTREE</span><span id="ov-count-b">0 cards</span></div>
          <div class="ov-lanes" id="ov-lanes-b"></div>
        </section>
      </div>

      <footer class="ov-ticker">
        <div class="ov-ticker-label">REFEREE EVIDENCE</div>
        <div class="ov-ticker-track" id="ov-ticker-track">
          <span class="ticker-item">awaiting first finding…</span>
        </div>
      </footer>
    </div>
  `;
}

function initLanes() {
  ['a', 'b'].forEach((fleet) => {
    const wrap = document.getElementById(`ov-lanes-${fleet}`)!;
    wrap.innerHTML = lanes
      .map(
        (lane) => `
      <div class="ov-lane" data-lane="${lane}">
        <div class="ov-lane-label">${LANE_LABEL[lane]}</div>
        <div class="ov-lane-cards" id="ov-lane-${fleet}-${lane}">0</div>
      </div>`
      )
      .join('');
  });
}

function render(fleet: 'a' | 'b') {
  const fleetCards = [...cards.values()].filter((c) => c.fleet === fleet);
  const countEl = document.getElementById(`ov-count-${fleet}`)!;
  countEl.textContent = `${fleetCards.length} card${fleetCards.length !== 1 ? 's' : ''}`;
  lanes.forEach((lane) => {
    const el = document.getElementById(`ov-lane-${fleet}-${lane}`)!;
    el.textContent = String(fleetCards.filter((c) => c.status === lane).length);
  });
}

function renderTicker() {
  const track = document.getElementById('ov-ticker-track')!;
  const items = evidence
    .slice(-12)
    .map(
      (e) =>
        `<span class="ticker-item ${e.severity === 'critical' ? 'crit' : ''}">[${e.severity}] ${e.category} · ${e.message}</span>`
    )
    .join('');
  if (items) track.innerHTML = items + items; // duplicate for seamless loop
}

export function mountOverlay(): () => void {
  initLanes();
  feed = createFeed();

  feed.onSession((card) => {
    cards.set(card.id, card);
    render(card.fleet);
  });

  feed.onReferee((ev) => {
    evidence.push(ev);
    renderTicker();
    if (ev.fleet === 'a' || ev.fleet === 'b') {
      const state = document.getElementById(`ov-state-${ev.fleet}`)!;
      state.textContent = ev.severity === 'critical' ? 'caught · blocked' : 'verified';
    }
  });

  feed.onScore((a, b) => {
    countUp(document.getElementById('ov-score-a')!, Math.round(a), 900);
    countUp(document.getElementById('ov-score-b')!, Math.round(b), 900);
  });

  feed.onStatus((st: any) => {
    if (st?.status === 'running') {
      document.getElementById('ov-state-a')!.textContent = 'working';
      document.getElementById('ov-state-b')!.textContent = 'working';
    }
  });

  feed.start();

  // Load any already-completed match state so a fresh OBS source isn't blank.
  fetch('/api/match/status')
    .then((r) => r.json())
    .then((st) => {
      if (st?.status === 'complete') {
        countUp(document.getElementById('ov-score-a')!, Math.round(st.fleet_a.trust_score), 900);
        countUp(document.getElementById('ov-score-b')!, Math.round(st.fleet_b.trust_score), 900);
        document.getElementById('ov-state-a')!.textContent = st.fleet_a.tests_pass ? 'verified' : 'caught · blocked';
        document.getElementById('ov-state-b')!.textContent = st.fleet_b.tests_pass ? 'verified' : 'caught · blocked';
      }
    })
    .catch(() => {});

  return () => {
    feed?.stop();
    feed = null;
    cards.clear();
    evidence.length = 0;
  };
}
