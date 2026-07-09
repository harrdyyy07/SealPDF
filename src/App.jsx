import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Droplets, Layers, Scissors, Hash, RotateCw, Image as ImageIcon,
  Trash2, DownloadCloud, Type, FileOutput, RefreshCw, Crop, Lock, ChevronDown, Moon, Sun, ShieldCheck, Zap, Menu, X, User, Eraser, FileText
} from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';

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
import CompressPdfTool from './components/CompressPdfTool';
import RedactPdfTool from './components/RedactPdfTool';
import WatermarkRemoverTool from './components/WatermarkRemoverTool';

import Footer from './components/Footer';
import CookieConsent from './components/CookieConsent';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import AboutUs from './components/AboutUs';
import ContactUs from './components/ContactUs';
import PdfToWordTool from './components/PdfToWordTool';
import { toolMarketingData } from './data/toolMarketingData';

const pathToMarketingKey = {
  '/merge-pdf': 'merge',
  '/split-pdf': 'splitter',
  '/remove-pages': 'remover',
  '/extract-pages': 'extract',
  '/organize-pdf': 'organize',
  '/compress-pdf': 'compress',
  '/jpg-to-pdf': 'img2pdf',
  '/image-to-pdf': 'img2pdf',
  '/pdf-to-jpg': 'pdf2jpg',
  '/pdf-to-word': 'pdf2word',
  '/rotate-pdf': 'rotate',
  '/page-numbers': 'numberer',
  '/watermark-pdf': 'watermark',
  '/crop-pdf': 'crop',
  '/edit-pdf': 'editor',
  '/remove-watermark': 'remover_tool',
  '/protect-pdf': 'protect',
  '/redact-pdf': 'redact',
};

const toolKeywords = {
  'merge': "merge PDF, combine PDF files, PDF merger free, join PDF files online, combine documents",
  'splitter': "split PDF, extract PDF pages, PDF splitter online, cut PDF pages, separate PDF pages free",
  'remover': "remove PDF pages, delete PDF pages, delete pages from PDF online, clean PDF, remove pages free",
  'extract': "extract PDF pages, save PDF pages, extract pages from PDF online, select PDF pages",
  'organize': "organize PDF, reorder PDF pages, rotate PDF pages, move pages in PDF online, organize documents",
  'compress': "compress PDF, shrink PDF size, reduce PDF size, PDF compressor online, optimize PDF quality",
  'img2pdf': "jpg to PDF, image to PDF converter, png to PDF, photos to PDF online, convert jpg to PDF free",
  'pdf2jpg': "pdf to jpg, convert PDF to images, extract images from PDF, PDF to jpeg converter online",
  'pdf2word': "pdf to word, convert PDF to docx, PDF to word converter online, editable word document free",
  'rotate': "rotate PDF, fix PDF orientation, turn PDF pages, rotate PDF online, rotate single page",
  'numberer': "add page numbers to PDF, PDF page numbering online, insert page numbers, format PDF page numbers",
  'watermark': "watermark PDF, add watermark online, PDF watermark creator, text watermark, image watermark",
  'crop': "crop PDF, trim PDF margins, change page size PDF, crop PDF online, adjust PDF view",
  'editor': "edit PDF online, free PDF editor, write on PDF, annotate PDF, add text to PDF",
  'remover_tool': "remove watermark from PDF, watermark remover online, clean PDF watermark, delete PDF objects",
  'protect': "protect PDF, password protect PDF, encrypt PDF, lock PDF document, secure PDF files online",
  'redact': "redact PDF, black out PDF text, permanently hide PDF info, secure redaction online, GDPR PDF tool"
};

const categories = [
  {
    title: "ORGANIZE PDF",
    tools: [
      { path: '/merge-pdf', name: 'Merge PDF', desc: 'Combine PDFs in the order you want with the easiest PDF merger.', icon: <Layers />, component: MergerTool },
      { path: '/split-pdf', name: 'Split PDF', desc: 'Separate one page or a whole set for easy conversion.', icon: <Scissors />, component: SplitterTool },
      { path: '/remove-pages', name: 'Remove pages', desc: 'Remove pages from a PDF document. Select and remove the pages.', icon: <Trash2 />, component: PageRemoverTool },
      { path: '/extract-pages', name: 'Extract pages', desc: 'Extract specific pages from a PDF to form a new document.', icon: <FileOutput />, component: ExtractPagesTool },
      { path: '/organize-pdf', name: 'Organize PDF', desc: 'Sort, change order, or delete PDF pages easily.', icon: <RefreshCw />, component: OrganizePdfTool },
      { path: '/compress-pdf', name: 'Compress PDF', desc: 'Reduce file size while optimizing for maximal PDF quality.', icon: <DownloadCloud />, component: CompressPdfTool },
    ]
  },
  {
    title: "CONVERT TO PDF",
    tools: [
      { path: '/jpg-to-pdf', name: 'JPG to PDF', desc: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.', icon: <ImageIcon />, component: ImageToPdfTool },
    ]
  },
  {
    title: "CONVERT FROM PDF",
    tools: [
      { path: '/pdf-to-jpg', name: 'PDF to JPG', desc: 'Convert each PDF page into a JPG or extract all images contained in a PDF.', icon: <ImageIcon />, component: PdfToJpgTool },
      { path: '/pdf-to-word', name: 'PDF to Word', desc: 'Convert PDF documents to editable Word files with high accuracy.', icon: <FileText />, component: PdfToWordTool },
    ]
  },
  {
    title: "EDIT PDF",
    tools: [
      { path: '/rotate-pdf', name: 'Rotate PDF', desc: 'Rotate your PDFs the way you need them.', icon: <RotateCw />, component: PageRotatorTool },
      { path: '/page-numbers', name: 'Add page numbers', desc: 'Add page numbers into PDFs with ease. Choose your positions and dimensions.', icon: <Hash />, component: PageNumbererTool },
      { path: '/watermark-pdf', name: 'Add watermark', desc: 'Stamp an image or text over your PDF in seconds.', icon: <Droplets />, component: WatermarkTool },
      { path: '/crop-pdf', name: 'Crop PDF', desc: 'Crop PDF margins, change PDF page size.', icon: <Crop />, component: CropPdfTool },
      { path: '/edit-pdf', name: 'Edit PDF', desc: 'Add text, images, shapes or freehand annotations to a PDF document.', icon: <Type />, component: EditorTool },
      { path: '/remove-watermark', name: 'Remove Watermark', desc: 'True watermark removal: identifies and deletes recurring objects from PDF data.', icon: <Eraser />, component: WatermarkRemoverTool },
    ]
  },
  {
    title: "PDF SECURITY",
    tools: [
      { path: '/protect-pdf', name: 'Protect PDF', desc: 'Encrypt your PDF with a password to prevent unauthorized access.', icon: <Lock />, component: ProtectPdfTool },
      { path: '/redact-pdf', name: 'Redact PDF', desc: 'Permanently hide and blackout sensitive text and images.', icon: <Type />, component: RedactPdfTool },
    ]
  }
];

// Flatten tools for routing mapping
const allTools = categories.flatMap(cat => cat.tools);

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const [installPrompt, setInstallPrompt] = React.useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    return localStorage.getItem('theme') === 'dark' || false;
  });
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);


  React.useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
  }, []);

  React.useEffect(() => {
    const path = location.pathname;
    let title = "SealPDF | Professional PDF Toolkit - Watermark, Merge, Split & More";
    let description = "SealPDF is a professional, fast, and secure PDF toolkit. Watermark, merge, split, rotate, and number your PDF files for free. No file limits, no registration.";
    let keywords = "PDF toolkit, watermark PDF, merge PDF, split PDF, PDF pages numberer, PDF rotator, image to PDF, free PDF tools, SealPDF";
    let canonical = `https://seal-pdf.com${path === '/' ? '' : path}`;
    
    let schemaData = null;
    
    // Check if path is a tool route
    const marketingKey = pathToMarketingKey[path];
    if (marketingKey && toolMarketingData[marketingKey]) {
      const toolData = toolMarketingData[marketingKey];
      title = `${toolData.title} | SealPDF`;
      description = toolData.description;
      keywords = toolKeywords[marketingKey] || keywords;
      
      // Build tool-specific schemas
      const url = `https://seal-pdf.com${path}`;
      
      // WebApplication Schema
      const webAppSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "@id": `${url}#webapp`,
        "name": `SealPDF - ${toolData.title.split(' — ')[0]}`,
        "url": url,
        "description": toolData.description,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "All",
        "browserRequirements": "Requires HTML5 compatible browser",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      };

      // HowTo Schema
      const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "@id": `${url}#howto`,
        "name": `How to use SealPDF ${toolData.title.split(' — ')[0]}`,
        "description": `Step-by-step guide to ${toolData.title.toLowerCase()} online for free.`,
        "step": toolData.steps.map((step, idx) => ({
          "@type": "HowToStep",
          "url": `${url}#step-${idx + 1}`,
          "name": step.title,
          "text": step.text
        }))
      };

      // FAQPage Schema
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        "mainEntity": toolData.faqs.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      };

      schemaData = {
        "@context": "https://schema.org",
        "@graph": [webAppSchema, howToSchema, faqSchema]
      };
    } else {
      // Non-tool pages
      if (path === '/about') {
        title = "About Us | SealPDF";
        description = "Learn more about SealPDF, our mission, values, and how we build secure, browser-based tools to simplify your PDF workflow.";
        keywords = "about us, PDF toolkit story, free PDF mission, SealPDF";
      } else if (path === '/contact') {
        title = "Contact Us | SealPDF";
        description = "Get in touch with the SealPDF team for support, feature requests, or general inquiries.";
        keywords = "contact, support, feedback, PDF tool help, SealPDF";
      } else if (path === '/privacy') {
        title = "Privacy Policy | SealPDF";
        description = "Read our privacy policy to understand how we protect your files and personal information. Complete local browser safety.";
        keywords = "privacy policy, data security, PDF privacy, SealPDF";
      } else if (path === '/terms') {
        title = "Terms of Service | SealPDF";
        description = "Read the SealPDF Terms of Service. Understand our usage conditions and security commitments.";
        keywords = "terms of service, user agreement, PDF tools terms, SealPDF";
      }
      
      // Default Website and Org schemas for non-tool pages
      schemaData = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": "https://seal-pdf.com/#website",
            "name": "SealPDF",
            "url": "https://seal-pdf.com/",
            "description": "SealPDF is a professional, fast, and secure PDF toolkit. Watermark, merge, split, rotate, and number your PDF files for free."
          },
          {
            "@type": "Organization",
            "@id": "https://seal-pdf.com/#organization",
            "name": "SealPDF",
            "url": "https://seal-pdf.com/",
            "logo": {
              "@type": "ImageObject",
              "url": "https://seal-pdf.com/logo.png"
            }
          }
        ]
      };
    }
    
    // Update basic tags
    document.title = title;
    
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.setAttribute('content', description);
    
    const kwMeta = document.querySelector('meta[name="keywords"]');
    if (kwMeta) kwMeta.setAttribute('content', keywords);
    
    const canonLink = document.getElementById('canonical-link');
    if (canonLink) canonLink.setAttribute('href', canonical);
    
    // Update Open Graph (og:) tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', canonical);
    
    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', title);
    
    const twitterDesc = document.querySelector('meta[property="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', description);
    
    const twitterUrl = document.querySelector('meta[property="twitter:url"]');
    if (twitterUrl) twitterUrl.setAttribute('content', canonical);
    
    // Inject JSON-LD Schema
    let script = document.getElementById('jsonld-schema');
    if (!script) {
      script = document.createElement('script');
      script.id = 'jsonld-schema';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify(schemaData);
  }, [location.pathname]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };


  const renderHome = () => (
    <>
      <section className="home-hero">
        <div className="hero-badges">
          <div className="hero-badge"><ShieldCheck size={16} /> 100% Secure & Private</div>
          <div className="hero-badge"><Zap size={16} /> No File Size Limits</div>
        </div>
        <h1>Simplify your PDF workflow with everything in one spot</h1>
        <p>Powerful PDF tools made simple and free. Merge, split, compress, convert, rotate, unlock, and watermark your PDFs with just a few clicks.</p>
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
      <ScrollToTop />
      <header className="top-header">
        <div className="header-left">
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
          <Link to="/" className="logo-container">
            <img src="/logo.png" alt="SealPDF Logo" className="logo-img" />
          </Link>
          <nav className="nav-links">
            <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>

            <div className="nav-item dropdown">
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                All tools <ChevronDown size={14} />
              </div>
              <div className="dropdown-content">
                <div className="dropdown-menu-layout">
                  {categories.map((category, idx) => (
                    <div key={idx} className="dropdown-category">
                      <h4>{category.title}</h4>
                      <div className="dropdown-list">
                        {category.tools.map(tool => (
                          <Link key={tool.path} to={tool.path} className="dropdown-item">
                            {React.cloneElement(tool.icon, { size: 16, strokeWidth: 2 })}
                            {tool.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link to="/merge-pdf" className={`nav-item ${location.pathname === '/merge-pdf' ? 'active' : ''}`}>Merge</Link>
            <Link to="/split-pdf" className={`nav-item ${location.pathname === '/split-pdf' ? 'active' : ''}`}>Split</Link>
            <Link to="/jpg-to-pdf" className={`nav-item ${location.pathname === '/jpg-to-pdf' ? 'active' : ''}`}>JPG to PDF</Link>
          </nav>
        </div>

        <div className="header-right">
          <button
            className="icon-btn"
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ marginRight: '1rem' }}
            title="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {installPrompt && (
            <button className="install-btn" onClick={handleInstall}>
              <DownloadCloud size={18} />
              <span>Install App</span>
            </button>
          )}

          <SignedOut>
            <SignInButton mode="modal" afterSignInUrl={location.pathname} afterSignUpUrl={location.pathname}>
              <button className="auth-btn login">Log in</button>
            </SignInButton>
            <SignUpButton mode="modal" afterSignInUrl={location.pathname} afterSignUpUrl={location.pathname}>
              <button className="auth-btn signup">
                <span className="signup-text">Sign up</span>
                <User className="signup-icon" size={20} />
              </button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: { width: 36, height: 36 } } }} />
          </SignedIn>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
        <div className="mobile-drawer-content">
          <div className="mobile-drawer-header">
            <img src="/logo.png" alt="SealPDF Logo" className="logo-img" />
            <button className="icon-btn" onClick={() => setMobileMenuOpen(false)}><X size={24} /></button>
          </div>
          <div className="mobile-drawer-links">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <div className="mobile-drawer-divider"></div>
            {categories.map((category, idx) => (
              <div key={idx} className="mobile-drawer-category">
                <h4>{category.title}</h4>
                {category.tools.map(tool => (
                  <Link key={tool.path} to={tool.path} onClick={() => setMobileMenuOpen(false)}>
                    {React.cloneElement(tool.icon, { size: 16, strokeWidth: 2 })}
                    {tool.name}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

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
                  <tool.component />
                </div>
              }
            />
          ))}
        </Routes>
      </main>

      <Footer />
      <CookieConsent />
    </div>
  );
}

export default App;
