// Broadcast feed: subscribes to the arena broadcast server over SSE.
// In the hackathon demo we can run in mock mode (no server) so the exact
// scripted match replays identically — unbreakable on-stage.

import type { BroadcastMessage, RefereeEvent, SessionCard } from './types';
import { mapStatus, type Lane } from './types';

export interface Feed {
  onSession(cb: (card: SessionCard) => void): void;
  onReferee(cb: (ev: RefereeEvent) => void): void;
  onScore(cb: (a: number, b: number) => void): void;
  onClock(cb: (ms: number) => void): void;
  start(): void;
  stop(): void;
}

const SSE_URL = import.meta.env.VITE_BROADCAST_URL ?? 'http://localhost:8090/events';

export function liveFeed(): Feed {
  const cbs = {
    session: [] as Array<(c: SessionCard) => void>,
    referee: [] as Array<(e: RefereeEvent) => void>,
    score: [] as Array<(a: number, b: number) => void>,
    clock: [] as Array<(ms: number) => void>,
  };
  let es: EventSource | null = null;

  return {
    onSession(cb) {
      cbs.session.push(cb);
    },
    onReferee(cb) {
      cbs.referee.push(cb);
    },
    onScore(cb) {
      cbs.score.push(cb);
    },
    onClock(cb) {
      cbs.clock.push(cb);
    },
    start() {
      es = new EventSource(SSE_URL);
      es.onmessage = (ev) => {
        let msg: BroadcastMessage;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        switch (msg.kind) {
          case 'session':
            cbs.session.forEach((cb) => cb(msg.data as SessionCard));
            break;
          case 'referee':
            cbs.referee.forEach((cb) => cb(msg.data as RefereeEvent));
            break;
          case 'score':
            {
              const [a, b] = msg.data as [number, number];
              cbs.score.forEach((cb) => cb(a, b));
            }
            break;
          case 'clock':
            cbs.clock.forEach((cb) => cb(msg.data as number));
            break;
        }
      };
    },
    stop() {
      es?.close();
    },
  };
}

// ---------- Mock mode: a deterministic, scripted match replay ----------

interface Step {
  at: number; // ms since match start
  action: 'session' | 'referee' | 'score';
  card?: SessionCard;
  ev?: RefereeEvent;
  score?: [number, number];
}

function buildScript(): Step[] {
  const T = (at: number): number => at;
  const s = (
    id: string,
    fleet: 'a' | 'b',
    status: Lane,
    branch: string,
    ts: number,
    label = 'claude-code',
  ): SessionCard => ({ id, fleet, label, branch, status, ts });

  return [
    // ---- Fleet A: fast, sloppy ----
    { at: T(500), action: 'session', card: s('a1', 'a', 'working', 'feat/login', T(500)) },
    { at: T(2000), action: 'session', card: s('a2', 'a', 'pending', 'feat/auth', T(2000)) },
    { at: T(3500), action: 'session', card: s('a1', 'a', 'needs_input', 'feat/login', T(3500)) },
    { at: T(4200), action: 'session', card: s('a2', 'a', 'working', 'feat/auth', T(4200)) },
    { at: T(6000), action: 'session', card: s('a1', 'a', 'ci_failed', 'feat/login', T(6000)) },
    { at: T(7000), action: 'session', card: s('a1', 'a', 'working', 'feat/login', T(7000)) },

    // ---- Fleet B: steady, honest ----
    { at: T(800), action: 'session', card: s('b1', 'b', 'working', 'feat/login', T(800), 'codex') },
    { at: T(2500), action: 'session', card: s('b1', 'b', 'review_pending', 'feat/login', T(2500), 'codex') },
    { at: T(4000), action: 'session', card: s('b2', 'b', 'working', 'feat/tests', T(4000), 'codex') },

    // ---- Theatrical test in Fleet A: REFEREE CATCH ----
    {
      at: T(7500),
      action: 'referee',
      ev: {
        fleet: 'a',
        severity: 'critical',
        category: 'test-reality',
        message: 'theater test: assertion survives mutation (expect(true).toBe(true))',
        evidence: 'tests/auth.test.ts:12',
        ts: T(7500),
      },
    },
    {
      at: T(7600),
      action: 'referee',
      ev: {
        fleet: 'a',
        severity: 'critical',
        category: 'symbol-reality',
        message: 'references symbol not resolvable in repository',
        evidence: 'x := machenhance.Generate()',
        ts: T(7600),
      },
    },

    // ---- Verdict lands ----
    { at: T(8200), action: 'score', score: [30, 100] },
    { at: T(8500), action: 'session', card: s('a1', 'a', 'changes_requested', 'feat/login', T(8500)) },

    // ---- Fleet B cleans up and merges ----
    { at: T(9500), action: 'session', card: s('b1', 'b', 'mergeable', 'feat/login', T(9500), 'codex') },
    { at: T(10000), action: 'score', score: [30, 100] },
    { at: T(10500), action: 'session', card: s('b2', 'b', 'review_pending', 'feat/tests', T(10500), 'codex') },
    { at: T(11500), action: 'session', card: s('b1', 'b', 'merged', 'feat/login', T(11500), 'codex') },
    { at: T(12000), action: 'score', score: [30, 100] },
    { at: T(12500), action: 'session', card: s('a2', 'a', 'working', 'feat/auth', T(12500)) },
    { at: T(13500), action: 'session', card: s('b2', 'b', 'mergeable', 'feat/tests', T(13500), 'codex') },
  ];
}

export function mockFeed(): Feed {
  const cbs = {
    session: [] as Array<(c: SessionCard) => void>,
    referee: [] as Array<(e: RefereeEvent) => void>,
    score: [] as Array<(a: number, b: number) => void>,
    clock: [] as Array<(ms: number) => void>,
  };
  let timers: number[] = [];
  let t0 = 0;

  return {
    onSession(cb) {
      cbs.session.push(cb);
    },
    onReferee(cb) {
      cbs.referee.push(cb);
    },
    onScore(cb) {
      cbs.score.push(cb);
    },
    onClock(cb) {
      cbs.clock.push(cb);
    },
    start() {
      t0 = performance.now();
      const script = buildScript();
      for (const step of script) {
        const delay = step.at + (Math.random() * 60 - 30); // slight jitter, still deterministic-ish
        const timer = window.setTimeout(() => {
          // Re-emit each card with the current lane so the clock stays live.
          if (step.action === 'session' && step.card) {
            cbs.session.forEach((cb) => cb({ ...step.card!, ts: step.at }));
          } else if (step.action === 'referee' && step.ev) {
            cbs.referee.forEach((cb) => cb(step.ev!));
          } else if (step.action === 'score' && step.score) {
            cbs.score.forEach((cb) => cb(step.score![0], step.score![1]));
          }
        }, delay);
        timers.push(timer);
      }
      // Clock ticker
      const clockTimer = window.setInterval(() => {
        cbs.clock.forEach((cb) => cb(performance.now() - t0));
      }, 250);
      timers.push(clockTimer);
    },
    stop() {
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
    },
  };
}

export function createFeed(mock = true): Feed {
  return mock ? mockFeed() : liveFeed();
}