import React from 'react';
import LegalPage from './LegalPage';

const AboutUs = ({ onBack }) => {
    const content = (
        <>
            <h2>Our Mission</h2>
            <p>SealPDF was created with a simple goal: to provide easy-to-use, professional-grade PDF tools for everyone. We believe that managing digital documents shouldn't be complicated or expensive.</p>

            <h2>What We Offer</h2>
            <p>We provide a comprehensive suite of PDF tools, including:</p>
            <ul>
                <li>Watermarking for document protection.</li>
                <li>Merging multiple PDFs into a single file.</li>
                <li>Splitting large PDFs into smaller parts.</li>
                <li>Adding page numbers for better organization.</li>
                <li>Rotating pages to the correct orientation.</li>
                <li>Converting images to PDF format.</li>
                <li>Removing unwanted pages from your documents.</li>
            </ul>

            <h2>Why Choose SealPDF?</h2>
            <p><strong>Speed:</strong> Processing happens quickly, often directly in your browser.</p>
            <p><strong>Privacy:</strong> We prioritize your data security and do not store your files longer than necessary.</p>
            <p><strong>Ease of Use:</strong> Our intuitive interface makes PDF tasks accessible to everyone, regardless of technical skill.</p>
        </>
    );

    return <LegalPage title="About Us" content={content} onBack={onBack} />;
};

export default AboutUs;
