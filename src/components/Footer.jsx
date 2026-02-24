import React from 'react';
import { Mail, Shield, FileText, Info } from 'lucide-react';

const Footer = ({ onLinkClick }) => {
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <div className="footer-left">
                    <p>&copy; {new Date().getFullYear()} SealPDF. All rights reserved.</p>
                </div>
                <div className="footer-links">
                    <button onClick={() => onLinkClick('about')} className="footer-link">
                        <Info size={16} />
                        About Us
                    </button>
                    <button onClick={() => onLinkClick('privacy')} className="footer-link">
                        <Shield size={16} />
                        Privacy Policy
                    </button>
                    <button onClick={() => onLinkClick('terms')} className="footer-link">
                        <FileText size={16} />
                        Terms of Service
                    </button>
                    <button onClick={() => onLinkClick('contact')} className="footer-link">
                        <Mail size={16} />
                        Contact Us
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
