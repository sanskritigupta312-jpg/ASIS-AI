import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const STUDIO_ITEMS = [
  { icon: '📐', label: 'Example Gallery',    sub: 'Browse real 3D models',          to: '/studio' },
  { icon: '📦', label: '3D Model Viewer',    sub: 'Interactive floor plan preview',  to: '/studio/viewer' },
  { icon: '🧱', label: 'Material Analysis',  sub: 'Wall type recommendations',       to: '/studio/materials' },
];

const NAV_LINKS = [
  { label: 'Home', to: '/' },
];

export default function Header() {
  const { pathname } = useLocation();
  const [studioOpen, setStudioOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setStudioOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close on route change
  useEffect(() => {
    setStudioOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const isStudio = pathname.startsWith('/studio');

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ paddingTop: scrolled ? '8px' : '16px', paddingBottom: scrolled ? '8px' : '0' }}
      >
        <div className="max-w-5xl mx-auto px-4" style={{ transition: 'all .3s' }}>
          <div
            className="flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300"
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

            {/* ── Desktop Nav ── */}
            <nav className="hidden md:flex items-center gap-1" ref={dropRef}>
              <Link
                to="/"
                className="px-4 py-2 rounded-xl transition-all"
                style={{
                  fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none',
                  background: pathname === '/' ? 'var(--bg-2)' : 'transparent',
                  color: pathname === '/' ? 'var(--accent)' : 'var(--text-2)',
                }}
              >
                Home
              </Link>

              {/* Studio dropdown */}
              <div className="relative">
                <button
                  onClick={() => setStudioOpen(v => !v)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all"
                  style={{
                    fontSize: '0.82rem', fontWeight: 600,
                    background: isStudio || studioOpen ? 'var(--bg-2)' : 'transparent',
                    color: isStudio || studioOpen ? 'var(--accent)' : 'var(--text-2)',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  Studio
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                    style={{ transform: studioOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {studioOpen && (
                  <div
                    className="absolute top-full mt-2 right-0 rounded-2xl overflow-hidden"
                    style={{
                      width: '300px', background: 'white',
                      border: '1px solid var(--border)',
                      boxShadow: '0 16px 48px rgba(29,78,216,.16), 0 4px 12px rgba(29,78,216,.08)',
                      animation: 'fade-up .18s cubic-bezier(.22,1,.36,1) both',
                    }}
                  >
                    <div className="px-4 py-3"
                      style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderBottom: '1px solid var(--border)' }}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>ASIS AI Studio</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-2)', marginTop: '2px' }}>Explore examples & features</p>
                    </div>
                    <div className="p-2">
                      {STUDIO_ITEMS.map(item => (
                        <Link key={item.label} to={item.to}
                          className="flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all"
                          style={{ textDecoration: 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <span className="text-lg leading-none mt-0.5">{item.icon}</span>
                          <div>
                            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>{item.label}</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '1px' }}>{item.sub}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', padding: '10px 12px' }}>
                      <Link to="/app"
                        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl font-semibold transition-all"
                        style={{ fontSize: '0.8rem', background: 'var(--accent)', color: 'white', textDecoration: 'none', boxShadow: '0 2px 8px rgba(29,78,216,.3)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}>
                        Upload & Analyse Now
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

              <Link to="/app" className="btn-primary"
                style={{ padding: '0.42rem 1.1rem', fontSize: '0.78rem', marginLeft: '4px' }}>
                Launch Analysis
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </nav>

            {/* ── Mobile hamburger ── */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-xl gap-1.5 transition-all"
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
              style={{
                background: mobileOpen ? 'var(--bg-2)' : 'transparent',
                border: '1px solid var(--border)',
              }}
            >
              <span style={{
                display: 'block', width: 16, height: 2, borderRadius: 2,
                background: 'var(--text-1)',
                transform: mobileOpen ? 'translateY(5px) rotate(45deg)' : 'none',
                transition: 'transform .22s',
              }} />
              <span style={{
                display: 'block', width: 16, height: 2, borderRadius: 2,
                background: 'var(--text-1)',
                opacity: mobileOpen ? 0 : 1,
                transition: 'opacity .22s',
              }} />
              <span style={{
                display: 'block', width: 16, height: 2, borderRadius: 2,
                background: 'var(--text-1)',
                transform: mobileOpen ? 'translateY(-5px) rotate(-45deg)' : 'none',
                transition: 'transform .22s',
              }} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="mobile-drawer md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="mobile-drawer-panel" onClick={e => e.stopPropagation()}>
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
                    <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".55"/>
                    <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".55"/>
                    <rect x="8" y="8" width="5" height="5" rx="1" fill="white"/>
                  </svg>
                </div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)' }}>ASIS AI</p>
              </div>
              <button onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'white', border: '1px solid var(--border)' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="var(--text-2)" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Drawer links */}
            <div className="p-4 space-y-1">
              <Link to="/" style={{ textDecoration: 'none' }}>
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                  style={{ background: pathname === '/' ? 'var(--bg-2)' : 'transparent' }}>
                  <span>🏠</span>
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Home</span>
                </div>
              </Link>

              <p className="label px-3 pt-3 pb-1">Studio</p>
              {STUDIO_ITEMS.map(item => (
                <Link key={item.label} to={item.to} style={{ textDecoration: 'none' }}>
                  <div className="flex items-start gap-3 px-3 py-3 rounded-xl"
                    style={{ background: pathname === item.to ? 'var(--bg-2)' : 'transparent' }}>
                    <span className="text-lg leading-none">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{item.label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)', marginTop: '2px' }}>{item.sub}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Drawer CTA */}
            <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
              <Link to="/app" className="btn-primary w-full justify-center" style={{ fontSize: '0.9rem' }}>
                Launch Analysis
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
