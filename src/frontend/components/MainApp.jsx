import { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import PipelineTracker from './PipelineTracker';
import UploadSection from './FileUpload';
import ThreeDViewer from './ThreeDViewer';
import Dashboard from './Dashboard';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const apiFetch = async (endpoint, options = {}) => {
  try {
    return await fetch(`${API_BASE}${endpoint}`, options);
  } catch (err) {
    return await fetch(endpoint, options);
  }
};

const parseJSON = async (res) => {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (err) {
    return { message: text };
  }
};

const STEP_LABELS = ['Upload', 'Edge Detection', 'Layout', '3D Generation', 'Materials', 'Complete'];

// Banner shown when the Node.js backend is not reachable (e.g. on Netlify)
function DemoModeBanner() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Header />
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          maxWidth: '540px',
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '1.5rem',
          padding: '2.5rem',
          textAlign: 'center',
          backdropFilter: 'blur(12px)',
        }}>
          {/* Icon */}
          <div style={{
            width: '64px', height: '64px',
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '1.75rem',
          }}>🔌</div>

          <h2 style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Backend Not Connected
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            The Analysis Studio requires a running Node.js + Python backend to process floor plans.
            This live demo is <strong style={{ color: '#c4b5fd' }}>frontend-only</strong> — the backend
            is not deployed on Netlify.
          </p>

          <div style={{
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            marginBottom: '1.75rem',
            textAlign: 'left',
          }}>
            <p style={{ color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.08em' }}>
              TO RUN LOCALLY
            </p>
            {[
              'git clone https://github.com/sanskritigupta312-jpg/ASIS-AI.git',
              'npm install && npm run dev',
            ].map(cmd => (
              <code key={cmd} style={{
                display: 'block',
                background: 'rgba(0,0,0,0.3)',
                color: '#e2e8f0',
                fontSize: '0.78rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '0.4rem',
                marginTop: '0.4rem',
                fontFamily: 'monospace',
              }}>{cmd}</code>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/studio"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                padding: '0.6rem 1.4rem',
                borderRadius: '0.6rem',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Explore Studio →
            </a>
            <a
              href="https://github.com/sanskritigupta312-jpg/ASIS-AI"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: '#cbd5e1',
                padding: '0.6rem 1.4rem',
                borderRadius: '0.6rem',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              View on GitHub
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function MainApp() {
  const [status, setStatus]       = useState('idle');
  const [activeStep, setActiveStep] = useState(0);
  const [taskId, setTaskId]       = useState(null);
  const [uploadUrl, setUploadUrl] = useState(null);
  const [modelUrl, setModelUrl]   = useState(null);
  const [blueprintUrl, setBlueprintUrl] = useState(null);
  const [overlayUrl, setOverlayUrl] = useState(null);
  const [analysis, setAnalysis]   = useState(null);
  const [block, setBlock] = useState(null);
  const [error, setError]         = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(null); // null = checking

  // Check if the backend is reachable on mount
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    fetch(`${API_BASE}/api/ping`, { signal: controller.signal })
      .then(res => setBackendAvailable(res.ok || res.status < 500))
      .catch(() => setBackendAvailable(false))
      .finally(() => clearTimeout(timeout));
  }, []);

  useEffect(() => {
    if (!taskId || status !== 'processing') return;
    const iv = setInterval(async () => {
      try {
        const res  = await apiFetch(`/api/task?id=${taskId}`);
        const data = await parseJSON(res);
        if (!res.ok) throw new Error(data.message || `Task poll failed: ${res.status}`);
        setActiveStep(data.currentStep);
        if (data.uploadUrl) setUploadUrl(data.uploadUrl);
        if (data.modelUrl)  setModelUrl(data.modelUrl);
        if (data.blueprintUrl) setBlueprintUrl(data.blueprintUrl);
        if (data.overlayUrl) setOverlayUrl(data.overlayUrl);
        if (data.analysis)  setAnalysis(data.analysis);
        if (data.block) setBlock(data.block);
        if (data.status === 'completed' && data.modelUrl) {
          setStatus('completed');
          clearInterval(iv);
        }
      } catch (e) {
        setError('Lost connection to backend.');
        setStatus('idle');
        clearInterval(iv);
      }
    }, 1200);
    return () => clearInterval(iv);
  }, [taskId, status]);

  const startAnalysis = async (file) => {
    if (!file) return;
    setStatus('processing');
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file, file.name);
      const res  = await apiFetch('/api/analyze', { method: 'POST', body: fd });
      const data = await parseJSON(res);
      if (!res.ok) throw new Error(data.message || `Upload failed: ${res.status}`);
      setTaskId(data.taskId);
      setActiveStep(0);
      setUploadUrl(null); setModelUrl(null); setBlueprintUrl(null); setOverlayUrl(null); setAnalysis(null); setBlock(null);
    } catch (e) {
      setError(e.message || 'Failed to start analysis.');
      setStatus('idle');
    }
  };

  // Still checking backend availability — show a subtle loading state
  if (backendAvailable === null) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0a0f', color: '#6366f1',
        fontSize: '1rem', fontFamily: 'Inter, sans-serif', gap: '0.75rem',
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Connecting to backend…
      </div>
    );
  }

  // Backend is not reachable (e.g. deployed on Netlify without backend)
  if (!backendAvailable) {
    return <DemoModeBanner />;
  }

  if (status === 'completed') {
    return <Dashboard uploadUrl={uploadUrl} modelUrl={modelUrl} blueprintUrl={blueprintUrl} overlayUrl={overlayUrl} analysis={analysis} block={block} />;
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16 sm:pb-20 space-y-6">

        {/* Page title */}
        <div className="anim-fade-up">
          <p className="label mb-2">Analysis Studio</p>
          <h1 className="heading" style={{ color: 'var(--text-1)' }}>Upload your floor plan</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-2)' }}>
            The pipeline runs automatically — edge detection, 3D generation, material logic, and blockchain seal.
          </p>
        </div>

        {/* Pipeline tracker */}
        <div className="card p-6 anim-fade-up anim-delay-1" style={{ background: 'white' }}>
          <p className="label mb-5" style={{ color: 'var(--text-3)' }}>
            {status === 'processing'
              ? `Step ${activeStep + 1} of ${STEP_LABELS.length} — ${STEP_LABELS[activeStep]}`
              : 'Pipeline'}
          </p>
          <PipelineTracker activeStep={activeStep} />
        </div>

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] anim-fade-up anim-delay-2">

          {/* Left — upload or viewer */}
          <div className="space-y-4">
            {status === 'idle' ? (
              <UploadSection onUpload={startAnalysis} />
            ) : (
              <div className="dark-panel overflow-hidden viewer-auto">
                <ThreeDViewer isLoading={true} previewUrl={null} />
              </div>
            )}
            {error && (
              <div
                className="rounded-2xl p-4 text-sm"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Right — info panel */}
          <div className="space-y-4">
            {/* What happens */}
            <div className="card p-5">
              <p className="label mb-4" style={{ color: 'var(--text-3)' }}>What happens next</p>
              <div className="space-y-3">
                {[
                  { icon: '🔍', text: 'Canny edge detection extracts wall lines' },
                  { icon: '🏠', text: 'Rooms and boundaries are classified' },
                  { icon: '📦', text: '3D model is extruded from 2D layout' },
                  { icon: '🧱', text: 'Materials assigned by structural role' },
                  { icon: '⛓', text: 'Analysis sealed on blockchain' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="text-base leading-none mt-0.5">{icon}</span>
                    <p className="text-sm" style={{ color: 'var(--text-2)' }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="card p-5" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
              <p className="label mb-3" style={{ color: '#92400e' }}>Tips for best results</p>
              <ul className="space-y-2">
                {[
                  'Use high-contrast black-on-white plans',
                  'Ensure walls are clearly drawn lines',
                  'Avoid photos of physical blueprints',
                ].map(t => (
                  <li key={t} className="text-xs flex gap-2" style={{ color: '#78350f' }}>
                    <span>·</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

