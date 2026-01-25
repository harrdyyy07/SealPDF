import React, { useState } from 'react';
import {
    Hash,
    Download,
    Loader2,
    FileText,
    CheckCircle2,
    Settings,
    X
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const PageNumbererTool = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [complete, setComplete] = useState(false);

    // Settings
    const [position, setPosition] = useState('bottom-center');
    const [startNumber, setStartNumber] = useState(1);
    const [fontSize, setFontSize] = useState(12);
    const [color, setColor] = useState('#6366f1');
    const [format, setFormat] = useState('Page {n}');

    const onFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setComplete(false);
        }
    };

    const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return rgb(r, g, b);
    };

    const addPageNumbers = async () => {
        if (!file) return;
        setIsProcessing(true);
        try {
            const fileBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
            const font = await pdf.embedFont(StandardFonts.Helvetica);
            const pages = pdf.getPages();

            pages.forEach((page, index) => {
                const { width, height } = page.getSize();
                const num = startNumber + index;
                const text = format.replace('{n}', num.toString()).replace('{total}', pages.length.toString());
                const textWidth = font.widthOfTextAtSize(text, fontSize);

                let x = 0, y = 0;
                const margin = 30;

                if (position === 'bottom-center') { x = width / 2 - textWidth / 2; y = margin; }
                else if (position === 'bottom-right') { x = width - textWidth - margin; y = margin; }
                else if (position === 'bottom-left') { x = margin; y = margin; }
                else if (position === 'top-center') { x = width / 2 - textWidth / 2; y = height - margin; }
                else if (position === 'top-right') { x = width - textWidth - margin; y = height - margin; }
                else if (position === 'top-left') { x = margin; y = height - margin; }

                page.drawText(text, {
                    x, y,
                    size: fontSize,
                    font,
                    color: hexToRgb(color),
                });
            });

            const pdfBytes = await pdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `numbered_${file.name}`;
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
                        <div className="glass-card clickable" onClick={() => document.getElementById('number-upload').click()}>
                            <div className="upload-zone">
                                <div className="icon-circle"><Hash size={48} color="#818cf8" /></div>
                                <h3>Add Page Numbers</h3>
                                <p>Upload a PDF to number its pages</p>
                                <input type="file" id="number-upload" hidden accept=".pdf" onChange={onFileChange} />
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card">
                            <div className="file-info-header">
                                <FileText color="#818cf8" />
                                <div className="file-details">
                                    <p className="file-name">{file.name}</p>
                                    <p className="file-meta">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button className="icon-btn" onClick={() => setFile(null)}><X size={20} /></button>
                            </div>
                            <div className="preview-placeholder">
                                <Hash size={64} style={{ opacity: 0.2 }} />
                                <p>Numbers will be added to all pages</p>
                            </div>
                            <button className="action-btn" onClick={addPageNumbers} disabled={isProcessing}>
                                {isProcessing ? <><Loader2 className="animate-spin" /> Numbering...</> : <><Download size={20} /> Add Numbers & Download</>}
                            </button>
                            {complete && <div className="status-msg success"><CheckCircle2 size={16} /> Numbered successfully!</div>}
                        </div>
                    )}
                </section>

                <aside className="glass-card">
                    <div className="aside-header">
                        <Settings size={20} color="#818cf8" />
                        <h3>Numbering Options</h3>
                    </div>
                    <div className="controls-group">
                        <div className="control-item">
                            <label>Format</label>
                            <input type="text" value={format} onChange={(e) => setFormat(e.target.value)} placeholder="e.g. Page {n} of {total}" />
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Use {'{n}'} for number and {'{total}'} for total pages.</p>
                        </div>
                        <div className="control-item">
                            <label>Position</label>
                            <select value={position} onChange={(e) => setPosition(e.target.value)}>
                                <option value="bottom-center">Bottom Center</option>
                                <option value="bottom-left">Bottom Left</option>
                                <option value="bottom-right">Bottom Right</option>
                                <option value="top-center">Top Center</option>
                                <option value="top-left">Top Left</option>
                                <option value="top-right">Top Right</option>
                            </select>
                        </div>
                        <div className="control-item">
                            <label>Start From</label>
                            <input type="number" value={startNumber} onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)} />
                        </div>
                        <div className="control-item">
                            <div className="label-row"><label>Font Size</label><span>{fontSize}px</span></div>
                            <input type="range" min="8" max="36" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} />
                        </div>
                        <div className="control-item">
                            <label>Color</label>
                            <div className="color-row"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} /><code>{color.toUpperCase()}</code></div>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default PageNumbererTool;
