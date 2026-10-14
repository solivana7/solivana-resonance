/**
 * Shared session-tracking helpers backed by localStorage. Player writes,
 * Dashboard reads. The InstallPrompt component uses the completed-session
 * counter to gate when to ask about installation.
 */

const SESSIONS_KEY = 'solivana-resonance-sessions';
const COMPLETED_COUNTER_KEY = 'solivana-resonance-completed-sessions';

export interface RecordedSession {
  id: string;
  frequencyId: string;
  frequencyName: string;
  hz: number;
  category: string;
  durationSec: number;
  brainwaveState?: string;
  completedAt: string; // ISO
}

export interface DerivedStats {
  totalSessions: number;
  totalMinutes: number;
  dayStreak: number;
  favoriteCategory: string;
  thisWeekMinutes: number;
  topFrequency: string;
  topFrequencyLabel: string;
}

export const EMPTY_STATS: DerivedStats = {
  totalSessions: 0,
  totalMinutes: 0,
  dayStreak: 0,
  favoriteCategory: '—',
  thisWeekMinutes: 0,
  topFrequency: '—',
  topFrequencyLabel: 'No sessions yet',
};

export function loadSessions(): RecordedSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[sessions] failed to read:', err);
    return [];
  }
}

export function recordSession(session: Omit<RecordedSession, 'id' | 'completedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const list = loadSessions();
    const next: RecordedSession = {
      ...session,
      id: `session-${Date.now()}`,
      completedAt: new Date().toISOString(),
    };
    list.push(next);
    // Cap at last 500 to keep localStorage sane
    const trimmed = list.length > 500 ? list.slice(-500) : list;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
    localStorage.setItem(COMPLETED_COUNTER_KEY, String(trimmed.length));
  } catch (err) {
    console.warn('[sessions] failed to record:', err);
  }
}

function startOfDay(iso: string): number {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function deriveStats(sessions: RecordedSession[]): DerivedStats {
  if (sessions.length === 0) return EMPTY_STATS;

  const totalMinutes = Math.round(
    sessions.reduce((sum, s) => sum + s.durationSec, 0) / 60,
  );

  // Streak: consecutive days from today backwards with at least one session
  const dayMs = 24 * 60 * 60 * 1000;
  const days = new Set(sessions.map((s) => startOfDay(s.completedAt)));
  const today = startOfDay(new Date().toISOString());
  let streak = 0;
  let cursor = today;
  // If no session today, streak still counts from most recent day
  while (days.has(cursor)) {
    streak += 1;
    cursor -= dayMs;
  }
  // If nothing today, allow the most recent day to anchor a 1-day "current" streak
  if (streak === 0) {
    const mostRecent = Math.max(...Array.from(days));
    if (today - mostRecent <= dayMs) streak = 1;
  }

  // Category tallies
  const catCounts: Record<string, number> = {};
  for (const s of sessions) catCounts[s.category] = (catCounts[s.category] || 0) + 1;
  const favoriteCategory =
    Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

  // This week
  const weekAgo = Date.now() - 7 * dayMs;
  const thisWeekMinutes = Math.round(
    sessions
      .filter((s) => new Date(s.completedAt).getTime() >= weekAgo)
      .reduce((sum, s) => sum + s.durationSec, 0) / 60,
  );

  // Top frequency
  const freqCounts: Record<string, { count: number; name: string; hz: number }> = {};
  for (const s of sessions) {
    if (!freqCounts[s.frequencyId]) {
      freqCounts[s.frequencyId] = { count: 0, name: s.frequencyName, hz: s.hz };
    }
    freqCounts[s.frequencyId].count += 1;
  }
  const top = Object.values(freqCounts).sort((a, b) => b.count - a.count)[0];
  const topFrequency = top ? (top.hz > 0 ? `${top.hz}Hz` : top.name) : '—';
  const topFrequencyLabel = top ? top.name : 'No sessions yet';

  return {
    totalSessions: sessions.length,
    totalMinutes,
    dayStreak: streak,
    favoriteCategory:
      favoriteCategory[0]?.toUpperCase() + favoriteCategory.slice(1),
    thisWeekMinutes,
    topFrequency,
    topFrequencyLabel,
  };
}

export function getCompletedCount(): number {
  if (typeof window === 'undefined') return 0;
  return Number(localStorage.getItem(COMPLETED_COUNTER_KEY) || 0);
}
