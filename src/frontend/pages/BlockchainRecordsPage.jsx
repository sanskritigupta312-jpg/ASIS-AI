import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const HOW_IT_WORKS = [
  { n: '01', title: 'Analysis Completes',   desc: 'When ASIS AI finishes processing your floor plan, all results are collected into a single data object.' },
  { n: '02', title: 'Data is Hashed',       desc: 'The analysis data (rooms, walls, area, timestamp) is serialised and passed through SHA-256 to produce a unique 64-character hex hash.' },
  { n: '03', title: 'Block is Created',     desc: 'A new block is created containing the hash, the previous block\'s hash, a timestamp, and the encoded analysis summary.' },
  { n: '04', title: 'Chain is Extended',    desc: 'The block is appended to the in-memory chain. Each block references the previous one — altering any block breaks all subsequent hashes.' },
  { n: '05', title: 'Integrity Verified',   desc: 'On every /api/blockchain request, the server re-hashes each block and checks it matches the stored hash. Any tampering is detected instantly.' },
];

const WHY_ITEMS = [
  { icon: '🔒', title: 'Tamper-Proof',    desc: 'Changing any analysis result changes its hash, which breaks the chain — making alterations immediately detectable.' },
  { icon: '📋', title: 'Audit Trail',     desc: 'Every analysis ever run is permanently recorded with a timestamp, making it easy to audit the history of floor plan analyses.' },
  { icon: '✅', title: 'Verifiable',      desc: 'Anyone with access to the chain can independently verify that a specific analysis was recorded at a specific time.' },
  { icon: '⚡', title: 'Instant',         desc: 'No external blockchain network needed — the chain runs in-memory on the server and seals each analysis in milliseconds.' },
];

function BlockCard({ block, isLatest }) {
  const [expanded, setExpanded] = useState(false);
  const short = (h) => h ? `${h.slice(0, 12)}…${h.slice(-8)}` : '—';

  return (
    <div className="card p-5 space-y-3" style={{ background: isLatest ? 'linear-gradient(135deg,#eff6ff,#dbeafe)' : 'white', borderColor: isLatest ? 'var(--border-2)' : 'var(--border)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black"
            style={{ background: isLatest ? 'var(--accent)' : 'var(--bg-2)', color: isLatest ? 'white' : 'var(--accent)' }}>
            #{block.index}
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
            {block.taskId === 'genesis' ? 'Genesis Block' : `Analysis Block`}
          </span>
        </div>
        {isLatest && <span className="badge badge-blue">Latest</span>}
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between"><span style={{ color: 'var(--text-3)' }}>Timestamp</span><span style={{ color: 'var(--text-1)' }}>{new Date(block.timestamp).toLocaleString()}</span></div>
        {block.taskId !== 'genesis' && <>
          <div className="flex justify-between"><span style={{ color: 'var(--text-3)' }}>Floor Area</span><span style={{ color: 'var(--text-1)' }}>{block.floorArea} m²</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-3)' }}>Rooms</span><span style={{ color: 'var(--text-1)' }}>{block.rooms}</span></div>
          <div className="flex justify-between"><span style={{ color: 'var(--text-3)' }}>Walls</span><span style={{ color: 'var(--text-1)' }}>{(block.walls?.outer ?? 0) + (block.walls?.inner ?? 0)}</span></div>
        </>}
      </div>

      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all"
        style={{ background: 'rgba(29,78,216,.06)', border: '1px solid var(--border)', color: 'var(--accent)' }}>
        <span>{expanded ? 'Hide' : 'Show'} hashes</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {expanded && (
        <div className="space-y-2 rounded-xl p-3 text-xs" style={{ background: 'rgba(29,78,216,.04)', border: '1px solid var(--border)' }}>
          <div><p className="label mb-1" style={{ fontSize: '0.55rem' }}>Block Hash</p>
            <p className="mono break-all" style={{ color: 'var(--accent)', lineHeight: 1.6 }}>{block.hash}</p></div>
          <div className="border-t pt-2" style={{ borderColor: 'var(--border)' }}>
            <p className="label mb-1" style={{ fontSize: '0.55rem' }}>Previous Hash</p>
            <p className="mono break-all" style={{ color: 'var(--text-3)', lineHeight: 1.6 }}>{block.prevHash}</p></div>
        </div>
      )}
    </div>
  );
}

export default function BlockchainRecordsPage() {
  const [chain, setChain] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blockchain')
      .then(r => r.json())
      .then(d => { setChain(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const blocks = chain?.chain ?? [];
  const displayBlocks = [...blocks].reverse().slice(0, 6);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 space-y-12 sm:space-y-14">

        <div className="anim-fade-up">
          <span className="badge badge-blue mb-4">Blockchain Records</span>
          <h1 className="heading" style={{ color: 'var(--text-1)' }}>Tamper-Proof Analysis Records</h1>
          <p className="mt-2 max-w-lg text-sm" style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>
            Every floor plan analysis is SHA-256 hashed and recorded on an immutable chain. No analysis can be altered without breaking the chain.
          </p>
        </div>

        {/* Live chain */}
        <div className="anim-fade-up anim-delay-1">
          <div className="flex items-center justify-between mb-5">
            <p className="label">Live Chain</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
                {loading ? 'Loading…' : `${chain?.length ?? 0} blocks · ${chain?.valid ? 'Valid' : 'Checking…'}`}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
            </div>
          ) : blocks.length === 0 ? (
            <div className="card p-10 text-center" style={{ background: 'white' }}>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>No blocks yet. Run an analysis to create the first record.</p>
              <Link to="/app" className="btn-primary mt-4 inline-flex" style={{ fontSize: '0.82rem' }}>Run Analysis</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayBlocks.map((b, i) => (
                <BlockCard key={b.index} block={b} isLatest={i === 0 && b.taskId !== 'genesis'} />
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="anim-fade-up">
          <p className="label mb-6">How the chain works</p>
          <div className="space-y-3">
            {HOW_IT_WORKS.map(s => (
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

        {/* Why it matters */}
        <div className="anim-fade-up">
          <p className="label mb-6">Why it matters</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WHY_ITEMS.map(w => (
              <div key={w.title} className="card card-hover p-5" style={{ background: 'white' }}>
                <span className="text-2xl mb-3 block">{w.icon}</span>
                <h4 className="font-semibold text-sm mb-1.5" style={{ color: 'var(--text-1)' }}>{w.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="card p-8 flex flex-col sm:flex-row items-center justify-between gap-6 anim-fade-up"
          style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderColor: 'var(--border-2)' }}>
          <div>
            <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-1)' }}>Add your analysis to the chain</h3>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>Upload a floor plan and your analysis will be permanently sealed as a new block.</p>
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
