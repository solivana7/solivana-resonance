/**
 * Shown on session summary after a user has completed >= 3 sessions.
 * The funnel ask: take the listener from free-tool engagement to the
 * SoliVana Wellness membership trial.
 */
export default function MembershipCard({ sessionCount }: { sessionCount: number }) {
  if (sessionCount < 3) return null;
  return (
    <a
      href="https://www.solivana.ai"
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full font-body no-underline transition-all duration-200 hover:scale-[1.005] hover:shadow-[0_8px_32px_rgba(51,29,1,0.14)]"
      style={{
        background: 'linear-gradient(135deg, #331D01 0%, #4a2e10 100%)',
        border: '1px solid rgba(236,146,71,0.32)',
        borderRadius: 12,
        padding: 28,
        color: '#F0EDED',
      }}
    >
      <span
        className="font-hero uppercase block"
        style={{
          fontSize: 10,
          letterSpacing: '0.22em',
          color: '#EC9247',
          marginBottom: 12,
        }}
      >
        SoliVana Wellness · Member Trial
      </span>
      <p
        className="font-hero"
        style={{ fontSize: 22, color: '#F0EDED', lineHeight: 1.25, marginBottom: 10, letterSpacing: '-0.01em' }}
      >
        You're {sessionCount} sessions in — the rest is waiting.
      </p>
      <p style={{ fontSize: 13, color: 'rgba(240,237,237,0.7)', lineHeight: 1.65, marginBottom: 16 }}>
        Members unlock the full SoliVana platform: bioenergetics scans, peptide protocols,
        the Foundation program, infoceutical fulfillment, wearables ingest, one clinical
        record across every tool.
      </p>
      <span
        className="font-body uppercase inline-block"
        style={{
          background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.14em',
          padding: '12px 22px',
          borderRadius: 8,
        }}
      >
        Start a member trial →
      </span>
    </a>
  );
}
