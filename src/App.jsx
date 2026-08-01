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
import GuidesList from './components/GuidesList';
import GuideDetail from './components/GuideDetail';
import HelpCenter from './components/HelpCenter';
import { guidesData } from './data/guidesData';
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
      } else if (path === '/guides') {
        title = "Guides & Resources | SealPDF";
        description = "Read our expert-written, comprehensive PDF guides. Learn about password protection, document watermarks, compression efficiency, layout integrity, and GDPR compliance.";
        keywords = "PDF guides, how-to PDF, password protect guide, compress PDF guide, document safety, GDPR compliance PDF";
        
        schemaData = {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": "https://seal-pdf.com/guides#collection",
          "name": "SealPDF Guides & Technical Resources",
          "url": "https://seal-pdf.com/guides",
          "description": "Educational articles, guides, and tutorials on managing, optimizing, and protecting PDF files securely."
        };
      } else if (path.startsWith('/guides/')) {
        const slug = path.split('/')[2];
        const guide = guidesData.find(g => g.slug === slug);
        if (guide) {
          title = `${guide.title} | SealPDF Guides`;
          description = guide.description;
          keywords = guide.keywords;
          
          const url = `https://seal-pdf.com${path}`;
          schemaData = {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "@id": `${url}#article`,
            "headline": guide.title,
            "description": guide.description,
            "image": "https://seal-pdf.com/logo.png",
            "author": {
              "@type": "Organization",
              "name": "SealPDF"
            },
            "publisher": {
              "@type": "Organization",
              "name": "SealPDF",
              "logo": {
                "@type": "ImageObject",
                "url": "https://seal-pdf.com/logo.png"
              }
            },
            "datePublished": "2026-07-21T00:00:00Z",
            "mainEntityOfPage": url
          };
        }
      } else if (path === '/help') {
        title = "Help & Support Center | SealPDF";
        description = "Get answers to frequently asked questions about SealPDF file processing security, GDPR compliance, and tools support.";
        keywords = "help center, FAQ, support, PDF processing, local browser processing, GDPR FAQ, SealPDF support";
        
        schemaData = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "@id": "https://seal-pdf.com/help#faq",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How does SealPDF process my files?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Most tools run client-side directly in your browser using JavaScript and WebAssembly. Files never leave your local device."
              }
            },
            {
              "@type": "Question",
              "name": "Is SealPDF GDPR compliant?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, we do not store files longer than required, and local tools upload nothing."
              }
            }
          ]
        };
      }
      
      // Default Website and Org schemas for non-tool pages if schemaData not set
      if (!schemaData) {
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


  const homeFaqs = [
    {
      q: "How does SealPDF protect my document privacy?",
      a: "SealPDF uses advanced client-side WebAssembly technology. Most document operations (like merging, splitting, watermarking, rotating, and numbering) run directly inside your web browser engine. Your files are processed locally on your device and are never uploaded to any remote server."
    },
    {
      q: "Are there any file size limits or usage restrictions?",
      a: "SealPDF offers free processing with generous file capacity. Because local tools leverage your device's memory, you can manipulate multi-page PDFs and high-resolution files without strict cloud caps."
    },
    {
      q: "Can I use SealPDF on mobile devices or smartphones?",
      a: "Yes! SealPDF is fully responsive and optimized for mobile web browsers across iOS, Android, macOS, Windows, and Linux. No app installation is required."
    },
    {
      q: "Is SealPDF compliant with GDPR and CCPA privacy standards?",
      a: "Yes. SealPDF strictly adheres to GDPR and CCPA privacy principles. Because we operate with a client-side execution paradigm, we do not inspect, retain, or monetize your personal document data."
    },
    {
      q: "What is the difference between visual hiding and programmatic redaction?",
      a: "Visual hiding places a dark block over text while leaving underlying text selectable in the document layout. Programmatic redaction, offered by SealPDF's Redact Tool, permanently purges the raw vector data and text characters from the binary stream so it cannot be recovered."
    }
  ];

  const [openHomeFaq, setOpenHomeFaq] = useState(null);

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

      <section className="home-rich-content" style={{ marginTop: '4rem', borderTop: '1px solid var(--border-color)', paddingTop: '4rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', color: 'var(--text-main)', lineHeight: 1.7 }}>
          
          {/* Section 1: Client-Side Security */}
          <div style={{ marginBottom: '3.5rem', background: 'var(--card-bg, rgba(255,255,255,0.02))', padding: '2.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
              Why Browser-Based Client-Side PDF Processing is Superior
            </h2>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
              In traditional digital workflows, editing or organizing PDF files required transmitting confidential files to cloud-based servers. Every upload carries inherent risks of data interception, unauthorized archiving, or compliance breaches under stringent regulations such as GDPR, HIPAA, and CCPA.
            </p>
            <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
              <strong>SealPDF changes this paradigm completely.</strong> Powered by compiled WebAssembly and native HTML5 APIs, SealPDF executes core document transformations—such as page merging, splitting, watermarking, page numbering, and margin cropping—entirely inside your browser's sandboxed memory space.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.4rem' }}>Zero Cloud Retention</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Your financial records, legal contracts, and personal identity documents remain strictly on your local device.</p>
              </div>
              <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.4rem' }}>Instantaneous Speed</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Bypass bandwidth bottlenecks and upload wait times. Processing happens instantly at hardware speed.</p>
              </div>
              <div style={{ padding: '1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.4rem' }}>Universal Compatibility</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Runs seamlessly across Windows, macOS, Linux, iOS, and Android without installing heavy desktop software.</p>
              </div>
            </div>
          </div>

          {/* Section 2: Comprehensive Capabilities */}
          <div style={{ marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
              Comprehensive Suite of Free PDF Management Tools
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div style={{ padding: '1.8rem', background: 'var(--card-bg, rgba(255,255,255,0.02))', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--primary)' }}>Document Organization</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Combine multiple independent PDFs into a cohesive report with our PDF Merger. Split long documents into targeted chapters, remove redundant pages, or extract specific page ranges with pixel-perfect fidelity.
                </p>
              </div>
              <div style={{ padding: '1.8rem', background: 'var(--card-bg, rgba(255,255,255,0.02))', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--primary)' }}>Conversion & Optimization</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Convert high-resolution image sets (JPG, PNG) into standard PDF documents or extract embedded document pages back into high-fidelity image formats. Shrink bulky PDF files using intelligent compression algorithms.
                </p>
              </div>
              <div style={{ padding: '1.8rem', background: 'var(--card-bg, rgba(255,255,255,0.02))', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--primary)' }}>Security & Redaction</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Encrypt files with 256-bit AES password protection, apply custom watermarks to protect proprietary copyrights, or permanently redact sensitive personal data prior to public release.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Educational Resources Link */}
          <div style={{ marginBottom: '3.5rem', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(147,51,234,0.1))', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.75rem' }}>Educational PDF Technical Resources & Guides</h2>
            <p style={{ maxWidth: '700px', margin: '0 auto 1.5rem', color: 'var(--text-muted)' }}>
              Master document security, AES encryption standards, layout optimization, and PDF compliance guidelines with our in-depth technical guides written by experts.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/guides/pdf-security-guide" style={{ background: 'var(--primary)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>
                Read Security Guide →
              </Link>
              <Link to="/guides" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-main)', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem', border: '1px solid var(--border-color)' }}>
                Explore All Guides
              </Link>
            </div>
          </div>

          {/* Section 4: Homepage FAQs */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>
              Frequently Asked Questions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {homeFaqs.map((faq, idx) => (
                <div key={idx} style={{ background: 'var(--card-bg, rgba(255,255,255,0.02))', borderRadius: '10px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <button
                    onClick={() => setOpenHomeFaq(openHomeFaq === idx ? null : idx)}
                    style={{ width: '100%', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 600, textAlign: 'left', cursor: 'pointer' }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: '1.4rem', color: 'var(--primary)', lineHeight: 1 }}>{openHomeFaq === idx ? '−' : '+'}</span>
                  </button>
                  {openHomeFaq === idx && (
                    <div style={{ padding: '0 1.5rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
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
            <Link to="/guides" className={`nav-item ${location.pathname.startsWith('/guides') ? 'active' : ''}`}>Guides</Link>
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
            <Link to="/guides" onClick={() => setMobileMenuOpen(false)}>Guides</Link>
            <Link to="/help" onClick={() => setMobileMenuOpen(false)}>Help Center</Link>
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
          <Route path="/guides" element={<GuidesList />} />
          <Route path="/guides/:slug" element={<GuideDetail />} />
          <Route path="/help" element={<HelpCenter />} />
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
