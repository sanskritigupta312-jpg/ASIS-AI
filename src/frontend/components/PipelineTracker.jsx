const STEPS = ['Upload', 'Edge Detection', 'Layout', '3D Generation', 'Materials', 'Complete'];

export default function PipelineTracker({ activeStep }) {
  return (
    <div className="w-full">
      <div className="flex items-start justify-between relative">
        {/* background track */}
        <div
          className="absolute top-4 left-0 right-0 h-px"
          style={{ background: 'var(--border)', zIndex: 0 }}
        />
        {/* progress fill */}
        <div
          className="absolute top-4 left-0 h-px transition-all duration-700"
          style={{
            background: 'var(--text-1)',
            width: `${(activeStep / (STEPS.length - 1)) * 100}%`,
            zIndex: 1,
          }}
        />

        {STEPS.map((step, i) => {
          const done    = i < activeStep;
          const current = i === activeStep;
          return (
            <div key={step} className="flex flex-col items-center gap-2.5 flex-1 relative" style={{ zIndex: 2 }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500"
                style={{
                  background: done ? 'var(--text-1)' : current ? 'var(--accent)' : 'var(--surface)',
                  border: `2px solid ${done ? 'var(--text-1)' : current ? 'var(--accent)' : 'var(--border-2)'}`,
                  color: done || current ? '#fff' : 'var(--text-3)',
                  boxShadow: current ? '0 0 0 4px rgba(37,99,235,.15)' : 'none',
                }}
              >
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  current ? (
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  ) : (
                    i + 1
                  )
                )}
              </div>
              <span
                className="text-center leading-tight"
                style={{
                  fontSize: '0.6rem',
                  fontWeight: current ? 700 : 500,
                  color: current ? 'var(--text-1)' : done ? 'var(--text-2)' : 'var(--text-3)',
                  letterSpacing: '0.04em',
                  maxWidth: '60px',
                }}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
