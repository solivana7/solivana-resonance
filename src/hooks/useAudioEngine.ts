import { useState, useRef, useCallback, useEffect } from 'react';

export type NoiseType = 'white' | 'pink' | 'brown' | 'violet' | 'grey' | 'blue';

export interface AudioEngineState {
  isPlaying: boolean;
  currentFrequency: string | null;
  volume: number;
  progress: number;
  error: string | null;
}

interface AudioNodes {
  ctx: AudioContext;
  oscillator: OscillatorNode | null;
  oscillatorRight: OscillatorNode | null;
  gainNode: GainNode;
  panner: StereoPannerNode | null;
  analyser: AnalyserNode;
  noiseBuffer: AudioBufferSourceNode | null;
  noiseGain: GainNode | null;
}

export function useAudioEngine() {
  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    currentFrequency: null,
    volume: 0.5,
    progress: 0,
    error: null,
  });

  const nodesRef = useRef<AudioNodes | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  // Stop active oscillators/buffers but keep ctx + gainNode + analyser alive.
  // The AudioContext is reused across plays to avoid Safari's ctx limit and
  // the cost of teardown + handshake on every track switch.
  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    const nodes = nodesRef.current;
    if (!nodes) return;

    try {
      nodes.oscillator?.stop();
      nodes.oscillator?.disconnect();
      nodes.oscillatorRight?.stop();
      nodes.oscillatorRight?.disconnect();
      nodes.noiseBuffer?.stop();
      nodes.noiseBuffer?.disconnect();
      nodes.noiseGain?.disconnect();
      nodes.panner?.disconnect();
    } catch (err) {
      console.warn('Audio cleanup non-fatal error:', err);
    }
    nodes.oscillator = null;
    nodes.oscillatorRight = null;
    nodes.noiseBuffer = null;
    nodes.noiseGain = null;
    nodes.panner = null;
  }, []);

  // Full teardown only on unmount.
  useEffect(() => {
    return () => {
      cleanup();
      const nodes = nodesRef.current;
      if (nodes) {
        try {
          nodes.gainNode?.disconnect();
          nodes.analyser?.disconnect();
          if (nodes.ctx.state !== 'closed') nodes.ctx.close();
        } catch (err) {
          console.warn('Audio teardown non-fatal error:', err);
        }
        nodesRef.current = null;
      }
    };
  }, [cleanup]);

  const updateProgress = useCallback(() => {
    if (startTimeRef.current > 0) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setState(prev => ({ ...prev, progress: elapsed }));
    }
    rafRef.current = requestAnimationFrame(updateProgress);
  }, []);

  // Lazily create one AudioContext for the lifetime of the component.
  // Subsequent calls reuse the existing context. Resumes if browser
  // autoplay-suspended (Safari + Chrome require a user gesture).
  const initAudio = useCallback((): AudioNodes | null => {
    if (nodesRef.current) {
      const existing = nodesRef.current;
      if (existing.ctx.state === 'suspended') {
        existing.ctx.resume().catch((err) => {
          console.warn('AudioContext resume failed:', err);
        });
      }
      return existing;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) {
        setState((s) => ({
          ...s,
          error:
            'Your browser does not support Web Audio. Try the latest Chrome, Safari, Firefox, or Edge.',
        }));
        return null;
      }
      const ctx = new AudioCtx();
      const gainNode = ctx.createGain();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.85;
      gainNode.connect(analyser);
      analyser.connect(ctx.destination);

      const nodes: AudioNodes = {
        ctx,
        oscillator: null,
        oscillatorRight: null,
        gainNode,
        panner: null,
        analyser,
        noiseBuffer: null,
        noiseGain: null,
      };
      nodesRef.current = nodes;
      if (ctx.state === 'suspended') {
        ctx.resume().catch((err) => {
          console.warn('AudioContext resume failed:', err);
        });
      }
      setState((s) => (s.error ? { ...s, error: null } : s));
      return nodes;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to start audio.';
      setState((s) => ({
        ...s,
        error: `Audio engine failed to start: ${message}`,
      }));
      return null;
    }
  }, []);

  const playSolfeggio = useCallback((hz: number, volume?: number) => {
    cleanup();
    const nodes = initAudio();
    if (!nodes) return;

    const vol = volume ?? state.volume;
    nodes.gainNode.gain.setValueAtTime(vol, nodes.ctx.currentTime);

    const osc = nodes.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, nodes.ctx.currentTime);
    osc.connect(nodes.gainNode);
    osc.start();
    nodes.oscillator = osc;

    setState(prev => ({
      ...prev,
      isPlaying: true,
      currentFrequency: `Solfeggio ${hz}Hz`,
      volume: vol,
    }));
    startTimeRef.current = Date.now();
    rafRef.current = requestAnimationFrame(updateProgress);
  }, [cleanup, initAudio, state.volume, updateProgress]);

  const playBinaural = useCallback((baseHz: number, beatHz: number, volume?: number) => {
    cleanup();
    const nodes = initAudio();
    if (!nodes) return;

    const vol = volume ?? state.volume;
    nodes.gainNode.gain.setValueAtTime(vol, nodes.ctx.currentTime);

    const leftOsc = nodes.ctx.createOscillator();
    leftOsc.type = 'sine';
    leftOsc.frequency.setValueAtTime(baseHz, nodes.ctx.currentTime);

    const rightOsc = nodes.ctx.createOscillator();
    rightOsc.type = 'sine';
    rightOsc.frequency.setValueAtTime(baseHz + beatHz, nodes.ctx.currentTime);

    const leftPanner = nodes.ctx.createStereoPanner();
    leftPanner.pan.setValueAtTime(-1, nodes.ctx.currentTime);

    const rightPanner = nodes.ctx.createStereoPanner();
    rightPanner.pan.setValueAtTime(1, nodes.ctx.currentTime);

    leftOsc.connect(leftPanner);
    leftPanner.connect(nodes.gainNode);
    rightOsc.connect(rightPanner);
    rightPanner.connect(nodes.gainNode);

    leftOsc.start();
    rightOsc.start();

    nodes.oscillator = leftOsc;
    nodes.oscillatorRight = rightOsc;
    nodes.panner = leftPanner;

    setState(prev => ({
      ...prev,
      isPlaying: true,
      currentFrequency: `Binaural ${baseHz}Hz + ${beatHz}Hz`,
      volume: vol,
    }));
    startTimeRef.current = Date.now();
    rafRef.current = requestAnimationFrame(updateProgress);
  }, [cleanup, initAudio, state.volume, updateProgress]);

  const playSchumann = useCallback((hz: number, volume?: number) => {
    cleanup();
    const nodes = initAudio();
    if (!nodes) return;

    const vol = volume ?? state.volume;
    nodes.gainNode.gain.setValueAtTime(vol, nodes.ctx.currentTime);

    const osc = nodes.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, nodes.ctx.currentTime);

    // Add subtle amplitude modulation for "pulsing" earth feel
    const lfo = nodes.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.25, nodes.ctx.currentTime);
    const lfoGain = nodes.ctx.createGain();
    lfoGain.gain.setValueAtTime(vol * 0.15, nodes.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(nodes.gainNode.gain);
    lfo.start();

    osc.connect(nodes.gainNode);
    osc.start();
    nodes.oscillator = osc;

    setState(prev => ({
      ...prev,
      isPlaying: true,
      currentFrequency: `Schumann ${hz}Hz`,
      volume: vol,
    }));
    startTimeRef.current = Date.now();
    rafRef.current = requestAnimationFrame(updateProgress);
  }, [cleanup, initAudio, state.volume, updateProgress]);

  const playIsochronic = useCallback((hz: number, beatHz: number, volume?: number) => {
    cleanup();
    const nodes = initAudio();
    if (!nodes) return;

    const vol = volume ?? state.volume;
    nodes.gainNode.gain.setValueAtTime(0, nodes.ctx.currentTime);

    const osc = nodes.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(hz, nodes.ctx.currentTime);

    // Create rhythmic pulsing via amplitude modulation
    const lfo = nodes.ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.setValueAtTime(beatHz, nodes.ctx.currentTime);

    const lfoGain = nodes.ctx.createGain();
    lfoGain.gain.setValueAtTime(vol, nodes.ctx.currentTime);

    const smoothGain = nodes.ctx.createGain();
    // Smooth the square wave slightly
    smoothGain.gain.setValueAtTime(0.8, nodes.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(smoothGain.gain);
    osc.connect(smoothGain);
    smoothGain.connect(nodes.gainNode);

    osc.start();
    lfo.start();
    nodes.oscillator = osc;

    setState(prev => ({
      ...prev,
      isPlaying: true,
      currentFrequency: `Isochronic ${hz}Hz @ ${beatHz}Hz`,
      volume: vol,
    }));
    startTimeRef.current = Date.now();
    rafRef.current = requestAnimationFrame(updateProgress);
  }, [cleanup, initAudio, state.volume, updateProgress]);

  const playNoise = useCallback((type: NoiseType, volume?: number) => {
    cleanup();
    const nodes = initAudio();
    if (!nodes) return;

    const vol = volume ?? state.volume;

    const bufferSize = nodes.ctx.sampleRate * 2;
    const buffer = nodes.ctx.createBuffer(1, bufferSize, nodes.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      switch (type) {
        case 'white':
          data[i] = white;
          break;
        case 'pink':
          data[i] = (white + (data[i - 1] || 0) * 0.9) * 0.15;
          break;
        case 'brown':
          data[i] = (white + (data[i - 1] || 0) * 0.99) * 0.06;
          break;
        case 'violet':
          data[i] = white * Math.sqrt(i / bufferSize) * 2;
          break;
        case 'grey':
          data[i] = white * (1 - Math.abs(i / bufferSize - 0.5) * 2) * 0.5;
          break;
        case 'blue':
          data[i] = white * (i / bufferSize) * 2;
          break;
        default:
          data[i] = white;
      }
    }

    const source = nodes.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const noiseGain = nodes.ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.6, nodes.ctx.currentTime);

    source.connect(noiseGain);
    noiseGain.connect(nodes.gainNode);
    source.start();

    nodes.noiseBuffer = source;
    nodes.noiseGain = noiseGain;

    setState(prev => ({
      ...prev,
      isPlaying: true,
      currentFrequency: `${type.charAt(0).toUpperCase() + type.slice(1)} Noise`,
      volume: vol,
    }));
    startTimeRef.current = Date.now();
    rafRef.current = requestAnimationFrame(updateProgress);
  }, [cleanup, initAudio, state.volume, updateProgress]);

  const stop = useCallback(() => {
    cleanup();
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentFrequency: null,
      progress: 0,
    }));
    startTimeRef.current = 0;
  }, [cleanup]);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    if (nodesRef.current) {
      nodesRef.current.gainNode.gain.setValueAtTime(
        clamped,
        nodesRef.current.ctx.currentTime
      );
    }
    setState(prev => ({ ...prev, volume: clamped }));
  }, []);

  const getAnalyserData = useCallback((): Uint8Array | null => {
    const nodes = nodesRef.current;
    if (!nodes?.analyser) return null;
    const dataArray = new Uint8Array(nodes.analyser.frequencyBinCount);
    nodes.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }, []);

  return {
    ...state,
    initAudio,
    playSolfeggio,
    playBinaural,
    playSchumann,
    playIsochronic,
    playNoise,
    stop,
    setVolume,
    getAnalyserData,
  };
}
