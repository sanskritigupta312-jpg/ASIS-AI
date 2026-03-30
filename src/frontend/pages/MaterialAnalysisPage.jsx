import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { MATERIAL_LIBRARY } from '../data/materialLibrary';

const MATERIALS = MATERIAL_LIBRARY;

const LOGIC_STEPS = [
  { n: '01', title: 'Detect Wall Position',   desc: 'Each wall line is checked against the floor plan boundary. Walls within 25px of the edge are outer walls.' },
  { n: '02', title: 'Classify Wall Type',     desc: 'Outer walls → load-bearing. Inner walls → partition. Columns/beams → structural.' },
  { n: '03', title: 'Score Materials',        desc: 'Each candidate material is scored: Strength ÷ Cost. Higher score = better value for that wall type.' },
  { n: '04', title: 'Assign Best Material',   desc: 'The material with the highest score for the wall type is assigned. Result is stored in the analysis JSON.' },
];

function ScoreBar({ value, max = 5, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: '#e2e8f0' }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: '99px', transition: 'width .6s ease' }} />
      </div>
      <span className="text-xs font-semibold w-4" style={{ color }}>{value}</span>
    </div>
  );
}

export default function MaterialAnalysisPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <main className="max-w-5xl mx-auto px-6 pt-32 pb-20 space-y-14">

        <div className="anim-fade-up">
          <span className="badge badge-blue mb-4">Material Analysis</span>
          <h1 className="heading" style={{ color: 'var(--text-1)' }}>Smart Material Recommendations</h1>
          <p className="mt-2 max-w-lg text-sm" style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
            ASIS AI assigns the optimal building material to every wall based on its structural role and a strength-to-cost scoring algorithm.
          </p>
        </div>

        {/* Material cards */}
        <div className="grid sm:grid-cols-3 gap-5 anim-fade-up anim-delay-1">
          {MATERIALS.map(m => (
            <div key={m.name} className="card p-6 space-y-4" style={{ background: m.bg, borderColor: m.border }}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold" style={{ color: m.color }}>{m.name}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'white', color: m.color, border: `1px solid ${m.border}` }}>
                    Score {m.score}
                  </span>
                </div>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>{m.role}</p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{m.desc}</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-3)' }}>
                    <span>Strength</span><span>{m.strength}/5</span>
                  </div>
                  <ScoreBar value={m.strength} color={m.color} />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-3)' }}>
                    <span>Cost</span><span>{m.cost}/5</span>
                  </div>
                  <ScoreBar value={m.cost} color="#94a3b8" />
                </div>
              </div>
              <div className="space-y-1.5 pt-2 border-t" style={{ borderColor: m.border }}>
                {m.props.map(p => (
                  <div key={p.label} className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-3)' }}>{p.label}</span>
                    <span className="font-semibold" style={{ color: 'var(--text-1)' }}>{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Logic steps */}
        <div className="anim-fade-up">
          <p className="label mb-6">How the algorithm works</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {LOGIC_STEPS.map(s => (
              <div key={s.n} className="card p-5 flex gap-4" style={{ background: 'white' }}>
                <span className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ background: 'var(--bg-2)', color: 'var(--accent)', border: '1.5px solid var(--border)' }}>
                  {s.n}
                </span>
                <div>
                  <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-1)' }}>{s.title}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="card p-8 flex flex-col sm:flex-row items-center justify-between gap-6 anim-fade-up"
          style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderColor: 'var(--border-2)' }}>
          <div>
            <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-1)' }}>See material analysis on your floor plan</h3>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>Upload an image and get wall-by-wall material recommendations instantly.</p>
          </div>
          <Link to="/app" className="btn-primary flex-shrink-0" style={{ fontSize: '0.85rem' }}>
            Upload Floor Plan
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>

      </main>
      <Footer />
    </div>
  );
}
