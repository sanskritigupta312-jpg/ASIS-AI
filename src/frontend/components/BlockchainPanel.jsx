import { useEffect, useState } from 'react';

export default function BlockchainPanel({ block }) {
  const [chain, setChain]       = useState(null);
  const [showHash, setShowHash] = useState(false);

  useEffect(() => {
    fetch('/api/blockchain').then(r => r.json()).then(setChain).catch(() => {});
  }, [block]);

  if (!block) return null;

  const isValid = chain?.valid !== false;

  return (
    <div className="card p-5 space-y-4" style={{ borderColor: '#93c5fd', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: '#dbeafe' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="5" width="4" height="4" rx="1" stroke="#1d4ed8" strokeWidth="1.3"/>
              <rect x="9" y="5" width="4" height="4" rx="1" stroke="#1d4ed8" strokeWidth="1.3"/>
              <path d="M5 7h4" stroke="#1d4ed8" strokeWidth="1.3" strokeLinecap="round"/>
              <rect x="1" y="1" width="4" height="3" rx="0.8" fill="#93c5fd"/>
              <rect x="9" y="1" width="4" height="3" rx="0.8" fill="#93c5fd"/>
              <rect x="1" y="10" width="4" height="3" rx="0.8" fill="#93c5fd"/>
              <rect x="9" y="10" width="4" height="3" rx="0.8" fill="#93c5fd"/>
            </svg>
          </div>
          <p className="label" style={{ color: '#1e40af' }}>Blockchain Record</p>
        </div>
        <span
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: isValid ? '#dbeafe' : '#fee2e2', color: isValid ? '#1d4ed8' : '#dc2626', border: `1px solid ${isValid ? '#93c5fd' : '#fca5a5'}` }}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isValid ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`} />
          {isValid ? 'Chain Valid' : 'Invalid'}
        </span>
      </div>

      {/* Data rows */}
      <div className="space-y-0 rounded-2xl overflow-hidden" style={{ border: '1px solid #bfdbfe' }}>
        {[
          ['Block #',      `#${block.index}`],
          ['Chain Length', chain ? `${chain.length} blocks` : '—'],
          ['Sealed At',    new Date(block.timestamp).toLocaleString()],
          ['Floor Area',   `${block.floorArea} m²`],
          ['Rooms',        block.rooms],
          ['Outer Walls',  block.walls?.outer],
          ['Inner Walls',  block.walls?.inner],
        ].map(([label, val], i) => (
          <div
            key={label}
            className="flex justify-between items-center px-4 py-2.5 text-xs"
            style={{ background: i % 2 === 0 ? 'rgba(255,255,255,.7)' : 'rgba(219,234,254,.4)', borderBottom: '1px solid #bfdbfe' }}
          >
            <span style={{ color: '#3b82f6' }}>{label}</span>
            <span className="font-semibold" style={{ color: '#1e3a8a' }}>{val ?? '—'}</span>
          </div>
        ))}
      </div>

      {/* Hash toggle */}
      <button
        onClick={() => setShowHash(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all"
        style={{ background: showHash ? '#dbeafe' : 'rgba(255,255,255,.6)', border: '1px solid #93c5fd', color: '#1d4ed8' }}
      >
        <span>{showHash ? 'Hide' : 'Show'} cryptographic hashes</span>
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ transform: showHash ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {showHash && (
        <div className="space-y-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,.8)', border: '1px solid #bfdbfe' }}>
          <div>
            <p className="label mb-1.5" style={{ color: '#93c5fd', fontSize: '0.55rem' }}>Block Hash (SHA-256)</p>
            <p className="mono text-xs break-all leading-relaxed" style={{ color: '#1d4ed8' }}>{block.hash}</p>
          </div>
          <div style={{ borderTop: '1px solid #bfdbfe', paddingTop: '0.75rem' }}>
            <p className="label mb-1.5" style={{ color: '#93c5fd', fontSize: '0.55rem' }}>Previous Hash</p>
            <p className="mono text-xs break-all leading-relaxed" style={{ color: '#3b82f6' }}>{block.prevHash}</p>
          </div>
        </div>
      )}

      <p className="text-xs leading-relaxed" style={{ color: '#3b82f6' }}>
        This analysis is permanently sealed as block #{block.index}. Any modification to the data would invalidate all subsequent blocks.
      </p>
    </div>
  );
}
