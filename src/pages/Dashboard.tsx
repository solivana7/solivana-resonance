import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Headphones,
  Clock,
  Flame,
  Heart,
  Play,
  Settings,
  ChevronDown,
  ChevronUp,
  Calendar,
  Activity,
  Grid3X3,
  Volume2,
  Bell,
  MonitorSpeaker,
  Moon,
  Download,
  X,
  Check,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { allFrequencies, getFrequencyById } from '@/data/frequencies';
import type { Frequency } from '@/data/frequencies';
import { loadSessions, deriveStats, EMPTY_STATS } from '@/lib/sessions';
import type { DerivedStats } from '@/lib/sessions';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Session {
  id: string;
  frequencyId: string;
  frequencyName: string;
  hz: number;
  category: string;
  duration: number;
  date: string;
  color: string;
}

interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  status: 'complete' | 'in-progress' | 'not-started';
}

/* ------------------------------------------------------------------ */
/*  Initial State                                                      */
/* ------------------------------------------------------------------ */
/* Session tracking is not yet wired into localStorage, so every       */
/* counter and chart starts empty. Once Player-side session logging    */
/* lands, these values get derived from solivana-resonance-sessions.   */

const MOCK_SESSIONS: Session[] = [];

const INITIAL_GOALS: Goal[] = [
  { id: 'g1', title: 'Daily Session', current: 0, target: 1, unit: 'sessions', status: 'not-started' },
  { id: 'g2', title: 'Weekly Minutes', current: 0, target: 120, unit: 'min', status: 'not-started' },
  { id: 'g3', title: 'Explore New', current: 0, target: 5, unit: 'frequencies', status: 'not-started' },
  { id: 'g4', title: 'Morning Session', current: 0, target: 1, unit: 'sessions', status: 'not-started' },
];

const CATEGORY_DISTRIBUTION: { name: string; percent: number }[] = [];

const WEEKLY_SPARKLINE = [0, 0, 0, 0, 0, 0, 0];

const DEFAULT_FAVORITE_IDS = [
  'solfeggio-528',
  'schumann-7.83',
  'binaural-alpha-10',
  'binaural-gamma-40',
];

/* ------------------------------------------------------------------ */
/*  Category label helper                                              */
/* ------------------------------------------------------------------ */

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    solfeggio: 'SOLFEGGIO',
    binaural: 'BINAURAL',
    schumann: 'SCHUMANN',
    isochronic: 'ISOCHRONIC',
    noise: 'NOISE',
  };
  return map[cat] || cat.toUpperCase();
}

/* ------------------------------------------------------------------ */
/*  Animated number hook                                               */
/* ------------------------------------------------------------------ */

function useAnimatedNumber(target: number, duration: number = 1500) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return { value, ref };
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers                                               */
/* ------------------------------------------------------------------ */

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem('solivana-resonance-favorites');
    if (raw) return JSON.parse(raw);
  } catch (err) { console.warn('Failed to read localStorage:', err); }
  return [...DEFAULT_FAVORITE_IDS];
}

function saveFavorites(ids: string[]) {
  localStorage.setItem('solivana-resonance-favorites', JSON.stringify(ids));
}

function loadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem('solivana-resonance-goals');
    if (raw) return JSON.parse(raw);
  } catch (err) { console.warn('Failed to read localStorage:', err); }
  return INITIAL_GOALS;
}

function saveGoals(goals: Goal[]) {
  localStorage.setItem('solivana-resonance-goals', JSON.stringify(goals));
}

/* ------------------------------------------------------------------ */
/*  Easing                                                             */
/* ------------------------------------------------------------------ */

const gentleOut = [0.22, 1, 0.4, 1] as [number, number, number, number];

/* ------------------------------------------------------------------ */
/*  Sparkline SVG                                                      */
/* ------------------------------------------------------------------ */

function Sparkline({ data, width = 80, height = 32 }: { data: number[]; width?: number; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke="#EC9247"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini bar chart                                                      */
/* ------------------------------------------------------------------ */

function MiniBarChart({ data }: { data: { name: string; percent: number }[] }) {
  return (
    <div className="flex items-end gap-1" style={{ height: 28 }}>
      {data.map((d) => (
        <div
          key={d.name}
          className="rounded-sm"
          style={{
            width: 6,
            height: `${Math.max(d.percent * 0.28, 4)}px`,
            background: '#EC9247',
            opacity: 0.7,
          }}
          title={`${d.name}: ${d.percent}%`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Streak dots                                                        */
/* ------------------------------------------------------------------ */

function StreakDots({ active = 6 }: { active?: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 7 }, (_, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 8,
            height: 8,
            background: i < active ? '#EC9247' : 'rgba(51,29,1,0.1)',
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress Ring SVG                                                  */
/* ------------------------------------------------------------------ */

function ProgressRing({ percent, size = 80, stroke = 4 }: { percent: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(240,237,237,0.08)"
        strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#EC9247"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: gentleOut, delay: 0.5 }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  /* -- state -- */
  const [favorites, setFavorites] = useState<Frequency[]>([]);
  const [goals] = useState<Goal[]>(loadGoals);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [highQuality, setHighQuality] = useState(true);
  const [darkTheme, setDarkTheme] = useState(false);

  /* -- init favorites from localStorage + frequency data -- */
  useEffect(() => {
    const ids = loadFavorites();
    const freqs = ids.map((id) => getFrequencyById(id)).filter(Boolean) as Frequency[];
    setFavorites(freqs);
  }, []);

  /* -- save goals -- */
  useEffect(() => {
    saveGoals(goals);
  }, [goals]);

  /* -- callbacks -- */
  const toggleFavorite = useCallback((freq: Frequency) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f.id === freq.id);
      const next = exists ? prev.filter((f) => f.id !== freq.id) : [...prev, freq];
      saveFavorites(next.map((f) => f.id));
      return next;
    });
  }, []);

  const removeFavorite = useCallback((freq: Frequency) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== freq.id);
      saveFavorites(next.map((f) => f.id));
      return next;
    });
  }, []);

  /* -- greeting -- */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  /* -- derived values from localStorage session history -- */
  const [derivedStats, setDerivedStats] = useState<DerivedStats>(EMPTY_STATS);
  useEffect(() => {
    setDerivedStats(deriveStats(loadSessions()));
  }, []);

  const dailyGoalPercent = 0; // re-derive when daily-goal feature lands

  /* -- stat numbers -- */
  const sessionsAnim = useAnimatedNumber(derivedStats.totalSessions);
  const minutesAnim = useAnimatedNumber(derivedStats.totalMinutes);
  const streakAnim = useAnimatedNumber(derivedStats.dayStreak);

  /* -- format minutes -- */
  const formatMinutes = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h}h ${min}m`;
  };

  /* -- weekly minutes formatted -- */
  const weeklyFormatted = formatMinutes(derivedStats.thisWeekMinutes);


  /* -- scroll to section -- */
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveTab(id);
  };

  /* -- recommendations -- */
  const recommendations = [
    allFrequencies.find((f) => f.id === 'solfeggio-396')!,
    allFrequencies.find((f) => f.id === 'isochronic-alpha-9')!,
    allFrequencies.find((f) => f.id === 'solfeggio-963')!,
  ].filter(Boolean);

  /* -- progress color -- */
  const goalStatusColor = (status: Goal['status']) => {
    if (status === 'complete') return '#EC9247';
    if (status === 'in-progress') return '#EC9247';
    return 'rgba(51,29,1,0.3)';
  };

  /* -- sidebar nav items -- */
  const navItems = [
    { label: 'Overview', icon: Activity, section: 'overview' },
    { label: 'Session History', icon: Calendar, section: 'sessions' },
    { label: 'Favorites', icon: Heart, section: 'favorites' },
    { label: 'Goals', icon: TrendingUp, section: 'goals' },
    { label: 'Settings', icon: Settings, section: 'settings' },
  ];

  /* ================================================================== */

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row" style={{ background: '#F0EDED' }}>
      {/* ================================================================ */}
      {/*  LEFT PANEL — User Profile & Quick Stats                         */}
      {/* ================================================================ */}
      <aside
        className="hidden lg:flex flex-col shrink-0 sticky top-[72px] h-[calc(100dvh-72px)] overflow-y-auto"
        style={{ width: 320, background: '#331D01', padding: 32 }}
      >
        {/* Avatar + Name */}
        <div className="flex flex-col items-center text-center">
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 64,
              height: 64,
              background: '#EC9247',
            }}
            aria-hidden="true"
          >
            <span
              className="font-hero"
              style={{ fontSize: 24, color: '#FFFFFF', fontWeight: 400 }}
            >
              ◯
            </span>
          </div>
          <h3
            className="font-hero uppercase mt-4"
            style={{ fontSize: 20, color: '#F0EDED', fontWeight: 400, letterSpacing: '-0.01em' }}
          >
            Listener
          </h3>
          <p className="font-body mt-1" style={{ fontSize: 12, color: 'rgba(240,237,237,0.4)' }}>
            Local-only session history
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mt-10 flex flex-col gap-0">
          {[
            { label: 'Total Sessions', value: `${derivedStats.totalSessions}`, sub: 'sessions completed' },
            { label: 'Total Listening Time', value: formatMinutes(derivedStats.totalMinutes), sub: 'lifetime' },
            { label: 'Current Streak', value: `${derivedStats.dayStreak} days`, sub: 'daily streak \uD83D\uDD25' },
            { label: 'Favorite Category', value: derivedStats.favoriteCategory, sub: 'most played' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: '1px solid rgba(240,237,237,0.06)' }}
            >
              <div>
                <p className="font-body" style={{ fontSize: 11, color: 'rgba(240,237,237,0.4)', letterSpacing: '0.05em' }}>
                  {stat.label.toUpperCase()}
                </p>
                <p className="font-hero mt-0.5" style={{ fontSize: 22, color: '#F0EDED', fontWeight: 400 }}>
                  {stat.value}
                </p>
              </div>
              <p className="font-body text-right" style={{ fontSize: 11, color: 'rgba(240,237,237,0.3)' }}>
                {stat.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Daily Goal Ring */}
        <div className="mt-10 flex flex-col items-center">
          <p
            className="font-body uppercase text-center"
            style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(240,237,237,0.4)' }}
          >
            TODAY&apos;S GOAL
          </p>
          <div className="relative mt-3">
            <ProgressRing percent={dailyGoalPercent} />
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: 'rotate(0deg)' }}
            >
              <span className="font-hero" style={{ fontSize: 20, color: '#EC9247', fontWeight: 400 }}>
                {dailyGoalPercent}%
              </span>
            </div>
          </div>
          <p className="font-body mt-2" style={{ fontSize: 12, color: 'rgba(240,237,237,0.5)' }}>
            13 of 20 minutes
          </p>
          <p className="font-body mt-0.5" style={{ fontSize: 11, color: '#EC9247' }}>
            7 minutes to go
          </p>
        </div>

        {/* Navigation */}
        <nav className="mt-10 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.section;
            return (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.section)}
                className="flex items-center gap-3 px-4 py-3 rounded font-body transition-all duration-200 cursor-pointer border-0"
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: isActive ? '#F0EDED' : 'rgba(240,237,237,0.6)',
                  background: isActive ? 'rgba(236,146,71,0.15)' : 'transparent',
                }}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ================================================================ */}
      {/*  MAIN CONTENT PANEL                                              */}
      {/* ================================================================ */}
      <main className="flex-1 min-w-0 overflow-y-auto" style={{ background: '#F0EDED' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 48px 80px' }} className="max-md:!px-6 max-md:!pt-8">
          {/* ----------------------------------------------------------- */}
          {/*  Section 1: Dashboard Header                                */}
          {/* ----------------------------------------------------------- */}
          <section id="overview">
            <motion.h1
              className="font-hero uppercase"
              style={{ fontSize: 32, color: '#331D01', fontWeight: 400, letterSpacing: '-0.01em' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: gentleOut }}
            >
              {greeting}.
            </motion.h1>
            <motion.p
              className="font-body mt-2"
              style={{ fontSize: 16, fontWeight: 300, color: 'rgba(51,29,1,0.6)' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: gentleOut, delay: 0.1 }}
            >
              You&apos;ve listened for 13 minutes today. Your mind thanks you.
            </motion.p>
            <motion.p
              className="font-body uppercase mt-1"
              style={{ fontSize: 12, letterSpacing: '0.08em', color: 'rgba(51,29,1,0.4)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease: gentleOut, delay: 0.2 }}
            >
              {todayStr}
            </motion.p>
          </section>

          {/* ----------------------------------------------------------- */}
          {/*  Section 2: Listening Stats — 4-Card Grid                   */}
          {/* ----------------------------------------------------------- */}
          <section className="mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  icon: Calendar,
                  value: weeklyFormatted,
                  label: 'This week',
                  sub: 'Listening time',
                  extra: <Sparkline data={WEEKLY_SPARKLINE} />,
                  delay: 0,
                },
                {
                  icon: Activity,
                  value: derivedStats.topFrequency,
                  label: `Most played — ${derivedStats.topFrequencyLabel}`,
                  sub: 'Transformation & Miracles',
                  extra: null,
                  delay: 0.1,
                },
                {
                  icon: Grid3X3,
                  value: derivedStats.favoriteCategory,
                  label: 'Favorite category',
                  sub: '62% of sessions',
                  extra: <MiniBarChart data={CATEGORY_DISTRIBUTION} />,
                  delay: 0.2,
                },
                {
                  icon: Flame,
                  value: `${derivedStats.dayStreak} days`,
                  label: 'Daily streak',
                  sub: 'Best: 14 days',
                  extra: <StreakDots active={6} />,
                  delay: 0.3,
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    className="rounded-lg"
                    style={{
                      background: '#FFFFFF',
                      padding: 24,
                      boxShadow: '0 2px 8px rgba(51,29,1,0.04)',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: gentleOut, delay: 0.2 + card.delay }}
                  >
                    <Icon size={24} style={{ color: '#EC9247' }} />
                    <p
                      className="font-hero uppercase mt-3"
                      style={{ fontSize: 24, color: '#331D01', fontWeight: 400, letterSpacing: '-0.01em' }}
                    >
                      {card.value}
                    </p>
                    <p className="font-body uppercase mt-1" style={{ fontSize: 12, color: 'rgba(51,29,1,0.4)', letterSpacing: '0.05em' }}>
                      {card.label}
                    </p>
                    {card.sub && (
                      <p className="font-body mt-1" style={{ fontSize: 11, color: '#EC9247' }}>
                        {card.sub}
                      </p>
                    )}
                    {card.extra && <div className="mt-3">{card.extra}</div>}
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ----------------------------------------------------------- */}
          {/*  Listening Stats Row (big numbers)                           */}
          {/* ----------------------------------------------------------- */}
          <section className="mt-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { ref: sessionsAnim.ref, value: sessionsAnim.value, label: 'Total Sessions', icon: Headphones },
                { ref: minutesAnim.ref, value: minutesAnim.value, label: 'Minutes Listened', icon: Clock, format: (v: number) => `${v}` },
                { ref: streakAnim.ref, value: streakAnim.value, label: 'Day Streak', icon: Flame },
                { value: derivedStats.favoriteCategory, label: 'Favorite Frequency', icon: Heart, isText: true },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    className="rounded-lg"
                    style={{
                      background: '#FFF8F0',
                      padding: 24,
                      boxShadow: '0 2px 8px rgba(51,29,1,0.04)',
                    }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: gentleOut, delay: 0.4 + i * 0.1 }}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={18} style={{ color: '#EC9247' }} />
                      <p className="font-body uppercase" style={{ fontSize: 11, color: 'rgba(51,29,1,0.4)', letterSpacing: '0.08em' }}>
                        {stat.label}
                      </p>
                    </div>
                    {'ref' in stat && stat.ref ? (
                      <div ref={stat.ref} className="font-hero mt-2" style={{ fontSize: 36, color: '#331D01', fontWeight: 400 }}>
                        {stat.format ? stat.format(stat.value as number) : stat.value}
                      </div>
                    ) : (
                      <p className="font-hero mt-2" style={{ fontSize: 36, color: '#331D01', fontWeight: 400 }}>
                        {stat.value as string}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ----------------------------------------------------------- */}
          {/*  Section 3: Recent Sessions — Timeline                      */}
          {/* ----------------------------------------------------------- */}
          <section id="sessions" className="mt-12">
            <div className="flex items-center justify-between">
              <motion.h2
                className="font-hero uppercase"
                style={{ fontSize: 20, color: '#331D01', fontWeight: 400, letterSpacing: '-0.01em' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: gentleOut }}
              >
                Recent Sessions
              </motion.h2>
              <span className="font-body cursor-pointer transition-colors hover:underline" style={{ fontSize: 13, color: '#EC9247' }}>
                View all &rarr;
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {MOCK_SESSIONS.map((session, i) => {
                const freq = getFrequencyById(session.frequencyId);
                return (
                  <motion.div
                    key={session.id}
                    className="flex items-center justify-between rounded-lg transition-colors duration-200 cursor-default"
                    style={{
                      background: '#FFFFFF',
                      padding: '16px 20px',
                      boxShadow: '0 1px 4px rgba(51,29,1,0.03)',
                    }}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.5, ease: gentleOut, delay: i * 0.08 }}
                  >
                    {/* Left: dot + name + tag */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="rounded-full shrink-0"
                        style={{ width: 8, height: 8, background: session.color }}
                      />
                      <span className="font-body truncate" style={{ fontSize: 14, color: '#331D01', fontWeight: 400 }}>
                        {session.hz > 0 ? `${session.hz}Hz` : session.frequencyName} — {session.frequencyName}
                      </span>
                      <span
                        className="font-body uppercase shrink-0 rounded"
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.05em',
                          background: '#F0EDED',
                          color: '#EC9247',
                          padding: '4px 8px',
                        }}
                      >
                        {categoryLabel(session.category)}
                      </span>
                    </div>

                    {/* Center: duration + date */}
                    <div className="hidden sm:flex items-center gap-6">
                      <span className="font-body" style={{ fontSize: 13, color: 'rgba(51,29,1,0.5)' }}>
                        {session.duration} min
                      </span>
                      <span className="font-body" style={{ fontSize: 12, color: 'rgba(51,29,1,0.4)' }}>
                        {session.date}
                      </span>
                    </div>

                    {/* Right: play + heart */}
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/player?freq=${session.frequencyId}`}
                        className="flex items-center justify-center rounded-full transition-all duration-200 hover:scale-105"
                        style={{
                          width: 32,
                          height: 32,
                          background: '#F0EDED',
                        }}
                        title="Replay"
                      >
                        <Play size={14} style={{ color: '#EC9247', marginLeft: 1 }} />
                      </Link>
                      <button
                        onClick={() => freq && toggleFavorite(freq)}
                        className="flex items-center justify-center rounded-full border-0 bg-transparent cursor-pointer transition-colors duration-200"
                        style={{ width: 32, height: 32 }}
                        title={favorites.find((f) => f.id === session.frequencyId) ? 'Unfavorite' : 'Favorite'}
                      >
                        <Heart
                          size={14}
                          style={{
                            color: favorites.find((f) => f.id === session.frequencyId) ? '#EC9247' : 'rgba(51,29,1,0.3)',
                            fill: favorites.find((f) => f.id === session.frequencyId) ? '#EC9247' : 'none',
                          }}
                        />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ----------------------------------------------------------- */}
          {/*  Section 4: Favorites & Daily Goals — Two Columns            */}
          {/* ----------------------------------------------------------- */}
          <section className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* -- Favorites -- */}
            <div id="favorites">
              <div className="flex items-center justify-between">
                <motion.h2
                  className="font-hero uppercase"
                  style={{ fontSize: 20, color: '#331D01', fontWeight: 400, letterSpacing: '-0.01em' }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: gentleOut }}
                >
                  Favorites
                </motion.h2>
                <span className="font-body cursor-pointer transition-colors hover:underline" style={{ fontSize: 13, color: '#EC9247' }}>
                  Manage &rarr;
                </span>
              </div>

              {favorites.length === 0 ? (
                <motion.div
                  className="mt-4 rounded-lg flex flex-col items-center justify-center text-center"
                  style={{
                    background: '#FFF8F0',
                    padding: 48,
                    boxShadow: '0 2px 8px rgba(51,29,1,0.04)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, ease: gentleOut }}
                >
                  <Heart size={32} style={{ color: 'rgba(51,29,1,0.15)' }} />
                  <p className="font-body mt-3" style={{ fontSize: 14, color: 'rgba(51,29,1,0.5)' }}>
                    No favorites yet. Explore frequencies and heart the ones you love.
                  </p>
                  <Link
                    to="/library"
                    className="font-body uppercase no-underline mt-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      color: '#FFFFFF',
                      background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
                      padding: '10px 24px',
                      borderRadius: 8,
                    }}
                  >
                    Explore Library
                  </Link>
                </motion.div>
              ) : (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {favorites.map((fav, i) => (
                    <motion.div
                      key={fav.id}
                      className="rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        background: '#FFFFFF',
                        padding: 16,
                        boxShadow: '0 2px 8px rgba(51,29,1,0.04)',
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, ease: gentleOut, delay: i * 0.1 }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-hero" style={{ fontSize: 14, color: 'rgba(236,146,71,0.4)', fontWeight: 400 }}>
                            {fav.hz > 0 ? `${fav.hz}Hz` : fav.name}
                          </p>
                          <h4
                            className="font-hero uppercase mt-1"
                            style={{ fontSize: 14, color: '#331D01', fontWeight: 400, letterSpacing: '0.02em' }}
                          >
                            {fav.name}
                          </h4>
                          <p className="font-body mt-0.5" style={{ fontSize: 12, color: 'rgba(51,29,1,0.5)' }}>
                            {fav.benefits[0] || fav.description.slice(0, 30)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFavorite(fav)}
                          className="flex items-center justify-center bg-transparent border-0 cursor-pointer p-1 transition-colors"
                          title="Remove"
                        >
                          <X size={14} style={{ color: 'rgba(51,29,1,0.25)' }} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Link
                          to={`/player?freq=${fav.id}`}
                          className="font-body uppercase no-underline transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: '0.1em',
                            color: '#FFFFFF',
                            background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
                            padding: '6px 16px',
                            borderRadius: 8,
                          }}
                        >
                          <Play size={11} className="inline mr-1" style={{ verticalAlign: 'middle' }} />
                          Play
                        </Link>
                        <span
                          className="font-body uppercase rounded"
                          style={{
                            fontSize: 10,
                            letterSpacing: '0.05em',
                            background: '#F0EDED',
                            color: '#EC9247',
                            padding: '4px 8px',
                          }}
                        >
                          {categoryLabel(fav.category)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* -- Daily Goals -- */}
            <div id="goals">
              <div className="flex items-center justify-between">
                <motion.h2
                  className="font-hero uppercase"
                  style={{ fontSize: 20, color: '#331D01', fontWeight: 400, letterSpacing: '-0.01em' }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: gentleOut }}
                >
                  Daily Goals
                </motion.h2>
                <span className="font-body cursor-pointer transition-colors hover:underline" style={{ fontSize: 13, color: '#EC9247' }}>
                  Edit &rarr;
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {goals.map((goal, i) => {
                  const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
                  return (
                    <motion.div
                      key={goal.id}
                      className="rounded-lg"
                      style={{
                        background: '#FFFFFF',
                        padding: 16,
                        boxShadow: '0 2px 8px rgba(51,29,1,0.04)',
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, ease: gentleOut, delay: i * 0.1 }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-body" style={{ fontSize: 14, color: '#331D01', fontWeight: 400 }}>
                          {goal.title}
                        </p>
                        {goal.status === 'complete' && (
                          <Check size={16} style={{ color: '#EC9247' }} />
                        )}
                      </div>
                      <p className="font-body mt-1" style={{ fontSize: 12, color: 'rgba(51,29,1,0.5)' }}>
                        {goal.current} / {goal.target} {goal.unit}
                      </p>
                      <div
                        className="mt-2 rounded-full overflow-hidden"
                        style={{ height: 6, background: '#F0EDED' }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: goalStatusColor(goal.status) }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${percent}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: gentleOut, delay: 0.3 + i * 0.1 }}
                        />
                      </div>
                      <p className="font-body mt-1.5" style={{ fontSize: 11, color: goalStatusColor(goal.status) }}>
                        {goal.status === 'complete'
                          ? 'Complete'
                          : goal.status === 'in-progress'
                            ? 'In progress'
                            : 'Not started'}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ----------------------------------------------------------- */}
          {/*  Recommended Frequencies                                      */}
          {/* ----------------------------------------------------------- */}
          <section className="mt-12">
            <motion.h2
              className="font-hero uppercase"
              style={{ fontSize: 20, color: '#331D01', fontWeight: 400, letterSpacing: '-0.01em' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: gentleOut }}
            >
              Based on Your Listening
            </motion.h2>
            <p className="font-body mt-1" style={{ fontSize: 14, color: 'rgba(51,29,1,0.5)' }}>
              Frequencies recommended from your session history
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec, i) => (
                <motion.div
                  key={rec.id}
                  className="rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
                  style={{
                    background: '#FFFFFF',
                    padding: 24,
                    boxShadow: '0 2px 8px rgba(51,29,1,0.04)',
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: gentleOut, delay: i * 0.1 }}
                >
                  <p className="font-hero" style={{ fontSize: 18, color: '#EC9247', fontWeight: 400 }}>
                    {rec.hz > 0 ? `${rec.hz}Hz` : rec.name}
                  </p>
                  <h4
                    className="font-hero uppercase mt-1"
                    style={{ fontSize: 16, color: '#331D01', fontWeight: 400, letterSpacing: '0.02em' }}
                  >
                    {rec.name}
                  </h4>
                  <p className="font-body mt-2" style={{ fontSize: 13, color: 'rgba(51,29,1,0.5)', lineHeight: 1.6 }}>
                    {rec.description.length > 80 ? rec.description.slice(0, 80) + '...' : rec.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="font-body uppercase rounded"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.05em',
                        background: '#F0EDED',
                        color: '#EC9247',
                        padding: '4px 8px',
                      }}
                    >
                      {categoryLabel(rec.category)}
                    </span>
                  </div>
                  <Link
                    to={`/player?freq=${rec.id}`}
                    className="font-body uppercase no-underline mt-4 inline-flex items-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      color: '#FFFFFF',
                      background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
                      padding: '10px 24px',
                      borderRadius: 8,
                    }}
                  >
                    Try Now
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ----------------------------------------------------------- */}
          {/*  Settings Panel (Collapsible)                                */}
          {/* ----------------------------------------------------------- */}
          <section id="settings" className="mt-12">
            <motion.button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center justify-between rounded-lg border-0 cursor-pointer transition-colors duration-200"
              style={{
                background: '#FFFFFF',
                padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(51,29,1,0.04)',
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: gentleOut }}
            >
              <div className="flex items-center gap-3">
                <Settings size={20} style={{ color: '#EC9247' }} />
                <span
                  className="font-hero uppercase"
                  style={{ fontSize: 18, color: '#331D01', fontWeight: 400, letterSpacing: '0.02em' }}
                >
                  Settings
                </span>
              </div>
              {settingsOpen ? <ChevronUp size={20} style={{ color: 'rgba(51,29,1,0.4)' }} /> : <ChevronDown size={20} style={{ color: 'rgba(51,29,1,0.4)' }} />}
            </motion.button>

            {settingsOpen && (
              <motion.div
                className="rounded-lg mt-2"
                style={{
                  background: '#FFFFFF',
                  padding: 24,
                  boxShadow: '0 2px 8px rgba(51,29,1,0.04)',
                }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.4, ease: gentleOut }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Account */}
                  <div>
                    <h4 className="font-hero uppercase" style={{ fontSize: 12, color: 'rgba(51,29,1,0.4)', letterSpacing: '0.15em', marginBottom: 12 }}>
                      Account
                    </h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(51,29,1,0.06)' }}>
                        <div className="flex items-center gap-2">
                          <MonitorSpeaker size={16} style={{ color: '#EC9247' }} />
                          <span className="font-body" style={{ fontSize: 14, color: '#331D01' }}>Display Name</span>
                        </div>
                        <span className="font-body" style={{ fontSize: 13, color: 'rgba(51,29,1,0.5)' }}>Listener</span>
                      </div>
                      <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(51,29,1,0.06)' }}>
                        <div className="flex items-center gap-2">
                          <BarChart3 size={16} style={{ color: '#EC9247' }} />
                          <span className="font-body" style={{ fontSize: 14, color: '#331D01' }}>Plan</span>
                        </div>
                        <span
                          className="font-body uppercase rounded"
                          style={{ fontSize: 11, letterSpacing: '0.05em', background: '#F0EDED', color: '#EC9247', padding: '4px 10px' }}
                        >
                          Free Plan
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div>
                    <h4 className="font-hero uppercase" style={{ fontSize: 12, color: 'rgba(51,29,1,0.4)', letterSpacing: '0.15em', marginBottom: 12 }}>
                      Notifications
                    </h4>
                    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(51,29,1,0.06)' }}>
                      <div className="flex items-center gap-2">
                        <Bell size={16} style={{ color: '#EC9247' }} />
                        <span className="font-body" style={{ fontSize: 14, color: '#331D01' }}>Push Notifications</span>
                      </div>
                      <button
                        onClick={() => setNotifEnabled(!notifEnabled)}
                        className="border-0 bg-transparent cursor-pointer"
                      >
                        <div
                          className="rounded-full transition-colors duration-200"
                          style={{
                            width: 40,
                            height: 22,
                            background: notifEnabled ? '#EC9247' : 'rgba(51,29,1,0.15)',
                            position: 'relative',
                          }}
                        >
                          <div
                            className="rounded-full transition-transform duration-200"
                            style={{
                              width: 18,
                              height: 18,
                              background: '#FFFFFF',
                              position: 'absolute',
                              top: 2,
                              left: notifEnabled ? 20 : 2,
                            }}
                          />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Audio Quality */}
                  <div>
                    <h4 className="font-hero uppercase" style={{ fontSize: 12, color: 'rgba(51,29,1,0.4)', letterSpacing: '0.15em', marginBottom: 12 }}>
                      Audio
                    </h4>
                    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(51,29,1,0.06)' }}>
                      <div className="flex items-center gap-2">
                        <Volume2 size={16} style={{ color: '#EC9247' }} />
                        <span className="font-body" style={{ fontSize: 14, color: '#331D01' }}>High Quality Audio</span>
                      </div>
                      <button
                        onClick={() => setHighQuality(!highQuality)}
                        className="border-0 bg-transparent cursor-pointer"
                      >
                        <div
                          className="rounded-full transition-colors duration-200"
                          style={{
                            width: 40,
                            height: 22,
                            background: highQuality ? '#EC9247' : 'rgba(51,29,1,0.15)',
                            position: 'relative',
                          }}
                        >
                          <div
                            className="rounded-full transition-transform duration-200"
                            style={{
                              width: 18,
                              height: 18,
                              background: '#FFFFFF',
                              position: 'absolute',
                              top: 2,
                              left: highQuality ? 20 : 2,
                            }}
                          />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Theme */}
                  <div>
                    <h4 className="font-hero uppercase" style={{ fontSize: 12, color: 'rgba(51,29,1,0.4)', letterSpacing: '0.15em', marginBottom: 12 }}>
                      Appearance
                    </h4>
                    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(51,29,1,0.06)' }}>
                      <div className="flex items-center gap-2">
                        <Moon size={16} style={{ color: '#EC9247' }} />
                        <span className="font-body" style={{ fontSize: 14, color: '#331D01' }}>Dark Theme</span>
                      </div>
                      <button
                        onClick={() => setDarkTheme(!darkTheme)}
                        className="border-0 bg-transparent cursor-pointer"
                      >
                        <div
                          className="rounded-full transition-colors duration-200"
                          style={{
                            width: 40,
                            height: 22,
                            background: darkTheme ? '#EC9247' : 'rgba(51,29,1,0.15)',
                            position: 'relative',
                          }}
                        >
                          <div
                            className="rounded-full transition-transform duration-200"
                            style={{
                              width: 18,
                              height: 18,
                              background: '#FFFFFF',
                              position: 'absolute',
                              top: 2,
                              left: darkTheme ? 20 : 2,
                            }}
                          />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Export Data */}
                <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(51,29,1,0.06)' }}>
                  <button
                    className="flex items-center gap-2 font-body uppercase border-0 cursor-pointer transition-all duration-200 hover:opacity-80"
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      letterSpacing: '0.12em',
                      color: '#FFFFFF',
                      background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
                      padding: '12px 24px',
                      borderRadius: 8,
                    }}
                  >
                    <Download size={16} />
                    Export Session Data
                  </button>
                </div>
              </motion.div>
            )}
          </section>

          {/* Bottom spacer */}
          <div style={{ height: 40 }} />
        </div>
      </main>
    </div>
  );
}
