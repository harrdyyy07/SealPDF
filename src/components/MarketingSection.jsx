import React, { useState } from 'react';
import { 
    Check, 
    ChevronDown, 
    ChevronUp, 
    FileText, 
    Upload, 
    Download, 
    Zap,
    Layers,
    Shield,
    Smartphone
} from 'lucide-react';
import { toolMarketingData } from '../data/toolMarketingData';
import '../styles/MarketingSection.css';

const MarketingSection = ({ toolId }) => {
    const data = toolMarketingData[toolId];
    const [openFaq, setOpenFaq] = useState(null);

    if (!data) return null;

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    // Generic SVG Illustration based on tool importance
    const renderIllustration = () => {
        return (
            <div className="illustration-box animate-float">
                <svg width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="20" y="20" width="140" height="180" rx="12" fill="var(--bg-white)" stroke="var(--border-color)" strokeWidth="2" />
                    <rect x="40" y="50" width="100" height="8" rx="4" fill="var(--bg-color)" />
                    <rect x="40" y="70" width="80" height="8" rx="4" fill="var(--bg-color)" />
                    <rect x="40" y="90" width="90" height="8" rx="4" fill="var(--bg-color)" />
                    
                    <rect x="80" y="40" width="140" height="180" rx="12" fill="var(--bg-white)" stroke="var(--border-color)" strokeWidth="2" style={{ transformOrigin: 'center', transform: 'translate(40px, 20px)' }} />
                    <rect x="100" y="70" width="100" height="8" rx="4" fill="var(--bg-color)" style={{ transform: 'translate(40px, 20px)' }} />
                    
                    <circle cx="120" cy="90" r="30" fill="var(--primary)" fillOpacity="0.1" />
                    {(() => {
                        const Icon = data.features[0].icon;
                        return <Icon size={32} color="var(--primary)" x="104" y="74" />;
                    })()}
                    
                    <path d="M160 90H190" stroke="var(--border-color)" strokeDasharray="4 4" />
                    <circle cx="175" cy="90" r="12" fill="var(--bg-white)" stroke="var(--border-color)" />
                    <Check size={14} color="#10b981" x="168" y="83" />
                </svg>
            </div>
        );
    };

    return (
        <div className="marketing-container">
            {/* Hero Section */}
            <section className="marketing-hero">
                <div className="hero-content">
                    <h2>{data.title}</h2>
                    <p className="hero-description">{data.description}</p>
                    
                    <div className="hero-features-grid">
                        {data.features.map((feature, idx) => (
                            <div key={idx} className="hero-feature-item">
                                <div className="feature-check">
                                    <Check size={14} />
                                </div>
                                <div className="feature-info">
                                    <h4>{feature.title}</h4>
                                    <p>{feature.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="hero-visual">
                    {renderIllustration()}
                </div>
            </section>

            {/* Detailed Feature Cards */}
            <h3 className="marketing-details-title">Beyond {toolId.charAt(0).toUpperCase() + toolId.slice(1).replace('_', ' ')}s: Fine-Tuned Experience</h3>
            <div className="details-grid">
                {data.details[0] && (
                    <div className="detail-card">
                        <div>
                            <h3>{data.details[0].title}</h3>
                            <p>{data.details[0].text}</p>
                        </div>
                        <div className="card-icon-preview">
                            <div className="step-icon-wrapper secondary">
                                {(() => {
                                    const Icon = data.details[0].icon;
                                    return <Icon size={24} />;
                                })()}
                            </div>
                        </div>
                    </div>
                )}
                {data.details[1] && (
                    <div className="detail-card">
                        <div>
                            <h3>{data.details[1].title}</h3>
                            <p>{data.details[1].text}</p>
                        </div>
                        <div className="card-icon-preview">
                             <div className="step-icon-wrapper secondary">
                                {(() => {
                                    const Icon = data.details[1].icon;
                                    return <Icon size={24} />;
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="details-grid alt">
                <div className="detail-card">
                    <div>
                        <h3>Chain Multiple Operations</h3>
                        <p>Combine with compression, merging, or format conversion in one continuous flow — no re-uploading needed.</p>
                    </div>
                    <div className="card-icon-preview">
                        <Layers size={32} color="var(--primary)" opacity={0.5} />
                    </div>
                </div>
                <div className="detail-card">
                    <div style={{ display: 'flex', gap: '30px' }}>
                        <div style={{ flex: 1 }}>
                            <h3>Your Data, Protected</h3>
                            <p>EU servers, GDPR compliant, 256-bit encryption. Files are permanently erased after processing.</p>
                        </div>
                        <div className="step-icon-wrapper secure" style={{ alignSelf: 'center' }}>
                            <Shield size={24} />
                        </div>
                    </div>
                </div>
                <div className="detail-card" style={{ gridColumn: 'span 2' }}>
                     <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <h3>Works on Every Device</h3>
                            <p>Pure browser-based tool. No downloads needed — works on Windows, Mac, phones, and tablets.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                             <Smartphone size={40} color="var(--primary)" opacity={0.3} />
                             <Zap size={40} color="#eab308" opacity={0.3} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Process Steps */}
            <section className="marketing-steps">
                <h3 className="steps-title">{data.title.split('—')[0]} in Just 3 Steps</h3>
                <div className="steps-flow">
                    <div className="steps-connector"></div>
                    {data.steps.map((step, idx) => (
                        <div key={idx} className="step-item">
                            <div className="step-number-bg">0{idx + 1}</div>
                            <div className="step-icon-wrapper">
                                {idx === 0 ? <Upload size={20} /> : idx === 1 ? <Layers size={20} /> : <Download size={20} />}
                            </div>
                            <h4>{step.title}</h4>
                            <p>{step.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ Section */}
            <section className="marketing-faq">
                <h3 className="faq-title">Frequently Asked Questions</h3>
                <div className="faq-list">
                    {data.faqs.map((faq, idx) => (
                        <div key={idx} className="faq-item">
                            <button className="faq-question" onClick={() => toggleFaq(idx)}>
                                {faq.question}
                                {openFaq === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                            {openFaq === idx && (
                                <div className="faq-answer animate-fadeIn">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default MarketingSection;
