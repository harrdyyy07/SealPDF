import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Droplets, Layers, Scissors, Hash, RotateCw, Image as ImageIcon, 
  Trash2, DownloadCloud, Type, FileOutput, RefreshCw, Crop, Lock
} from 'lucide-react';

// Original Tools
import WatermarkTool from './components/WatermarkTool';
import MergerTool from './components/MergerTool';
import SplitterTool from './components/SplitterTool';
import PageNumbererTool from './components/PageNumbererTool';
import PageRotatorTool from './components/PageRotatorTool';
import ImageToPdfTool from './components/ImageToPdfTool';
import PageRemoverTool from './components/PageRemoverTool';
import EditorTool from './components/EditorTool';

// New Feasible Tools
import ProtectPdfTool from './components/ProtectPdfTool';
import PdfToJpgTool from './components/PdfToJpgTool';
import ExtractPagesTool from './components/ExtractPagesTool';
import OrganizePdfTool from './components/OrganizePdfTool';
import CropPdfTool from './components/CropPdfTool';

import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import AboutUs from './components/AboutUs';
import ContactUs from './components/ContactUs';

function App() {
  const [installPrompt, setInstallPrompt] = React.useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  const categories = [
    {
      title: "ORGANIZE PDF",
      tools: [
        { path: '/merge-pdf', name: 'Merge PDF', desc: 'Combine PDFs in the order you want with the easiest PDF merger.', icon: <Layers />, component: <MergerTool /> },
        { path: '/split-pdf', name: 'Split PDF', desc: 'Separate one page or a whole set for easy conversion.', icon: <Scissors />, component: <SplitterTool /> },
        { path: '/remove-pages', name: 'Remove pages', desc: 'Remove pages from a PDF document. Select and remove the pages.', icon: <Trash2 />, component: <PageRemoverTool /> },
        { path: '/extract-pages', name: 'Extract pages', desc: 'Extract specific pages from a PDF to form a new document.', icon: <FileOutput />, component: <ExtractPagesTool /> },
        { path: '/organize-pdf', name: 'Organize PDF', desc: 'Sort, change order, or delete PDF pages easily.', icon: <RefreshCw />, component: <OrganizePdfTool /> },
      ]
    },
    {
      title: "CONVERT TO PDF",
      tools: [
        { path: '/jpg-to-pdf', name: 'JPG to PDF', desc: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.', icon: <ImageIcon />, component: <ImageToPdfTool /> },
      ]
    },
    {
      title: "CONVERT FROM PDF",
      tools: [
        { path: '/pdf-to-jpg', name: 'PDF to JPG', desc: 'Convert each PDF page into a JPG or extract all images contained in a PDF.', icon: <ImageIcon />, component: <PdfToJpgTool /> },
      ]
    },
    {
      title: "EDIT PDF",
      tools: [
        { path: '/rotate-pdf', name: 'Rotate PDF', desc: 'Rotate your PDFs the way you need them.', icon: <RotateCw />, component: <PageRotatorTool /> },
        { path: '/page-numbers', name: 'Add page numbers', desc: 'Add page numbers into PDFs with ease. Choose your positions and dimensions.', icon: <Hash />, component: <PageNumbererTool /> },
        { path: '/watermark-pdf', name: 'Add watermark', desc: 'Stamp an image or text over your PDF in seconds.', icon: <Droplets />, component: <WatermarkTool /> },
        { path: '/crop-pdf', name: 'Crop PDF', desc: 'Crop PDF margins, change PDF page size.', icon: <Crop />, component: <CropPdfTool /> },
        { path: '/edit-pdf', name: 'Edit PDF', desc: 'Add text, images, shapes or freehand annotations to a PDF document.', icon: <Type />, component: <EditorTool /> },
      ]
    },
    {
      title: "PDF SECURITY",
      tools: [
        { path: '/protect-pdf', name: 'Protect PDF', desc: 'Encrypt your PDF with a password to prevent unauthorized access.', icon: <Lock />, component: <ProtectPdfTool /> },
      ]
    }
  ];

  // Flatten tools for routing mapping
  const allTools = categories.flatMap(cat => cat.tools);

  const renderHome = () => (
    <>
      <section className="home-hero">
        <h1>Every tool you need to work with PDFs in one place</h1>
        <p>All the tools you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.</p>
      </section>
      
      <div className="tools-grid-container" style={{ paddingTop: '2rem' }}>
        {categories.map((category, index) => (
          <div key={index} style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-muted)', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', fontWeight: 700 }}>{category.title}</h2>
            <div className="tools-grid">
              {category.tools.map(tool => (
                <Link key={tool.path} to={tool.path} className="tool-card">
                  <div className="tool-icon-wrapper">
                    {React.cloneElement(tool.icon, { size: 48, strokeWidth: 1.5 })}
                  </div>
                  <h3>{tool.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4' }}>{tool.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="header-left">
          <Link to="/" className="logo-container">
            <img src="/logo.png" alt="SealPDF Logo" className="logo-img" />
          </Link>
          <nav className="nav-links">
            <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
            <Link to="/merge-pdf" className={`nav-item ${location.pathname === '/merge-pdf' ? 'active' : ''}`}>Merge</Link>
            <Link to="/split-pdf" className={`nav-item ${location.pathname === '/split-pdf' ? 'active' : ''}`}>Split</Link>
            <Link to="/jpg-to-pdf" className={`nav-item ${location.pathname === '/jpg-to-pdf' ? 'active' : ''}`}>JPG to PDF</Link>
          </nav>
        </div>
        
        <div className="header-right">
          {installPrompt && (
            <button className="install-btn" onClick={handleInstall}>
              <DownloadCloud size={18} />
              <span>Install App</span>
            </button>
          )}
          <button className="auth-btn login">Log in</button>
          <button className="auth-btn signup">Sign up</button>
        </div>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={renderHome()} />
          <Route path="/privacy" element={<PrivacyPolicy onBack={() => navigate('/')} />} />
          <Route path="/terms" element={<TermsOfService onBack={() => navigate('/')} />} />
          <Route path="/about" element={<AboutUs onBack={() => navigate('/')} />} />
          <Route path="/contact" element={<ContactUs onBack={() => navigate('/')} />} />
          <Route path="/image-to-pdf" element={<ImageToPdfTool />} /> {/* Legacy redirect mapping */}
          
          {allTools.map(tool => (
             <Route 
               key={tool.path} 
               path={tool.path} 
               element={
                 <div className="tool-container">
                    <header className="page-header">
                      <h1>{tool.name}</h1>
                      <p className="subtitle">{tool.desc}</p>
                    </header>
                    {tool.component}
                 </div>
               } 
             />
          ))}
        </Routes>
      </main>

      <Footer onLinkClick={(page) => { navigate('/' + page); window.scrollTo(0,0); }} />
      <CookieConsent />
    </div>
  );
}

export default App;
