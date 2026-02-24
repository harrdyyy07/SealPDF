import React, { useState } from 'react';
import {
  Droplets,
  Layers,
  Scissors,
  Hash,
  RotateCw,
  Image as ImageIcon,
  Trash2,
  DownloadCloud,
  Type
} from 'lucide-react';

import WatermarkTool from './components/WatermarkTool';
import MergerTool from './components/MergerTool';
import SplitterTool from './components/SplitterTool';
import PageNumbererTool from './components/PageNumbererTool';
import PageRotatorTool from './components/PageRotatorTool';
import ImageToPdfTool from './components/ImageToPdfTool';
import PageRemoverTool from './components/PageRemoverTool';
import EditorTool from './components/EditorTool';

import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import AboutUs from './components/AboutUs';
import ContactUs from './components/ContactUs';

function App() {
  const [activeTab, setActiveTab] = useState('watermark');
  const [legalPage, setLegalPage] = useState(null); // 'privacy', 'terms', 'about', 'contact'
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

  const handleLegalClick = (page) => {
    setLegalPage(page);
    window.scrollTo(0, 0);
  };

  const closeLegalPage = () => {
    setLegalPage(null);
  };

  const tools = [
    { id: 'watermark', name: 'Watermark', icon: <Droplets size={20} />, component: <WatermarkTool /> },
    { id: 'merger', name: 'PDF Merger', icon: <Layers size={20} />, component: <MergerTool /> },
    { id: 'splitter', name: 'PDF Splitter', icon: <Scissors size={20} />, component: <SplitterTool /> },
    { id: 'numberer', name: 'Page Numbers', icon: <Hash size={20} />, component: <PageNumbererTool /> },
    { id: 'rotator', name: 'Page Rotator', icon: <RotateCw size={20} />, component: <PageRotatorTool /> },
    { id: 'image2pdf', name: 'Image to PDF', icon: <ImageIcon size={20} />, component: <ImageToPdfTool /> },
    { id: 'remover', name: 'Page Remover', icon: <Trash2 size={20} />, component: <PageRemoverTool /> },
    { id: 'editor', name: 'PDF Editor', icon: <Type size={20} />, component: <EditorTool /> },
  ];

  const activeTool = tools.find(t => t.id === activeTab);

  const renderContent = () => {
    if (legalPage === 'privacy') return <PrivacyPolicy onBack={closeLegalPage} />;
    if (legalPage === 'terms') return <TermsOfService onBack={closeLegalPage} />;
    if (legalPage === 'about') return <AboutUs onBack={closeLegalPage} />;
    if (legalPage === 'contact') return <ContactUs onBack={closeLegalPage} />;

    return (
      <div className="tool-container">
        <header className="page-header">
          <h1>{activeTool.name}</h1>
          <p className="subtitle">SealPDF • Professional PDF Tools</p>
        </header>
        {activeTool.component}
      </div>
    );
  };

  return (
    <div className="app-shell">
      {/* Sidebar for Desktop */}
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={() => { setActiveTab('watermark'); setLegalPage(null); }} style={{ cursor: 'pointer' }}>
          <img src="/logo.png" alt="SealPDF Logo" className="logo-img" />
        </div>

        <nav className="nav-links">
          {tools.map(tool => (
            <div
              key={tool.id}
              className={`nav-item ${(activeTab === tool.id && !legalPage) ? 'active' : ''}`}
              onClick={() => { setActiveTab(tool.id); setLegalPage(null); }}
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
        <img src="/logo.png" alt="SealPDF Logo" className="mobile-logo-img" onClick={() => { setActiveTab('watermark'); setLegalPage(null); }} />
        {installPrompt && (
          <button className="mobile-install-btn" onClick={handleInstall}>
            <DownloadCloud size={20} />
          </button>
        )}
      </div>

      <main className="main-content">
        {renderContent()}
        <Footer onLinkClick={handleLegalClick} />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        {tools.map(tool => (
          <div
            key={tool.id}
            className={`bottom-nav-item ${(activeTab === tool.id && !legalPage) ? 'active' : ''}`}
            onClick={() => { setActiveTab(tool.id); setLegalPage(null); }}
          >
            {tool.icon}
            <span>{tool.name}</span>
          </div>
        ))}
      </nav>

      <CookieConsent />
    </div>
  );
}

export default App;
