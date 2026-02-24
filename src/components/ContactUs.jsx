import React from 'react';
import LegalPage from './LegalPage';
import { Mail, MessageSquare } from 'lucide-react';

const ContactUs = ({ onBack }) => {
    const content = (
        <>
            <p>We'd love to hear from you! Whether you have a question about our tools, need help, or want to provide feedback, please feel free to reach out.</p>

            <div className="contact-methods" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                    <Mail size={24} color="#6366f1" />
                    <div>
                        <h3 style={{ margin: 0, color: 'white' }}>Email Support</h3>
                        <p style={{ margin: 0 }}>support@sealpdf.com</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                    <MessageSquare size={24} color="#a855f7" />
                    <div>
                        <h3 style={{ margin: 0, color: 'white' }}>Feedback</h3>
                        <p style={{ margin: 0 }}>We value your suggestions to make SealPDF better.</p>
                    </div>
                </div>
            </div>

            <h2 style={{ marginTop: '2.5rem' }}>Response Time</h2>
            <p>We aim to respond to all inquiries within 24-48 hours during business days. Thank you for your patience.</p>
        </>
    );

    return <LegalPage title="Contact Us" content={content} onBack={onBack} />;
};

export default ContactUs;
