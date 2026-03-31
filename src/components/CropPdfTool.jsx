import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Crop, Download, FileUp } from 'lucide-react';

import AuthDownloadWrapper from './AuthDownloadWrapper';

const CropPdfTool = () => {
    const [file, setFile] = useState(null);
    const [margins, setMargins] = useState({ top: 10, bottom: 10, left: 10, right: 10 });
    const [isCropping, setIsCropping] = useState(false);
    const [error, setError] = useState('');
    const [croppedPdfUrl, setCroppedPdfUrl] = useState(null);

    const onFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setCroppedPdfUrl(null);
            setError('');
        }
    };

    const handleMarginChange = (e) => {
        setMargins(prev => ({
            ...prev,
            [e.target.name]: Number(e.target.value) || 0
        }));
    };

    const handleCrop = async () => {
        if (!file) {
            setError('Please select a file.');
            return;
        }

        try {
            setIsCropping(true);
            setError('');
            const fileData = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(fileData);
            
            const pages = pdfDoc.getPages();
            pages.forEach(page => {
                const { width, height } = page.getSize();
                // We reduce the box by margins (points roughly)
                // Default box is [x, y, width, height], origin at bottom-left
                page.setCropBox(
                    margins.left, 
                    margins.bottom, 
                    width - margins.left - margins.right, 
                    height - margins.top - margins.bottom
                );
            });

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            setCroppedPdfUrl(URL.createObjectURL(blob));
        } catch (err) {
            console.error(err);
            setError('Failed to crop PDF: ' + err.message);
        } finally {
            setIsCropping(false);
        }
    };

    return (
        <div className="main-layout single-col animate-fadeIn">
            <div className="glass-card">
                {!file ? (
                    <div className="upload-zone clickable" onClick={() => document.getElementById('pdf-upload-crop').click()}>
                        <div className="huge-select-btn">Select PDF file</div>
                        <p className="upload-subtext" style={{ marginTop: '1rem' }}>or drop PDF here</p>
                        <input type="file" id="pdf-upload-crop" hidden accept=".pdf" onChange={onFileChange} />
                    </div>
                ) : (
                    <div className="controls-group">
                        <div className="file-info-header">
                            <FileUp className="file-icon" />
                            <div className="file-details">
                                <p className="file-name">{file.name}</p>
                            </div>
                            <button className="icon-btn" onClick={() => setFile(null)}>✕</button>
                        </div>

                        {!croppedPdfUrl ? (
                            <>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Enter crop margins (in points):</p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="control-item">
                                        <label>Top Margin</label>
                                        <input type="number" name="top" value={margins.top} onChange={handleMarginChange} />
                                    </div>
                                    <div className="control-item">
                                        <label>Bottom Margin</label>
                                        <input type="number" name="bottom" value={margins.bottom} onChange={handleMarginChange} />
                                    </div>
                                    <div className="control-item">
                                        <label>Left Margin</label>
                                        <input type="number" name="left" value={margins.left} onChange={handleMarginChange} />
                                    </div>
                                    <div className="control-item">
                                        <label>Right Margin</label>
                                        <input type="number" name="right" value={margins.right} onChange={handleMarginChange} />
                                    </div>
                                </div>

                                {error && <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>}

                                <button 
                                    className={`action-btn ${isCropping ? 'animate-pulse' : ''}`}
                                    onClick={handleCrop}
                                    disabled={isCropping}
                                >
                                    <Crop />
                                    {isCropping ? 'Cropping...' : 'Crop PDF'}
                                </button>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <Crop size={48} color="#16a34a" style={{ marginBottom: '1rem' }} />
                                <h2>PDF Cropped!</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Your new PDF is ready to download.</p>
                                <AuthDownloadWrapper>
                                <a href={croppedPdfUrl} download={`cropped_${file.name}`} className="action-btn" style={{ textDecoration: 'none' }}>
                                    <Download /> Download Cropped PDF
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

export default CropPdfTool;
