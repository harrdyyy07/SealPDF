import React from 'react';
import { Mail, Shield, FileText, Info, Facebook, Twitter, Instagram, Linkedin, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = ({ onLinkClick }) => {
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <div className="footer-col">
                    <h4>SealPDF</h4>
                    <ul>
                        <li><button onClick={() => onLinkClick('about')} className="footer-link">About Us</button></li>
                        <li><button onClick={() => onLinkClick('contact')} className="footer-link">Contact</button></li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>Legal</h4>
                    <ul>
                        <li><button onClick={() => onLinkClick('terms')} className="footer-link">Terms of Service</button></li>
                        <li><button onClick={() => onLinkClick('privacy')} className="footer-link">Privacy Policy</button></li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>Follow Us</h4>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <a href="#" target="_blank" rel="noopener noreferrer" className="footer-link" aria-label="Facebook">
                            <Facebook size={20} />
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer" className="footer-link" aria-label="Twitter">
                            <Twitter size={20} />
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer" className="footer-link" aria-label="Instagram">
                            <Instagram size={20} />
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer" className="footer-link" aria-label="LinkedIn">
                            <Linkedin size={20} />
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer" className="footer-link" aria-label="GitHub">
                            <Github size={20} />
                        </a>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/" onClick={() => window.scrollTo(0,0)}>
                        <img src="/logo.png" alt="SealPDF" style={{ height: '24px', filter: 'grayscale(1) brightness(2)' }} />
                    </Link>
                </div>
                <p>&copy; {new Date().getFullYear()} SealPDF. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
