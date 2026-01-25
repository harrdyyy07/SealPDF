import React, { useState } from 'react';
import {
    Scissors,
    Download,
    Loader2,
    FileText,
    CheckCircle2,
    X
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

const SplitterTool = () => {
    const [file, setFile] = useState(null);
    const [pages, setPages] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [complete, setComplete] = useState(false);

    const onFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setComplete(false);
        }
    };

    const splitPDF = async () => {
        if (!file || !pages.trim()) return;
        setIsProcessing(true);
        try {
            const fileBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
            const newPdf = await PDFDocument.create();

            const totalPages = pdf.getPageCount();
            const ranges = pages.split(',').map(r => r.trim());
            const selectedIndices = [];

            ranges.forEach(range => {
                if (range.includes('-')) {
                    const [start, end] = range.split('-').map(Number);
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= totalPages) selectedIndices.push(i - 1);
                    }
                } else {
                    const num = Number(range);
                    if (num >= 1 && num <= totalPages) selectedIndices.push(num - 1);
                }
            });

            const uniqueIndices = [...new Set(selectedIndices)].sort((a, b) => a - b);
            if (uniqueIndices.length === 0) throw new Error("No valid pages selected");

            const copiedPages = await newPdf.copyPages(pdf, uniqueIndices);
            copiedPages.forEach(page => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `extracted_${file.name}`;
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
                        <div className="glass-card clickable" onClick={() => document.getElementById('split-upload').click()}>
                            <div className="upload-zone">
                                <div className="icon-circle"><Scissors size={48} color="#818cf8" /></div>
                                <h3>Extract Pages from PDF</h3>
                                <p>Click to upload the source PDF</p>
                                <input type="file" id="split-upload" hidden accept=".pdf" onChange={onFileChange} />
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
                                <Scissors size={64} style={{ opacity: 0.2 }} />
                                <p>Enter page numbers to extract</p>
                            </div>
                            <button className="action-btn" onClick={splitPDF} disabled={isProcessing || !pages.trim()}>
                                {isProcessing ? <><Loader2 className="animate-spin" /> Extracting...</> : <><Download size={20} /> Extract & Download</>}
                            </button>
                            {complete && <div className="status-msg success"><CheckCircle2 size={16} /> Pages extracted successfully!</div>}
                        </div>
                    )}
                </section>

                <aside className="glass-card">
                    <div className="aside-header">
                        <Scissors size={20} color="#818cf8" />
                        <h3>Pages to Extract</h3>
                    </div>
                    <div className="controls-group">
                        <div className="control-item">
                            <label>Page Range</label>
                            <input
                                type="text"
                                placeholder="e.g. 1-3, 5, 8-10"
                                value={pages}
                                onChange={(e) => setPages(e.target.value)}
                            />
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Use commas for separate pages and hyphens for ranges.
                            </p>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default SplitterTool;
