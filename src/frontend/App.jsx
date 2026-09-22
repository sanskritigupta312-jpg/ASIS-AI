import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Route-level code splitting — each page is loaded only when first visited
const LandingPage          = lazy(() => import('./pages/LandingPage'));
const ExampleGalleryPage   = lazy(() => import('./pages/ExampleGalleryPage'));
const ModelViewerPage      = lazy(() => import('./pages/ModelViewerPage'));
const MaterialAnalysisPage = lazy(() => import('./pages/MaterialAnalysisPage'));
const BlockchainRecordsPage = lazy(() => import('./pages/BlockchainRecordsPage'));
const MainApp              = lazy(() => import('./components/MainApp'));

// Minimal fallback shown while a page chunk is loading
const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#0a0a0f', color: '#6366f1', fontSize: '1rem',
    fontFamily: 'Inter, sans-serif', gap: '0.75rem'
  }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    Loading…
  </div>
);

const App = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/studio" element={<ExampleGalleryPage />} />
        <Route path="/studio/viewer" element={<ModelViewerPage />} />
        <Route path="/studio/materials" element={<MaterialAnalysisPage />} />
        <Route path="/studio/blockchain" element={<BlockchainRecordsPage />} />
        <Route path="/app" element={<MainApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
