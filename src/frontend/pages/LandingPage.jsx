import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const steps = [
  { n: '01', title: 'Upload',          desc: 'Drop your floor plan image — PNG or JPG accepted.' },
  { n: '02', title: 'Edge Detection',  desc: 'OpenCV scans every pixel to extract walls, lines, and boundaries.' },
  { n: '03', title: 'Layout Analysis', desc: 'Rooms, outer walls, and inner partitions are classified automatically.' },
  { n: '04', title: '3D Generation',   desc: 'A full 3D model is extruded from the 2D layout in real time.' },
  { n: '05', title: 'Material Logic',  desc: 'AI recommends optimal materials per wall type and load requirement.' },
  { n: '06', title: 'Blockchain Seal', desc: 'The analysis is SHA-256 hashed and recorded on an immutable chain.' },
];

const features = [
  { emoji: '🏗️', title: 'Outer & Inner Walls',  desc: 'Automatically distinguishes load-bearing outer walls from interior partitions.' },
  { emoji: '🏠', title: 'Room Detection',        desc: 'Identifies individual rooms and calculates approximate area in m².' },
  { emoji: '🧱', title: 'Material Intelligence', desc: 'Strength-to-cost scoring picks the best material for every wall segment.' },
  { emoji: '📦', title: 'Interactive 3D Viewer', desc: 'Orbit, zoom, and inspect the generated model directly in the browser.' },
  { emoji: '⛓️', title: 'Blockchain Record',     desc: 'Every analysis is SHA-256 hashed and chained — tamper-proof by design.' },
  { emoji: '📄', title: 'PDF Export',            desc: 'Download a full report with 3D screenshot, wall tables, room areas, and chain proof.' },
];

const stats = [
  { value: '< 10s',   label: 'Processing time' },
  { value: '6',       label: 'Pipeline stages' },
  { value: '100%',    label: 'Browser-native'  },
  { value: 'SHA-256', label: 'Hash algorithm'  },
];

/* ── Floating blueprint card (decorative) ─────────────────────────────────── */
const BlueprintCard = ({ style, lines }) => (
  <div
    className="absolute rounded-2xl pointer-events-none select-none"
    style={{
      border: '1px solid rgba(147,197,253,.25)',
      background: 'rgba(15,36,96,.55)',
      backdropFilter: 'blur(6px)',
      padding: '14px 18px',
      ...style,
    }}
  >
    {lines.map((l, i) => (
      <div key={i} className="flex items-center gap-2 mb-1.5 last:mb-0">
        <span style={{ width: l.w, height: 2, background: l.c, borderRadius: 2, display: 'block', flexShrink: 0 }} />
        <span style={{ fontSize: '0.6rem', color: 'rgba(147,197,253,.7)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{l.t}</span>
      </div>
    ))}
  </div>
);

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text-1)' }} className="min-h-screen">
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hero-bg pt-36 pb-32 px-6">
        <div className="max-w-5xl mx-auto relative">

          {/* Floating decorative blueprint cards */}
          <BlueprintCard
            style={{ top: '10px', right: '0px', opacity: 0.85, animation: 'float 6s ease-in-out infinite' }}
            lines={[
              { w: 48, c: '#60a5fa', t: 'outer_wall · Red Brick' },
              { w: 32, c: '#93c5fd', t: 'inner_wall · Fly Ash' },
              { w: 20, c: '#bfdbfe', t: 'floor_slab · RCC' },
            ]}
          />
          <BlueprintCard
            style={{ bottom: '80px', right: '60px', opacity: 0.7, animation: 'float 8s ease-in-out infinite reverse' }}
            lines={[
              { w: 36, c: '#34d399', t: 'rooms: 5 detected' },
              { w: 28, c: '#60a5fa', t: 'area: 387.09 m²' },
              { w: 22, c: '#a78bfa', t: 'block #42 · valid' },
            ]}
          />

          {/* Badge */}
          <div className="anim-fade-up">
            <span className="badge mb-8" style={{ background: 'rgba(96,165,250,.15)', color: '#93c5fd', border: '1px solid rgba(96,165,250,.3)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#60a5fa' }} />
              AI-Powered Floor Plan Analysis
            </span>
          </div>

          {/* Headline */}
          <h1 className="display anim-fade-up anim-delay-1" style={{ color: 'white', maxWidth: '680px' }}>
            Turn blueprints<br />
            <span style={{ color: '#60a5fa' }}>into intelligence.</span>
          </h1>

          {/* Sub */}
          <p className="mt-6 anim-fade-up anim-delay-2" style={{ fontSize: '1.1rem', color: 'rgba(191,219,254,.85)', lineHeight: 1.75, maxWidth: '520px' }}>
            Upload a floor plan. ASIS AI detects walls, classifies rooms, generates a 3D model,
            recommends materials, and seals the result on a blockchain — all in seconds.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mt-10 anim-fade-up anim-delay-3">
            <Link to="/studio" className="btn-primary" style={{ background: '#2563eb', boxShadow: '0 4px 20px rgba(37,99,235,.5)' }}>
              Start Analysis
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full text-sm transition-all"
              style={{ background: 'rgba(255,255,255,.08)', color: '#bfdbfe', border: '1px solid rgba(147,197,253,.25)', backdropFilter: 'blur(8px)' }}
            >
              See how it works
            </a>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 anim-fade-up anim-delay-4">
            {stats.map(({ value, label }) => (
              <div
                key={label}
                className="text-center rounded-2xl py-5 px-4"
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(147,197,253,.18)', backdropFilter: 'blur(8px)' }}
              >
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#93c5fd', letterSpacing: '-0.02em' }}>{value}</p>
                <p style={{ fontSize: '0.7rem', color: 'rgba(147,197,253,.6)', marginTop: '4px', letterSpacing: '0.06em' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6" style={{ background: 'white' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="label mb-3">Process</p>
            <h2 className="heading" style={{ color: 'var(--text-1)' }}>How it works</h2>
            <p className="mt-3 text-sm max-w-lg" style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
              Six automated stages take your image from raw pixels to a verified 3D model.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((s, i) => (
              <div key={s.n} className="card card-hover p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold"
                    style={{ background: i === 5 ? '#dbeafe' : 'var(--bg-2)', color: 'var(--accent)', border: '1.5px solid var(--border)' }}
                  >
                    {s.n}
                  </span>
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{s.title}</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: 'var(--bg)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="label mb-3">Capabilities</p>
            <h2 className="heading" style={{ color: 'var(--text-1)' }}>Everything you need</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="card card-hover p-6" style={{ background: 'white' }}>
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 text-xl"
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
                >
                  {f.emoji}
                </div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-1)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: 'white' }}>
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-3xl p-14 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0c1a3a 0%, #0f2460 50%, #1a3a7a 100%)',
              boxShadow: '0 20px 60px rgba(12,26,58,.4)',
            }}
          >
            {/* Blueprint grid overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(rgba(147,197,253,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(147,197,253,.08) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(96,165,250,.2) 0%, transparent 70%)' }} />

            <div className="relative z-10">
              <span className="badge mb-6" style={{ background: 'rgba(96,165,250,.15)', color: '#93c5fd', border: '1px solid rgba(96,165,250,.3)' }}>
                Ready to try?
              </span>
              <h2 className="heading mb-4" style={{ color: 'white' }}>Upload your first floor plan</h2>
              <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: 'rgba(191,219,254,.7)', lineHeight: 1.7 }}>
                No account needed. Drop an image and watch the full pipeline run automatically.
              </p>
              <Link
                to="/studio"
                className="inline-flex items-center gap-2 font-bold px-8 py-3.5 rounded-full text-sm transition-all"
                style={{ background: '#2563eb', color: 'white', boxShadow: '0 4px 24px rgba(37,99,235,.5)' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'none'; }}
              >
                Launch Studio
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
