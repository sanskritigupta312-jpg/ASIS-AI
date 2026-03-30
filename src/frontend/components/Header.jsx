import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const STUDIO_ITEMS = [
  { icon: '📐', label: 'Example Gallery',    sub: 'Browse real 3D models',          to: '/studio' },
  { icon: '📦', label: '3D Model Viewer',    sub: 'Interactive floor plan preview',  to: '/studio/viewer' },
  { icon: '🧱', label: 'Material Analysis',  sub: 'Wall type recommendations',       to: '/studio/materials' },
  // { icon: '⛓️', label: 'Blockchain Records', sub: 'Tamper-proof analysis seals', to: '/studio/blockchain' }, // commented out
];

export default function Header() {
  const { pathname } = useLocation();
  const [studioOpen, setStudioOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const dropRef = useRef(null);

  // Scroll detection for background change
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setStudioOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on route change
  useEffect(() => { setStudioOpen(false); }, [pathname]);

  const isStudio = pathname.startsWith('/studio');
  const isApp    = pathname === '/app';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{ paddingTop: scrolled ? '8px' : '16px', paddingBottom: scrolled ? '8px' : '0' }}
    >
      <div
        className="max-w-5xl mx-auto px-4"
        style={{ transition: 'all .3s' }}
      >
        <div
          className="flex items-center justify-between px-5 py-3 rounded-2xl transition-all duration-300"
          style={{
            background: scrolled ? 'rgba(255,255,255,.97)' : 'rgba(255,255,255,.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            boxShadow: scrolled
              ? '0 4px 24px rgba(29,78,216,.12), 0 1px 4px rgba(29,78,216,.06)'
              : '0 2px 12px rgba(29,78,216,.08)',
          }}
        >
          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 2px 10px rgba(29,78,216,.35)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".55"/>
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".55"/>
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white"/>
              </svg>
            </div>
            <div className="leading-none">
              <p style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', lineHeight: 1 }}>
                ASIS AI
              </p>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1, marginTop: '3px' }}>
                Floor Intelligence
              </p>
            </div>
          </Link>

          {/* ── Nav ── */}
          <nav className="flex items-center gap-1" ref={dropRef}>

            {/* Home */}
            <Link
              to="/"
              className="px-4 py-2 rounded-xl transition-all"
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
                background: pathname === '/' ? 'var(--bg-2)' : 'transparent',
                color: pathname === '/' ? 'var(--accent)' : 'var(--text-2)',
              }}
            >
              Home
            </Link>

            {/* Studio dropdown trigger */}
            <div className="relative">
              <button
                onClick={() => setStudioOpen(v => !v)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  background: isStudio || studioOpen ? 'var(--bg-2)' : 'transparent',
                  color: isStudio || studioOpen ? 'var(--accent)' : 'var(--text-2)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Studio
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  style={{ transform: studioOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Dropdown */}
              {studioOpen && (
                <div
                  className="absolute top-full mt-2 right-0 rounded-2xl overflow-hidden"
                  style={{
                    width: '300px',
                    background: 'white',
                    border: '1px solid var(--border)',
                    boxShadow: '0 16px 48px rgba(29,78,216,.16), 0 4px 12px rgba(29,78,216,.08)',
                    animation: 'fade-up .18s cubic-bezier(.22,1,.36,1) both',
                  }}
                >
                  {/* Dropdown header */}
                  <div
                    className="px-4 py-3"
                    style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderBottom: '1px solid var(--border)' }}
                  >
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      ASIS AI Studio
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginTop: '2px' }}>
                      Explore examples & features
                    </p>
                  </div>

                  {/* Items */}
                  <div className="p-2">
                    {STUDIO_ITEMS.map(item => (
                      <Link
                        key={item.label}
                        to={item.to}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all"
                        style={{ textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span className="text-lg leading-none mt-0.5">{item.icon}</span>
                        <div>
                          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>{item.label}</p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '1px' }}>{item.sub}</p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Footer link */}
                  <div style={{ borderTop: '1px solid var(--border)', padding: '10px 12px' }}>
                    <Link
                      to="/app"
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-xl font-semibold transition-all"
                      style={{
                        fontSize: '0.8rem',
                        background: 'var(--accent)',
                        color: 'white',
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(29,78,216,.3)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
                    >
                      Upload & Analyse Now
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

            {/* Launch Analysis CTA */}
            <Link
              to="/studio"
              className="btn-primary"
              style={{ padding: '0.42rem 1.1rem', fontSize: '0.78rem', marginLeft: '4px' }}
            >
              Launch Analysis
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
