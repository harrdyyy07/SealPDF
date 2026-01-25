import React, { useState } from 'react';
import {
    FilePlus,
    ArrowUp,
    ArrowDown,
    Trash2,
    Download,
    Loader2,
    FileText,
    CheckCircle2
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

const MergerTool = () => {
    const [files, setFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [complete, setComplete] = useState(false);

    const onFilesChange = (e) => {
        const selectedFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
        if (selectedFiles.length > 0) {
            setFiles(prev => [...prev, ...selectedFiles]);
            setComplete(false);
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const moveFile = (index, direction) => {
        const newFiles = [...files];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newFiles.length) return;
        [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
        setFiles(newFiles);
    };

    const mergePDFs = async () => {
        if (files.length < 2) return;
        setIsProcessing(true);
        try {
            const mergedPdf = await PDFDocument.create();
            for (const file of files) {
                const fileBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }
            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `merged_${new Date().getTime()}.pdf`;
            link.click();
            setComplete(true);
        } catch (error) {
            alert(`Error merging PDFs: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="tool-content animate-fadeIn">
            <div className="main-layout single-col">
                <section className="glass-card">
                    <div className="tool-header">
                        <h3>PDF Merger</h3>
                        <p>Combine multiple PDF files into one single document</p>
                    </div>

                    <div className="merge-list">
                        {files.map((file, index) => (
                            <div key={index} className="merge-item glass-card secondary">
                                <FileText className="file-icon" />
                                <div className="file-info">
                                    <span className="file-name">{file.name}</span>
                                    <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <div className="item-actions">
                                    <button onClick={() => moveFile(index, -1)} disabled={index === 0} title="Move Up"><ArrowUp size={16} /></button>
                                    <button onClick={() => moveFile(index, 1)} disabled={index === files.length - 1} title="Move Down"><ArrowDown size={16} /></button>
                                    <button onClick={() => removeFile(index)} className="delete-btn" title="Remove"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}

                        <label className="add-more-card clickable">
                            <FilePlus size={32} />
                            <span>Add PDF Files</span>
                            <input type="file" multiple accept=".pdf" hidden onChange={onFilesChange} />
                        </label>
                    </div>

                    {files.length >= 2 && (
                        <button className="action-btn" onClick={mergePDFs} disabled={isProcessing}>
                            {isProcessing ? <><Loader2 className="animate-spin" /> Merging...</> : <><Download size={20} /> Merge & Download</>}
                        </button>
                    )}

                    {complete && <div className="status-msg success"><CheckCircle2 size={16} /> PDFs merged successfully!</div>}
                </section>
            </div>
        </div>
    );
};

export default MergerTool;
