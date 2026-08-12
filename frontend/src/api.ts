// Typed API client for the AO Arena server. The referee, the arena, and the
// league are all real server-side capabilities — no mocks here.

export interface VerdictFinding {
  category: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  evidence_path?: string;
  suggestion?: string;
}

export interface Verdict {
  pr_ref: string;
  repo: string;
  ref: string;
  agent?: string;
  created_at: string;
  duration_ms: number;
  checks_run: string[];
  findings: VerdictFinding[];
  trust_score: number;
  mergeable: boolean;
  summary: string;
  receipt_hash: string;
}

export interface Standing {
  name: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  matches: number;
}

export interface HistoryRecord {
  id: string;
  kind: 'match' | 'audit';
  spec_id?: string;
  fleet_a: string;
  fleet_b: string;
  score_a: number;
  score_b: number;
  winner: string;
  summary: string;
  duration_ms: number;
  created_at: string;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/** Run the referee on a raw diff + optional PR body. Returns a real verdict. */
export function audit(diff: string, body: string, claims?: string[]): Promise<Verdict> {
  return post<Verdict>('/api/audit', { diff, body, claims: claims ?? [] });
}

/** Start a head-to-head. Empty diffs select the honest-vs-dishonest fixture. */
export function runMatch(): Promise<{ status: string }> {
  return post<{ status: string }>('/api/match', { fleet_a_diff: '', fleet_b_diff: '' });
}

export interface LeagueResponse {
  standings: Standing[];
  matches: number;
}

export function league(): Promise<LeagueResponse> {
  return get<LeagueResponse>('/api/league');
}

export function history(): Promise<{ history: HistoryRecord[] }> {
  return get<{ history: HistoryRecord[] }>('/api/history');
}
