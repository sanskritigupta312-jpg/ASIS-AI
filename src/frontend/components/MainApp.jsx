import { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import PipelineTracker from './PipelineTracker';
import UploadSection from './FileUpload';
import ThreeDViewer from './ThreeDViewer';
import Dashboard from './Dashboard';
import { processFloorPlanClientSide } from '../utils/clientReconstruction';

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
  const [block, setBlock]         = useState(null);
  const [error, setError]         = useState(null);

  // Poll backend for task updates if using server pipeline
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
        console.warn('Backend polling interrupted:', e.message);
      }
    }, 1200);
    return () => clearInterval(iv);
  }, [taskId, status]);

  const startAnalysis = async (file) => {
    if (!file) return;
    setStatus('processing');
    setError(null);
    setActiveStep(0);
    setUploadUrl(null);
    setModelUrl(null);
    setBlueprintUrl(null);
    setOverlayUrl(null);
    setAnalysis(null);
    setBlock(null);

    // 1. Try Python OpenCV backend first (works on localhost)
    let backendStarted = false;
    try {
      const fd = new FormData();
      fd.append('file', file, file.name);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await apiFetch('/api/analyze', { method: 'POST', body: fd, signal: controller.signal });
      clearTimeout(timeout);

      const data = await parseJSON(res);
      if (res.ok && data.taskId) {
        setTaskId(data.taskId);
        backendStarted = true;
        return;
      }
    } catch (backendErr) {
      console.log('Backend not available, transitioning to browser 3D reconstruction engine...');
    }

    // 2. If backend is not available (e.g. deployed on Netlify), run in-browser 3D reconstruction
    if (!backendStarted) {
      try {
        // Step 1: Upload & Edge Detection
        setActiveStep(1);
        await new Promise(r => setTimeout(r, 600));

        // Step 2: Wall & Room Layout Reconstruction
        setActiveStep(2);
        await new Promise(r => setTimeout(r, 600));

        // Step 3: Extrude 3D geometry
        setActiveStep(3);
        const result = await processFloorPlanClientSide(file);
        await new Promise(r => setTimeout(r, 700));

        // Step 4: Material logic & Structural validation
        setActiveStep(4);
        await new Promise(r => setTimeout(r, 600));

        // Step 5: Final output & Blockchain seal
        setActiveStep(5);
        await new Promise(r => setTimeout(r, 400));

        setUploadUrl(result.uploadUrl);
        setModelUrl(result.modelUrl);
        setBlueprintUrl(result.blueprintUrl);
        setOverlayUrl(result.overlayUrl);
        setAnalysis(result.analysis);
        setBlock(result.block);
        setStatus('completed');
      } catch (clientErr) {
        console.error('Client reconstruction error:', clientErr);
        setError('Failed to analyze floor plan image. Please ensure the file is a clear blueprint or diagram.');
        setStatus('idle');
      }
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
