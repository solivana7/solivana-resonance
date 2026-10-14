import { useState, useMemo, useCallback, useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Music,
  Waves,
  Globe,
  Zap,
  Palette,
  Play,
  Headphones,
  Clock,
  Brain,
  Heart,
  X,
  ChevronRight,
  Star,
} from 'lucide-react';
import type { Frequency, FrequencyCategory, BrainwaveState } from '@/data/frequencies';
import {
  allFrequencies,
  frequencyGroups,
} from '@/data/frequencies';
import { useAudioEngine } from '@/hooks/useAudioEngine';

/* ─────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────── */

const GENTLE_OUT = [0.22, 1, 0.4, 1] as [number, number, number, number];

const CATEGORY_TABS: { id: FrequencyCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: null },
  { id: 'solfeggio', label: 'Solfeggio', icon: <Music size={18} /> },
  { id: 'binaural', label: 'Binaural Beats', icon: <Waves size={18} /> },
  { id: 'schumann', label: 'Schumann', icon: <Globe size={18} /> },
  { id: 'isochronic', label: 'Isochronic', icon: <Zap size={18} /> },
  { id: 'noise', label: 'Color Noise', icon: <Palette size={18} /> },
];

const BRAINWAVE_FILTERS: { label: string; value: BrainwaveState }[] = [
  { label: 'Delta', value: 'delta' },
  { label: 'Theta', value: 'theta' },
  { label: 'Alpha', value: 'alpha' },
  { label: 'Beta', value: 'beta' },
  { label: 'Gamma', value: 'gamma' },
];

const BENEFIT_FILTERS = ['Sleep', 'Focus', 'Relaxation', 'Healing', 'Meditation'];

const CATEGORY_DESCRIPTIONS: Record<FrequencyCategory, string> = {
  solfeggio:
    'A six-tone scale used in early Gregorian chant and revived in the 1970s. Each tone has traditional uses as a backdrop for contemplative listening practices.',
  binaural:
    'Two tones of slightly different frequencies delivered to each ear. The brain perceives a third tone \u2014 the binaural beat \u2014 and entrains to its frequency.',
  schumann:
    "The Earth\u2019s natural electromagnetic resonance frequency, discovered by Winfried Otto Schumann in 1952.",
  isochronic:
    'Single tones that turn on and off at regular intervals. The most effective form of audio entrainment \u2014 no headphones required.',
  noise:
    'Broad-spectrum sound with energy distributed across frequencies. Each color has a unique spectral signature for different listening uses.',
};

const FREQUENCY_RANGES: Record<FrequencyCategory, string[]> = {
  solfeggio: ['All', 'Sub-Bass', 'Bass', 'Mid', 'High'],
  binaural: ['All', 'Delta', 'Theta', 'Alpha', 'Beta', 'Gamma'],
  schumann: ['All', 'Fundamental', 'Harmonics'],
  isochronic: ['All', 'Delta', 'Theta', 'Alpha', 'Beta', 'Gamma'],
  noise: ['All', 'White', 'Pink', 'Brown', 'Violet', 'Grey', 'Blue'],
};

const BRAINWAVE_LABELS: Record<string, string> = {
  delta: 'Deep Sleep',
  theta: 'Meditation',
  alpha: 'Relaxation',
  beta: 'Focus',
  gamma: 'Cognition',
};

/* ─────────────────────────────────────────────
   Helper Functions
   ───────────────────────────────────────────── */

function getFrequencyRangeLabel(f: Frequency): string {
  if (f.category === 'solfeggio') {
    if (f.hz <= 285) return 'Sub-Bass';
    if (f.hz <= 417) return 'Bass';
    if (f.hz <= 639) return 'Mid';
    return 'High';
  }
  if (f.category === 'schumann') {
    return f.hz <= 7.83 ? 'Fundamental' : 'Harmonics';
  }
  if (f.category === 'noise') {
    return f.name.split(' ')[0];
  }
  return f.brainwaveState ?? '';
}

function categoryToDisplay(cat: string): string {
  switch (cat) {
    case 'solfeggio': return 'Solfeggio';
    case 'binaural': return 'Binaural Beats';
    case 'schumann': return 'Schumann Resonance';
    case 'isochronic': return 'Isochronic Tones';
    case 'noise': return 'Color Noise';
    default: return cat;
  }
}

/* ─────────────────────────────────────────────
   Main Library Component
   ───────────────────────────────────────────── */

export default function Library() {
  const [activeTab, setActiveTab] = useState<FrequencyCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBrainwaveFilters, setActiveBrainwaveFilters] = useState<string[]>([]);
  const [activeBenefitFilters, setActiveBenefitFilters] = useState<string[]>([]);
  const [selectedFrequency, setSelectedFrequency] = useState<Frequency | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const audioEngine = useAudioEngine();

  /* ── Filtering Logic ── */
  const filteredFrequencies = useMemo(() => {
    let result = [...allFrequencies];

    // Tab filter
    if (activeTab !== 'all') {
      result = result.filter((f) => f.category === activeTab);
    }

    // Search filter (name, hz, description, benefits)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.hz.toString().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.benefits.some((b) => b.toLowerCase().includes(q)),
      );
    }

    // Brainwave state filter
    if (activeBrainwaveFilters.length > 0) {
      result = result.filter((f) =>
        activeBrainwaveFilters.some(
          (filter) => f.brainwaveState === filter || getFrequencyRangeLabel(f).toLowerCase() === filter.toLowerCase(),
        ),
      );
    }

    // Benefit filter
    if (activeBenefitFilters.length > 0) {
      result = result.filter((f) =>
        activeBenefitFilters.some((filter) =>
          f.benefits.some((b) => b.toLowerCase().includes(filter.toLowerCase())),
        ),
      );
    }

    return result;
  }, [activeTab, searchQuery, activeBrainwaveFilters, activeBenefitFilters]);

  /* ── Handlers ── */
  const toggleBrainwaveFilter = useCallback((value: string) => {
    setActiveBrainwaveFilters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }, []);

  const toggleBenefitFilter = useCallback((value: string) => {
    setActiveBenefitFilters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setActiveBrainwaveFilters([]);
    setActiveBenefitFilters([]);
  }, []);

  const handlePlayFrequency = useCallback(
    (freq: Frequency) => {
      switch (freq.category) {
        case 'solfeggio':
          audioEngine.playSolfeggio(freq.hz);
          break;
        case 'binaural':
          audioEngine.playBinaural(200, freq.hz);
          break;
        case 'schumann':
          audioEngine.playSchumann(freq.hz);
          break;
        case 'isochronic':
          audioEngine.playIsochronic(200, freq.hz);
          break;
        case 'noise': {
          const noiseType = freq.name.split(' ')[0].toLowerCase() as 'white' | 'pink' | 'brown' | 'violet' | 'grey' | 'blue';
          audioEngine.playNoise(noiseType);
          break;
        }
      }
    },
    [audioEngine],
  );

  const activeGroup = frequencyGroups.find((g) => g.id === activeTab);

  /* ── Counts per tab ── */
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allFrequencies.length };
    for (const cat of ['solfeggio', 'binaural', 'schumann', 'isochronic', 'noise'] as const) {
      counts[cat] = allFrequencies.filter((f) => f.category === cat).length;
    }
    return counts;
  }, []);

  return (
    <div className="w-full">
      {/* ═══════════════ Section 1: Page Header ═══════════════ */}
      <section
        className="relative w-full px-6 md:px-12 lg:px-20"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F0EDED 50%, #FFF8F0 100%)',
          paddingTop: 120,
          paddingBottom: 80,
        }}
      >
        <div className="mx-auto" style={{ maxWidth: 1280 }}>
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: GENTLE_OUT }}
          >
            <span
              className="font-body uppercase"
              style={{
                fontSize: 12,
                letterSpacing: '0.08em',
                color: 'rgba(51,29,1,0.4)',
              }}
            >
              <Link to="/" className="no-underline hover:underline" style={{ color: 'rgba(51,29,1,0.4)' }}>
                Home
              </Link>
              {' / '}
              <span style={{ color: 'rgba(51,29,1,0.6)' }}>Library</span>
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="clip-hidden font-hero uppercase"
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ duration: 0.8, ease: GENTLE_OUT, delay: 0.1 }}
            style={{
              fontSize: 48,
              fontWeight: 400,
              letterSpacing: '-0.01em',
              color: '#331D01',
              lineHeight: 1.1,
              marginTop: 16,
            }}
          >
            FREQUENCY LIBRARY
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="font-body"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: GENTLE_OUT, delay: 0.3 }}
            style={{
              fontSize: 16,
              fontWeight: 300,
              color: 'rgba(51,29,1,0.6)',
              maxWidth: 560,
              marginTop: 16,
              lineHeight: 1.7,
            }}
          >
            Explore our complete collection of precise sound frequencies. Each tone is
            documented and generated to the listed Hz value in your browser.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            className="relative w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: GENTLE_OUT, delay: 0.4 }}
            style={{ marginTop: 32, maxWidth: 720 }}
          >
            <Search
              size={20}
              style={{ color: '#331D01', position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search frequencies, benefits, or Hz values..."
              className="w-full font-body outline-none transition-all duration-200 focus:border-[#EC9247]"
              style={{
                height: 48,
                padding: '12px 16px 12px 48px',
                fontSize: 14,
                fontWeight: 300,
                background: '#FFF8F0',
                border: '1px solid rgba(51,29,1,0.12)',
                borderRadius: 8,
                color: '#331D01',
                letterSpacing: '0.01em',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer"
              >
                <X size={16} style={{ color: 'rgba(51,29,1,0.4)' }} />
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ Section 2: Tab Bar ═══════════════ */}
      <motion.section
        className="sticky bg-white w-full"
        style={{
          top: 72,
          zIndex: 40,
          borderBottom: '1px solid rgba(51,29,1,0.08)',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: GENTLE_OUT, delay: 0.3 }}
      >
        <div className="mx-auto flex items-center px-6 md:px-12 lg:px-20" style={{ maxWidth: 1280 }}>
          <div className="flex items-center overflow-x-auto scrollbar-hide" style={{ gap: 0 }}>
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={isActive}
                  aria-label={`Filter to ${tab.label} (${tabCounts[tab.id]})`}
                  className="relative flex items-center gap-2 bg-transparent border-none cursor-pointer whitespace-nowrap transition-colors duration-200 font-body uppercase hover:text-brown focus-visible:text-brown"
                  style={{
                    padding: '20px 24px',
                    fontSize: 13,
                    fontWeight: 400,
                    letterSpacing: '0.08em',
                    color: isActive ? '#331D01' : 'rgba(51,29,1,0.4)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'rgba(51,29,1,0.7)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'rgba(51,29,1,0.4)';
                  }}
                >
                  {tab.icon}
                  {tab.label}
                  <span
                    className="font-body"
                    style={{
                      fontSize: 11,
                      color: isActive ? '#EC9247' : 'rgba(51,29,1,0.3)',
                      marginLeft: 4,
                    }}
                  >
                    ({tabCounts[tab.id]})
                  </span>
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0"
                      layoutId="activeTabIndicator"
                      style={{
                        height: 2,
                        background: '#EC9247',
                      }}
                      transition={{ duration: 0.3, ease: GENTLE_OUT }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ═══════════════ Section 3: Sidebar + Frequency Grid ═══════════════ */}
      <section
        className="w-full px-6 md:px-12 lg:px-20"
        style={{
          background: '#F0EDED',
          paddingTop: 48,
          paddingBottom: 80,
        }}
      >
        <div className="mx-auto" style={{ maxWidth: 1280 }}>
          {/* Filter Pills Row */}
          <motion.div
            className="flex flex-wrap items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: GENTLE_OUT, delay: 0.5 }}
            style={{ marginBottom: 32 }}
          >
            {/* Brainwave filters */}
            {BRAINWAVE_FILTERS.map((filter) => {
              const isActive = activeBrainwaveFilters.includes(filter.value);
              return (
                <button
                  key={filter.value}
                  onClick={() => toggleBrainwaveFilter(filter.value)}
                  className="font-body uppercase border-none cursor-pointer transition-all duration-200"
                  style={{
                    padding: '6px 14px',
                    fontSize: 11,
                    fontWeight: 400,
                    letterSpacing: '0.08em',
                    borderRadius: 4,
                    background: isActive ? '#EC9247' : '#F0EDED',
                    color: isActive ? '#FFFFFF' : '#EC9247',
                  }}
                >
                  {filter.label}
                </button>
              );
            })}

            {/* Divider */}
            <div
              style={{
                width: 1,
                height: 20,
                background: 'rgba(51,29,1,0.12)',
                margin: '0 8px',
              }}
            />

            {/* Benefit filters */}
            {BENEFIT_FILTERS.map((filter) => {
              const isActive = activeBenefitFilters.includes(filter);
              return (
                <button
                  key={filter}
                  onClick={() => toggleBenefitFilter(filter)}
                  className="font-body uppercase border-none cursor-pointer transition-all duration-200"
                  style={{
                    padding: '6px 14px',
                    fontSize: 11,
                    fontWeight: 400,
                    letterSpacing: '0.08em',
                    borderRadius: 4,
                    background: isActive ? '#EC9247' : '#F0EDED',
                    color: isActive ? '#FFFFFF' : '#EC9247',
                  }}
                >
                  {filter}
                </button>
              );
            })}

            {/* Clear Filters */}
            {(activeBrainwaveFilters.length > 0 || activeBenefitFilters.length > 0 || searchQuery) && (
              <button
                onClick={clearAllFilters}
                className="font-body uppercase bg-transparent border-none cursor-pointer transition-colors duration-200 hover:text-sage-green"
                style={{
                  padding: '6px 12px',
                  fontSize: 11,
                  fontWeight: 400,
                  letterSpacing: '0.08em',
                  color: 'rgba(51,29,1,0.5)',
                  marginLeft: 8,
                }}
              >
                Clear all
              </button>
            )}
          </motion.div>

          {/* Two-Column Layout */}
          <div className="flex gap-12 flex-col lg:flex-row">
            {/* ── Left Sidebar ── */}
            <AnimatePresence mode="wait">
              {activeTab !== 'all' && activeGroup && (
                <motion.aside
                  key={activeTab}
                  className="hidden lg:block flex-shrink-0"
                  style={{ width: 280, position: 'sticky', top: 160, alignSelf: 'flex-start' }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.6, ease: GENTLE_OUT }}
                >
                  <h3
                    className="font-hero uppercase"
                    style={{
                      fontSize: 24,
                      fontWeight: 400,
                      letterSpacing: '0.02em',
                      color: '#331D01',
                      lineHeight: 1.2,
                    }}
                  >
                    {activeGroup.name.toUpperCase()}
                  </h3>
                  <p
                    className="font-body"
                    style={{
                      fontSize: 14,
                      fontWeight: 300,
                      color: 'rgba(51,29,1,0.6)',
                      marginTop: 12,
                      lineHeight: 1.7,
                    }}
                  >
                    {CATEGORY_DESCRIPTIONS[activeTab as FrequencyCategory]}
                  </p>

                  {/* Category-specific range filters */}
                  <div className="flex flex-wrap gap-2" style={{ marginTop: 24 }}>
                    {FREQUENCY_RANGES[activeTab as FrequencyCategory]?.map((range, i) => {
                      const isActive = i === 0; // "All" is default active
                      return (
                        <motion.span
                          key={range}
                          className="font-body uppercase"
                          style={{
                            padding: '6px 12px',
                            fontSize: 11,
                            fontWeight: 400,
                            letterSpacing: '0.08em',
                            borderRadius: 4,
                            background: isActive ? '#EC9247' : '#F0EDED',
                            color: isActive ? '#FFFFFF' : '#EC9247',
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.4, delay: i * 0.05 }}
                        >
                          {range}
                        </motion.span>
                      );
                    })}
                  </div>

                  {/* Tag Badge */}
                  <div
                    className="font-body uppercase"
                    style={{
                      marginTop: 24,
                      padding: '6px 12px',
                      fontSize: 11,
                      fontWeight: 400,
                      letterSpacing: '0.08em',
                      borderRadius: 4,
                      background: '#F0EDED',
                      color: '#EC9247',
                      display: 'inline-block',
                    }}
                  >
                    {activeGroup.tag}
                  </div>

                  {/* Hz range badge */}
                  <div
                    className="font-body"
                    style={{
                      marginTop: 12,
                      fontSize: 12,
                      fontWeight: 400,
                      color: 'rgba(51,29,1,0.4)',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {activeGroup.frequencyBadge}
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* ── Right: Frequency Grid ── */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {filteredFrequencies.length === 0 ? (
                  /* Empty State */
                  <motion.div
                    key="empty"
                    className="flex flex-col items-center justify-center text-center"
                    style={{ padding: '80px 24px' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Search size={48} style={{ color: 'rgba(51,29,1,0.15)', marginBottom: 16 }} />
                    <h3
                      className="font-hero uppercase"
                      style={{
                        fontSize: 20,
                        fontWeight: 400,
                        color: '#331D01',
                        letterSpacing: '0.02em',
                      }}
                    >
                      No frequencies found
                    </h3>
                    <p
                      className="font-body"
                      style={{
                        fontSize: 14,
                        fontWeight: 300,
                        color: 'rgba(51,29,1,0.5)',
                        marginTop: 8,
                        maxWidth: 360,
                      }}
                    >
                      Try adjusting your search terms or filters to discover more frequencies.
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="font-body uppercase border-none cursor-pointer transition-all duration-200"
                      style={{
                        marginTop: 20,
                        padding: '10px 24px',
                        fontSize: 12,
                        fontWeight: 500,
                        letterSpacing: '0.12em',
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
                        color: '#FFFFFF',
                      }}
                    >
                      Clear Filters
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`grid-${activeTab}`}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                    style={{ gap: 24 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {filteredFrequencies.map((freq, index) => (
                      <FrequencyCard
                        key={freq.id}
                        frequency={freq}
                        index={index}
                        isFavorite={favorites.has(freq.id)}
                        onToggleFavorite={() => toggleFavorite(freq.id)}
                        onPlay={() => handlePlayFrequency(freq)}
                        onSelect={() => setSelectedFrequency(freq)}
                        isPlaying={!!(audioEngine.isPlaying && audioEngine.currentFrequency?.includes(freq.name))}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ Section 4: CTA Banner ═══════════════ */}
      <section
        className="w-full relative overflow-hidden px-6 md:px-12 lg:px-20 py-12 md:py-16 lg:py-20"
        style={{
          background: '#331D01',
        }}
      >
        {/* Subtle radial gradient pulse background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(236,146,71,0.15) 0%, transparent 70%)',
          }}
        />
        <div className="mx-auto text-center relative" style={{ maxWidth: 1280 }}>
          <motion.h2
            className="font-hero uppercase"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: GENTLE_OUT }}
            style={{
              fontSize: 40,
              fontWeight: 400,
              color: '#F0EDED',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            Ready to Begin?
          </motion.h2>
          <motion.p
            className="font-body"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: GENTLE_OUT, delay: 0.2 }}
            style={{
              fontSize: 16,
              fontWeight: 300,
              color: 'rgba(240,237,237,0.6)',
              maxWidth: 480,
              margin: '20px auto 0',
              lineHeight: 1.7,
            }}
          >
            Choose a frequency from the library above and launch a personalized listening session
            with our real-time audio engine.
          </motion.p>
          <motion.div
            className="flex items-center justify-center gap-6 flex-wrap"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, ease: GENTLE_OUT, delay: 0.4 }}
            style={{ marginTop: 32 }}
          >
            <Link
              to="/player"
              className="inline-flex items-center justify-center font-body uppercase text-white no-underline transition-all duration-200 hover:bg-white/[0.14]"
              style={{
                padding: '16px 40px',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.12em',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(240,237,237,0.15)',
              }}
            >
              Start a Session
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ Frequency Detail Modal ═══════════════ */}
      <AnimatePresence>
        {selectedFrequency && (
          <FrequencyDetailModal
            frequency={selectedFrequency}
            onClose={() => setSelectedFrequency(null)}
            isFavorite={favorites.has(selectedFrequency.id)}
            onToggleFavorite={() => toggleFavorite(selectedFrequency.id)}
            onPlay={() => handlePlayFrequency(selectedFrequency)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Frequency Card Component
   ═══════════════════════════════════════════════ */

interface FrequencyCardProps {
  frequency: Frequency;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPlay: () => void;
  onSelect: () => void;
  isPlaying: boolean;
}

function FrequencyCard({
  frequency,
  index,
  isFavorite,
  onToggleFavorite,
  onPlay,
  onSelect,
  isPlaying,
}: FrequencyCardProps) {
  const brainwaveLabel = frequency.brainwaveState
    ? BRAINWAVE_LABELS[frequency.brainwaveState]
    : null;

  const headphonesRequired =
    frequency.category === 'binaural' ? 'Required' : frequency.category === 'noise' ? 'Optional' : 'Optional';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.7,
        ease: GENTLE_OUT,
        delay: index * 0.08,
      }}
      whileHover={{
        y: -4,
        boxShadow: '0 8px 24px rgba(51,29,1,0.08)',
      }}
      onClick={onSelect}
      className="relative cursor-pointer flex flex-col"
      style={{
        background: '#FFF8F0',
        borderRadius: 8,
        padding: 24,
        boxShadow: '0 2px 8px rgba(51,29,1,0.04)',
        border: '1px solid transparent',
        transition: 'border-color 0.3s',
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.borderColor = 'rgba(236,146,71,0.3)';
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      {/* Hz Badge (top-right) */}
      <div
        className="absolute font-hero"
        style={{
          top: 16,
          right: 20,
          fontSize: 32,
          fontWeight: 400,
          color: '#EC9247',
          opacity: 0.3,
          lineHeight: 1,
        }}
      >
        {frequency.hz > 0 ? `${frequency.hz}Hz` : ''}
      </div>

      {/* Category Tag */}
      <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
        <span
          className="font-body uppercase"
          style={{
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: '0.08em',
            borderRadius: 4,
            background: '#F0EDED',
            color: '#EC9247',
          }}
        >
          {getFrequencyRangeLabel(frequency)}
        </span>
        {brainwaveLabel && (
          <span
            className="font-body uppercase"
            style={{
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: '0.08em',
              borderRadius: 4,
              background: 'rgba(236,146,71,0.08)',
              color: '#EC9247',
            }}
          >
            {brainwaveLabel}
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        className="font-hero uppercase"
        style={{
          fontSize: 20,
          fontWeight: 400,
          color: '#331D01',
          letterSpacing: '0.02em',
          lineHeight: 1.2,
          marginTop: 4,
        }}
      >
        {frequency.name}
      </h3>

      {/* Description */}
      <p
        className="font-body"
        style={{
          fontSize: 14,
          fontWeight: 300,
          color: 'rgba(51,29,1,0.6)',
          marginTop: 8,
          lineHeight: 1.7,
          flex: 1,
        }}
      >
        {frequency.description}
      </p>

      {/* Benefits */}
      <div className="flex flex-wrap gap-1" style={{ marginTop: 12 }}>
        {frequency.benefits.slice(0, 4).map((benefit) => (
          <span
            key={benefit}
            className="font-body"
            style={{
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 400,
              color: 'rgba(51,29,1,0.4)',
              background: 'rgba(51,29,1,0.04)',
              borderRadius: 4,
              letterSpacing: '0.01em',
            }}
          >
            {benefit}
          </span>
        ))}
      </div>

      {/* Properties Row */}
      <div
        className="flex items-center gap-4 flex-wrap"
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid rgba(51,29,1,0.06)',
        }}
      >
        <div className="flex items-center gap-1">
          <Clock size={12} style={{ color: 'rgba(51,29,1,0.3)' }} />
          <span
            className="font-body uppercase"
            style={{ fontSize: 11, color: 'rgba(51,29,1,0.4)', letterSpacing: '0.02em' }}
          >
            10&ndash;60 min
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Headphones size={12} style={{ color: 'rgba(51,29,1,0.3)' }} />
          <span
            className="font-body uppercase"
            style={{ fontSize: 11, color: 'rgba(51,29,1,0.4)', letterSpacing: '0.02em' }}
          >
            {headphonesRequired}
          </span>
        </div>
        {frequency.brainwaveState && (
          <div className="flex items-center gap-1">
            <Brain size={12} style={{ color: 'rgba(51,29,1,0.3)' }} />
            <span
              className="font-body uppercase"
              style={{ fontSize: 11, color: 'rgba(51,29,1,0.4)', letterSpacing: '0.02em' }}
            >
              {frequency.brainwaveState}
            </span>
          </div>
        )}
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
        <button
          className="bg-transparent border-none cursor-pointer flex items-center gap-1 font-body transition-colors duration-200"
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: '#EC9247',
            padding: 0,
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          Learn More
          <ChevronRight size={14} />
        </button>
        <div className="flex items-center gap-2">
          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors duration-200"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              size={16}
              style={{
                color: isFavorite ? '#EC9247' : 'rgba(51,29,1,0.25)',
                fill: isFavorite ? '#EC9247' : 'transparent',
                transition: 'all 0.2s',
              }}
            />
          </button>
          {/* Play button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="flex items-center justify-center font-body uppercase text-white border-none cursor-pointer transition-all duration-200"
            style={{
              padding: '8px 20px',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.12em',
              borderRadius: 8,
              background: isPlaying
                ? 'linear-gradient(135deg, #D67A2F, #5A9080)'
                : 'linear-gradient(135deg, #EC9247, #D67A2F)',
              gap: 6,
            }}
          >
            <Play size={12} />
            {isPlaying ? 'Playing' : 'Play'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Frequency Detail Modal Component
   ═══════════════════════════════════════════════ */

interface FrequencyDetailModalProps {
  frequency: Frequency;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPlay: () => void;
}

function FrequencyDetailModal({
  frequency,
  onClose,
  isFavorite,
  onToggleFavorite,
  onPlay,
}: FrequencyDetailModalProps) {
  const brainwaveLabel = frequency.brainwaveState
    ? BRAINWAVE_LABELS[frequency.brainwaveState]
    : null;
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background: 'rgba(51, 29, 1, 0.6)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Panel */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative h-full overflow-y-auto"
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#FFF8F0',
        }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.5, ease: GENTLE_OUT }}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close frequency details"
          className="absolute top-6 right-6 z-10 flex items-center justify-center border-none cursor-pointer transition-colors duration-200"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(51,29,1,0.06)',
          }}
        >
          <X size={18} aria-hidden="true" style={{ color: '#331D01' }} />
        </button>

        {/* Panel Content */}
        <div style={{ padding: '60px 40px 40px' }}>
          {/* Category Tag */}
          <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
            <span
              className="font-body uppercase"
              style={{
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: '0.08em',
                borderRadius: 4,
                background: '#F0EDED',
                color: '#EC9247',
              }}
            >
              {categoryToDisplay(frequency.category)}
            </span>
            {brainwaveLabel && (
              <span
                className="font-body uppercase"
                style={{
                  padding: '6px 12px',
                  fontSize: 11,
                  fontWeight: 400,
                  letterSpacing: '0.08em',
                  borderRadius: 4,
                  background: 'rgba(236,146,71,0.08)',
                  color: '#EC9247',
                }}
              >
                {brainwaveLabel}
              </span>
            )}
          </div>

          {/* Name (removed the decorative ghost numeral — it collided with the heading) */}
          <h2
            id={titleId}
            className="font-hero uppercase"
            style={{
              fontSize: 36,
              fontWeight: 400,
              color: '#331D01',
              letterSpacing: '-0.01em',
              lineHeight: 1.05,
              marginTop: 8,
            }}
          >
            {frequency.name}
          </h2>

          {/* Description */}
          <p
            className="font-body"
            style={{
              fontSize: 16,
              fontWeight: 300,
              color: 'rgba(51,29,1,0.6)',
              marginTop: 16,
              lineHeight: 1.7,
            }}
          >
            {frequency.description}
          </p>

          {/* Benefits Section */}
          <div style={{ marginTop: 32 }}>
            <h4
              className="font-hero uppercase"
              style={{
                fontSize: 12,
                fontWeight: 400,
                letterSpacing: '0.15em',
                color: '#331D01',
                marginBottom: 12,
              }}
            >
              Benefits
            </h4>
            <div className="flex flex-col gap-2">
              {frequency.benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <Star size={14} style={{ color: '#EC9247', opacity: 0.6, flexShrink: 0 }} />
                  <span
                    className="font-body"
                    style={{
                      fontSize: 14,
                      fontWeight: 300,
                      color: 'rgba(51,29,1,0.6)',
                    }}
                  >
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Scientific Background */}
          <div style={{ marginTop: 32 }}>
            <h4
              className="font-hero uppercase"
              style={{
                fontSize: 12,
                fontWeight: 400,
                letterSpacing: '0.15em',
                color: '#331D01',
                marginBottom: 12,
              }}
            >
              Scientific Background
            </h4>
            <p
              className="font-body"
              style={{
                fontSize: 14,
                fontWeight: 300,
                color: 'rgba(51,29,1,0.6)',
                lineHeight: 1.7,
              }}
            >
              {getScientificBackground(frequency)}
            </p>
          </div>

          {/* Properties */}
          <div
            className="flex items-center gap-6 flex-wrap"
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid rgba(51,29,1,0.08)',
            }}
          >
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: '#EC9247', opacity: 0.5 }} />
              <span className="font-body" style={{ fontSize: 13, color: 'rgba(51,29,1,0.6)' }}>
                Duration: 10&ndash;60 minutes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones size={14} style={{ color: '#EC9247', opacity: 0.5 }} />
              <span className="font-body" style={{ fontSize: 13, color: 'rgba(51,29,1,0.6)' }}>
                Headphones: {frequency.category === 'binaural' ? 'Required' : 'Optional'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3" style={{ marginTop: 32 }}>
            <Link
              to={`/player?freq=${frequency.id}`}
              className="flex items-center justify-center gap-2 font-body uppercase text-white no-underline transition-all duration-200 hover:scale-[1.02] hover:shadow-sage-glow active:scale-[0.98]"
              style={{
                padding: '16px 32px',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.12em',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
                width: '100%',
              }}
              onClick={onPlay}
            >
              <Play size={14} />
              Start Session
            </Link>
            <button
              onClick={onToggleFavorite}
              className="flex items-center justify-center gap-2 font-body uppercase border-none cursor-pointer transition-all duration-200"
              style={{
                padding: '14px 32px',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.12em',
                borderRadius: 8,
                background: isFavorite ? '#F0EDED' : 'transparent',
                border: isFavorite ? '1px solid #EC9247' : '1px solid rgba(51,29,1,0.15)',
                color: isFavorite ? '#EC9247' : '#331D01',
                width: '100%',
              }}
            >
              <Heart
                size={14}
                style={{
                  fill: isFavorite ? '#EC9247' : 'transparent',
                }}
              />
              {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   Scientific Background Helper
   ═══════════════════════════════════════════════ */

function getScientificBackground(frequency: Frequency): string {
  switch (frequency.category) {
    case 'solfeggio':
      return `The Solfeggio frequencies are a six-tone scale used in early Gregorian chant and revived in the 1970s. ${frequency.name} sits within that scale. Reception of these tones in modern wellness contexts is cultural and contemplative rather than clinical, and individual experiences vary widely.`;
    case 'binaural':
      return `Binaural beats were described in 1839 by Heinrich Wilhelm Dove. When two tones at slightly different frequencies are presented separately to each ear, listeners perceive a third "beat" at the difference frequency. Research on whether this perceived beat influences brainwave activity has produced mixed results, with effects varying by listener, headphone use, and session length.`;
    case 'schumann':
      return `The Schumann resonances are a set of low-frequency peaks in the Earth\u2019s electromagnetic spectrum, described by physicist Winfried Otto Schumann in 1952. The fundamental mode sits near 7.83 Hz. They are an environmental phenomenon; the audio version played here is a sine-wave reconstruction of the frequency for listening purposes.`;
    case 'isochronic':
      return `Isochronic tones are evenly spaced pulses of a single tone. Unlike binaural beats, they do not require headphones \u2014 the pulses can be heard through speakers. Research on their effects on attention and brainwave patterns has produced mixed results; experience varies by listener.`;
    case 'noise':
      return `Color noise generators produce broadband sound with specific spectral characteristics. ${frequency.name} is commonly used as a backdrop for sound masking and quiet listening. Listener experience varies; some find specific noise colors more pleasant or useful than others for focus or sleep wind-down.`;
    default:
      return 'This frequency is generated as a sine wave in your browser. Listener experience varies; we make no medical claims about it.';
  }
}
