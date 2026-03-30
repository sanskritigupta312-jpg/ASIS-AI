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
