import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Square,
  Heart,
  Volume2,
  VolumeX,
  Minus,
  Plus,
  ChevronLeft,
  Check,
  Zap,
  Timer,
  Brain,
  Sparkles,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import type { NoiseType } from '@/hooks/useAudioEngine';
import {
  type FrequencyCategory,
  type BrainwaveState,
  type Frequency,
  allFrequencies,
} from '@/data/frequencies';
import PostSessionCard from '@/components/PostSessionCard';
import CrossSellCard from '@/components/CrossSellCard';
import MembershipCard from '@/components/MembershipCard';
import BreathingOrb from '@/components/BreathingOrb';
import { recordSession, getCompletedCount } from '@/lib/sessions';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SessionPhase = 'setup' | 'playing' | 'summary';

interface SessionConfig {
  category: FrequencyCategory;
  frequencyId: string;
  durationMin: number;
  volume: number;
  carrierHz: number;
  beatHz: number;
  noiseType: string;
  waveform: OscillatorType;
  panning: 'mono' | 'stereo';
}

interface Preset {
  label: string;
  config: Partial<SessionConfig>;
  icon: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DURATION_PRESETS = [5, 10, 15, 20, 30, 45, 60];

const CATEGORIES: { id: FrequencyCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'solfeggio', label: 'Solfeggio', icon: <Sparkles size={28} strokeWidth={1.5} /> },
  { id: 'binaural', label: 'Binaural', icon: <Brain size={28} strokeWidth={1.5} /> },
  { id: 'schumann', label: 'Schumann', icon: <Zap size={28} strokeWidth={1.5} /> },
  { id: 'isochronic', label: 'Isochronic', icon: <Timer size={28} strokeWidth={1.5} /> },
  { id: 'noise', label: 'Color Noise', icon: <Volume2 size={28} strokeWidth={1.5} /> },
];

const BRAINWAVE_LABELS: Record<BrainwaveState, { label: string; range: string; desc: string }> = {
  delta: { label: 'DELTA', range: '0.5–4 Hz', desc: 'Slow listening, sleep wind-down' },
  theta: { label: 'THETA', range: '4–8 Hz', desc: 'Meditation, creativity, REM sleep' },
  alpha: { label: 'ALPHA', range: '8–14 Hz', desc: 'Relaxation, stress relief, flow state' },
  beta: { label: 'BETA', range: '14–30 Hz', desc: 'Focus, alertness, problem solving' },
  gamma: { label: 'GAMMA', range: '30–100 Hz', desc: 'Peak awareness, cognitive enhancement' },
};

const QUICK_PRESETS: Preset[] = [
  {
    label: 'Deep Sleep',
    config: { category: 'binaural' as FrequencyCategory, frequencyId: 'binaural-delta-0.5', durationMin: 30, beatHz: 0.5, carrierHz: 100 },
    icon: <Zap size={16} />,
  },
  {
    label: 'Focus',
    config: { category: 'binaural' as FrequencyCategory, frequencyId: 'binaural-beta-15', durationMin: 25, beatHz: 15, carrierHz: 200 },
    icon: <Brain size={16} />,
  },
  {
    label: 'Meditation',
    config: { category: 'binaural' as FrequencyCategory, frequencyId: 'binaural-theta-5', durationMin: 20, beatHz: 5, carrierHz: 200 },
    icon: <Sparkles size={16} />,
  },
  {
    label: '528Hz Healing',
    config: { category: 'solfeggio' as FrequencyCategory, frequencyId: 'solfeggio-528', durationMin: 15 },
    icon: <Sparkles size={16} />,
  },
  {
    label: 'Earth Connection',
    config: { category: 'schumann' as FrequencyCategory, frequencyId: 'schumann-7.83', durationMin: 20 },
    icon: <Zap size={16} />,
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getBrainwaveState(hz: number): BrainwaveState {
  if (hz <= 4) return 'delta';
  if (hz <= 8) return 'theta';
  if (hz <= 14) return 'alpha';
  if (hz <= 30) return 'beta';
  return 'gamma';
}

function getFrequencyById(id: string): Frequency | undefined {
  return allFrequencies.find((f) => f.id === id);
}

/* ------------------------------------------------------------------ */
/*  Orb Component (isolated for animation perf)                       */
/* ------------------------------------------------------------------ */
/* PulsingOrb + WaveformVisualizer removed — replaced by BreathingOrb */
/* in the playing-phase redesign. Setup + Summary use the orb too.   */

/* ------------------------------------------------------------------ */
/*  Ambient Particles (isolated, memo'd)                              */
/* ------------------------------------------------------------------ */

const AmbientParticles = React.memo(function AmbientParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 2,
      duration: 8 + Math.random() * 7,
      delay: Math.random() * 10,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: 'rgba(236,146,71,0.18)',
            animation: `sine-drift ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
});

/* ================================================================== */
/*  MAIN PLAYER COMPONENT                                              */
/* ================================================================== */

export default function Player() {
  const navigate = useNavigate();
  const audio = useAudioEngine();

  /* ---------- state ---------- */
  const [phase, setPhase] = useState<SessionPhase>('setup');
  const [config, setConfig] = useState<SessionConfig>({
    category: 'solfeggio',
    frequencyId: 'solfeggio-528',
    durationMin: 15,
    volume: 0.7,
    carrierHz: 200,
    beatHz: 10,
    noiseType: 'pink',
    waveform: 'sine',
    panning: 'stereo',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingSec, setRemainingSec] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [timerFlash, setTimerFlash] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({ duration: 0, frequency: '', category: '', state: '' });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---------- derived ---------- */
  const currentFreq = getFrequencyById(config.frequencyId);
  const categoryFrequencies = allFrequencies.filter((f) => f.category === config.category);
  const brainwave: BrainwaveState = currentFreq?.brainwaveState ?? getBrainwaveState(config.beatHz || currentFreq?.hz || 10);
  const brainwaveInfo = BRAINWAVE_LABELS[brainwave];

  const totalSec = config.durationMin * 60;
  const progressPct = totalSec > 0 ? ((totalSec - remainingSec) / totalSec) * 100 : 0;

  /* ---------- timer logic ---------- */
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          clearTimer();
          // Auto-stop
          setPhase('summary');
          audio.stop();
          setSessionStats({
            duration: totalSec,
            frequency: currentFreq?.name || '',
            category: config.category,
            state: brainwaveInfo.label,
          });
          // Persist to history so Dashboard + InstallPrompt + streak can read
          recordSession({
            frequencyId: config.frequencyId,
            frequencyName: currentFreq?.name || '',
            hz: currentFreq?.hz || 0,
            category: config.category,
            durationSec: totalSec,
            brainwaveState: brainwaveInfo.label,
          });
          return 0;
        }
        // flash effect
        setTimerFlash(true);
        setTimeout(() => setTimerFlash(false), 200);
        return prev - 1;
      });
      setElapsedSec((e) => e + 1);
    }, 1000);
  }, [clearTimer, totalSec, currentFreq, config.category, brainwaveInfo, audio]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  /* ---------- session actions ---------- */
  const beginSession = useCallback(() => {
    // Resume AudioContext if needed
    const resumeCtx = async () => {
      const ctx = (audio as unknown as { initAudio?: () => { ctx: AudioContext } | null }).initAudio?.();
      return ctx?.ctx;
    };
    resumeCtx();

    const freq = currentFreq;
    if (!freq) return;

    const vol = config.volume;

    switch (config.category) {
      case 'solfeggio':
        audio.playSolfeggio(freq.hz, vol);
        break;
      case 'binaural':
        audio.playBinaural(config.carrierHz, config.beatHz, vol);
        break;
      case 'schumann':
        audio.playSchumann(freq.hz, vol);
        break;
      case 'isochronic':
        audio.playIsochronic(config.carrierHz, config.beatHz, vol);
        break;
      case 'noise': {
        const noiseType = (config.noiseType || 'pink') as NoiseType;
        audio.playNoise(noiseType, vol);
        break;
      }
    }

    setRemainingSec(config.durationMin * 60);
    setElapsedSec(0);
    setIsPaused(false);
    setFavorited(false);
    setPhase('playing');
  }, [audio, config, currentFreq]);

  const applyPreset = useCallback((preset: Preset) => {
    setConfig((prev) => ({ ...prev, ...preset.config }));
    const freq = getFrequencyById(preset.config.frequencyId || '');
    if (!freq) return;
    const vol = configRef.current.volume;
    switch (freq.category) {
      case 'solfeggio':
        audio.playSolfeggio(freq.hz, vol);
        break;
      case 'binaural':
        audio.playBinaural(preset.config.carrierHz || 200, preset.config.beatHz || freq.hz, vol);
        break;
      case 'schumann':
        audio.playSchumann(freq.hz, vol);
        break;
      case 'isochronic':
        audio.playIsochronic(preset.config.carrierHz || 200, preset.config.beatHz || freq.hz, vol);
        break;
      case 'noise':
        audio.playNoise((preset.config.noiseType || 'pink') as NoiseType, vol);
        break;
    }
    setRemainingSec((preset.config.durationMin || 15) * 60);
    setElapsedSec(0);
    setIsPaused(false);
    setFavorited(false);
    setPhase('playing');
  }, [audio]);

  // Need a ref to track latest config for deferred calls
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  const togglePause = useCallback(() => {
    if (isPaused) {
      // Resume by restarting with same settings
      const freq = currentFreq;
      if (!freq) return;
      const vol = configRef.current.volume;
      switch (configRef.current.category) {
        case 'solfeggio':
          audio.playSolfeggio(freq.hz, vol);
          break;
        case 'binaural':
          audio.playBinaural(configRef.current.carrierHz, configRef.current.beatHz, vol);
          break;
        case 'schumann':
          audio.playSchumann(freq.hz, vol);
          break;
        case 'isochronic':
          audio.playIsochronic(configRef.current.carrierHz, configRef.current.beatHz, vol);
          break;
        case 'noise':
          audio.playNoise(configRef.current.noiseType as NoiseType, vol);
          break;
      }
      startTimer();
      setIsPaused(false);
    } else {
      audio.stop();
      clearTimer();
      setIsPaused(true);
    }
  }, [isPaused, currentFreq, audio, startTimer, clearTimer]);

  const endSession = useCallback(() => {
    audio.stop();
    clearTimer();
    setSessionStats({
      duration: elapsedSec,
      frequency: currentFreq?.name || '',
      category: config.category,
      state: brainwaveInfo.label,
    });
    // Only record sessions >= 30s to avoid logging accidental clicks
    if (elapsedSec >= 30) {
      recordSession({
        frequencyId: config.frequencyId,
        frequencyName: currentFreq?.name || '',
        hz: currentFreq?.hz || 0,
        category: config.category,
        durationSec: elapsedSec,
        brainwaveState: brainwaveInfo.label,
      });
    }
    setPhase('summary');
  }, [audio, clearTimer, elapsedSec, currentFreq, config.category, config.frequencyId, brainwaveInfo]);

  const backToSetup = useCallback(() => {
    audio.stop();
    clearTimer();
    setPhase('setup');
  }, [audio, clearTimer]);

  // Start timer when entering playing phase
  useEffect(() => {
    if (phase === 'playing' && !isPaused) {
      startTimer();
    }
    return () => clearTimer();
  }, [phase, isPaused, startTimer, clearTimer]);

  // Load favorited state from localStorage when the current frequency changes
  useEffect(() => {
    if (!config.frequencyId) return;
    try {
      const raw = localStorage.getItem('solivana-resonance-favorites');
      const list: string[] = raw ? JSON.parse(raw) : [];
      setFavorited(list.includes(config.frequencyId));
    } catch (err) {
      console.warn('Failed to read favorites:', err);
    }
  }, [config.frequencyId]);

  // Toast: ESC during playing exits back to setup; toast auto-clears after 2s
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'playing') {
        backToSetup();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase, backToSetup]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Pre-fill setup from URL query params (?freq=…&duration=…&category=…)
  // Runs once on mount; supports shared session URLs.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const freqParam = params.get('freq');
    const durationParam = params.get('duration');
    const categoryParam = params.get('category') as FrequencyCategory | null;
    if (!freqParam && !durationParam && !categoryParam) return;
    setConfig((c) => {
      const next = { ...c };
      if (freqParam && allFrequencies.find((f) => f.id === freqParam)) {
        next.frequencyId = freqParam;
        const found = allFrequencies.find((f) => f.id === freqParam);
        if (found) next.category = found.category;
      }
      if (categoryParam && ['solfeggio', 'binaural', 'schumann', 'isochronic', 'noise'].includes(categoryParam)) {
        next.category = categoryParam;
      }
      const dur = Number(durationParam);
      if (Number.isFinite(dur) && dur > 0 && dur <= 120) {
        next.durationMin = Math.floor(dur);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build a shareable URL that recreates the current session config
  const buildShareUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (config.frequencyId) params.set('freq', config.frequencyId);
    if (config.category) params.set('category', config.category);
    if (config.durationMin) params.set('duration', String(config.durationMin));
    return `${window.location.origin}/?#/player?${params.toString()}`;
  }, [config]);

  const shareCurrentSession = useCallback(async () => {
    const url = buildShareUrl();
    const text = currentFreq
      ? `Tuning into ${currentFreq.name} on SoliVana Resonance.`
      : 'A session on SoliVana Resonance.';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'SoliVana Resonance', text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setToast('Session link copied');
      }
    } catch (err) {
      console.warn('Share failed:', err);
      setToast('Share unavailable');
    }
  }, [buildShareUrl, currentFreq]);

  // Save current setup as a named preset in localStorage
  const savePresetFromCurrent = useCallback(() => {
    const name = window.prompt(
      'Name this practice',
      currentFreq ? `${currentFreq.name} · ${config.durationMin}min` : 'My practice',
    );
    if (!name) return;
    try {
      const raw = localStorage.getItem('solivana-resonance-presets');
      const list: Array<{
        id: string;
        name: string;
        frequencyId: string;
        category: FrequencyCategory;
        durationMin: number;
        savedAt: string;
      }> = raw ? JSON.parse(raw) : [];
      list.push({
        id: `preset-${Date.now()}`,
        name: name.trim(),
        frequencyId: config.frequencyId,
        category: config.category,
        durationMin: config.durationMin,
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem('solivana-resonance-presets', JSON.stringify(list));
      setToast(`Saved "${name.trim()}"`);
    } catch (err) {
      console.warn('Failed to save preset:', err);
      setToast('Could not save preset');
    }
  }, [config, currentFreq]);

  const toggleFavorited = useCallback(() => {
    if (!config.frequencyId) return;
    setFavorited((prev) => {
      const next = !prev;
      try {
        const raw = localStorage.getItem('solivana-resonance-favorites');
        const list: string[] = raw ? JSON.parse(raw) : [];
        const updated = next
          ? Array.from(new Set([...list, config.frequencyId]))
          : list.filter((id) => id !== config.frequencyId);
        localStorage.setItem('solivana-resonance-favorites', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to persist favorites:', err);
      }
      setToast(next ? 'Added to favorites' : 'Removed from favorites');
      return next;
    });
  }, [config.frequencyId]);

  /* ---------- orb values ---------- */
  // orbBaseHz removed — the new BreathingOrb derives its breath cadence from
  // the beat alone. The carrier tone is not visualized separately anymore.

  const orbBeatHz = useMemo(() => {
    if (config.category === 'binaural' || config.category === 'isochronic') {
      return config.beatHz;
    }
    return currentFreq?.hz || 0;
  }, [config, currentFreq]);

  /* ================================================================= */
  /*  RENDER — Setup Phase                                              */
  /* ================================================================= */

  if (phase === 'setup') {
    return (
      <div
        className="px-6 md:px-12 lg:px-20"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F0EDED 50%, #FFF8F0 100%)',
          minHeight: 'calc(100dvh - 72px)',
          paddingTop: 120,
          paddingBottom: 80,
        }}
      >
        <div className="mx-auto" style={{ maxWidth: 1280 }}>
          {/* Title */}
          <div className="mb-12 animate-fade-in-up">
            <h1
              className="font-hero uppercase"
              style={{ fontSize: 48, letterSpacing: '-0.01em', color: '#331D01' }}
            >
              SESSION PLAYER
            </h1>
            <p
              className="font-body mt-4"
              style={{
                fontSize: 16,
                fontWeight: 300,
                color: 'rgba(51,29,1,0.6)',
                maxWidth: 520,
                lineHeight: 1.7,
              }}
            >
              Configure your frequency session below. All audio is generated in real-time through your browser — no files, no downloads.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="mb-8 flex flex-wrap gap-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset)}
                className="flex items-center gap-2 font-body uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                }}
              >
                {preset.icon}
                {preset.label}
              </button>
            ))}
          </div>

          {/* Configuration Panel */}
          <div
            className="animate-fade-in-up"
            style={{
              background: '#FFFFFF',
              borderRadius: 8,
              padding: 40,
              boxShadow: '0 4px 24px rgba(51,29,1,0.06)',
              animationDelay: '0.3s',
            }}
          >
            <div className="flex flex-col" style={{ gap: 24 }}>
              {/* Category Select */}
              <div>
                <label
                  className="font-hero uppercase block mb-3"
                  style={{ fontSize: 12, letterSpacing: '0.15em', color: '#EC9247' }}
                >
                  FREQUENCY CATEGORY
                </label>
                <div className="flex flex-wrap gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setConfig((c) => ({
                          ...c,
                          category: cat.id,
                          frequencyId: allFrequencies.filter((f) => f.category === cat.id)[0]?.id || '',
                        }));
                      }}
                      className="flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer"
                      style={{
                        background: config.category === cat.id ? '#F0EDED' : '#FFF8F0',
                        border: `1px solid ${config.category === cat.id ? '#EC9247' : 'rgba(51,29,1,0.08)'}`,
                        borderRadius: 8,
                        padding: 16,
                        minWidth: 140,
                        color: '#EC9247',
                      }}
                    >
                      {cat.icon}
                      <span
                        className="font-body uppercase"
                        style={{ fontSize: 12, color: '#331D01', fontWeight: 400, letterSpacing: '0.05em' }}
                      >
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequency Select */}
              <div>
                <label
                  className="font-hero uppercase block mb-3"
                  style={{ fontSize: 12, letterSpacing: '0.15em', color: '#EC9247' }}
                >
                  SELECT FREQUENCY
                </label>
                <Select
                  value={config.frequencyId}
                  onValueChange={(val) => setConfig((c) => ({ ...c, frequencyId: val }))}
                >
                  <SelectTrigger
                    className="w-full font-body"
                    style={{
                      background: '#FFF8F0',
                      border: '1px solid rgba(51,29,1,0.12)',
                      borderRadius: 8,
                      padding: '12px 16px',
                      fontSize: 14,
                      color: '#331D01',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryFrequencies.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} — {f.description.slice(0, 60)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div>
                <label
                  className="font-hero uppercase block mb-3"
                  style={{ fontSize: 12, letterSpacing: '0.15em', color: '#EC9247' }}
                >
                  SESSION DURATION
                </label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_PRESETS.map((min) => (
                    <button
                      key={min}
                      onClick={() => setConfig((c) => ({ ...c, durationMin: min }))}
                      className="font-body uppercase transition-all duration-200 cursor-pointer"
                      style={{
                        background: config.durationMin === min ? '#EC9247' : '#F0EDED',
                        color: config.durationMin === min ? '#FFFFFF' : '#EC9247',
                        fontSize: 12,
                        fontWeight: 500,
                        padding: '6px 14px',
                        borderRadius: 4,
                        border: 'none',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {min} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume */}
              <div>
                <label
                  className="font-hero uppercase block mb-3"
                  style={{ fontSize: 12, letterSpacing: '0.15em', color: '#EC9247' }}
                >
                  VOLUME — {Math.round(config.volume * 100)}%
                </label>
                <div className="px-1">
                  <Slider
                    value={[config.volume * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => {
                      const vol = v / 100;
                      setConfig((c) => ({ ...c, volume: vol }));
                      audio.setVolume(vol);
                    }}
                  />
                </div>
              </div>

              {/* Advanced Options */}
              <div>
                <button
                  onClick={() => setShowAdvanced((s) => !s)}
                  className="flex items-center gap-2 bg-transparent border-none cursor-pointer font-body transition-colors duration-200 hover:opacity-80"
                  style={{ fontSize: 14, fontWeight: 400, color: '#EC9247' }}
                >
                  Advanced Options
                  <span
                    className="inline-block transition-transform duration-200"
                    style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    ▼
                  </span>
                </button>
                {showAdvanced && (
                  <div className="mt-4 flex flex-col gap-4" style={{ animation: 'fade-in-up 0.4s ease forwards' }}>
                    {(config.category === 'binaural' || config.category === 'isochronic') && (
                      <div className="flex flex-wrap gap-4">
                        <div>
                          <label htmlFor="carrier-hz-input" className="font-body block mb-1" style={{ fontSize: 12, color: 'rgba(51,29,1,0.6)' }}>
                            Carrier Frequency (Hz)
                          </label>
                          <input
                            id="carrier-hz-input"
                            type="number"
                            min={100}
                            max={1000}
                            value={config.carrierHz}
                            onChange={(e) => setConfig((c) => ({ ...c, carrierHz: Number(e.target.value) }))}
                            aria-label="Carrier frequency in Hertz"
                            className="font-body"
                            style={{
                              background: '#FFF8F0',
                              border: '1px solid rgba(51,29,1,0.12)',
                              borderRadius: 8,
                              padding: '8px 12px',
                              fontSize: 14,
                              width: 120,
                              color: '#331D01',
                            }}
                          />
                        </div>
                        <div>
                          <label htmlFor="beat-hz-input" className="font-body block mb-1" style={{ fontSize: 12, color: 'rgba(51,29,1,0.6)' }}>
                            Beat Frequency (Hz)
                          </label>
                          <input
                            id="beat-hz-input"
                            type="number"
                            min={0.5}
                            max={100}
                            step={0.5}
                            value={config.beatHz}
                            onChange={(e) => setConfig((c) => ({ ...c, beatHz: Number(e.target.value) }))}
                            aria-label="Beat frequency in Hertz"
                            className="font-body"
                            style={{
                              background: '#FFF8F0',
                              border: '1px solid rgba(51,29,1,0.12)',
                              borderRadius: 8,
                              padding: '8px 12px',
                              fontSize: 14,
                              width: 120,
                              color: '#331D01',
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {config.category === 'noise' && (
                      <div>
                        <label className="font-body block mb-2" style={{ fontSize: 12, color: 'rgba(51,29,1,0.6)' }}>
                          Noise Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['white', 'pink', 'brown', 'violet', 'grey', 'blue'].map((n) => (
                            <button
                              key={n}
                              onClick={() => setConfig((c) => ({ ...c, noiseType: n }))}
                              className="font-body uppercase transition-all duration-200 cursor-pointer"
                              style={{
                                background: config.noiseType === n ? '#EC9247' : '#F0EDED',
                                color: config.noiseType === n ? '#FFFFFF' : '#EC9247',
                                fontSize: 11,
                                fontWeight: 500,
                                padding: '4px 12px',
                                borderRadius: 4,
                                border: 'none',
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                              }}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Begin Button */}
              <button
                onClick={beginSession}
                className="w-full font-body uppercase text-white transition-all duration-200 hover:scale-[1.01] hover:shadow-sage-glow active:scale-[0.99] cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  padding: 20,
                  borderRadius: 8,
                  border: 'none',
                  marginTop: 8,
                }}
              >
                BEGIN SESSION
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================= */
  /*  RENDER — Summary Phase                                            */
  /* ================================================================= */

  if (phase === 'summary') {
    return (
      <div
        className="px-6 md:px-12 lg:px-20"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F0EDED 50%, #FFF8F0 100%)',
          minHeight: 'calc(100dvh - 72px)',
          paddingTop: 120,
          paddingBottom: 80,
        }}
      >
        <div className="mx-auto flex flex-col items-center" style={{ maxWidth: 720 }}>
          {/* Success Icon */}
          <div
            className="flex items-center justify-center mb-8"
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#F0EDED',
              animation: 'fade-in-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
          >
            <Check size={36} color="#EC9247" strokeWidth={2} />
          </div>

          {/* Headline */}
          <h1
            className="font-hero uppercase text-center"
            style={{
              fontSize: 40,
              letterSpacing: '-0.01em',
              color: '#331D01',
              animation: 'hero-clip-reveal 0.6s cubic-bezier(0.22, 1, 0.4, 1) 0.2s forwards',
              clipPath: 'inset(0 100% 0 0)',
            }}
          >
            Session Complete
          </h1>

          {/* Stats Card */}
          <div
            className="w-full mt-8"
            style={{
              background: '#FFFFFF',
              borderRadius: 8,
              padding: 32,
              boxShadow: '0 4px 24px rgba(51,29,1,0.06)',
              animation: 'fade-in-up 0.7s cubic-bezier(0.22, 1, 0.4, 1) 0.4s forwards',
              opacity: 0,
            }}
          >
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'TOTAL TIME', value: formatTime(sessionStats.duration), color: '#EC9247' },
                { label: 'FREQUENCY', value: sessionStats.frequency, color: '#331D01' },
                { label: 'CATEGORY', value: sessionStats.category.toUpperCase(), color: '#331D01' },
                { label: 'STATE', value: sessionStats.state, color: '#EC9247' },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="flex flex-col gap-1"
                  style={{
                    animation: `fade-in-up 0.5s cubic-bezier(0.22, 1, 0.4, 1) ${0.5 + i * 0.1}s forwards`,
                    opacity: 0,
                  }}
                >
                  <span
                    className="font-body uppercase"
                    style={{ fontSize: 12, letterSpacing: '0.08em', color: 'rgba(51,29,1,0.5)' }}
                  >
                    {stat.label}
                  </span>
                  <span
                    className="font-hero"
                    style={{ fontSize: 24, color: stat.color }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className="flex flex-wrap gap-4 justify-center mt-8"
            style={{
              animation: 'fade-in-up 0.6s cubic-bezier(0.22, 1, 0.4, 1) 0.6s forwards',
              opacity: 0,
            }}
          >
            <button
              type="button"
              onClick={() => { setPhase('setup'); window.scrollTo(0, 0); }}
              className="font-body uppercase text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-sage-glow active:scale-[0.98] cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.12em',
                padding: '16px 32px',
                borderRadius: 8,
                border: 'none',
              }}
            >
              START NEW SESSION
            </button>
            <button
              type="button"
              onClick={toggleFavorited}
              className="flex items-center gap-2 font-body uppercase transition-all duration-200 cursor-pointer"
              style={{
                background: 'transparent',
                border: '1px solid #331D01',
                color: '#331D01',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.12em',
                padding: '16px 32px',
                borderRadius: 8,
              }}
            >
              <Heart size={16} fill={favorited ? '#EC9247' : 'none'} color={favorited ? '#EC9247' : '#331D01'} />
              {favorited ? 'SAVED' : 'SAVE TO FAVORITES'}
            </button>
            <button
              type="button"
              onClick={savePresetFromCurrent}
              className="font-body uppercase transition-all duration-200 cursor-pointer"
              style={{
                background: 'transparent',
                border: '1px solid rgba(51,29,1,0.4)',
                color: '#331D01',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.12em',
                padding: '16px 32px',
                borderRadius: 8,
              }}
            >
              SAVE AS PRESET
            </button>
            <button
              type="button"
              onClick={shareCurrentSession}
              className="font-body uppercase transition-all duration-200 cursor-pointer"
              style={{
                background: 'transparent',
                border: '1px solid rgba(51,29,1,0.4)',
                color: '#331D01',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.12em',
                padding: '16px 32px',
                borderRadius: 8,
              }}
            >
              SHARE SESSION
            </button>
          </div>

          {/* Post-session email capture */}
          <div
            className="w-full mt-10"
            style={{
              animation: 'fade-in-up 0.7s cubic-bezier(0.22, 1, 0.4, 1) 0.75s forwards',
              opacity: 0,
            }}
          >
            <PostSessionCard
              frequencyName={sessionStats.frequency}
              category={sessionStats.category}
              durationSec={sessionStats.duration}
            />
          </div>

          {/* Category-aware cross-sell */}
          <div
            className="w-full mt-6"
            style={{
              animation: 'fade-in-up 0.7s cubic-bezier(0.22, 1, 0.4, 1) 0.9s forwards',
              opacity: 0,
            }}
          >
            <CrossSellCard category={sessionStats.category} />
          </div>

          {/* Membership ask — only renders at 3+ sessions */}
          <div
            className="w-full mt-6"
            style={{
              animation: 'fade-in-up 0.7s cubic-bezier(0.22, 1, 0.4, 1) 1.05s forwards',
              opacity: 0,
            }}
          >
            <MembershipCard sessionCount={getCompletedCount()} />
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="font-body uppercase transition-all duration-200 hover:opacity-80 cursor-pointer mt-6"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#EC9247',
              fontSize: 14,
              fontWeight: 400,
              padding: '16px 24px',
              animation: 'fade-in-up 0.6s cubic-bezier(0.22, 1, 0.4, 1) 1s forwards',
              opacity: 0,
            }}
          >
            VIEW DASHBOARD →
          </button>
        </div>
      </div>
    );
  }

  /* ================================================================= */
  /*  RENDER — Playing Phase (Dark Canvas)                              */
  /* ================================================================= */

  return (
    <div
      className="fixed inset-0 flex flex-col items-center overflow-hidden"
      style={{
        // Light cream canvas — matches the rest of the SoliVana surface.
        // Subtle warm radial keeps it from feeling flat.
        background: 'radial-gradient(ellipse at center, #FFFFFF 0%, #FFF8F0 55%, #F4E8D8 100%)',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
      }}
    >
      {/* Ambient Particles */}
      <AmbientParticles />

      {/* ── Top chrome: chevron + Done chip. No line. ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 md:px-10 pt-5 pointer-events-none z-10">
        <button
          type="button"
          onClick={backToSetup}
          aria-label="Back to setup"
          className="pointer-events-auto flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer transition-opacity duration-200 hover:opacity-100"
          style={{
            width: 40,
            height: 40,
            color: '#331D01',
            opacity: 0.55,
          }}
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFavorited}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={favorited}
            className="flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer transition-opacity duration-200 hover:opacity-100"
            style={{
              width: 40,
              height: 40,
              color: favorited ? '#EC9247' : '#331D01',
              opacity: favorited ? 1 : 0.55,
            }}
          >
            <Heart size={18} fill={favorited ? '#EC9247' : 'none'} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={endSession}
            aria-label="End session"
            className="font-body uppercase transition-opacity duration-200 cursor-pointer hover:opacity-100"
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              background: 'transparent',
              border: '1px solid rgba(51,29,1,0.18)',
              color: '#331D01',
              fontSize: 11,
              letterSpacing: '0.18em',
              opacity: 0.75,
            }}
          >
            Done
          </button>
        </div>
      </div>

      {/* ── Audio error banner ── */}
      {audio.error && (
        <div
          role="alert"
          aria-live="assertive"
          className="absolute top-20 left-1/2 -translate-x-1/2 font-body z-20"
          style={{
            padding: '12px 18px',
            borderRadius: 999,
            background: '#FFFFFF',
            border: '1px solid rgba(155,58,31,0.45)',
            color: '#9B3A1F',
            fontSize: 13,
            maxWidth: 'min(92vw, 520px)',
            textAlign: 'center',
            lineHeight: 1.5,
            boxShadow: '0 6px 24px rgba(155,58,31,0.12)',
          }}
        >
          {audio.error}
        </div>
      )}

      {/* ── Toast (favorites, share, etc.) ── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed font-body z-[70]"
          style={{
            top: 72,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 18px',
            borderRadius: 999,
            background: 'rgba(51,29,1,0.92)',
            border: '1px solid rgba(236,146,71,0.45)',
            color: '#F0EDED',
            fontSize: 13,
            letterSpacing: '0.04em',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            animation: 'fade-in 0.2s ease',
          }}
        >
          {toast}
        </div>
      )}

      {/* ── The single focal orb ── */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6">
        <BreathingOrb
          getAnalyserData={audio.getAnalyserData}
          isPlaying={audio.isPlaying && !isPaused}
          beatHz={orbBeatHz}
          size={Math.min(440, typeof window !== 'undefined' ? Math.min(window.innerWidth * 0.78, window.innerHeight * 0.5) : 360)}
        />

        {/* Caption — one line, three pieces */}
        <div className="mt-8 flex flex-col items-center text-center" style={{ animation: 'fade-in 0.6s ease forwards' }}>
          <p
            className="font-hero uppercase"
            style={{
              fontSize: 13,
              letterSpacing: '0.32em',
              color: 'rgba(51,29,1,0.55)',
              marginBottom: 10,
            }}
          >
            {currentFreq?.name || ''}
            <span style={{ margin: '0 14px', color: '#EC9247' }}>·</span>
            {brainwaveInfo.label}
          </p>
          <p
            className="font-body"
            style={{
              fontSize: 14,
              color: 'rgba(51,29,1,0.5)',
              lineHeight: 1.65,
              maxWidth: 480,
            }}
          >
            {(currentFreq?.benefits[0] || brainwaveInfo.desc).toLowerCase()}.
          </p>
        </div>
      </div>

      {/* ── Bottom control strip ── */}
      <div className="w-full shrink-0 flex flex-col items-center pb-6 md:pb-8 px-6">
        {/* Time row + progress */}
        <div className="w-full max-w-md flex flex-col items-center gap-2 mb-5">
          <div className="w-full flex items-center justify-between font-body tabular-nums" style={{ fontSize: 12, color: 'rgba(51,29,1,0.55)' }}>
            <span
              aria-live="polite"
              aria-atomic="true"
              aria-label="Time remaining"
              style={{
                fontSize: 14,
                color: '#331D01',
                letterSpacing: '0.04em',
                transform: timerFlash ? 'scale(1.04)' : 'scale(1)',
                transition: 'transform 0.2s ease',
                display: 'inline-block',
              }}
            >
              {formatTime(remainingSec)}
            </span>
            <span style={{ fontSize: 11, letterSpacing: '0.06em', opacity: 0.6 }}>
              of {formatTime(totalSec)}
            </span>
          </div>
          <div
            className="w-full"
            style={{
              height: 2,
              backgroundColor: 'rgba(51,29,1,0.10)',
              borderRadius: 1,
              overflow: 'hidden',
            }}
            role="progressbar"
            aria-valuenow={Math.round(progressPct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                backgroundColor: '#EC9247',
                transition: 'width 1s linear',
                boxShadow: '0 0 12px rgba(236,146,71,0.45)',
              }}
            />
          </div>
        </div>

        {/* Transport row */}
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => { if (remainingSec > 300) setRemainingSec((r) => r - 300); }}
            aria-label="Decrease session by 5 minutes"
            disabled={remainingSec <= 300}
            className="flex items-center justify-center bg-transparent border-none cursor-pointer transition-opacity duration-200 hover:opacity-100 disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ width: 44, height: 44, color: '#331D01', opacity: 0.55 }}
          >
            <Minus size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={togglePause}
            aria-label={isPaused ? 'Resume session' : 'Stop session'}
            aria-pressed={!isPaused}
            className="flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-[1.05] active:scale-95"
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
              border: 'none',
              color: '#FFFFFF',
              boxShadow: '0 6px 28px rgba(236,146,71,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            {isPaused ? (
              <Play size={26} fill="white" aria-hidden="true" style={{ marginLeft: 3 }} />
            ) : (
              <Square size={22} fill="white" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setRemainingSec((r) => r + 300)}
            aria-label="Increase session by 5 minutes"
            className="flex items-center justify-center bg-transparent border-none cursor-pointer transition-opacity duration-200 hover:opacity-100"
            style={{ width: 44, height: 44, color: '#331D01', opacity: 0.55 }}
          >
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Volume row — slim and centered */}
        <div className="flex items-center gap-3 mt-5" style={{ width: 220 }}>
          <button
            type="button"
            onClick={() => {
              const newVol = config.volume > 0 ? 0 : 0.7;
              setConfig((c) => ({ ...c, volume: newVol }));
              audio.setVolume(newVol);
            }}
            aria-label={config.volume === 0 ? 'Unmute' : 'Mute'}
            aria-pressed={config.volume === 0}
            className="flex items-center justify-center bg-transparent border-none cursor-pointer transition-opacity duration-200 hover:opacity-100"
            style={{ width: 32, height: 32, color: '#331D01', opacity: 0.55 }}
          >
            {config.volume === 0 ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
          </button>
          <div className="flex-1">
            <Slider
              value={[config.volume * 100]}
              min={0}
              max={100}
              step={1}
              aria-label="Volume"
              onValueChange={([v]) => {
                const vol = v / 100;
                setConfig((c) => ({ ...c, volume: vol }));
                audio.setVolume(vol);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
