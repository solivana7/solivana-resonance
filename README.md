# SoliVana Resonance

**Frequency wellness, generated in the browser.** Resonance plays precise sound
frequencies — binaural beats, Solfeggio tones, Schumann resonance, isochronic
tones, and color noise — synthesized client-side with the Web Audio API. No
audio files, no accounts, no tracking pixels; session history lives in the
visitor's own browser.

Live: https://resonance.solivana.io

## Problem

Sound-frequency tools are either heavyweight subscription apps that upload
listening data, or bare tone generators with no guidance. Resonance is the
middle path: a fast, installable PWA that explains what each frequency is
traditionally used for (in plain, non-medical language), plays it instantly,
and keeps every session stat on-device.

## Approach

- **Pure synthesis.** Every tone is generated in the browser with the Web
  Audio API — there is no audio pipeline, no CDN of MP3s, and nothing to
  buffer. The app works fully offline once installed.
- **Guided library, honest copy.** Frequencies are grouped (Solfeggio,
  binaural, Schumann, isochronic, color noise) with descriptions that
  describe listening contexts, not medical effects.
- **Local-first stats.** The dashboard (streaks, weekly minutes, favorites)
  reads from `localStorage`; nothing about listening habits leaves the
  device except an optional, explicit email capture after a session.
- **One small server route.** A single Express endpoint, `POST /api/lead`,
  proxies the optional email capture to a CRM using a server-side token —
  the token never ships in client JavaScript.

## Engineering highlights

- **Security headers on every response** (HSTS, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) plus
  `x-powered-by` disabled; immutable caching for hashed assets, no-cache for
  the SPA shell.
- **Strict input validation on `/api/lead`**: email shape check, tag count
  and length caps, notes capped at 2 000 chars, 64 kb JSON body limit, and a
  fail-closed CRM upsert that returns structured error codes instead of
  leaking upstream failures to the client.
- **AudioContext reuse for Safari**: one context per page lifetime —
  oscillators and noise buffers are swapped per track while the context,
  gain node, and analyser persist — avoiding Safari's context-count limit and
  the teardown handshake cost on every track switch.
- **Accessibility**: focus management on modals (initial focus, Escape to
  close, focus restore), `aria-live` regions for player state and form
  feedback, `aria-modal` dialogs, labelled icon buttons, 44×44 touch targets,
  and `prefers-reduced-motion` respected by the orb and animations.
- **PWA**: installable via the web manifest and a custom install prompt
  (`beforeinstallprompt`).

## Stack

- Vite + React 19 + TypeScript
- Tailwind 3 + shadcn/ui (Radix primitives)
- Web Audio API (raw `OscillatorNode` / `AudioBufferSourceNode` synthesis)
- Framer Motion for animations
- react-router (HashRouter)
- Express (`server.js`) for static hosting + the `/api/lead` proxy

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + Vite build
npm run preview      # serve built dist/ locally
npm start            # production server (dist/ + /api/lead)
```

The server needs no environment variables to run in dev mode; set `GHL_PIT`
and `GHL_LOCATION_ID` to enable live CRM upserts.

## Deployment

Dockerfile + `railway.json` at the repo root; deploys as a single container
that builds the SPA and serves it with the Express proxy. Healthcheck at
`/healthz`.

---

Portfolio — code shared for review, not licensed for reuse.
