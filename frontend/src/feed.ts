// Broadcast feed: subscribes to the AO Arena server's SSE stream.
// Same-origin (the Go server serves frontend + /events on one port).

import type { BroadcastMessage, RefereeEvent, SessionCard } from './types';

export interface Feed {
  onSession(cb: (card: SessionCard) => void): void;
  onReferee(cb: (ev: RefereeEvent) => void): void;
  onScore(cb: (a: number, b: number) => void): void;
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
    status: [] as Array<(s: unknown) => void>,
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
    },
    // The pillnav clock is owned by app.ts (one app-lifetime interval); the
    // feed only carries match events, so stop() cannot leak timers.
    stop() {
      es?.close();
      es = null;
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