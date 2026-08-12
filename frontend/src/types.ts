// Shared broadcast types — mirror the AO daemon status vocabulary.

export type Lane =
  | 'pending'
  | 'working'
  | 'needs_input'
  | 'ci_failed'
  | 'changes_requested'
  | 'review_pending'
  | 'mergeable'
  | 'merged';

export interface SessionCard {
  id: string;
  fleet: 'a' | 'b';
  label: string; // agent harness, e.g. claude-code
  branch: string;
  status: Lane;
  pr?: string;
  ts: number;
}

export interface RefereeEvent {
  fleet: 'a' | 'b';
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  evidence?: string;
  ts: number;
}

// Wire protocol for the broadcast server (SSE → WebSocket bridge).
export interface BroadcastMessage {
  kind: 'session' | 'referee' | 'score' | 'clock';
  data: unknown;
}

export const LANE_ORDER: Lane[] = [
  'pending',
  'working',
  'needs_input',
  'ci_failed',
  'changes_requested',
  'review_pending',
  'mergeable',
  'merged',
];

export const LANE_LABEL: Record<Lane, string> = {
  pending: 'Pending',
  working: 'Iterating',
  needs_input: 'Needs input',
  ci_failed: 'CI failed',
  changes_requested: 'Changes requested',
  review_pending: 'In review',
  mergeable: 'Mergeable',
  merged: 'Merged',
};

// AO daemon status strings map onto our lanes; unknown states fall to 'working'.
export function mapStatus(status: string): Lane {
  const s = status.toLowerCase();
  switch (s) {
    case 'working':
      return 'working';
    case 'needs_input':
      return 'needs_input';
    case 'ci_failed':
      return 'ci_failed';
    case 'changes_requested':
      return 'changes_requested';
    case 'review_pending':
      return 'review_pending';
    case 'mergeable':
      return 'mergeable';
    case 'merged':
      return 'merged';
    case 'pending':
      return 'pending';
    default:
      return 'working';
  }
}