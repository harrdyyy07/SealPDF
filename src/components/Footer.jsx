import React from 'react';
import { Mail, Shield, FileText, Info, Facebook, Twitter, Instagram, Linkedin, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="app-footer">
            <div className="footer-content">
                <div className="footer-col">
                    <h4>Organize PDF</h4>
                    <ul>
                        <li><Link to="/merge-pdf" className="footer-link">Merge PDF</Link></li>
                        <li><Link to="/split-pdf" className="footer-link">Split PDF</Link></li>
                        <li><Link to="/remove-pages" className="footer-link">Remove pages</Link></li>
                        <li><Link to="/extract-pages" className="footer-link">Extract pages</Link></li>
                        <li><Link to="/organize-pdf" className="footer-link">Organize PDF</Link></li>
                        <li><Link to="/compress-pdf" className="footer-link">Compress PDF</Link></li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>Convert PDF</h4>
                    <ul>
                        <li><Link to="/jpg-to-pdf" className="footer-link">JPG to PDF</Link></li>
                        <li><Link to="/pdf-to-jpg" className="footer-link">PDF to JPG</Link></li>
                        <li><Link to="/pdf-to-word" className="footer-link">PDF to Word</Link></li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>Edit PDF</h4>
                    <ul>
                        <li><Link to="/rotate-pdf" className="footer-link">Rotate PDF</Link></li>
                        <li><Link to="/page-numbers" className="footer-link">Add page numbers</Link></li>
                        <li><Link to="/watermark-pdf" className="footer-link">Add watermark</Link></li>
                        <li><Link to="/crop-pdf" className="footer-link">Crop PDF</Link></li>
                        <li><Link to="/edit-pdf" className="footer-link">Edit PDF</Link></li>
                        <li><Link to="/remove-watermark" className="footer-link">Remove Watermark</Link></li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>Security</h4>
                    <ul>
                        <li><Link to="/protect-pdf" className="footer-link">Protect PDF</Link></li>
                        <li><Link to="/redact-pdf" className="footer-link">Redact PDF</Link></li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h4>SealPDF</h4>
                    <ul>
                        <li><Link to="/about" className="footer-link">About Us</Link></li>
                        <li><Link to="/contact" className="footer-link">Contact</Link></li>
                        <li><Link to="/terms" className="footer-link">Terms of Service</Link></li>
                        <li><Link to="/privacy" className="footer-link">Privacy Policy</Link></li>
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
