import React, { useState } from 'react';
import {
    Trash2,
    Download,
    Loader2,
    FileText,
    CheckCircle2,
    X
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

const PageRemoverTool = () => {
    const [file, setFile] = useState(null);
    const [pagesToRemove, setPagesToRemove] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [complete, setComplete] = useState(false);

    const onFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setComplete(false);
        }
    };

    const removePages = async () => {
        if (!file || !pagesToRemove.trim()) return;
        setIsProcessing(true);
        try {
            const fileBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });

            const totalPages = pdf.getPageCount();
            const ranges = pagesToRemove.split(',').map(r => r.trim());
            const indicesToRemove = [];

            ranges.forEach(range => {
                if (range.includes('-')) {
                    const [start, end] = range.split('-').map(Number);
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= totalPages) indicesToRemove.push(i - 1);
                    }
                } else {
                    const num = Number(range);
                    if (num >= 1 && num <= totalPages) indicesToRemove.push(num - 1);
                }
            });

            // Sort indices in descending order to avoid shifts while removing
            const uniqueIndices = [...new Set(indicesToRemove)].sort((a, b) => b - a);

            if (uniqueIndices.length === 0) throw new Error("No valid pages selected for removal");
            if (uniqueIndices.length >= totalPages) throw new Error("Cannot remove all pages from a PDF");

            uniqueIndices.forEach(index => {
                pdf.removePage(index);
            });

            const pdfBytes = await pdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cleaned_${file.name}`;
            link.click();
            setComplete(true);
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="tool-content animate-fadeIn">
            <main className="main-layout">
                <section>
                    {!file ? (
                        <div className="glass-card clickable" onClick={() => document.getElementById('remove-upload').click()}>
                            <div className="upload-zone">
                                <div className="icon-circle"><Trash2 size={48} color="#f87171" /></div>
                                <h3>Remove Pages from PDF</h3>
                                <p>Upload a PDF to delete specific pages</p>
                                <input type="file" id="remove-upload" hidden accept=".pdf" onChange={onFileChange} />
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card">
                            <div className="file-info-header">
                                <FileText color="#818cf8" />
                                <div className="file-details">
                                    <p className="file-name">{file.name}</p>
                                    <p className="file-meta">Source Document</p>
                                </div>
                                <button className="icon-btn" onClick={() => setFile(null)}><X size={20} /></button>
                            </div>
                            <div className="preview-placeholder">
                                <Trash2 size={64} style={{ opacity: 0.2 }} />
                                <p>Specific pages will be permanently removed</p>
                            </div>
                            <button className="action-btn" onClick={removePages} disabled={isProcessing || !pagesToRemove.trim()} style={{ background: 'linear-gradient(to right, #ef4444, #f87171)' }}>
                                {isProcessing ? <><Loader2 className="animate-spin" /> Removing...</> : <><Trash2 size={20} /> Remove Pages & Download</>}
                            </button>
                            {complete && <div className="status-msg success"><CheckCircle2 size={16} /> Pages removed successfully!</div>}
                        </div>
                    )}
                </section>

                <aside className="glass-card">
                    <div className="aside-header">
                        <Trash2 size={20} color="#f87171" />
                        <h3>Pages to Remove</h3>
                    </div>
                    <div className="controls-group">
                        <div className="control-item">
                            <label>Page Indices</label>
                            <input
                                type="text"
                                placeholder="e.g. 2, 4-6, 10"
                                value={pagesToRemove}
                                onChange={(e) => setPagesToRemove(e.target.value)}
                            />
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Enter the page numbers you want to DELETE.
                            </p>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default PageRemoverTool;
