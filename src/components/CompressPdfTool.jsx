import React, { useState } from 'react';
import {
    Minimize2,
    Download,
    Loader2,
    FileText,
    CheckCircle2,
    X,
    Settings
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Setup pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

import AuthDownloadWrapper from './AuthDownloadWrapper';

const CompressPdfTool = () => {
    const [file, setFile] = useState(null);
    const [quality, setQuality] = useState(0.6); // Default to Medium (0.6)
    const [isProcessing, setIsProcessing] = useState(false);
    const [complete, setComplete] = useState(false);
    const [progress, setProgress] = useState('');
    const [stats, setStats] = useState(null);

    const onFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setComplete(false);
            setStats(null);
        }
    };

    const convertPageToJpeg = async (page, scale, jpegQuality) => {
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
        return canvas.toDataURL('image/jpeg', jpegQuality);
    };

    const compressPDF = async () => {
        if (!file) return;
        setIsProcessing(true);
        setComplete(false);
        setStats(null);
        
        const originalSize = file.size;
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
            const newPdf = await PDFDocument.create();
            const totalPages = pdfDoc.numPages;

            // Determine scale based on quality selection
            // High quality: 1.5, Medium: 1.0, Low: 0.7
            const scale = quality > 0.7 ? 1.5 : (quality > 0.4 ? 1.0 : 0.7);

            for (let i = 1; i <= totalPages; i++) {
                setProgress(`Compressing page ${i} of ${totalPages}...`);
                const page = await pdfDoc.getPage(i);
                
                // Convert page to JPEG image
                const jpegDataUri = await convertPageToJpeg(page, scale, quality);
                
                // Embed JPEG into new PDF
                const jpegImage = await newPdf.embedJpg(jpegDataUri);
                const pdfPage = newPdf.addPage([jpegImage.width, jpegImage.height]);
                
                pdfPage.drawImage(jpegImage, {
                    x: 0,
                    y: 0,
                    width: jpegImage.width,
                    height: jpegImage.height,
                });
            }

            setProgress('Finishing up...');
            const compressedPdfBytes = await newPdf.save();
            const compressedSize = compressedPdfBytes.byteLength;
            
            const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `compressed_${file.name}`;
            link.click();
            
            setStats({
                original: (originalSize / 1024 / 1024).toFixed(2),
                compressed: (compressedSize / 1024 / 1024).toFixed(2),
                saved: (((originalSize - compressedSize) / originalSize) * 100).toFixed(0)
            });
            setComplete(true);
        } catch (error) {
            alert(`Compression failed: ${error.message}`);
        } finally {
            setIsProcessing(false);
            setProgress('');
        }
    };

    return (
        <div className="tool-content animate-fadeIn">
            <main className="main-layout">
                <section>
                    {!file ? (
                        <div className="glass-card clickable" onClick={() => document.getElementById('compress-upload').click()}>
                            <div className="upload-zone">
                                <div className="huge-select-btn">Select PDF file</div>
                                <p className="upload-subtext">or drop PDF here</p>
                                <input type="file" id="compress-upload" hidden accept=".pdf" onChange={onFileChange} />
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card">
                            <div className="file-info-header">
                                <FileText />
                                <div className="file-details">
                                    <p className="file-name">{file.name}</p>
                                    <p className="file-meta">Source Document • {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button className="icon-btn" onClick={() => setFile(null)}><X size={20} /></button>
                            </div>
                            <div className="preview-placeholder">
                                <Minimize2 size={64} style={{ opacity: 0.2 }} />
                                <p>Select compression level and click compress</p>
                                {isProcessing && <p className="upload-subtext animate-pulse" style={{ color: 'var(--primary)' }}>{progress}</p>}
                                {stats && (
                                    <div style={{ textAlign: 'center', marginTop: '1rem', background: '#f0fdf4', padding: '1rem', borderRadius: '8px', color: '#166534' }}>
                                        <p style={{ fontWeight: 'bold' }}>Compression saved {stats.saved}% !</p>
                                        <p style={{ fontSize: '0.9rem' }}>Went from {stats.original} MB → {stats.compressed} MB</p>
                                    </div>
                                )}
                            </div>
                            <AuthDownloadWrapper>
                                <button className="action-btn" onClick={compressPDF} disabled={isProcessing}>
                                {isProcessing ? <><Loader2 className="animate-spin" /> Compressing...</> : <><Download size={20} /> Compress PDF</>}
                            </button>
                            </AuthDownloadWrapper>
                            {complete && <div className="status-msg success"><CheckCircle2 size={16} /> PDF compressed successfully!</div>}
                            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Note: Compression flattens the PDF, meaning text cannot be highlighted in the downloaded file.
                            </p>
                        </div>
                    )}
                </section>

                <aside className="glass-card">
                    <div className="aside-header">
                        <Settings size={20} />
                        <h3>Compression Level</h3>
                    </div>
                    <div className="controls-group">
                        <div className="control-item">
                            <label>Quality</label>
                            <div className="toggle-group" style={{ flexDirection: 'column', background: 'transparent', gap: '0.5rem' }}>
                                <button 
                                    className={`toggle-btn ${quality === 0.3 ? 'active' : ''}`}
                                    onClick={() => setQuality(0.3)}
                                    style={{ border: '1px solid var(--border-color)', background: quality === 0.3 ? 'var(--primary)' : 'var(--bg-white)', color: quality === 0.3 ? 'white' : 'var(--text-main)', padding: '0.8rem' }}
                                >
                                    Extreme Compression (Less Quality)
                                </button>
                                <button 
                                    className={`toggle-btn ${quality === 0.6 ? 'active' : ''}`}
                                    onClick={() => setQuality(0.6)}
                                    style={{ border: '1px solid var(--border-color)', background: quality === 0.6 ? 'var(--primary)' : 'var(--bg-white)', color: quality === 0.6 ? 'white' : 'var(--text-main)', padding: '0.8rem' }}
                                >
                                    Recommended (Good Quality)
                                </button>
                                <button 
                                    className={`toggle-btn ${quality === 0.9 ? 'active' : ''}`}
                                    onClick={() => setQuality(0.9)}
                                    style={{ border: '1px solid var(--border-color)', background: quality === 0.9 ? 'var(--primary)' : 'var(--bg-white)', color: quality === 0.9 ? 'white' : 'var(--text-main)', padding: '0.8rem' }}
                                >
                                    Less Compression (High Quality)
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default CompressPdfTool;
