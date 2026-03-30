import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThreeDViewer from '../components/ThreeDViewer';

const EXAMPLES = [
  {
    id: 1,
    name: 'Compact 2BHK',
    desc: '2 bedrooms, kitchen, bathroom — 387 m² plan',
    rooms: 5,
    walls: 12,
    area: '387 m²',
    modelUrl: '/outputs/example_2bhk.obj',
    tag: 'Residential',
    tagColor: '#dbeafe',
    tagText: '#1d4ed8',
  },
  {
    id: 2,
    name: 'Open Floor Plan',
    desc: 'Large living space with minimal partitions',
    rooms: 4,
    walls: 10,
    area: '310 m²',
    modelUrl: '/outputs/example_open.obj',
    tag: 'Modern',
    tagColor: '#dcfce7',
    tagText: '#15803d',
  },
  {
    id: 3,
    name: 'Multi-Room Layout',
    desc: '3 bedrooms, 2 bathrooms, dining room',
    rooms: 8,
    walls: 18,
    area: '420 m²',
    modelUrl: '/outputs/multi_room_v2.obj',
    tag: 'Family',
    tagColor: '#fef3c7',
    tagText: '#92400e',
  },
];

const FEATURES = [
  { icon: '🔍', title: 'Edge Detection',     desc: 'Canny algorithm extracts every wall line from your image with pixel precision.' },
  { icon: '🏠', title: 'Room Classification', desc: 'Living room, bedroom, kitchen, bathroom — automatically identified and sized.' },
  { icon: '📐', title: 'Area Calculation',    desc: 'Each room gets an approximate area in m² based on detected boundaries.' },
  { icon: '📦', title: '3D Extrusion',        desc: 'Walls are extruded to 3m height and rendered as an interactive 3D model.' },
  { icon: '🧱', title: 'Material Logic',      desc: 'Outer walls get Red Brick, inner walls get Fly Ash — based on structural role.' },
  { icon: '⛓️', title: 'Blockchain Seal',     desc: 'Every analysis is SHA-256 hashed and recorded on an immutable chain.' },
  { icon: '📄', title: 'PDF Report',          desc: 'Download a full report with 3D screenshot, wall tables, and room areas.' },
  { icon: '🔗', title: 'OBJ Export',          desc: 'Download the generated 3D model as a Wavefront OBJ file.' },
];

function ExampleCard({ ex, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-4 transition-all"
      style={{
        background: active ? 'var(--accent-lt)' : 'white',
        border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: active ? '0 0 0 3px rgba(29,78,216,.10)' : 'none',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{ex.name}</p>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: ex.tagColor, color: ex.tagText }}
        >
          {ex.tag}
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>{ex.desc}</p>
      <div className="flex gap-3 text-xs" style={{ color: 'var(--text-2)' }}>
        <span>🏠 {ex.rooms} rooms</span>
        <span>📏 {ex.walls} walls</span>
        <span>📐 {ex.area}</span>
      </div>
    </button>
  );
}

export default function StudioPage() {
  const [active, setActive] = useState(0);
  const ex = EXAMPLES[active];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 space-y-12 sm:space-y-16">

        {/* ── Page header ── */}
        <div className="anim-fade-up">
          <span className="badge badge-blue mb-4">Example Gallery</span>
          <h1 className="heading" style={{ color: 'var(--text-1)' }}>
            See what ASIS AI can do
          </h1>
          <p className="mt-3 max-w-xl" style={{ fontSize: '0.95rem', color: 'var(--text-2)', lineHeight: 1.7 }}>
            Browse real 3D models generated from floor plan images. Interact with them, then upload your own.
          </p>
        </div>

        {/* ── 3D Gallery ── */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-6 anim-fade-up anim-delay-1">

          {/* Sidebar — example selector, stacks above viewer on mobile */}
          <div className="space-y-3">
            <p className="label mb-2">Select Example</p>
            {EXAMPLES.map((e, i) => (
              <ExampleCard key={e.id} ex={e} active={active === i} onClick={() => setActive(i)} />
            ))}

            <Link
              to="/app"
              className="btn-primary w-full justify-center mt-4"
              style={{ fontSize: '0.85rem' }}
            >
              Upload Your Own
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          {/* 3D Viewer */}
          <div className="space-y-4">
            <div className="dark-panel overflow-hidden viewer-auto">
              <ThreeDViewer isLoading={false} previewUrl={ex.modelUrl} />
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Rooms',      value: ex.rooms },
                { label: 'Walls',      value: ex.walls },
                { label: 'Floor Area', value: ex.area  },
              ].map(({ label, value }) => (
                <div key={label} className="card p-4 text-center" style={{ background: 'white' }}>
                  <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{value}</p>
                  <p className="label mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,var(--border),transparent)' }} />

        {/* ── Features grid ── */}
        <div className="anim-fade-up">
          <div className="mb-10">
            <p className="label mb-3">What you get</p>
            <h2 className="heading" style={{ color: 'var(--text-1)' }}>Every analysis includes</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="card card-hover p-5" style={{ background: 'white' }}>
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <h3 className="font-semibold text-sm mb-1.5" style={{ color: 'var(--text-1)' }}>{f.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div
          className="rounded-3xl text-center relative overflow-hidden anim-fade-up"
          style={{
            padding: 'clamp(2rem, 5vw, 3rem) clamp(1.25rem, 5vw, 3rem)',
            background: 'linear-gradient(135deg,#0c1a3a 0%,#0f2460 50%,#1a3a7a 100%)',
            boxShadow: '0 20px 60px rgba(12,26,58,.35)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(147,197,253,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(147,197,253,.07) 1px,transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative z-10">
            <h2 className="heading mb-3" style={{ color: 'white' }}>Ready to analyse your floor plan?</h2>
            <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: 'rgba(191,219,254,.7)', lineHeight: 1.7 }}>
              Upload any floor plan image and get a full 3D model, room analysis, material recommendations, and blockchain record in seconds.
            </p>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 font-bold px-8 py-3.5 rounded-full text-sm"
              style={{ background: '#2563eb', color: 'white', boxShadow: '0 4px 24px rgba(37,99,235,.5)', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.transform = 'none'; }}
            >
              Start Your Analysis
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
