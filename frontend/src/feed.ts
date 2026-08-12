// Broadcast feed: subscribes to the AO Arena server's SSE stream.
// Same-origin (the Go server serves frontend + /events on one port).

import type { BroadcastMessage, RefereeEvent, SessionCard } from './types';

export interface Feed {
  onSession(cb: (card: SessionCard) => void): void;
  onReferee(cb: (ev: RefereeEvent) => void): void;
  onScore(cb: (a: number, b: number) => void): void;
  onClock(cb: (ms: number) => void): void;
  onStatus(cb: (status: unknown) => void): void;
  start(): void;
  stop(): void;
  runMatch(): Promise<void>;
}

export function liveFeed(): Feed {
  const cbs = {
    session: [] as Array<(c: SessionCard) => void>,
    referee: [] as Array<(e: RefereeEvent) => void>,
    score: [] as Array<(a: number, b: number) => void>,
    clock: [] as Array<(ms: number) => void>,
    status: [] as Array<(s: unknown) => void>,
  };
  let es: EventSource | null = null;
  const startedAt = Date.now();

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
    onStatus(cb) {
      cbs.status.push(cb);
    },
    start() {
      es = new EventSource('/events');
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
          case 'status':
            cbs.status.forEach((cb) => cb(msg.data));
            break;
        }
      };
      // Clock derived from page load; real match duration shows via SSE after.
      const clockTimer = window.setInterval(() => {
        cbs.clock.forEach((cb) => cb(Date.now() - startedAt));
      }, 250);
      es.addEventListener('close', () => window.clearInterval(clockTimer));
    },
    stop() {
      es?.close();
    },
    async runMatch() {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fleet_a_diff: '', fleet_b_diff: '' }),
      });
      if (!res.ok) throw new Error('failed to start match: ' + res.status);
      const st = await res.json();
      cbs.status.forEach((cb) => cb(st));
    },
  };
}

export function createFeed(): Feed {
  return liveFeed();
}