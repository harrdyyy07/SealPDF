import React, { useState } from 'react';
import {
  Droplets,
  Layers,
  Scissors,
  Hash,
  RotateCw,
  Image as ImageIcon,
  Trash2,
  DownloadCloud
} from 'lucide-react';

import WatermarkTool from './components/WatermarkTool';
import MergerTool from './components/MergerTool';
import SplitterTool from './components/SplitterTool';
import PageNumbererTool from './components/PageNumbererTool';
import PageRotatorTool from './components/PageRotatorTool';
import ImageToPdfTool from './components/ImageToPdfTool';
import PageRemoverTool from './components/PageRemoverTool';

function App() {
  const [activeTab, setActiveTab] = useState('watermark');
  const [installPrompt, setInstallPrompt] = React.useState(null);

  React.useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const tools = [
    { id: 'watermark', name: 'Watermark', icon: <Droplets size={20} />, component: <WatermarkTool /> },
    { id: 'merger', name: 'PDF Merger', icon: <Layers size={20} />, component: <MergerTool /> },
    { id: 'splitter', name: 'PDF Splitter', icon: <Scissors size={20} />, component: <SplitterTool /> },
    { id: 'numberer', name: 'Page Numbers', icon: <Hash size={20} />, component: <PageNumbererTool /> },
    { id: 'rotator', name: 'Page Rotator', icon: <RotateCw size={20} />, component: <PageRotatorTool /> },
    { id: 'image2pdf', name: 'Image to PDF', icon: <ImageIcon size={20} />, component: <ImageToPdfTool /> },
    { id: 'remover', name: 'Page Remover', icon: <Trash2 size={20} />, component: <PageRemoverTool /> },
  ];

  const activeTool = tools.find(t => t.id === activeTab);

  return (
    <div className="app-shell">
      {/* Sidebar for Desktop */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="SealPDF Logo" className="logo-img" />
        </div>

        <nav className="nav-links">
          {tools.map(tool => (
            <div
              key={tool.id}
              className={`nav-item ${activeTab === tool.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tool.id)}
            >
              {tool.icon}
              <span>{tool.name}</span>
            </div>
          ))}
        </nav>

        {installPrompt && (
          <div className="install-section">
            <button className="install-btn" onClick={handleInstall}>
              <DownloadCloud size={20} />
              <span>Download App</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Top Header */}
      <div className="mobile-header">
        <img src="/logo.png" alt="SealPDF Logo" className="mobile-logo-img" />
        {installPrompt && (
          <button className="mobile-install-btn" onClick={handleInstall}>
            <DownloadCloud size={20} />
          </button>
        )}
      </div>

      <main className="main-content">
        <div className="tool-container">
          <header className="page-header">
            <h1>{activeTool.name}</h1>
            <p className="subtitle">SealPDF • Professional PDF Tools</p>
          </header>

          {activeTool.component}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        {tools.map(tool => (
          <div
            key={tool.id}
            className={`bottom-nav-item ${activeTab === tool.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tool.id)}
          >
            {tool.icon}
            <span>{tool.name}</span>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default App;
