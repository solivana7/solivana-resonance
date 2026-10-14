import { useEffect, useRef, useState } from 'react';

/**
 * The single full-screen focal point of the Player. One orb at the centre
 * of the canvas with three overlaid motions:
 *
 *   1. Audio amplitude modulates the outer ring (sine-wave perturbation
 *      around the circumference). The ring is the visualizer.
 *   2. A physiological-sigh breathing cycle (4s in, 7s out) drives a slow
 *      scale on the whole orb — the body cue.
 *   3. The beat frequency drives a fast inner pulse — the audible beat
 *      made visible.
 *
 * When isPlaying is false, the orb is still alive — slow breath only,
 * no audio reactivity. Never goes flat. This is the meditative cue.
 */
export default function BreathingOrb({
  getAnalyserData,
  isPlaying,
  beatHz = 0.4,
  size = 360,
}: {
  getAnalyserData: () => Uint8Array | null;
  isPlaying: boolean;
  beatHz?: number;
  size?: number;
}) {
  const ringRef = useRef<SVGPathElement>(null);
  const haloRef = useRef<SVGCircleElement>(null);
  const rafRef = useRef(0);
  const tRef = useRef(0);
  const ampRef = useRef(0.15);
  const breathRef = useRef(1);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Respect prefers-reduced-motion — orb still breathes but at half rate
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const draw = () => {
      if (!ringRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      const speedScale = reduceMotion ? 0.5 : 1;
      tRef.current += 0.012 * speedScale;
      const t = tRef.current;

      // Read audio amplitude (mean of mid-frequency bins)
      let targetAmp = 0.06;
      if (isPlaying) {
        const data = getAnalyserData();
        if (data && data.length > 0) {
          let sum = 0;
          const start = Math.floor(data.length * 0.05);
          const end = Math.floor(data.length * 0.45);
          for (let i = start; i < end; i++) sum += data[i];
          const mean = sum / (end - start) / 255;
          targetAmp = Math.max(0.05, Math.min(0.18, 0.05 + mean * 0.5));
        } else {
          targetAmp = 0.08;
        }
      }
      ampRef.current += (targetAmp - ampRef.current) * 0.06;
      const amp = ampRef.current;

      // Physiological-sigh breathing cycle, 11 s total (4 in, 7 out).
      // Normalize the wave to [0,1] then map to a gentle 0.96..1.04 scale.
      const breathPhase = (t * speedScale * 2 * Math.PI) / 11;
      const breathRaw = (Math.sin(breathPhase - Math.PI / 2) + 1) / 2;
      const breathScale = 0.96 + breathRaw * 0.08;
      breathRef.current += (breathScale - breathRef.current) * 0.1;

      // Beat pulse — fast inner ring shimmer at the beat frequency
      const clampedBeatHz = Math.max(0.05, Math.min(2.5, beatHz));
      const beatPhase = t * clampedBeatHz * 2 * Math.PI * speedScale;
      const beatGlow = 0.4 + (Math.sin(beatPhase) * 0.5 + 0.5) * 0.6; // 0.4..1.0

      // Build sine-modulated circle path. The radius wobbles around the
      // base by `amp * R` and oscillates with audio + a slow drift.
      const cx = 0;
      const cy = 0;
      const baseR = 100;
      const N = 96;
      const pts: [number, number][] = [];
      for (let i = 0; i <= N; i++) {
        const theta = (i / N) * Math.PI * 2;
        // Two layered sines: a slow drift and a faster audio-mod component
        const r =
          baseR *
          (1 +
            amp *
              (Math.sin(theta * 3 + t * 1.2) * 0.5 +
                Math.sin(theta * 5 - t * 0.8) * 0.35 +
                Math.sin(theta * 7 + t * 0.4) * 0.15));
        pts.push([cx + Math.cos(theta) * r, cy + Math.sin(theta) * r]);
      }
      // Smooth path with mid-point quadratic curves
      let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[i + 1];
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        d += ` Q ${x1.toFixed(2)} ${y1.toFixed(2)}, ${mx.toFixed(2)} ${my.toFixed(2)}`;
      }
      d += ' Z';
      ringRef.current.setAttribute('d', d);

      // Halo scales with breath, plus a gentle pulse from the beat
      if (haloRef.current) {
        const haloR = baseR * (0.96 + (breathRef.current - 1) * 1.2) * (1 + beatGlow * 0.04);
        haloRef.current.setAttribute('r', haloR.toFixed(2));
        haloRef.current.setAttribute('opacity', String(0.45 + beatGlow * 0.25));
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [getAnalyserData, isPlaying, beatHz, reduceMotion]);

  return (
    <svg
      viewBox="-160 -160 320 320"
      width={size}
      height={size}
      aria-hidden="true"
      style={{
        display: 'block',
        // Soft warm shadow against the cream canvas — reads as embodied glow,
        // not a dark drop-shadow.
        filter: 'drop-shadow(0 8px 40px rgba(236,146,71,0.32)) drop-shadow(0 0 80px rgba(214,122,47,0.18))',
        transform: `scale(${breathRef.current})`,
        transition: 'transform 50ms linear',
        willChange: 'transform',
      }}
    >
      <defs>
        {/* Deeper orange anchor for contrast against the cream surface */}
        <radialGradient id="orbCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE2C2" stopOpacity="0.98" />
          <stop offset="22%" stopColor="#F0A85F" stopOpacity="0.96" />
          <stop offset="55%" stopColor="#EC9247" stopOpacity="0.92" />
          <stop offset="82%" stopColor="#B96E2A" stopOpacity="0.78" />
          <stop offset="100%" stopColor="#7A4112" stopOpacity="0.0" />
        </radialGradient>
        <radialGradient id="orbHalo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EC9247" stopOpacity="0" />
          <stop offset="55%" stopColor="#EC9247" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#EC9247" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Outer breathing halo */}
      <circle ref={haloRef} cx="0" cy="0" r="135" fill="url(#orbHalo)" />

      {/* Soft glow ring under everything — sits beneath the modulated ring */}
      <circle cx="0" cy="0" r="115" fill="url(#orbCore)" opacity="0.55" />

      {/* The audio-modulated ring (the "edge" of the orb) */}
      <path
        ref={ringRef}
        fill="url(#orbCore)"
        stroke="rgba(155,84,24,0.45)"
        strokeWidth="0.9"
      />

      {/* Inner core — slightly deeper than before for definition on light bg */}
      <circle cx="0" cy="0" r="42" fill="url(#orbCore)" opacity="0.95" />
      <circle cx="0" cy="0" r="22" fill="#FFE2C2" opacity="0.6" />
    </svg>
  );
}
