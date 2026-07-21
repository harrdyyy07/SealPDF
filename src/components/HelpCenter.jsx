import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Lock, RefreshCw, Mail, ShieldAlert, Cpu, Database } from 'lucide-react';
import LegalPage from './LegalPage';
import { useNavigate } from 'react-router-dom';

const HelpCenter = () => {
    const navigate = useNavigate();
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const faqs = [
        {
            category: "Privacy & File Security",
            question: "How does SealPDF process my files? Are they secure?",
            answer: "Most of SealPDF's tools (including Merge, Split, Rotate, Remove Pages, Page Numbering, and Watermark) operate entirely in your web browser. Using advanced client-side technologies (like JavaScript and WebAssembly), the file is read and edited locally in your browser sandbox. Your files are never uploaded to any remote server, guaranteeing absolute confidentiality. For tools that require complex backend parsing (such as PDF to Word conversion), files are securely transmitted via encrypted HTTPS, processed in memory, and immediately erased. No backups or logs of file contents are kept."
        },
        {
            category: "Privacy & File Security",
            question: "Is SealPDF GDPR compliant?",
            answer: "Yes. SealPDF is fully compliant with the European Union's General Data Protection Regulation (GDPR). Since we do not collect personal data, do not profile users, and do not retain uploaded files, we process your information with extreme respect. Any file that goes to our backend conversion nodes is completely destroyed within an hour of processing."
        },
        {
            category: "Tool Operations",
            question: "Are there any file size limits?",
            answer: "For our local browser-based tools, there are no strict file size limits, though performance depends on your device's CPU and memory (RAM). For our cloud-assisted converters, we support files up to 50MB for free accounts to ensure stable server bandwidth."
        },
        {
            category: "Tool Operations",
            question: "What is the difference between visual blackout and true redaction?",
            answer: "Visual blackout is drawing a dark shape over text. The characters remain in the metadata stream and can be highlighted and copied. True redaction physically deletes the letters and shapes from the PDF layout code, replacing them with empty placeholders. SealPDF's Redact tool uses structural deletions to ensure sensitive facts cannot be retrieved by text inspectors."
        },
        {
            category: "Troubleshooting",
            question: "Why did my PDF to Word conversion lose some styling?",
            answer: "PDF is a fixed canvas layout, while Word is a reflowable text stream. Recreating logical margins and tables out of coordinates is a complex mathematical process. If your file contains custom fonts that are not installed on your operating system, Word will substitute them, which can shift paragraph alignments. Using standard fonts (like Arial, Times New Roman, or Helvetica) prevents this shift."
        },
        {
            category: "General",
            question: "Is SealPDF completely free to use?",
            answer: "Yes, SealPDF is 100% free. There are no hidden subscription charges, no watermarks stamped onto your downloads, and no registrations required to access our core suite of tools."
        }
    ];

    const content = (
        <div className="help-center-inner">
            <p className="lead-text">
                Have questions about document security, processing workflows, or need help troubleshooting? Browse our FAQ topics or get in touch.
            </p>

            {/* Architecture Diagram */}
            <div className="architecture-diagram-section" style={{ margin: '2.5rem 0' }}>
                <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={20} color="var(--primary)" />
                    Privacy Architecture
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    How our zero-upload technology processes your files locally on your device:
                </p>
                <div className="diag-flow">
                    <div className="diag-box">
                        <Database size={24} className="diag-icon" />
                        <span>Source PDF</span>
                        <small>On your device</small>
                    </div>
                    <div className="diag-arrow">&rarr;</div>
                    <div className="diag-box active">
                        <Cpu size={24} className="diag-icon text-primary" />
                        <span>Browser Memory</span>
                        <small>WebAssembly Sandbox</small>
                    </div>
                    <div className="diag-arrow">&rarr;</div>
                    <div className="diag-box">
                        <Lock size={24} className="diag-icon text-green" />
                        <span>Output PDF</span>
                        <small>Saved locally</small>
                    </div>
                </div>
                <div className="diagram-caption" style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    💡 <strong>Zero Upload:</strong> Files never leave your local computer. Completely private and offline-capable.
                </div>
            </div>

            {/* FAQs Accordion */}
            <h2 style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Frequently Asked Questions</h2>
            <div className="faq-accordion">
                {faqs.map((faq, index) => (
                    <div key={index} className="faq-item">
                        <button className="faq-question" onClick={() => toggleFaq(index)}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
                                <span className="faq-cat-badge">{faq.category}</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.25rem' }}>{faq.question}</span>
                            </div>
                            {openIndex === index ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {openIndex === index && (
                            <div className="faq-answer animate-fadeIn">
                                <p style={{ margin: 0, lineHeight: '1.6' }}>{faq.answer}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Need More Help CTA */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', background: 'rgba(37, 99, 235, 0.08)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '3rem' }}>
                <div>
                    <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Still need help?</h3>
                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        If you have other technical inquiries or feature requests, contact our support desk directly.
                    </p>
                </div>
                <button onClick={() => navigate('/contact')} className="auth-btn signup" style={{ flexShrink: 0 }}>
                    <Mail size={16} style={{ marginRight: '8px' }} />
                    Contact Support
                </button>
            </div>
        </div>
    );

    return <LegalPage title="Help & Support Center" content={content} onBack={() => navigate('/')} />;
};

export default HelpCenter;
