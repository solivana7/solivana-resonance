import { Link } from 'react-router-dom';

const externalLinks = [
  { label: 'SoliVana', href: 'https://solivana.com' },
  { label: 'Privacy', href: 'https://tools.solivana.io/privacy' },
  { label: 'Terms', href: 'https://tools.solivana.io/terms' },
  { label: 'AI Disclosure', href: 'https://tools.solivana.io/privacy#ai' },
];

export default function Footer() {
  return (
    <footer className="bg-brown px-6 md:px-12 lg:px-20" style={{ paddingTop: 60, paddingBottom: 40 }}>
      <div className="mx-auto grid grid-cols-1 md:grid-cols-3 gap-12" style={{ maxWidth: 1280 }}>
        {/* Brand Column */}
        <div className="flex flex-col gap-4">
          <span
            className="font-hero uppercase flex flex-col sm:flex-row sm:items-center sm:gap-2"
            style={{
              color: '#F0EDED',
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: '0.08em',
            }}
          >
            SoliVana
            <span style={{ color: '#EC9247', fontSize: 11, letterSpacing: '0.22em', fontWeight: 400 }}>
              <span className="hidden sm:inline">·&nbsp;</span>RESONANCE
            </span>
          </span>
          <p
            className="font-body"
            style={{
              color: 'rgba(240,237,237,0.7)',
              fontSize: 14,
              fontWeight: 300,
              lineHeight: 1.7,
              maxWidth: 320,
            }}
          >
            Precise sound frequencies — binaural beats, Solfeggio tones, Schumann resonance, and color noise — generated directly in your browser. By SoliVana Wellness.
          </p>
        </div>

        {/* Explore Column */}
        <div className="flex flex-col gap-4">
          <h4
            className="font-hero uppercase"
            style={{
              color: '#F0EDED',
              opacity: 0.8,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.22em',
              marginBottom: 4,
            }}
          >
            Explore
          </h4>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Home', path: '/' },
              { label: 'Library', path: '/library' },
              { label: 'Player', path: '/player' },
              { label: 'Dashboard', path: '/dashboard' },
            ].map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="font-body no-underline transition-colors duration-200 hover:text-accent"
                style={{
                  color: 'rgba(240,237,237,0.85)',
                  fontSize: 14,
                  fontWeight: 300,
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* SoliVana Column */}
        <div className="flex flex-col gap-4">
          <h4
            className="font-hero uppercase"
            style={{
              color: '#F0EDED',
              opacity: 0.8,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.22em',
              marginBottom: 4,
            }}
          >
            SoliVana
          </h4>
          <div className="flex flex-col gap-3">
            {externalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body no-underline transition-colors duration-200 hover:text-accent"
                style={{
                  color: 'rgba(240,237,237,0.85)',
                  fontSize: 14,
                  fontWeight: 300,
                }}
              >
                {link.label}
              </a>
            ))}
            <a
              href="mailto:info@solivana.com"
              className="font-body no-underline transition-colors duration-200 hover:text-accent"
              style={{
                color: 'rgba(240,237,237,0.85)',
                fontSize: 14,
                fontWeight: 300,
              }}
            >
              Support
            </a>
          </div>
        </div>
      </div>

      {/* Disclaimer + copyright */}
      <div
        className="mx-auto mt-12 pt-6 border-t flex flex-col gap-4"
        style={{
          maxWidth: 1280,
          borderColor: 'rgba(240,237,237,0.15)',
        }}
      >
        <p
          className="font-body"
          style={{
            color: 'rgba(240,237,237,0.55)',
            fontSize: 12,
            fontWeight: 300,
            lineHeight: 1.7,
            maxWidth: 920,
          }}
        >
          SoliVana Resonance generates sound waves for personal listening. It is not a medical device and is not intended to diagnose, treat, cure, or prevent any disease. The FDA has not evaluated any statements presented. Use at a comfortable volume; remove headphones if you feel any discomfort. If you have a medical condition, talk to your provider before changing what you listen to.
        </p>
        <p
          className="font-body"
          style={{
            color: 'rgba(240,237,237,0.45)',
            fontSize: 12,
            fontWeight: 300,
          }}
        >
          &copy; {new Date().getFullYear()} SoliVana Wellness. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
