import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { FileOutput, Download, FileUp } from 'lucide-react';

const ExtractPagesTool = () => {
    const [file, setFile] = useState(null);
    const [pageRanges, setPageRanges] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [error, setError] = useState('');
    const [extractedPdfUrl, setExtractedPdfUrl] = useState(null);

    const onFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setExtractedPdfUrl(null);
            setError('');
        }
    };

    const parsePageRanges = (rangesStr, maxPages) => {
        const selected = new Set();
        const parts = rangesStr.split(',');
        for (const p of parts) {
            const range = p.trim();
            if (!range) continue;
            if (range.includes('-')) {
                const [start, end] = range.split('-').map(Number);
                if (!start || !end || start > end || start < 1 || end > maxPages) {
                    throw new Error(`Invalid range: ${range}`);
                }
                for (let i = start; i <= end; i++) selected.add(i - 1);
            } else {
                const num = Number(range);
                if (!num || num < 1 || num > maxPages) {
                    throw new Error(`Invalid page number: ${range}`);
                }
                selected.add(num - 1);
            }
        }
        return Array.from(selected).sort((a, b) => a - b);
    };

    const handleExtract = async () => {
        if (!file || !pageRanges) {
            setError('Please select a file and enter page numbers to extract.');
            return;
        }

        try {
            setIsExtracting(true);
            setError('');
            const fileData = await file.arrayBuffer();
            const sourceDoc = await PDFDocument.load(fileData);
            
            const pageIndices = parsePageRanges(pageRanges, sourceDoc.getPageCount());
            
            if (pageIndices.length === 0) {
                 setError('No specific valid pages selected.');
                 return;
            }

            const newDoc = await PDFDocument.create();
            const copiedPages = await newDoc.copyPages(sourceDoc, pageIndices);
            copiedPages.forEach(p => newDoc.addPage(p));

            const newPdfBytes = await newDoc.save();
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            setExtractedPdfUrl(URL.createObjectURL(blob));
        } catch (err) {
            console.error(err);
            setError('Failed to extract pages: ' + err.message);
        } finally {
            setIsExtracting(false);
        }
    };

    return (
        <div className="main-layout single-col animate-fadeIn">
            <div className="glass-card">
                {!file ? (
                    <div className="upload-zone clickable" onClick={() => document.getElementById('pdf-upload-extract').click()}>
                        <div className="huge-select-btn">Select PDF file</div>
                        <p className="upload-subtext" style={{ marginTop: '1rem' }}>or drop PDF here</p>
                        <input type="file" id="pdf-upload-extract" hidden accept=".pdf" onChange={onFileChange} />
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

                        {!extractedPdfUrl ? (
                            <>
                                <div className="control-item">
                                    <label>Pages to Extract</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g., 1, 3-5, 9" 
                                        value={pageRanges}
                                        onChange={(e) => setPageRanges(e.target.value)}
                                        style={{ marginBottom: '0.5rem' }}
                                    />
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Separate page numbers with commas, or use a dash for ranges.</p>
                                </div>

                                {error && <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>}

                                <button 
                                    className={`action-btn ${isExtracting ? 'animate-pulse' : ''}`}
                                    onClick={handleExtract}
                                    disabled={!pageRanges || isExtracting}
                                >
                                    <FileOutput />
                                    {isExtracting ? 'Extracting...' : 'Extract Pages'}
                                </button>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <FileOutput size={48} color="#16a34a" style={{ marginBottom: '1rem' }} />
                                <h2>Pages Extracted!</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Your new PDF is ready to download.</p>
                                <a href={extractedPdfUrl} download={`extracted_${file.name}`} className="action-btn" style={{ textDecoration: 'none' }}>
                                    <Download /> Download PDF
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExtractPagesTool;
