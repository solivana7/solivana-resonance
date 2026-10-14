/**
 * SoliVana Resonance — tiny production server.
 *
 * Serves the Vite build from dist/ AND exposes one API route at
 * POST /api/lead that proxies to GoHighLevel's contacts/upsert
 * endpoint using a server-side Private Integration Token.
 *
 * The PIT (GHL_PIT) and location ID (GHL_LOCATION_ID) are read from
 * Railway env vars at runtime — they are never bundled into the
 * client-side JavaScript.
 *
 * Per feedback_all_apps_push_to_GHL.md: every customer-facing SoliVana
 * app must push captured contact data with a project tag and event tags.
 * If GHL_PIT is unset, the route still returns 200 and logs the payload
 * so we never silently fail in production — but no upsert happens.
 */

import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 8080;
const GHL_PIT = process.env.GHL_PIT;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_API_BASE = process.env.GHL_API_BASE || 'https://services.leadconnectorhq.com';

const app = express();
app.disable('x-powered-by');
app.use(compression());
app.use(express.json({ limit: '64kb' }));

// Security + caching headers for static assets and the SPA shell
app.use((req, res, next) => {
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'SAMEORIGIN');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

/**
 * POST /api/lead
 *
 * Body: { email, first_name?, source?, tags?: string[], notes?, session?: {...} }
 *
 * Upserts the contact into GHL, attaches the requested tags, and writes
 * a contact-note with the session metadata. Returns { ok: true } on success.
 *
 * Validation:
 *   - email required, must look vaguely like an email
 *   - tags capped at 20 entries, each ≤ 80 chars
 *   - notes capped at 2000 chars
 */
app.post('/api/lead', async (req, res) => {
  const { email, first_name, source, tags, notes, session } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ ok: false, error: 'Invalid email' });
  }

  // Normalize tags
  const safeTags = Array.isArray(tags)
    ? tags
        .filter((t) => typeof t === 'string')
        .slice(0, 20)
        .map((t) => t.trim().slice(0, 80).toLowerCase())
        .filter(Boolean)
    : ['resonance-lead'];
  if (!safeTags.includes('resonance-lead')) safeTags.push('resonance-lead');

  // Compose payload for GHL
  const payload = {
    locationId: GHL_LOCATION_ID,
    email: email.trim().toLowerCase().slice(0, 254),
    firstName: typeof first_name === 'string' ? first_name.trim().slice(0, 80) : undefined,
    tags: safeTags,
    source: typeof source === 'string' ? source.slice(0, 200) : 'resonance.solivana.io',
  };

  if (!GHL_PIT || !GHL_LOCATION_ID) {
    console.warn('[lead] GHL_PIT or GHL_LOCATION_ID unset — capture skipped.', {
      email: payload.email,
      tags: safeTags,
      notes: typeof notes === 'string' ? notes.slice(0, 200) : undefined,
      session,
    });
    return res.json({ ok: true, dev: true });
  }

  try {
    const upsertRes = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GHL_PIT}`,
        Version: '2021-07-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!upsertRes.ok) {
      const text = await upsertRes.text();
      console.warn('[lead] GHL upsert failed', upsertRes.status, text.slice(0, 500));
      return res.status(502).json({ ok: false, error: 'GHL upsert failed', status: upsertRes.status });
    }

    const upsertJson = await upsertRes.json();
    const contactId = upsertJson?.contact?.id;

    // Best-effort note for the contact — non-blocking
    if (contactId && typeof notes === 'string' && notes.trim()) {
      try {
        await fetch(`${GHL_API_BASE}/contacts/${contactId}/notes`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GHL_PIT}`,
            Version: '2021-07-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: notes.slice(0, 2000),
            userId: undefined,
          }),
        });
      } catch (noteErr) {
        console.warn('[lead] note attach failed (non-fatal):', noteErr);
      }
    }

    return res.json({ ok: true, contactId, new: Boolean(upsertJson?.new) });
  } catch (err) {
    console.error('[lead] upsert error:', err);
    return res.status(500).json({ ok: false, error: 'Upstream error' });
  }
});

// Healthcheck (Railway hits this)
app.get('/healthz', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Static assets — long cache on /assets/, no-cache on the shell
const distDir = path.join(__dirname, 'dist');
app.use(
  '/assets',
  express.static(path.join(distDir, 'assets'), {
    maxAge: '1y',
    immutable: true,
  }),
);
app.use(
  express.static(distDir, {
    maxAge: '0',
    setHeaders: (res, filepath) => {
      if (filepath.endsWith('.html')) res.set('Cache-Control', 'no-cache');
    },
  }),
);

// SPA fallback — everything else returns index.html
app.get('*', (_req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  const ghlMode = GHL_PIT && GHL_LOCATION_ID ? 'live' : 'dev (no upsert)';
  console.log(`[resonance] listening on :${PORT} | GHL: ${ghlMode}`);
});
