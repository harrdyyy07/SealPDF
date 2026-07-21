import React, { useState } from 'react';
import LegalPage from './LegalPage';
import { Mail, MessageSquare, MapPin, Clock, Send, ShieldCheck } from 'lucide-react';

const ContactUs = ({ onBack }) => {
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Visual submit feedback
        if (formData.email && formData.message) {
            setSubmitted(true);
        }
    };

    const content = (
        <>
            <p className="lead-text" style={{ marginBottom: '2rem' }}>
                Have inquiries about document security, custom branding requests, or need technical help? Contact the SealPDF support desk. Our team resolves requests within 24-48 hours.
            </p>

            <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', margin: '2rem 0' }}>
                {/* Info Panel */}
                <div className="contact-info-panel">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Mail size={22} color="var(--primary)" style={{ marginTop: '3px' }} />
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>Support Desk</h3>
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>support@sealpdf.com</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                        <MessageSquare size={22} color="#a855f7" style={{ marginTop: '3px' }} />
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>Feedback & Requests</h3>
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>feedback@sealpdf.com</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                        <MapPin size={22} color="#10b981" style={{ marginTop: '3px' }} />
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>Operations HQ</h3>
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                SealPDF Technologies Ltd.<br />
                                14 East Plaza, Suite 400<br />
                                London, EC1A 1BB, United Kingdom
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                        <Clock size={22} color="#eab308" style={{ marginTop: '3px' }} />
                        <div>
                            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>Operational Hours</h3>
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Monday – Friday: 09:00 – 18:00 GMT</p>
                        </div>
                    </div>
                </div>

                {/* Styled Contact Form */}
                <div className="contact-form-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <ShieldCheck size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ color: 'var(--text-main)', margin: 0 }}>Message Received</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                Thank you for contacting support. We will get back to you shortly.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>Your Name</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>Email Address</label>
                                <input 
                                    type="email" 
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>Message</label>
                                <textarea 
                                    rows="4" 
                                    required
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', resize: 'vertical' }}
                                />
                            </div>
                            <button type="submit" className="auth-btn signup" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                                <Send size={16} style={{ marginRight: '8px' }} />
                                Send Message
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </>
    );

    return <LegalPage title="Contact Us" content={content} onBack={onBack} />;
};

export default ContactUs;
