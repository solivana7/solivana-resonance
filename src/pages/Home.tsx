import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { frequencyGroups } from '@/data/frequencies';

/* ──────────────────────── IntersectionObserver hook ──────────────────────── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, revealed };
}

/* ──────────────────────── SVG Icons ──────────────────────── */
function ChooseIcon() {
  return (
    <svg aria-hidden="true" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="19" stroke="#EC9247" strokeWidth="1.5" />
      <path d="M12 20 Q16 12, 20 20 Q24 28, 28 20" stroke="#EC9247" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="14" y1="24" x2="26" y2="24" stroke="#EC9247" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ListenIcon() {
  return (
    <svg aria-hidden="true" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="19" stroke="#EC9247" strokeWidth="1.5" />
      <polygon points="15,14 15,26 27,20" fill="#EC9247" />
      <path d="M28 15 Q30 20, 28 25" stroke="#EC9247" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M31 12 Q34 20, 31 28" stroke="#EC9247" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function FeelIcon() {
  return (
    <svg aria-hidden="true" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="19" stroke="#EC9247" strokeWidth="1.5" />
      <path d="M20 12 Q26 8, 28 14 Q30 20, 20 28 Q10 20, 12 14 Q14 8, 20 12Z" stroke="#EC9247" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

function SineWaveBg() {
  return (
    <svg
      aria-hidden="true"
      width="100%"
      height="100%"
      viewBox="0 0 1200 300"
      preserveAspectRatio="none"
      className="animate-sine-drift"
      style={{ opacity: 0.04, position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <path
        d="M0,150 Q75,50 150,150 Q225,250 300,150 Q375,50 450,150 Q525,250 600,150 Q675,50 750,150 Q825,250 900,150 Q975,50 1050,150 Q1125,250 1200,150"
        stroke="#331D01"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M0,100 Q75,0 150,100 Q225,200 300,100 Q375,0 450,100 Q525,200 600,100 Q675,0 750,100 Q825,200 900,100 Q975,0 1050,100 Q1125,200 1200,100"
        stroke="#331D01"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M0,200 Q75,100 150,200 Q225,300 300,200 Q375,100 450,200 Q525,300 600,200 Q675,100 750,200 Q825,300 900,200 Q975,100 1050,200 Q1125,300 1200,200"
        stroke="#331D01"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

/* ──────────────────────── Hero Section ──────────────────────── */
function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: 600, height: '90vh' }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/hero-botanical-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #F0EDED 50%, #FFF8F0 100%)', opacity: 0.3 }}
      />

      {/* White translucent panel - left side */}
      <div
        className="absolute left-0 top-0 bottom-0 hidden md:flex flex-col justify-center px-6 md:px-12 lg:px-20"
        style={{
          width: '55%',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
          paddingTop: 100,
          paddingBottom: 100,
        }}
      >
        {/* Subtitle label */}
        <p
          className="font-hero uppercase animate-fade-in"
          style={{
            color: '#EC9247',
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: '0.15em',
            lineHeight: 1.5,
            animationDelay: '0.4s',
            opacity: 0,
          }}
        >
          FREQUENCY WELLNESS PLATFORM
        </p>

        {/* Headline */}
        <h1
          className="font-hero uppercase mt-4 animate-hero-clip-reveal"
          style={{
            color: '#331D01',
            fontSize: 48,
            fontWeight: 400,
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
            clipPath: 'inset(0 100% 0 0)',
            textWrap: 'balance',
          }}
        >
          Tune Into Your
          <br />
          Optimal State
        </h1>

        {/* Body */}
        <p
          className="font-body mt-6 animate-fade-in"
          style={{
            color: 'rgba(51,29,1,0.6)',
            fontSize: 16,
            fontWeight: 300,
            lineHeight: 1.7,
            maxWidth: 440,
            animationDelay: '0.5s',
            opacity: 0,
          }}
        >
          Generate precise sound frequencies &mdash; binaural beats, Solfeggio tones, Schumann resonance, and more &mdash; directly in your browser. No apps. No downloads. Just sound.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-wrap items-center gap-4 mt-8 animate-fade-in"
          style={{ animationDelay: '0.6s', opacity: 0 }}
        >
          <Link
            to="/library"
            className="inline-flex items-center justify-center font-body uppercase text-white no-underline transition-all duration-200 hover:scale-[1.02] hover:shadow-sage-glow active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.12em',
              padding: '16px 32px',
              borderRadius: 8,
            }}
          >
            EXPLORE FREQUENCIES
          </Link>

          <Link
            to="/player"
            className="font-body no-underline transition-colors duration-200 hover:underline"
            style={{
              color: '#EC9247',
              fontSize: 14,
              fontWeight: 400,
              marginLeft: 8,
            }}
          >
            Or start a quick session &rarr;
          </Link>
        </div>
      </div>

      {/* Mobile panel - full width */}
      <div
        className="md:hidden absolute inset-0 flex flex-col justify-center"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
          padding: '100px 24px',
        }}
      >
        <p
          className="font-hero uppercase animate-fade-in"
          style={{
            color: '#EC9247',
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: '0.15em',
            lineHeight: 1.5,
            animationDelay: '0.4s',
            opacity: 0,
          }}
        >
          FREQUENCY WELLNESS PLATFORM
        </p>
        <h1
          className="font-hero uppercase mt-4 animate-fade-in"
          style={{
            color: '#331D01',
            fontSize: 32,
            fontWeight: 400,
            letterSpacing: '-0.01em',
            lineHeight: 1.05,
            animationDelay: '0.2s',
            opacity: 0,
            textWrap: 'balance',
          }}
        >
          Tune Into Your
          <br />
          Optimal State
        </h1>
        <p
          className="font-body mt-6 animate-fade-in"
          style={{
            color: 'rgba(51,29,1,0.6)',
            fontSize: 16,
            fontWeight: 300,
            lineHeight: 1.7,
            maxWidth: 440,
            animationDelay: '0.5s',
            opacity: 0,
          }}
        >
          Generate precise sound frequencies &mdash; binaural beats, Solfeggio tones, Schumann resonance, and more &mdash; directly in your browser. No apps. No downloads. Just sound.
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-8 animate-fade-in" style={{ animationDelay: '0.6s', opacity: 0 }}>
          <Link
            to="/library"
            className="inline-flex items-center justify-center font-body uppercase text-white no-underline"
            style={{
              background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.12em',
              padding: '16px 32px',
              borderRadius: 8,
            }}
          >
            EXPLORE FREQUENCIES
          </Link>
          <Link
            to="/player"
            className="font-body no-underline"
            style={{
              color: '#EC9247',
              fontSize: 14,
              fontWeight: 400,
            }}
          >
            Or start a quick session &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── How It Works Section ──────────────────────── */
const steps = [
  {
    icon: <ChooseIcon />,
    title: 'CHOOSE YOUR FREQUENCY',
    body: 'Browse our library of sound frequencies \u2014 from ancient Solfeggio scales to modern binaural beat patterns organized by brainwave state.',
  },
  {
    icon: <ListenIcon />,
    title: 'LISTEN & EXPERIENCE',
    body: 'Our Web Audio engine generates precise frequencies in real-time. Experience binaural entrainment, isochronic pulses, and resonant tones through any headphones or speakers.',
  },
  {
    icon: <FeelIcon />,
    title: 'TRACK YOUR PROGRESS',
    body: 'Save your favorite sessions, set daily listening goals, and track how different frequencies affect your focus, sleep, and wellbeing over time.',
  },
];

function HowItWorksSection() {
  const { ref, revealed } = useScrollReveal();

  return (
    <section className="bg-white" style={{ padding: '80px 24px' }}>
      <div className="mx-auto" style={{ maxWidth: 1280 }} ref={ref}>
        {/* Section label */}
        <p
          className={
            'font-hero uppercase text-center transition-all duration-[800ms] ' +
            (revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[40px]')
          }
          style={{
            color: '#EC9247',
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: '0.15em',
            lineHeight: 1.5,
          }}
        >
          HOW IT WORKS
        </p>
        {/* Headline */}
        <h2
          className={
            'font-hero uppercase text-center mt-4 transition-all duration-[800ms] ' +
            (revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[40px]')
          }
          style={{
            color: '#331D01',
            fontSize: 40,
            fontWeight: 400,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          Three Steps to Practice
        </h2>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className={
                'flex flex-col items-center text-center transition-all duration-[800ms] ' +
                (revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[40px]')
              }
              style={{
                transitionDelay: revealed ? `${(i + 1) * 0.15}s` : '0s',
              }}
            >
              <div className="mb-6">{step.icon}</div>
              <h3
                className="font-hero uppercase"
                style={{
                  color: '#331D01',
                  fontSize: 20,
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  lineHeight: 1.2,
                }}
              >
                {step.title}
              </h3>
              <p
                className="font-body mt-3"
                style={{
                  color: 'rgba(51,29,1,0.6)',
                  fontSize: 16,
                  fontWeight: 300,
                  lineHeight: 1.7,
                }}
              >
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── Frequency Systems Section ──────────────────────── */
function FrequencySystemsSection() {
  const { ref, revealed } = useScrollReveal();

  return (
    <section className="bg-peach-cream" style={{ padding: '80px 24px' }}>
      <div className="mx-auto" style={{ maxWidth: 1280 }} ref={ref}>
        <p
          className={
            'font-hero uppercase text-center transition-all duration-[800ms] ' +
            (revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[40px]')
          }
          style={{
            color: '#EC9247',
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: '0.15em',
            lineHeight: 1.5,
          }}
        >
          FREQUENCY SYSTEMS
        </p>
        <h2
          className={
            'font-hero uppercase text-center mt-4 transition-all duration-[800ms] ' +
            (revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[40px]')
          }
          style={{
            color: '#331D01',
            fontSize: 40,
            fontWeight: 400,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          Five Modalities, Infinite Possibilities
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-16">
          {frequencyGroups.map((group, i) => (
            <div
              key={group.id}
              className={
                'group bg-pale-cream rounded-lg transition-all duration-300 hover:-translate-y-[2px] hover:shadow-card-hover ' +
                (revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[40px]')
              }
              style={{
                padding: 24,
                boxShadow: '0 2px 8px rgba(51,29,1,0.04)',
                transitionProperty: 'opacity, transform, box-shadow',
                transitionDuration: '800ms',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.4, 1)',
                transitionDelay: revealed ? `${(i + 1) * 0.1}s` : '0s',
              }}
            >
              {/* Category tag */}
              <span
                className="inline-block font-body uppercase"
                style={{
                  background: '#F0EDED',
                  color: '#EC9247',
                  fontSize: 12,
                  fontWeight: 400,
                  letterSpacing: '0.08em',
                  padding: '6px 12px',
                  borderRadius: 4,
                  marginBottom: 12,
                }}
              >
                {group.tag}
              </span>
              {/* Frequency badge */}
              <p
                className="font-body uppercase mt-2"
                style={{
                  color: '#EC9247',
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                }}
              >
                {group.frequencyBadge}
              </p>
              {/* Title */}
              <h3
                className="font-hero uppercase mt-3"
                style={{
                  color: '#331D01',
                  fontSize: 20,
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  lineHeight: 1.2,
                }}
              >
                {group.name.toUpperCase()}
              </h3>
              {/* Description */}
              <p
                className="font-body mt-3"
                style={{
                  color: 'rgba(51,29,1,0.6)',
                  fontSize: 14,
                  fontWeight: 300,
                  lineHeight: 1.7,
                }}
              >
                {group.description}
              </p>
              {/* CTA */}
              <Link
                to={`/library?${group.id}`}
                className="inline-block font-body no-underline mt-4 transition-colors duration-200 hover:underline"
                style={{
                  color: '#EC9247',
                  fontSize: 14,
                  fontWeight: 400,
                }}
              >
                Explore &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── Featured Categories Section ──────────────────────── */
const featuredCards = [
  {
    image: '/category-binaural.png',
    tag: 'BINAURAL BEATS',
    title: 'SLEEP & DEEP REST',
    description: 'Delta wave frequencies (0.5\u20134Hz) to guide your brain into deep, restorative sleep states.',
    link: '/library?binaural',
  },
  {
    image: '/category-isochronic.png',
    tag: 'ISOCHRONIC TONES',
    title: 'FOCUS & FLOW',
    description: 'Beta-range stimulation (14\u201330Hz) combined with gamma bursts for sustained concentration.',
    link: '/library?isochronic',
  },
  {
    image: '/category-solfeggio.png',
    tag: 'SOLFEGGIO',
    title: 'MEDITATION & MINDFULNESS',
    description: 'Theta-range binaural beats (4\u20138Hz) paired with ancient Solfeggio tones for deep meditative states.',
    link: '/library?solfeggio',
  },
  {
    image: '/category-schumann.png',
    tag: 'SCHUMANN RESONANCE',
    title: 'GROUNDING & CALM',
    description: "The Earth\u2019s natural 7.83Hz frequency and its harmonics for a profound sense of grounding.",
    link: '/library?schumann',
  },
];

function FeaturedCategoriesSection() {
  const { ref, revealed } = useScrollReveal();

  return (
    <section className="bg-white" style={{ padding: '80px 24px' }}>
      <div className="mx-auto" style={{ maxWidth: 1280 }} ref={ref}>
        <p
          className={
            'font-hero uppercase text-center transition-all duration-[800ms] ' +
            (revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[40px]')
          }
          style={{
            color: '#EC9247',
            fontSize: 12,
            fontWeight: 400,
            letterSpacing: '0.15em',
            lineHeight: 1.5,
          }}
        >
          POPULAR CATEGORIES
        </p>
        <h2
          className={
            'font-hero uppercase text-center mt-4 transition-all duration-[800ms] ' +
            (revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[40px]')
          }
          style={{
            color: '#331D01',
            fontSize: 40,
            fontWeight: 400,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          Where Will You Begin?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {featuredCards.map((card, i) => (
            <Link
              key={card.title}
              to={card.link}
              className={
                'group block no-underline rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-[2px] hover:shadow-card-hover ' +
                (revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[40px]')
              }
              style={{
                transitionProperty: 'opacity, transform, box-shadow',
                transitionDuration: '800ms',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.4, 1)',
                transitionDelay: revealed ? `${(i + 1) * 0.15}s` : '0s',
                boxShadow: '0 2px 8px rgba(51,29,1,0.04)',
              }}
            >
              {/* Image */}
              <div className="overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  style={{ borderRadius: '8px 8px 0 0' }}
                />
              </div>
              {/* Content */}
              <div className="bg-pale-cream" style={{ padding: 24, borderRadius: '0 0 8px 8px' }}>
                <span
                  className="inline-block font-body uppercase"
                  style={{
                    background: '#F0EDED',
                    color: '#EC9247',
                    fontSize: 12,
                    fontWeight: 400,
                    letterSpacing: '0.08em',
                    padding: '6px 12px',
                    borderRadius: 4,
                  }}
                >
                  {card.tag}
                </span>
                <h3
                  className="font-hero uppercase mt-3"
                  style={{
                    color: '#331D01',
                    fontSize: 20,
                    fontWeight: 400,
                    letterSpacing: '0.02em',
                    lineHeight: 1.2,
                  }}
                >
                  {card.title}
                </h3>
                <p
                  className="font-body mt-2"
                  style={{
                    color: 'rgba(51,29,1,0.6)',
                    fontSize: 14,
                    fontWeight: 300,
                    lineHeight: 1.7,
                  }}
                >
                  {card.description}
                </p>
                <span
                  className="inline-block font-body mt-3 transition-colors duration-200 group-hover:underline"
                  style={{
                    color: '#EC9247',
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Explore &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── CTA Banner Section ──────────────────────── */
function CTABannerSection() {
  const { ref, revealed } = useScrollReveal();

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F0EDED 50%, #FFF8F0 100%)',
        padding: '80px 24px',
      }}
    >
      <SineWaveBg />
      <div className="mx-auto text-center relative z-10" style={{ maxWidth: 1280 }} ref={ref}>
        <h2
          className={
            'font-hero uppercase transition-all duration-[800ms] ' +
            (revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[40px]')
          }
          style={{
            color: '#331D01',
            fontSize: 40,
            fontWeight: 400,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          Your Frequency Awaits
        </h2>
        <p
          className={
            'font-body mx-auto mt-6 transition-all duration-[800ms] ' +
            (revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[40px]')
          }
          style={{
            color: 'rgba(51,29,1,0.6)',
            fontSize: 16,
            fontWeight: 300,
            lineHeight: 1.7,
            maxWidth: 560,
            transitionDelay: revealed ? '0.2s' : '0s',
          }}
        >
          Begin with our curated frequency library or dive straight into a personalized listening session. Every tone is generated in real-time &mdash; precise, pure, and purpose-built.
        </p>
        <div
          className={
            'flex flex-wrap items-center justify-center gap-4 mt-8 transition-all duration-[800ms] ' +
            (revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[20px]')
          }
          style={{
            transitionDelay: revealed ? '0.3s' : '0s',
          }}
        >
          <Link
            to="/library"
            className="inline-flex items-center justify-center font-body uppercase text-white no-underline transition-all duration-200 hover:scale-[1.02] hover:shadow-sage-glow active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.12em',
              padding: '16px 32px',
              borderRadius: 8,
            }}
          >
            EXPLORE THE LIBRARY
          </Link>
          <Link
            to="/player"
            className="inline-flex items-center justify-center font-body uppercase no-underline transition-all duration-200 hover:bg-[rgba(236,146,71,0.06)] hover:border-sage-green"
            style={{
              background: 'transparent',
              border: '1px solid #331D01',
              color: '#331D01',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.12em',
              padding: '14px 30px',
              borderRadius: 8,
            }}
          >
            START A SESSION
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────── Home Page ──────────────────────── */
export default function Home() {
  return (
    <div>
      <HeroSection />
      <HowItWorksSection />
      <FrequencySystemsSection />
      <FeaturedCategoriesSection />
      <CTABannerSection />
    </div>
  );
}
