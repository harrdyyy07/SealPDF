import React from 'react';
import LegalPage from './LegalPage';
import { ShieldCheck, Zap, Cpu, Heart } from 'lucide-react';

const AboutUs = ({ onBack }) => {
    const content = (
        <>
            <p className="lead-text" style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '2rem' }}>
                SealPDF was established with a singular mission: to provide highly secure, fast, and completely accessible PDF tools to users around the globe. We believe managing files should not involve expensive licenses, complicated registrations, or compromises to personal privacy.
            </p>

            <h2>Our Mission & Vision</h2>
            <p>
                In a digital-first workspace, PDFs are the building blocks of commerce, legal systems, education, and professional services. However, editing, merging, or watermarking documents often requires bulky software or sketchy cloud upload services. SealPDF simplifies document logistics by packing enterprise-grade utilities into a lightweight, responsive browser application.
            </p>

            <h2>Privacy By Design: Client-Side Execution</h2>
            <p>
                Unlike generic online PDF conversion pages that copy your files onto third-party backend servers, SealPDF pioneers a <strong>privacy-first approach</strong>. By compiling robust rendering libraries into WebAssembly, our application executes tools directly within your browser cache memory. 
            </p>
            <p>
                When you merge pages, stamp watermarks, rotate pages, or apply page numbers, <strong>your documents never leave your computer.</strong> This local execution loop isolates your financial audits, tax forms, and proprietary intellectual property from cyber security threats, storage breaches, or server logs.
            </p>

            <h2>Core Principles We Live By</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', margin: '2rem 0' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        <ShieldCheck size={18} color="var(--primary)" />
                        Data Sovereignty
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Your files belong to you. We never audit, inspect, analyze, or archive document contents.</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        <Zap size={18} color="#eab308" />
                        Speed & Simplicity
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Eliminate bloated setup sheets. Process files with drag-and-drop actions in milliseconds.</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        <Cpu size={18} color="#10b981" />
                        Technological Innovation
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Employ WebAssembly to scale native desktop tasks into sandboxed browser runtimes.</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        <Heart size={18} color="#ec4899" />
                        Universal Access
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Core features remain completely free, with no watermark overlays on your downloads.</p>
                </div>
            </div>

            <h2>Global Compliance Standards</h2>
            <p>
                SealPDF aligns with regulatory policies such as GDPR, CCPA, and COPPA. Because we do not store documents or gather tracking data, we are recognized as a compliant utility pipeline. We continuously upgrade our encryption methods and browser APIs to stay ahead of the digital safety landscape.
            </p>
        </>
    );

    return <LegalPage title="About SealPDF" content={content} onBack={onBack} />;
};

export default AboutUs;
