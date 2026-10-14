import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

function LogoIcon() {
  return (
    <svg aria-hidden="true" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" stroke="#331D01" strokeWidth="1.5" fill="none" />
      <path
        d="M11 20C11 20 14 12 20 12C26 12 29 20 29 20C29 20 26 28 20 28C14 28 11 20 11 20Z"
        stroke="#331D01"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 20 Q14 8, 20 20 Q26 32, 32 20"
        stroke="#331D01"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Library', path: '/library' },
    { label: 'Player', path: '/player' },
    { label: 'Dashboard', path: '/dashboard' },
  ];

  return (
    <nav
      className={
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ' +
        (scrolled
          ? 'bg-white shadow-[0_1px_8px_rgba(51,29,1,0.08)]'
          : 'bg-transparent')
      }
      style={{ height: 72 }}
    >
      <div className="mx-auto flex items-center justify-between h-full px-6 md:px-12 lg:px-20" style={{ maxWidth: 1280 }}>
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 no-underline">
          <LogoIcon />
          <span
            className="font-hero text-brown tracking-wide flex items-center gap-2"
            style={{ fontSize: 14, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}
          >
            SOLIVANA
            <span className="font-hero text-accent" style={{ fontSize: 10, letterSpacing: '0.22em', fontWeight: 400 }}>
              · RESONANCE
            </span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={
                'font-body no-underline transition-colors duration-200 uppercase ' +
                (location.pathname === link.path
                  ? 'text-sage-green'
                  : 'text-brown-primary hover:text-sage-green')
              }
              style={{ fontSize: 13, fontWeight: 400, letterSpacing: '0.08em' }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA — hidden on /player since user is already mid-session there */}
        {location.pathname !== '/player' && (
          <Link
            to="/player"
            className="hidden md:inline-flex items-center justify-center font-body uppercase text-white no-underline transition-all duration-200 hover:scale-[1.02] hover:shadow-sage-glow active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.12em',
              padding: '12px 28px',
              borderRadius: 8,
            }}
          >
            Start Session
          </Link>
        )}

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col gap-[5px] p-2 bg-transparent border-none cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={
              'block w-5 h-[1.5px] bg-brown-primary transition-transform duration-300 origin-center ' +
              (mobileOpen ? 'rotate-45 translate-y-[6.5px]' : '')
            }
          />
          <span
            className={
              'block w-5 h-[1.5px] bg-brown-primary transition-opacity duration-300 ' +
              (mobileOpen ? 'opacity-0' : '')
            }
          />
          <span
            className={
              'block w-5 h-[1.5px] bg-brown-primary transition-transform duration-300 origin-center ' +
              (mobileOpen ? '-rotate-45 -translate-y-[6.5px]' : '')
            }
          />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={
          'md:hidden overflow-hidden transition-all duration-300 bg-white shadow-lg ' +
          (mobileOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0')
        }
      >
        <div className="flex flex-col items-center gap-6 py-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={
                'font-body no-underline uppercase transition-colors ' +
                (location.pathname === link.path
                  ? 'text-sage-green'
                  : 'text-brown-primary hover:text-sage-green')
              }
              style={{ fontSize: 13, fontWeight: 400, letterSpacing: '0.08em' }}
            >
              {link.label}
            </Link>
          ))}
          {location.pathname !== '/player' && (
            <Link
              to="/player"
              className="inline-flex items-center justify-center font-body uppercase text-white no-underline"
              style={{
                background: 'linear-gradient(135deg, #EC9247, #D67A2F)',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.12em',
                padding: '12px 28px',
                borderRadius: 8,
              }}
            >
              Start Session
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
