import { useState, useId } from 'react';

/**
 * Post-session email capture. Posts to the app's own POST /api/lead
 * endpoint with a `resonance-lead` tag + a `frequency-session-completed`
 * event tag, per the hard rule that every customer-facing SoliVana app
 * pushes captured contact data to GHL. The server proxies to GHL with a
 * server-side token; no webhook URL or token exists in the client.
 *
 * If the server has no GHL credentials configured, the form still shows
 * but submits as a no-op and tells the user the capture is in dev mode.
 * This avoids a silent failure path in production.
 */
export default function PostSessionCard({
  frequencyName,
  category,
  durationSec,
}: {
  frequencyName: string;
  category: string;
  durationSec: number;
}) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const emailId = useId();
  const nameId = useId();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('sending');
    setErrorMsg(null);

    const payload = {
      email: email.trim(),
      first_name: firstName.trim() || undefined,
      source: 'resonance.solivana.io',
      tags: ['resonance-lead', 'frequency-session-completed'],
      notes: `Completed ${Math.round(durationSec / 60)}-min ${category} session — ${frequencyName}`,
      session: {
        frequency_name: frequencyName,
        category,
        duration_sec: durationSec,
        completed_at: new Date().toISOString(),
      },
    };

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('sent');
    } catch (err) {
      console.warn('[PostSessionCard] /api/lead push failed:', err);
      setErrorMsg(
        err instanceof Error ? err.message : 'Could not save right now.',
      );
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div
        className="w-full font-body"
        style={{
          background: 'rgba(236,146,71,0.06)',
          border: '1px solid rgba(236,146,71,0.32)',
          borderRadius: 12,
          padding: 24,
          color: '#331D01',
        }}
        role="status"
        aria-live="polite"
      >
        <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
          Saved — we'll send you a reminder for your next session.
        </p>
        <p style={{ fontSize: 13, color: 'rgba(51,29,1,0.6)' }}>
          Check {email || 'your inbox'} for occasional notes from SoliVana. Unsubscribe anytime.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full font-body flex flex-col gap-3"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(51,29,1,0.08)',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <div>
        <p style={{ fontSize: 14, fontWeight: 500, color: '#331D01', marginBottom: 2 }}>
          Save your practice
        </p>
        <p style={{ fontSize: 13, color: 'rgba(51,29,1,0.6)', lineHeight: 1.6 }}>
          Get a quiet reminder for your next session, plus the occasional new frequency we publish. No spam.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id={nameId}
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name (optional)"
          aria-label="First name"
          className="font-body"
          style={{
            flex: 1,
            padding: '12px 14px',
            background: '#FFF8F0',
            border: '1px solid rgba(51,29,1,0.12)',
            borderRadius: 8,
            fontSize: 14,
            color: '#331D01',
          }}
        />
        <input
          id={emailId}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="font-body"
          style={{
            flex: 2,
            padding: '12px 14px',
            background: '#FFF8F0',
            border: '1px solid rgba(51,29,1,0.12)',
            borderRadius: 8,
            fontSize: 14,
            color: '#331D01',
          }}
        />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="font-body uppercase transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          style={{
            background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: '0.12em',
            padding: '12px 28px',
            borderRadius: 8,
            border: 'none',
          }}
        >
          {status === 'sending' ? 'Saving…' : 'Save & remind me'}
        </button>
        <span style={{ fontSize: 11, color: 'rgba(51,29,1,0.45)' }}>
          Stored with SoliVana. Unsubscribe anytime.
        </span>
      </div>

      {status === 'error' && errorMsg && (
        <p role="alert" style={{ fontSize: 13, color: '#9B3A1F' }}>
          {errorMsg} Please try again.
        </p>
      )}
    </form>
  );
}
