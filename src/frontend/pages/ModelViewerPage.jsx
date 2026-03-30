import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ThreeDViewer from '../components/ThreeDViewer';

const MODELS = [
  { label: 'Compact 2BHK',      url: '/outputs/example_2bhk.obj' },
  { label: 'Open Floor Plan',   url: '/outputs/example_open.obj' },
  { label: 'Multi-Room Layout', url: '/outputs/multi_room_v2.obj' },
];

const CONTROLS = [
  { key: 'Left drag',   action: 'Rotate the model' },
  { key: 'Scroll',      action: 'Zoom in / out' },
  { key: 'Right drag',  action: 'Pan the view' },
  { key: 'View buttons','action': 'Switch to Top / Front / Side' },
  { key: 'Auto button', action: 'Toggle auto-rotation' },
];

export default function ModelViewerPage() {
  const [selected, setSelected] = useState(0);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 space-y-8">

        <div className="anim-fade-up">
          <span className="badge badge-blue mb-4">3D Model Viewer</span>
          <h1 className="heading" style={{ color: 'var(--text-1)' }}>Interactive 3D Floor Plan Viewer</h1>
          <p className="mt-2 max-w-lg text-sm" style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
            Explore generated 3D models in full detail. Rotate, zoom, and switch between views to inspect every wall and room.
          </p>
        </div>

        {/* Model selector tabs */}
        <div className="flex gap-2 flex-wrap anim-fade-up anim-delay-1">
          {MODELS.map((m, i) => (
            <button key={m.label} onClick={() => setSelected(i)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: selected === i ? 'var(--accent)' : 'white',
                color: selected === i ? 'white' : 'var(--text-2)',
                border: `1.5px solid ${selected === i ? 'var(--accent)' : 'var(--border)'}`,
                boxShadow: selected === i ? '0 2px 10px rgba(29,78,216,.3)' : 'none',
              }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Full viewer */}
        <div className="dark-panel overflow-hidden viewer-auto anim-fade-up anim-delay-2">
          <ThreeDViewer isLoading={false} previewUrl={MODELS[selected].url} />
        </div>

        {/* Controls guide + CTA */}
        <div className="grid sm:grid-cols-2 gap-6 anim-fade-up anim-delay-3">
          <div className="card p-6" style={{ background: 'white' }}>
            <p className="label mb-4">Viewer Controls</p>
            <div className="space-y-3">
              {CONTROLS.map(({ key, action }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: 'var(--bg-2)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                    {key}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-2)' }}>{action}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 flex flex-col justify-between" style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderColor: 'var(--border-2)' }}>
            <div>
              <p className="label mb-3">Generate Your Own</p>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-1)' }}>Upload a floor plan image</h3>
              <p className="text-sm" style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
                Upload any architectural floor plan and ASIS AI will generate an interactive 3D model like these — in under 10 seconds.
              </p>
            </div>
            <Link to="/app" className="btn-primary mt-6 justify-center" style={{ fontSize: '0.85rem' }}>
              Start Analysis
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
