import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage          from './pages/LandingPage';
import ExampleGalleryPage   from './pages/ExampleGalleryPage';
import ModelViewerPage      from './pages/ModelViewerPage';
import MaterialAnalysisPage from './pages/MaterialAnalysisPage';
import BlockchainRecordsPage from './pages/BlockchainRecordsPage';
import MainApp              from './components/MainApp';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/studio" element={<ExampleGalleryPage />} />
      <Route path="/studio/viewer" element={<ModelViewerPage />} />
      <Route path="/studio/materials" element={<MaterialAnalysisPage />} />
      <Route path="/studio/blockchain" element={<BlockchainRecordsPage />} />
      <Route path="/app" element={<MainApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
