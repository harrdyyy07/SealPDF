import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { Image as ImageIcon, Download, FileUp } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

import AuthDownloadWrapper from './AuthDownloadWrapper';
import MarketingSection from './MarketingSection';


const PdfToJpgTool = () => {
    const [file, setFile] = useState(null);
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [zipUrl, setZipUrl] = useState(null);

    const onFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setZipUrl(null);
            setError('');
            setProgress(0);
        }
    };

    const handleConvert = async () => {
        if (!file) {
            setError('Please select a PDF file.');
            return;
        }

        try {
            setIsConverting(true);
            setError('');
            setProgress(0);
            
            const fileData = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: fileData });
            const pdfDoc = await loadingTask.promise;
            
            const numPages = pdfDoc.numPages;
            const zip = new JSZip();
            
            // For converting to canvas, we need a scaling factor.
            // 2.0 is a good standard for nice quality JPEGs
            const scale = 2.0;

            for (let i = 1; i <= numPages; i++) {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale });
                
                // Prepare canvas using HTML5 canvas
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                await page.render(renderContext).promise;
                
                // Convert canvas to base64 jpg
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                // Strip the exact base64 data to add to JSZip
                const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
                
                zip.file(`page_${i}.jpg`, base64Data, {base64: true});
                
                setProgress(Math.round((i / numPages) * 100));
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            setZipUrl(URL.createObjectURL(zipBlob));
        } catch (err) {
            console.error(err);
            setError('Failed to convert PDF to JPG: ' + err.message);
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div className="main-layout single-col animate-fadeIn">
            <div className="glass-card">
                {!file ? (
                    <div className="upload-zone clickable" onClick={() => document.getElementById('pdf-upload-jpg').click()}>
                        <div className="huge-select-btn">Select PDF file</div>
                        <p className="upload-subtext" style={{ marginTop: '1rem' }}>or drop PDF here</p>
                        <input type="file" id="pdf-upload-jpg" hidden accept=".pdf" onChange={onFileChange} />
                    </div>
                ) : (
                    <div className="controls-group">
                        <div className="file-info-header">
                            <FileUp className="file-icon" />
                            <div className="file-details">
                                <p className="file-name">{file.name}</p>
                            </div>
                            <button className="icon-btn" onClick={() => { setFile(null); setZipUrl(null); }} disabled={isConverting}>✕</button>
                        </div>

                        {!zipUrl ? (
                            <>
                                {error && <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>}
                                
                                {isConverting && (
                                    <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '8px', height: '8px', marginTop: '1rem' }}>
                                        <div style={{ height: '100%', background: 'var(--primary)', borderRadius: '8px', width: `${progress}%`, transition: 'width 0.2s' }}></div>
                                    </div>
                                )}

                                <button 
                                    className={`action-btn ${isConverting ? 'animate-pulse' : ''}`}
                                    onClick={handleConvert}
                                    disabled={isConverting}
                                >
                                    <ImageIcon />
                                    {isConverting ? `Converting (${progress}%)...` : 'Convert to JPG'}
                                </button>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <ImageIcon size={48} color="#16a34a" style={{ marginBottom: '1rem' }} />
                                <h2>Conversion Complete!</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Your JPG images are ready.</p>
                                <AuthDownloadWrapper>
                                <a href={zipUrl} download={`images_${file.name.replace('.pdf','')}.zip`} className="action-btn" style={{ textDecoration: 'none' }}>
                                    <Download /> Download ZIP
                                </a>
                            </AuthDownloadWrapper>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <MarketingSection toolId="pdf2jpg" />
        </div>
    );
};

export default PdfToJpgTool;
