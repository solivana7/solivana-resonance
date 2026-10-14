/**
 * Category-aware cross-sell at the end of a session. Maps each frequency
 * category to the most natural next SoliVana product. No medical claims —
 * just "this might pair well" framing.
 */

interface CrossSellLink {
  title: string;
  blurb: string;
  href: string;
  badge: string;
}

const CROSS_SELL: Record<string, CrossSellLink> = {
  solfeggio: {
    badge: 'SOLIVANA SLEEP',
    title: 'A six-week sleep program for the listener who wants more than a tone.',
    blurb:
      'CBT-I, the first-line clinical treatment for insomnia, paired with a binaural audio engine and circadian recovery. For nights that stopped working.',
    href: 'https://sleep.solivana.io',
  },
  binaural: {
    badge: 'SOLIVANA SLEEP',
    title: 'Take binaural listening further with CBT-I.',
    blurb:
      'Six weeks of clinical sleep therapy paired with a real-time binaural engine. Built for executives whose nights stopped working — when trackers weren’t enough.',
    href: 'https://sleep.solivana.io',
  },
  schumann: {
    badge: 'THE FOUNDATION',
    title: 'Prepare your body before you cleanse.',
    blurb:
      'A six-week foundational protocol that builds your detox capacity before a parasite cleanse — so detox doesn’t make you sick. Member library, AI Companion, live cohort.',
    href: 'https://foundation.solivana.ai',
  },
  isochronic: {
    badge: 'INNERVIEW',
    title: 'Decode your face and tongue in 30 seconds.',
    blurb:
      'AI wellness screening through Ayurveda and Traditional Chinese Medicine. Surfaces constitutional patterns and matches you to SoliVana therapies.',
    href: 'https://innerview.solivana.io',
  },
  noise: {
    badge: 'SOLIVANA SLEEP',
    title: 'For nights when noise alone isn’t enough.',
    blurb:
      'Six weeks of CBT-I plus binaural audio and circadian recovery. Built for the listener who has tried everything else.',
    href: 'https://sleep.solivana.io',
  },
};

export default function CrossSellCard({ category }: { category: string }) {
  const link = CROSS_SELL[category] ?? CROSS_SELL.solfeggio;

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full font-body no-underline transition-all duration-200 hover:scale-[1.005] hover:shadow-[0_6px_28px_rgba(51,29,1,0.10)]"
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF8F0 100%)',
        border: '1px solid rgba(51,29,1,0.10)',
        borderRadius: 12,
        padding: 24,
        color: '#331D01',
      }}
    >
      <span
        className="font-hero uppercase block"
        style={{
          fontSize: 10,
          letterSpacing: '0.22em',
          color: '#EC9247',
          marginBottom: 10,
        }}
      >
        Pair with → {link.badge}
      </span>
      <p
        className="font-hero"
        style={{ fontSize: 18, color: '#331D01', lineHeight: 1.3, marginBottom: 8, letterSpacing: '-0.01em' }}
      >
        {link.title}
      </p>
      <p style={{ fontSize: 13, color: 'rgba(51,29,1,0.65)', lineHeight: 1.65 }}>
        {link.blurb}
      </p>
      <p
        className="font-body uppercase"
        style={{
          fontSize: 11,
          color: '#EC9247',
          letterSpacing: '0.18em',
          marginTop: 14,
          fontWeight: 500,
        }}
      >
        Explore →
      </p>
    </a>
  );
}
