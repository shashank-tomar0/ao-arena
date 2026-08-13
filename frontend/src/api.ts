// Typed API client for the AO Arena server. The referee, the arena, and the
// league are all real server-side capabilities — no mocks here.

export interface VerdictFinding {
  category: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  evidence_path?: string;
  evidence?: string;
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

export interface ChainStatus {
  verified: boolean;
  length: number;
  genesis: string;
  broken_at?: number;
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

/**
 * Run the referee on a raw diff + optional PR body + optional build/CI
 * output. Real toolchain failures in the build output become
 * compiler-reality findings with the compiler's own file:line evidence.
 */
export function audit(diff: string, body: string, claims?: string[], testOutput?: string): Promise<Verdict> {
  return post<Verdict>('/api/audit', {
    diff,
    body,
    claims: claims ?? [],
    test_output: testOutput ?? '',
  });
}

/** Start a head-to-head. Empty diffs select the honest-vs-dishonest fixture. */
export function runMatch(): Promise<{ status: string }> {
  return post<{ status: string }>('/api/match', { fleet_a_diff: '', fleet_b_diff: '' });
}

export interface VerifyResult {
  valid: boolean;
  recomputed: string;
  claimed: string;
}

/**
 * Recompute the receipt hash over a verdict and compare it to the claimed
 * receipt. Flip any finding and the receipt breaks — tamper evidence, live.
 */
export function verifyReceipt(verdict: Verdict, receipt: string): Promise<VerifyResult> {
  return post<VerifyResult>('/api/verify', { verdict, receipt });
}

export interface DeterminismResult {
  receipts: string[];
  deterministic: boolean;
  score: number;
  runs: number;
}

/** Run the same diff through the referee N times — identical receipts prove determinism. */
export function determinism(diff: string, body: string): Promise<DeterminismResult> {
  return post<DeterminismResult>('/api/determinism', { diff, body });
}

export interface LedgerResponse {
  chain: ChainStatus;
}

export function ledger(): Promise<LedgerResponse> {
  return get<LedgerResponse>('/api/ledger');
}

export interface ReplayEvent {
  kind: 'session' | 'referee' | 'score' | 'status';
  data: unknown;
}

export function matchReplay(): Promise<{ match_id: string; events: ReplayEvent[] }> {
  return get<{ match_id: string; events: ReplayEvent[] }>('/api/match/replay');
}

export interface VerdictPage {
  found: boolean;
  kind?: 'match' | 'audit';
  winner?: string;
  created_at?: string;
  summary?: string;
  score_a?: number;
  score_b?: number;
  verdict?: Verdict;
  fleet_a?: Verdict;
  fleet_b?: Verdict;
}

/** Resolve a persisted receipt hash to its verdict — the shareable /r/ surface. */
export function verdictPage(hash: string): Promise<VerdictPage> {
  return get<VerdictPage>(`/api/verdict/${encodeURIComponent(hash)}`);
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

export interface BenchmarkStats {
  caught: number;
  total: number;
  honest_cleared: boolean;
  deterministic: boolean;
  failure_modes: string[];
}

export interface ArenaStats {
  matches_officiated: number;
  audits_run: number;
  benchmark: BenchmarkStats;
  ledger: ChainStatus;
}

/** Live-computed arena statistics — real measured numbers, never invented. */
export function stats(): Promise<ArenaStats> {
  return get<ArenaStats>('/api/stats');
}
