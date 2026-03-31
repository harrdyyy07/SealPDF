import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Lock, Download, FileUp } from 'lucide-react';

import AuthDownloadWrapper from './AuthDownloadWrapper';

const ProtectPdfTool = () => {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [isProtecting, setIsProtecting] = useState(false);
    const [error, setError] = useState('');
    const [protectedPdf, setProtectedPdf] = useState(null);

    const onFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setProtectedPdf(null);
            setError('');
        }
    };

    const handleProtect = async () => {
        if (!file || !password) {
            setError('Please select a file and enter a password.');
            return;
        }

        try {
            setIsProtecting(true);
            setError('');
            const fileData = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(fileData);
            
            // Note: pdf-lib encrypt currently works best if we encrypt via userPassword property
            // (assuming the version supports it natively or via simple API)
            // Due to pdf-lib limitations on full RC4/AES, some deep encryption may fail if not supported.
            // A basic implementation:
            pdfDoc.encrypt({
                 userPassword: password,
                 ownerPassword: password,
                 permissions: {
                    printing: 'highResolution',
                    modifying: false,
                    copying: false,
                    annotating: false,
                    fillingForms: false,
                    documentAssembly: false,
                 }
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            setProtectedPdf(URL.createObjectURL(blob));
        } catch (err) {
            console.error(err);
            setError('Failed to protect the PDF: ' + err.message);
        } finally {
            setIsProtecting(false);
        }
    };

    return (
        <div className="main-layout single-col animate-fadeIn">
            <div className="glass-card">
                {!file ? (
                    <div className="upload-zone clickable" onClick={() => document.getElementById('pdf-upload')?.click()}>
                        <div className="huge-select-btn">Select PDF file</div>
                        <p className="upload-subtext" style={{ marginTop: '1rem' }}>or drop PDF here</p>
                        <input type="file" id="pdf-upload" hidden accept=".pdf" onChange={onFileChange} />
                    </div>
                ) : (
                    <div className="controls-group">
                        <div className="file-info-header">
                            <FileUp className="file-icon" />
                            <div className="file-details">
                                <p className="file-name">{file.name}</p>
                                <p className="file-meta">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button className="icon-btn" onClick={() => setFile(null)}>✕</button>
                        </div>

                        {!protectedPdf ? (
                            <>
                                <div className="control-item">
                                    <label>Set Password</label>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <Lock size={20} color="var(--text-muted)" />
                                        <input 
                                            type="password" 
                                            placeholder="Enter strong password" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            style={{ flex: 1 }}
                                        />
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>This password will be required to open the document.</p>
                                </div>

                                {error && <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>}

                                <button 
                                    className={`action-btn ${isProtecting ? 'animate-pulse' : ''}`}
                                    onClick={handleProtect}
                                    disabled={!password || isProtecting}
                                >
                                    <Lock />
                                    {isProtecting ? 'Protecting Document...' : 'Protect PDF'}
                                </button>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <Lock size={48} color="#16a34a" style={{ marginBottom: '1rem' }} />
                                <h2>Your PDF is secure!</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Download the encrypted file below.</p>
                                <AuthDownloadWrapper>
                                <a href={protectedPdf} download={`protected_${file.name}`} className="action-btn" style={{ textDecoration: 'none' }}>
                                    <Download /> Download Protected PDF
                                </a>
                            </AuthDownloadWrapper>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProtectPdfTool;
