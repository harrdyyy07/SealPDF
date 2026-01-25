import React, { useState } from 'react';
import {
    RotateCw,
    Download,
    Loader2,
    FileText,
    CheckCircle2,
    Settings,
    X,
    RotateCcw
} from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';

const PageRotatorTool = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [complete, setComplete] = useState(false);

    // Settings
    const [rotation, setRotation] = useState(90);
    const [targetPages, setTargetPages] = useState('all'); // 'all', 'odd', 'even'

    const onFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setComplete(false);
        }
    };

    const rotatePDF = async () => {
        if (!file) return;
        setIsProcessing(true);
        try {
            const fileBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
            const pages = pdf.getPages();

            pages.forEach((page, index) => {
                const pageNum = index + 1;
                let shouldRotate = false;

                if (targetPages === 'all') shouldRotate = true;
                else if (targetPages === 'odd' && pageNum % 2 !== 0) shouldRotate = true;
                else if (targetPages === 'even' && pageNum % 2 === 0) shouldRotate = true;

                if (shouldRotate) {
                    const currentRotation = page.getRotation().angle;
                    page.setRotation(degrees(currentRotation + rotation));
                }
            });

            const pdfBytes = await pdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `rotated_${file.name}`;
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
                        <div className="glass-card clickable" onClick={() => document.getElementById('rotate-upload').click()}>
                            <div className="upload-zone">
                                <div className="icon-circle"><RotateCw size={48} color="#818cf8" /></div>
                                <h3>Rotate PDF Pages</h3>
                                <p>Upload a PDF to rotate its pages</p>
                                <input type="file" id="rotate-upload" hidden accept=".pdf" onChange={onFileChange} />
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
                                <RotateCw size={64} style={{ opacity: 0.2 }} />
                                <p>Pages will be rotated by {rotation}°</p>
                            </div>
                            <button className="action-btn" onClick={rotatePDF} disabled={isProcessing}>
                                {isProcessing ? <><Loader2 className="animate-spin" /> Rotating...</> : <><Download size={20} /> Rotate & Download</>}
                            </button>
                            {complete && <div className="status-msg success"><CheckCircle2 size={16} /> Rotated successfully!</div>}
                        </div>
                    )}
                </section>

                <aside className="glass-card">
                    <div className="aside-header">
                        <Settings size={20} color="#818cf8" />
                        <h3>Rotation Options</h3>
                    </div>
                    <div className="controls-group">
                        <div className="control-item">
                            <label>Angle</label>
                            <div className="toggle-group">
                                <button className={`toggle-btn ${rotation === 90 ? 'active' : ''}`} onClick={() => setRotation(90)}>90° CW</button>
                                <button className={`toggle-btn ${rotation === 180 ? 'active' : ''}`} onClick={() => setRotation(180)}>180°</button>
                                <button className={`toggle-btn ${rotation === 270 ? 'active' : ''}`} onClick={() => setRotation(270)}>90° CCW</button>
                            </div>
                        </div>
                        <div className="control-item">
                            <label>Apply To</label>
                            <select value={targetPages} onChange={(e) => setTargetPages(e.target.value)}>
                                <option value="all">All Pages</option>
                                <option value="odd">Odd Pages Only</option>
                                <option value="even">Even Pages Only</option>
                            </select>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default PageRotatorTool;
