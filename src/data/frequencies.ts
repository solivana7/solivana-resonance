export type FrequencyCategory = 'solfeggio' | 'binaural' | 'schumann' | 'isochronic' | 'noise';
export type BrainwaveState = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export interface Frequency {
  id: string;
  name: string;
  hz: number;
  category: FrequencyCategory;
  description: string;
  benefits: string[];
  color: string;
  brainwaveState?: BrainwaveState;
}

export interface FrequencyGroup {
  id: FrequencyCategory;
  name: string;
  tag: string;
  frequencyBadge: string;
  description: string;
  frequencies: Frequency[];
}

// Copy guidance: every entry describes the tool, not a medical effect.
// Use "often chosen for", "common listening context", "traditional use" —
// never "heals", "repairs", "cures", "treats", "relieves", "boosts immune",
// "regenerates", "detoxifies". The audio is a sound source, nothing more.

export const solfeggioFrequencies: Frequency[] = [
  {
    id: 'solfeggio-174',
    name: '174 Hz',
    hz: 174,
    category: 'solfeggio',
    description: 'The lowest tone in the Solfeggio set. Often chosen as a grounding backdrop for quiet sessions.',
    benefits: ['Grounding listening', 'Quiet wind-down', 'Steady backdrop'],
    color: '#8B4513',
  },
  {
    id: 'solfeggio-285',
    name: '285 Hz',
    hz: 285,
    category: 'solfeggio',
    description: 'A lower tone in the Solfeggio set. Often paired with slow, restorative listening practices.',
    benefits: ['Restorative listening', 'Slow practice', 'Low-tone backdrop'],
    color: '#A0522D',
  },
  {
    id: 'solfeggio-396',
    name: '396 Hz',
    hz: 396,
    category: 'solfeggio',
    description: 'A Solfeggio tone traditionally associated with emotional release in contemplative practice.',
    benefits: ['Contemplative listening', 'Quiet reflection', 'Slow practice'],
    color: '#CD853F',
  },
  {
    id: 'solfeggio-417',
    name: '417 Hz',
    hz: 417,
    category: 'solfeggio',
    description: 'A Solfeggio tone traditionally used during practices oriented around change and intention-setting.',
    benefits: ['Intention-setting', 'Journaling backdrop', 'Reflective listening'],
    color: '#DAA520',
  },
  {
    id: 'solfeggio-528',
    name: '528 Hz',
    hz: 528,
    category: 'solfeggio',
    description: 'A widely shared Solfeggio tone associated with restorative listening practices. Common in calm-focus and meditation sessions.',
    benefits: ['Calm focus', 'Meditation backdrop', 'Quiet practice'],
    color: '#EC9247',
  },
  {
    id: 'solfeggio-639',
    name: '639 Hz',
    hz: 639,
    category: 'solfeggio',
    description: 'A Solfeggio tone traditionally chosen as a backdrop for journaling and contemplative practice.',
    benefits: ['Journaling backdrop', 'Quiet reflection', 'Contemplative listening'],
    color: '#5F9EA0',
  },
  {
    id: 'solfeggio-741',
    name: '741 Hz',
    hz: 741,
    category: 'solfeggio',
    description: 'A higher Solfeggio tone often chosen for clear-headed listening and creative work.',
    benefits: ['Clear-headed listening', 'Creative work backdrop', 'Reflective practice'],
    color: '#4682B4',
  },
  {
    id: 'solfeggio-852',
    name: '852 Hz',
    hz: 852,
    category: 'solfeggio',
    description: 'A high Solfeggio tone traditionally used as a backdrop for contemplative and meditative practice.',
    benefits: ['Meditative backdrop', 'Quiet contemplation', 'Stillness practice'],
    color: '#6A5ACD',
  },
  {
    id: 'solfeggio-963',
    name: '963 Hz',
    hz: 963,
    category: 'solfeggio',
    description: 'The highest tone in the Solfeggio set. Often chosen as a backdrop for stillness practice.',
    benefits: ['Stillness practice', 'Quiet listening', 'Open awareness'],
    color: '#8B7EC8',
  },
];

export const binauralFrequencies: Frequency[] = [
  // Delta (0.5-4Hz) — slow listening backdrop, sleep wind-down
  {
    id: 'binaural-delta-0.5',
    name: '0.5 Hz Delta',
    hz: 0.5,
    category: 'binaural',
    description: 'A very slow Delta-range binaural beat. Often used as a backdrop during pre-sleep wind-down.',
    benefits: ['Pre-sleep wind-down', 'Slow listening', 'Quiet backdrop'],
    color: '#EC9247',
    brainwaveState: 'delta',
  },
  {
    id: 'binaural-delta-1',
    name: '1.0 Hz Delta',
    hz: 1.0,
    category: 'binaural',
    description: 'A Delta-range binaural beat. Often paired with quiet restorative practice.',
    benefits: ['Quiet restorative practice', 'Slow listening', 'Background'],
    color: '#00B8E0',
    brainwaveState: 'delta',
  },
  {
    id: 'binaural-delta-2',
    name: '2.0 Hz Delta',
    hz: 2.0,
    category: 'binaural',
    description: 'A Delta-range binaural beat. Often chosen as a backdrop for slow evening sessions.',
    benefits: ['Evening wind-down', 'Slow listening', 'Quiet practice'],
    color: '#009EC8',
    brainwaveState: 'delta',
  },
  {
    id: 'binaural-delta-3',
    name: '3.0 Hz Delta',
    hz: 3.0,
    category: 'binaural',
    description: 'A Delta-range binaural beat. Often chosen as a slow, low backdrop for restorative listening.',
    benefits: ['Restorative listening', 'Slow practice', 'Deep calm'],
    color: '#0084B0',
    brainwaveState: 'delta',
  },
  // Theta (4-8Hz) — meditation, creative reflection
  {
    id: 'binaural-theta-4',
    name: '4.0 Hz Theta',
    hz: 4.0,
    category: 'binaural',
    description: 'A Theta-range binaural beat. Often used as a backdrop for meditation and creative reflection.',
    benefits: ['Meditation backdrop', 'Creative reflection', 'Quiet practice'],
    color: '#EC9247',
    brainwaveState: 'theta',
  },
  {
    id: 'binaural-theta-5',
    name: '5.0 Hz Theta',
    hz: 5.0,
    category: 'binaural',
    description: 'A Theta-range binaural beat. Often chosen as a backdrop for journaling and creative reflection.',
    benefits: ['Journaling backdrop', 'Creative reflection', 'Quiet listening'],
    color: '#E8C200',
    brainwaveState: 'theta',
  },
  {
    id: 'binaural-theta-6',
    name: '6.0 Hz Theta',
    hz: 6.0,
    category: 'binaural',
    description: 'A Theta-range binaural beat. Often chosen as a backdrop for visualization and study sessions.',
    benefits: ['Visualization backdrop', 'Study sessions', 'Quiet practice'],
    color: '#D4B000',
    brainwaveState: 'theta',
  },
  // Alpha (8-14Hz) — relaxed listening, flow backdrop
  {
    id: 'binaural-alpha-8',
    name: '8.0 Hz Alpha',
    hz: 8.0,
    category: 'binaural',
    description: 'An Alpha-range binaural beat. Often chosen as a backdrop for calm-focus sessions.',
    benefits: ['Calm focus backdrop', 'Relaxed listening', 'Quiet practice'],
    color: '#EC9247',
    brainwaveState: 'alpha',
  },
  {
    id: 'binaural-alpha-10',
    name: '10.0 Hz Alpha',
    hz: 10.0,
    category: 'binaural',
    description: 'An Alpha-range binaural beat. Often chosen as a backdrop for mindful work and present-moment listening.',
    benefits: ['Mindful work backdrop', 'Present-moment listening', 'Quiet practice'],
    color: '#EC9247',
    brainwaveState: 'alpha',
  },
  {
    id: 'binaural-alpha-12',
    name: '12.0 Hz Alpha',
    hz: 12.0,
    category: 'binaural',
    description: 'An upper-Alpha binaural beat. Often chosen as a backdrop for relaxed-but-alert listening.',
    benefits: ['Relaxed-but-alert listening', 'Balanced backdrop', 'Quiet practice'],
    color: '#00D16D',
    brainwaveState: 'alpha',
  },
  // Beta (14-30Hz) — focused-work backdrop
  {
    id: 'binaural-beta-15',
    name: '15 Hz Beta',
    hz: 15.0,
    category: 'binaural',
    description: 'A Beta-range binaural beat. Often chosen as a backdrop for focused work and study.',
    benefits: ['Focused-work backdrop', 'Study backdrop', 'Sustained attention'],
    color: '#FF6B35',
    brainwaveState: 'beta',
  },
  {
    id: 'binaural-beta-20',
    name: '20 Hz Beta',
    hz: 20.0,
    category: 'binaural',
    description: 'A Beta-range binaural beat. Often chosen as a backdrop for energetic focused work.',
    benefits: ['Energetic-focus backdrop', 'Sustained work', 'Daytime listening'],
    color: '#EC9247',
    brainwaveState: 'beta',
  },
  // Gamma (30-100Hz) — high-frequency listening
  {
    id: 'binaural-gamma-40',
    name: '40 Hz Gamma',
    hz: 40.0,
    category: 'binaural',
    description: 'A Gamma-range binaural beat. Often used as a backdrop for sharp, attentive listening sessions.',
    benefits: ['Attentive-listening backdrop', 'Engaged practice', 'Daytime backdrop'],
    color: '#EC9247',
    brainwaveState: 'gamma',
  },
];

export const schumannFrequencies: Frequency[] = [
  {
    id: 'schumann-7.83',
    name: '7.83 Hz',
    hz: 7.83,
    category: 'schumann',
    description: 'The fundamental Schumann resonance — the Earth’s ambient electromagnetic frequency. Commonly used as a steady, low backdrop for grounding practice.',
    benefits: ['Grounding backdrop', 'Steady tone', 'Quiet practice'],
    color: '#EC9247',
  },
  {
    id: 'schumann-14.3',
    name: '14.3 Hz',
    hz: 14.3,
    category: 'schumann',
    description: 'First Schumann harmonic. Often chosen as a backdrop for alert, focused listening.',
    benefits: ['Focused-listening backdrop', 'Alert practice', 'Daytime backdrop'],
    color: '#D67A2F',
  },
  {
    id: 'schumann-20.8',
    name: '20.8 Hz',
    hz: 20.8,
    category: 'schumann',
    description: 'Second Schumann harmonic. Often chosen as a backdrop for study and engaged work.',
    benefits: ['Study backdrop', 'Engaged work', 'Daytime listening'],
    color: '#568E7D',
  },
  {
    id: 'schumann-27.3',
    name: '27.3 Hz',
    hz: 27.3,
    category: 'schumann',
    description: 'Third Schumann harmonic. Often chosen as a backdrop for creative reflection.',
    benefits: ['Creative-reflection backdrop', 'Engaged listening', 'Daytime practice'],
    color: '#62A28F',
  },
  {
    id: 'schumann-33.8',
    name: '33.8 Hz',
    hz: 33.8,
    category: 'schumann',
    description: 'Fourth Schumann harmonic. Often chosen as a backdrop for energetic focused work.',
    benefits: ['Energetic-focus backdrop', 'Sustained work', 'Daytime listening'],
    color: '#6EB6A1',
  },
  {
    id: 'schumann-39',
    name: '39 Hz',
    hz: 39.0,
    category: 'schumann',
    description: 'Fifth Schumann harmonic. Often chosen as a backdrop for meditative or contemplative listening.',
    benefits: ['Meditative backdrop', 'Contemplative listening', 'Quiet practice'],
    color: '#7ACAB3',
  },
  {
    id: 'schumann-45',
    name: '45 Hz',
    hz: 45.0,
    category: 'schumann',
    description: 'Higher Schumann harmonic. Often chosen as a backdrop for engaged, attentive listening.',
    benefits: ['Attentive-listening backdrop', 'Engaged practice', 'Daytime backdrop'],
    color: '#86DEC5',
  },
  {
    id: 'schumann-60',
    name: '60 Hz',
    hz: 60.0,
    category: 'schumann',
    description: 'Upper-range Schumann harmonic. Often chosen as a backdrop for daytime, energetic listening.',
    benefits: ['Daytime backdrop', 'Energetic listening', 'Engaged practice'],
    color: '#92F2D7',
  },
];

export const isochronicFrequencies: Frequency[] = [
  // Delta (0.5-4Hz) — speakers OK, slow listening
  {
    id: 'isochronic-delta-0.5',
    name: '0.5 Hz Delta',
    hz: 0.5,
    category: 'isochronic',
    description: 'Slow Delta-range pulses. Often used as a backdrop during pre-sleep wind-down. Works through speakers.',
    benefits: ['Pre-sleep wind-down', 'Speaker-friendly', 'Slow listening'],
    color: '#EC9247',
    brainwaveState: 'delta',
  },
  {
    id: 'isochronic-delta-2',
    name: '2.0 Hz Delta',
    hz: 2.0,
    category: 'isochronic',
    description: 'Delta-range isochronic pulses. Often chosen as a slow backdrop for evening sessions. Works through speakers.',
    benefits: ['Evening backdrop', 'Speaker-friendly', 'Slow practice'],
    color: '#009EC8',
    brainwaveState: 'delta',
  },
  // Theta (4-8Hz) — meditation backdrop, speakers OK
  {
    id: 'isochronic-theta-5',
    name: '5.0 Hz Theta',
    hz: 5.0,
    category: 'isochronic',
    description: 'Theta-range isochronic pulses. Often chosen as a backdrop for meditation and creative reflection. Works through speakers.',
    benefits: ['Meditation backdrop', 'Creative reflection', 'Speaker-friendly'],
    color: '#EC9247',
    brainwaveState: 'theta',
  },
  {
    id: 'isochronic-theta-7',
    name: '7.0 Hz Theta',
    hz: 7.0,
    category: 'isochronic',
    description: 'Theta-range isochronic pulses near the Schumann fundamental. Often chosen as a backdrop for contemplative practice. Works through speakers.',
    benefits: ['Contemplative backdrop', 'Speaker-friendly', 'Quiet practice'],
    color: '#D4B000',
    brainwaveState: 'theta',
  },
  // Alpha (8-14Hz) — relaxed listening
  {
    id: 'isochronic-alpha-9',
    name: '9.0 Hz Alpha',
    hz: 9.0,
    category: 'isochronic',
    description: 'Alpha-range isochronic pulses. Often chosen as a backdrop for relaxed listening. Works through speakers.',
    benefits: ['Relaxed-listening backdrop', 'Speaker-friendly', 'Quiet practice'],
    color: '#EC9247',
    brainwaveState: 'alpha',
  },
  {
    id: 'isochronic-alpha-11',
    name: '11.0 Hz Alpha',
    hz: 11.0,
    category: 'isochronic',
    description: 'Alpha-range isochronic pulses. Often chosen as a backdrop for mindful, balanced listening. Works through speakers.',
    benefits: ['Mindful-listening backdrop', 'Balanced practice', 'Speaker-friendly'],
    color: '#00D16D',
    brainwaveState: 'alpha',
  },
  // Beta (14-30Hz) — focused work
  {
    id: 'isochronic-beta-15',
    name: '15 Hz Beta',
    hz: 15.0,
    category: 'isochronic',
    description: 'Beta-range isochronic pulses. Often chosen as a backdrop for focused work and study. Works through speakers.',
    benefits: ['Focused-work backdrop', 'Study backdrop', 'Speaker-friendly'],
    color: '#FF6B35',
    brainwaveState: 'beta',
  },
  {
    id: 'isochronic-beta-18',
    name: '18 Hz Beta',
    hz: 18.0,
    category: 'isochronic',
    description: 'Beta-range isochronic pulses. Often chosen as a backdrop for sustained, energetic work. Works through speakers.',
    benefits: ['Sustained-work backdrop', 'Energetic listening', 'Speaker-friendly'],
    color: '#EC9247',
    brainwaveState: 'beta',
  },
  {
    id: 'isochronic-beta-25',
    name: '25 Hz Beta',
    hz: 25.0,
    category: 'isochronic',
    description: 'Upper-Beta isochronic pulses. Often chosen as a backdrop for sharp, attentive work. Works through speakers.',
    benefits: ['Attentive-work backdrop', 'Engaged listening', 'Speaker-friendly'],
    color: '#D46000',
    brainwaveState: 'beta',
  },
  // Gamma (30-100Hz)
  {
    id: 'isochronic-gamma-35',
    name: '35 Hz Gamma',
    hz: 35.0,
    category: 'isochronic',
    description: 'Gamma-range isochronic pulses. Often chosen as a backdrop for engaged, attentive listening. Works through speakers.',
    benefits: ['Attentive-listening backdrop', 'Engaged practice', 'Speaker-friendly'],
    color: '#EC9247',
    brainwaveState: 'gamma',
  },
  {
    id: 'isochronic-gamma-50',
    name: '50 Hz Gamma',
    hz: 50.0,
    category: 'isochronic',
    description: 'Higher Gamma-range isochronic pulses. Often chosen as a backdrop for sharp, daytime listening. Works through speakers.',
    benefits: ['Daytime backdrop', 'Sharp listening', 'Speaker-friendly'],
    color: '#786455',
    brainwaveState: 'gamma',
  },
];

export const noiseTypes: Frequency[] = [
  {
    id: 'noise-white',
    name: 'White Noise',
    hz: 0,
    category: 'noise',
    description: 'Equal intensity across the audible spectrum. Often chosen as a backdrop for sound masking and study sessions.',
    benefits: ['Sound masking', 'Study backdrop', 'Steady backdrop'],
    color: '#E8E8E8',
  },
  {
    id: 'noise-pink',
    name: 'Pink Noise',
    hz: 0,
    category: 'noise',
    description: 'More energy in lower frequencies — a natural, balanced sound. Often chosen as a backdrop for evening wind-down.',
    benefits: ['Evening wind-down', 'Balanced backdrop', 'Quiet listening'],
    color: '#FFB6C1',
  },
  {
    id: 'noise-brown',
    name: 'Brown Noise',
    hz: 0,
    category: 'noise',
    description: 'A deep, warm rumble with strong low frequencies. Often chosen as a backdrop for focus and study.',
    benefits: ['Focus backdrop', 'Study backdrop', 'Warm low tones'],
    color: '#8B4513',
  },
  {
    id: 'noise-violet',
    name: 'Violet Noise',
    hz: 0,
    category: 'noise',
    description: 'More energy in higher frequencies. Often chosen as a backdrop for high-frequency sound masking.',
    benefits: ['High-frequency masking', 'Sharp backdrop', 'Alert listening'],
    color: '#9B59B6',
  },
  {
    id: 'noise-grey',
    name: 'Grey Noise',
    hz: 0,
    category: 'noise',
    description: 'Spectrally shaped for psychoacoustically equal loudness across hearing range. Often chosen as a pleasant, balanced backdrop.',
    benefits: ['Balanced backdrop', 'Pleasant masking', 'Quiet listening'],
    color: '#808080',
  },
  {
    id: 'noise-blue',
    name: 'Blue Noise',
    hz: 0,
    category: 'noise',
    description: 'More energy in higher frequencies than white noise — sharp and bright. Often chosen as a backdrop for sharp daytime listening.',
    benefits: ['Daytime backdrop', 'Sharp listening', 'Bright tones'],
    color: '#4169E1',
  },
];

export const frequencyGroups: FrequencyGroup[] = [
  {
    id: 'solfeggio',
    name: 'Solfeggio Frequencies',
    tag: 'TRADITIONAL SCALE',
    frequencyBadge: '174Hz – 963Hz',
    description: 'Nine tones from the Solfeggio scale revived in the 1970s. Each is commonly used as a backdrop for contemplative listening practices.',
    frequencies: solfeggioFrequencies,
  },
  {
    id: 'binaural',
    name: 'Binaural Beats',
    tag: 'TWO-TONE LISTENING',
    frequencyBadge: '0.5Hz – 100Hz',
    description: 'Two slightly different tones played in each ear, producing a perceived beat at the difference frequency. Best heard through headphones; commonly used as a backdrop for focus, meditation, and wind-down practice.',
    frequencies: binauralFrequencies,
  },
  {
    id: 'schumann',
    name: 'Schumann Resonance',
    tag: "EARTH’S AMBIENT FREQUENCY",
    frequencyBadge: '7.83Hz fundamental',
    description: "The Earth’s ambient electromagnetic frequency at 7.83 Hz, plus its harmonic overtones. Often chosen as a steady low backdrop for grounding practice.",
    frequencies: schumannFrequencies,
  },
  {
    id: 'isochronic',
    name: 'Isochronic Tones',
    tag: 'SINGLE-TONE PULSES',
    frequencyBadge: '0.1Hz – 50Hz',
    description: 'Evenly-spaced pulses of a single tone. Work through speakers — no headphones required. Commonly used as a backdrop for focus, meditation, and study.',
    frequencies: isochronicFrequencies,
  },
  {
    id: 'noise',
    name: 'Color Noise',
    tag: 'SPECTRAL SOUND',
    frequencyBadge: 'Full spectrum',
    description: 'White, pink, brown, violet, grey, and blue noise — each shaped for a different spectral profile. Commonly used as a backdrop for sound masking, focus, and quiet listening.',
    frequencies: noiseTypes,
  },
];

export const allFrequencies: Frequency[] = [
  ...solfeggioFrequencies,
  ...binauralFrequencies,
  ...schumannFrequencies,
  ...isochronicFrequencies,
  ...noiseTypes,
];

export function getFrequenciesByCategory(category: FrequencyCategory): Frequency[] {
  return allFrequencies.filter(f => f.category === category);
}

export function getFrequencyById(id: string): Frequency | undefined {
  return allFrequencies.find(f => f.id === id);
}

export function getFrequenciesByBrainwaveState(state: BrainwaveState): Frequency[] {
  return allFrequencies.filter(f => f.brainwaveState === state);
}
