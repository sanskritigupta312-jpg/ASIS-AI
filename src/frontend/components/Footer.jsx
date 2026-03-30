import { Link } from 'react-router-dom';

const COL_LINKS = [
  {
    heading: 'Product',
    links: [
      { label: 'Launch Studio',   to: '/app' },
      { label: 'How It Works',    href: '/#how-it-works' },
      { label: 'Features',        href: '/#features' },
    ],
  },
  {
    heading: 'Technology',
    links: [
      { label: 'OpenCV Pipeline',  href: '#' },
      { label: '3D Generation',    href: '#' },
      // { label: 'Blockchain Seal',  href: '#' },
    ],
  },
  {
    heading: 'Output',
    links: [
      { label: 'PDF Report',       href: '#' },
      { label: 'OBJ Model Export', href: '#' },
      { label: 'Material Analysis',href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: 'linear-gradient(160deg, #080f20 0%, #0c1a3a 60%, #0f2050 100%)',
        borderTop: '1px solid rgba(147,197,253,.12)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle blueprint grid */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(147,197,253,.05) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(147,197,253,.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-5xl mx-auto px-6 relative" style={{ zIndex: 1 }}>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 py-14">

          {/* Brand column */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 4px 14px rgba(37,99,235,.45)' }}
              >
                <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
                  <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".55"/>
                  <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".55"/>
                  <rect x="8" y="8" width="5" height="5" rx="1" fill="white"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#60a5fa', lineHeight: 1 }}>ASIS AI</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', lineHeight: 1, marginTop: 3 }}>Floor Intelligence</p>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'rgba(147,197,253,.65)', lineHeight: 1.7, maxWidth: '220px' }}>
              AI-powered floor plan analysis — from image to verified 3D model in seconds.
            </p>

            {/* Tech badges */}
            <div className="flex flex-wrap gap-2">
              {['React', 'OpenCV', 'Three.js', 'Blockchain'].map(t => (
                <span
                  key={t}
                  style={{
                    fontSize: '0.62rem', fontWeight: 600,
                    padding: '3px 10px', borderRadius: '100px',
                    background: 'rgba(37,99,235,.18)',
                    border: '1px solid rgba(96,165,250,.22)',
                    color: '#93c5fd',
                    letterSpacing: '0.04em',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COL_LINKS.map(col => (
            <div key={col.heading} className="space-y-4">
              <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(147,197,253,.5)' }}>
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map(({ label, to, href }) => (
                  <li key={label}>
                    {to ? (
                      <Link
                        to={to}
                        style={{ fontSize: '0.85rem', color: 'rgba(191,219,254,.7)', textDecoration: 'none', transition: 'color .15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'white'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(191,219,254,.7)'}
                      >
                        {label}
                      </Link>
                    ) : (
                      <a
                        href={href}
                        style={{ fontSize: '0.85rem', color: 'rgba(191,219,254,.7)', textDecoration: 'none', transition: 'color .15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'white'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(191,219,254,.7)'}
                      >
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Divider ── */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(147,197,253,.18), transparent)' }} />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6">
          <p style={{ fontSize: '0.78rem', color: 'rgba(147,197,253,.4)' }}>
            © 2026 ASIS AI. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#22c55e' }}
            />
            <p style={{ fontSize: '0.78rem', color: 'rgba(147,197,253,.4)' }}>
              All systems operational
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
