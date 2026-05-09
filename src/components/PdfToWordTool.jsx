import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from "docx";
import { FileText, Download, FileUp, Loader2, AlertCircle, ShieldCheck, Zap, Globe } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

import AuthDownloadWrapper from './AuthDownloadWrapper';
import MarketingSection from './MarketingSection';

const PdfToWordTool = () => {
    const [file, setFile] = useState(null);
    const [isConverting, setIsConverting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [error, setError] = useState('');
    const [docUrl, setDocUrl] = useState(null);

    const onFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setDocUrl(null);
            setError('');
            setProgress(0);
            setStatusText('');
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
            setStatusText('Initializing PDF engine...');
            
            const fileData = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: fileData });
            const pdfDoc = await loadingTask.promise;
            
            const numPages = pdfDoc.numPages;
            const docChildren = [];

            for (let i = 1; i <= numPages; i++) {
                setStatusText(`Analyzing Page ${i} structure...`);
                const page = await pdfDoc.getPage(i);
                const textContent = await page.getTextContent({ includeStyles: true });
                const viewport = page.getViewport({ scale: 1.0 });
                const { width: pageWidth, height: pageHeight } = viewport;

                // 1. DEEP OPERATOR SCAN (Lines, Borders, Images)
                const operatorList = await page.getOperatorList();
                const images = [];
                const paths = [];
                let currentPath = [];
                let currentTransform = [1, 0, 0, 1, 0, 0];
                let currentFillColor = "000000";

                for (let j = 0; j < operatorList.fnArray.length; j++) {
                    const fn = operatorList.fnArray[j];
                    const args = operatorList.argsArray[j];

                    switch (fn) {
                        case pdfjsLib.OPS.transform:
                            currentTransform = args;
                            break;
                        case pdfjsLib.OPS.moveTo:
                            currentPath = [{ x: args[0], y: args[1] }];
                            break;
                        case pdfjsLib.OPS.lineTo:
                            currentPath.push({ x: args[0], y: args[1] });
                            break;
                        case pdfjsLib.OPS.rectangle:
                            const [rx, ry, rw, rh] = args;
                            paths.push({ type: 'rect', x: rx, y: ry, w: rw, h: rh });
                            break;
                        case pdfjsLib.OPS.stroke:
                        case pdfjsLib.OPS.fill:
                        case pdfjsLib.OPS.eoFill:
                            if (currentPath.length > 1) {
                                paths.push({ type: 'path', points: [...currentPath] });
                            }
                            currentPath = [];
                            break;
                        case pdfjsLib.OPS.setFillRGBColor:
                            currentFillColor = args.map(c => c.toString(16).padStart(2, '0')).join('');
                            break;
                        case pdfjsLib.OPS.paintImageXObject:
                        case pdfjsLib.OPS.paintInlineImageXObject:
                            try {
                                let img;
                                if (fn === pdfjsLib.OPS.paintImageXObject) {
                                    const objId = args[0];
                                    img = page.commonObjs.has(objId) ? await page.commonObjs.get(objId) : await page.objs.get(objId);
                                } else {
                                    img = args[0];
                                }

                                if (img && img.data) {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = img.width;
                                    canvas.height = img.height;
                                    const ctx = canvas.getContext('2d');
                                    const imageData = ctx.createImageData(img.width, img.height);
                                    
                                    // Handle Grayscale and RGB(A)
                                    if (img.data.length === img.width * img.height) {
                                        for (let k = 0, l = 0; k < img.data.length; k++, l += 4) {
                                            imageData.data[l] = imageData.data[l+1] = imageData.data[l+2] = img.data[k];
                                            imageData.data[l+3] = 255;
                                        }
                                    } else if (img.data.length === img.width * img.height * 3) {
                                        for (let k = 0, l = 0; k < img.data.length; k += 3, l += 4) {
                                            imageData.data[l] = img.data[k];
                                            imageData.data[l+1] = img.data[k+1];
                                            imageData.data[l+2] = img.data[k+2];
                                            imageData.data[l+3] = 255;
                                        }
                                    } else {
                                        imageData.data.set(img.data);
                                    }
                                    
                                    ctx.putImageData(imageData, 0, 0);
                                    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
                                    const arrayBuffer = await blob.arrayBuffer();
                                    
                                    images.push({
                                        buffer: arrayBuffer,
                                        width: Math.abs(currentTransform[0]),
                                        height: Math.abs(currentTransform[3]),
                                        x: currentTransform[4],
                                        y: pageHeight - currentTransform[5] - Math.abs(currentTransform[3])
                                    });
                                }
                            } catch (e) { console.error("Img error", e); }
                            break;
                    }
                }

                // 2. GRID RECONSTRUCTION & BORDER DETECTION
                // Identify structural borders from rectangles and paths
                const borders = paths.filter(p => {
                    if (p.type === 'rect') return Math.abs(p.w) > 50 || Math.abs(p.h) > 50;
                    if (p.type === 'path') {
                        const p1 = p.points[0];
                        const p2 = p.points[p.points.length - 1];
                        return Math.abs(p1.x - p2.x) > 50 || Math.abs(p1.y - p2.y) > 50;
                    }
                    return false;
                });

                // 3. TEXT & LAYOUT ASSEMBLY
                const items = textContent.items.sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
                
                let lastY = -1;
                let lastX = -1;
                let currentPara = null;

                items.forEach((item) => {
                    const x = item.transform[4];
                    const y = item.transform[5];
                    const fontSize = Math.round(Math.sqrt(item.transform[0]**2 + item.transform[1]**2));
                    const isBold = item.fontName?.toLowerCase().includes('bold') || false;
                    const isItalic = item.fontName?.toLowerCase().includes('italic') || false;
                    
                    // Detect Color (simplified - using styles map)
                    const style = textContent.styles[item.fontName];
                    const color = style?.color || "000000";

                    // Line Grouping Logic
                    if (Math.abs(y - lastY) > 5) {
                        // New Line
                        const vGap = lastY !== -1 ? Math.max(0, (lastY - y) - fontSize) : 0;
                        
                        // Check if this line is part of a bordered area
                        const hasBorder = borders.some(b => {
                            const by = pageHeight - b.y;
                            return Math.abs(by - (pageHeight - y)) < 20;
                        });

                        currentPara = new Paragraph({
                            spacing: { before: vGap * 20 },
                            indent: { left: Math.max(0, x) * 20 },
                            border: hasBorder ? { bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 } } : undefined,
                            children: [
                                new TextRun({
                                    text: item.str,
                                    size: fontSize * 2,
                                    bold: isBold,
                                    italics: isItalic,
                                    color: color.replace('#', '')
                                })
                            ]
                        });
                        docChildren.push(currentPara);
                        lastY = y;
                        lastX = x + (item.width || item.str.length * (fontSize * 0.5));
                    } else {
                        // Same Line
                        const hGap = x - lastX;
                        if (hGap > 8) {
                            currentPara.addChildElement(new TextRun({ text: " ".repeat(Math.floor(hGap / (fontSize * 0.3))) }));
                        }
                        currentPara.addChildElement(new TextRun({
                            text: item.str,
                            size: fontSize * 2,
                            bold: isBold,
                            italics: isItalic,
                            color: color.replace('#', '')
                        }));
                        lastX = x + (item.width || item.str.length * (fontSize * 0.5));
                    }
                });

                // 4. IMAGE POSITIONING
                images.forEach(img => {
                    docChildren.push(new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 200 },
                        children: [
                            new ImageRun({
                                data: img.buffer,
                                transformation: {
                                    width: Math.min(500, img.width),
                                    height: (img.height / img.width) * Math.min(500, img.width),
                                },
                            }),
                        ],
                    }));
                });

                // Page Break
                if (i < numPages) {
                    docChildren.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }));
                }
                
                setProgress(Math.round((i / numPages) * 100));
            }

            setStatusText('Packing Word document...');
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: docChildren,
                }],
            });

            const blob = await Packer.toBlob(doc);
            setDocUrl(URL.createObjectURL(blob));
            setStatusText('Conversion complete!');
        } catch (err) {
            console.error(err);
            setError('Conversion failed: ' + err.message);
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div className="main-layout single-col animate-fadeIn">
            <div className="glass-card premium-shadow">
                <div className="god-mode-header" style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                }}>
                    <div className="icon-glow" style={{
                        background: 'rgba(56, 189, 248, 0.2)',
                        padding: '1rem',
                        borderRadius: '12px',
                        display: 'flex'
                    }}>
                        <ShieldCheck size={32} color="#38bdf8" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>God-Mode Recovery Engine</h3>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.4' }}>
                            Full-state parsing of borders, images, and layout. We reconstruct your document using a pixel-precise coordinate system.
                        </p>
                    </div>
                </div>

                {!file ? (
                    <div className="upload-zone clickable" onClick={() => document.getElementById('pdf-upload-word-god').click()}>
                        <div className="huge-select-btn">Select PDF file</div>
                        <p className="upload-subtext" style={{ marginTop: '1rem' }}>or drop PDF here</p>
                        <input type="file" id="pdf-upload-word-god" hidden accept=".pdf" onChange={onFileChange} />
                    </div>
                ) : (
                    <div className="controls-group">
                        <div className="file-pill" style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '1rem',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            marginBottom: '2rem'
                        }}>
                            <FileUp className="text-primary" />
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{file.name}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button className="icon-btn" onClick={() => { setFile(null); setDocUrl(null); }} disabled={isConverting}>✕</button>
                        </div>

                        {!docUrl ? (
                            <>
                                {error && <div className="error-card" style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', borderRadius: '12px', color: '#991b1b', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                    <AlertCircle size={18} /> {error}
                                </div>}
                                
                                {isConverting && (
                                    <div className="engine-status" style={{ margin: '2rem 0' }}>
                                        <div className="loading-bar-container" style={{ height: '14px', background: '#f1f5f9', borderRadius: '7px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                            <div className="loading-bar-progress" style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #0ea5e9 0%, #38bdf8 100%)', transition: 'width 0.4s ease' }}></div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{statusText}</p>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{progress}%</p>
                                        </div>
                                    </div>
                                )}

                                <button 
                                    className={`action-btn-premium ${isConverting ? 'btn-active' : ''}`}
                                    onClick={handleConvert}
                                    disabled={isConverting}
                                    style={{
                                        width: '100%',
                                        height: '60px',
                                        borderRadius: '14px',
                                        background: 'var(--primary)',
                                        color: '#fff',
                                        border: 'none',
                                        fontSize: '1.1rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        boxShadow: '0 4px 14px 0 rgba(0, 118, 255, 0.39)'
                                    }}
                                >
                                    {isConverting ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
                                    {isConverting ? 'Engaging God-Mode...' : 'Convert to Word (God-Mode)'}
                                </button>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                <div className="celebration-icon" style={{ 
                                    width: '90px', height: '90px', background: '#f0fdf4', borderRadius: '24px', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                                    border: '2px solid #bbf7d0', transform: 'rotate(5deg)'
                                }}>
                                    <Globe size={48} color="#15803d" />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Reconstruction Complete!</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>Layout, borders, and images have been successfully recovered.</p>
                                <AuthDownloadWrapper>
                                    <a href={docUrl} download={`${file.name.replace('.pdf','')}.docx`} className="action-btn" style={{ 
                                        textDecoration: 'none', 
                                        width: '100%', 
                                        height: '56px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        background: '#15803d',
                                        color: '#fff',
                                        fontWeight: 700
                                    }}>
                                        <Download size={20} /> Download Reconstructed DOCX
                                    </a>
                                </AuthDownloadWrapper>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <MarketingSection toolId="pdf2word" />
        </div>
    );
};

export default PdfToWordTool;
