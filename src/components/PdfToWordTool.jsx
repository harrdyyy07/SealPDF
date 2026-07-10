import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from "docx";
import { FileText, Download, FileUp, Loader2, AlertCircle, ShieldCheck, Zap, Globe } from 'lucide-react';
import { createWorker } from 'tesseract.js';

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

        let ocrWorker = null;
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

            const getOcrWorker = async () => {
                if (!ocrWorker) {
                    setStatusText("Initializing OCR Engine...");
                    ocrWorker = await createWorker({
                        logger: m => {
                            if (m && m.status === 'recognizing text') {
                                const pageProgress = Math.floor(m.progress * 100);
                                setStatusText(`Running OCR on Page... ${pageProgress}%`);
                            }
                        }
                    });
                    await ocrWorker.loadLanguage('eng');
                    await ocrWorker.initialize('eng');
                }
                return ocrWorker;
            };

            for (let i = 1; i <= numPages; i++) {
                setStatusText(`Analyzing Page ${i} structure...`);
                const page = await pdfDoc.getPage(i);
                
                // Get base viewport (scale 1.0) for coordinate sizing
                const viewportBase = page.getViewport({ scale: 1.0 });
                const { width: pageWidth, height: pageHeight } = viewportBase;

                // Render page to a canvas at 1.5x scale to force load image objects and prepare for high-quality OCR
                const renderScale = 1.5;
                const viewportRender = page.getViewport({ scale: renderScale });
                const canvas = document.createElement('canvas');
                canvas.width = viewportRender.width;
                canvas.height = viewportRender.height;
                const ctx = canvas.getContext('2d');

                setStatusText(`Rendering Page ${i} for layout extraction...`);
                await page.render({ canvasContext: ctx, viewport: viewportRender }).promise;

                // Scan text contents
                let textContent = await page.getTextContent({ includeStyles: true });
                let items = textContent.items;

                // Deep operator scan for vector paths, lines, and image XObjects
                const operatorList = await page.getOperatorList();
                const images = [];
                const paths = [];
                let currentPath = [];
                let currentTransform = [1, 0, 0, 1, 0, 0];
                let currentFillColor = "000000";

                const applyTransform = (x, y, matrix) => {
                    const [a, b, c, d, e, f] = matrix;
                    return {
                        x: a * x + c * y + e,
                        y: b * x + d * y + f
                    };
                };

                for (let j = 0; j < operatorList.fnArray.length; j++) {
                    const fn = operatorList.fnArray[j];
                    const args = operatorList.argsArray[j];

                    switch (fn) {
                        case pdfjsLib.OPS.transform:
                            currentTransform = args;
                            break;
                        case pdfjsLib.OPS.moveTo:
                            currentPath = [applyTransform(args[0], args[1], currentTransform)];
                            break;
                        case pdfjsLib.OPS.lineTo:
                            currentPath.push(applyTransform(args[0], args[1], currentTransform));
                            break;
                        case pdfjsLib.OPS.rectangle:
                            const [rx, ry, rw, rh] = args;
                            const p00_rect = applyTransform(rx, ry, currentTransform);
                            const p11_rect = applyTransform(rx + rw, ry + rh, currentTransform);
                            paths.push({
                                type: 'rect',
                                x: Math.min(p00_rect.x, p11_rect.x),
                                y: Math.min(p00_rect.y, p11_rect.y),
                                w: Math.abs(p11_rect.x - p00_rect.x),
                                h: Math.abs(p11_rect.y - p00_rect.y)
                            });
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

                                if (img) {
                                    const imgWidth = img.width;
                                    const imgHeight = img.height;

                                    const p00_img = applyTransform(0, 0, currentTransform);
                                    const p11_img = applyTransform(1, 1, currentTransform);
                                    const imgX = Math.min(p00_img.x, p11_img.x);
                                    const imgY = Math.min(p00_img.y, p11_img.y);
                                    const imgW = Math.abs(p11_img.x - p00_img.x);
                                    const imgH = Math.abs(p11_img.y - p00_img.y);

                                    // Render to image canvas to generate buffer
                                    const imgCanvas = document.createElement('canvas');
                                    imgCanvas.width = imgWidth;
                                    imgCanvas.height = imgHeight;
                                    const imgCtx = imgCanvas.getContext('2d');

                                    if (img.bitmap) {
                                        imgCtx.drawImage(img.bitmap, 0, 0);
                                    } else if (img.data) {
                                        const imgData = imgCtx.createImageData(imgWidth, imgHeight);
                                        if (img.data.length === imgWidth * imgHeight) {
                                            for (let k = 0, l = 0; k < img.data.length; k++, l += 4) {
                                                imgData.data[l] = imgData.data[l+1] = imgData.data[l+2] = img.data[k];
                                                imgData.data[l+3] = 255;
                                            }
                                        } else if (img.data.length === imgWidth * imgHeight * 3) {
                                            for (let k = 0, l = 0; k < img.data.length; k += 3, l += 4) {
                                                imgData.data[l] = img.data[k];
                                                imgData.data[l+1] = img.data[k+1];
                                                imgData.data[l+2] = img.data[k+2];
                                                imgData.data[l+3] = 255;
                                            }
                                        } else if (img.data.length === imgWidth * imgHeight * 4) {
                                            imgData.data.set(img.data);
                                        } else {
                                            for (let k = 0; k < Math.min(img.data.length, imgData.data.length); k++) {
                                                imgData.data[k] = img.data[k];
                                            }
                                        }
                                        imgCtx.putImageData(imgData, 0, 0);
                                    } else {
                                        try {
                                            imgCtx.drawImage(img, 0, 0);
                                        } catch (drawErr) {
                                            console.error("Direct image render failed:", drawErr);
                                        }
                                    }

                                    const blob = await new Promise(r => imgCanvas.toBlob(r, 'image/png'));
                                    const arrayBuffer = await blob.arrayBuffer();

                                    images.push({
                                        buffer: arrayBuffer,
                                        width: imgW,
                                        height: imgH,
                                        x: imgX,
                                        y: pageHeight - imgY - imgH
                                    });
                                }
                            } catch (e) {
                                console.error("Image extraction error:", e);
                            }
                            break;
                    }
                }

                // Detect scanned pages (no text content)
                const hasText = items.filter(item => item.str && item.str.trim().length > 0).length >= 5;
                if (!hasText) {
                    setStatusText(`Page ${i} is scanned. Running OCR...`);
                    try {
                        const ocrWorker = await getOcrWorker();
                        const { data: { lines } } = await ocrWorker.recognize(canvas);
                        items = lines.map(line => {
                            const x = line.bbox.x0 / renderScale;
                            const y = pageHeight - (line.bbox.y0 / renderScale);
                            const height = (line.bbox.y1 - line.bbox.y0) / renderScale;
                            const width = (line.bbox.x1 - line.bbox.x0) / renderScale;
                            const fontSize = Math.round(height);
                            return {
                                str: line.text.replace(/\n/g, ' ').trim(),
                                transform: [fontSize, 0, 0, fontSize, x, y],
                                width: width,
                                fontName: 'sans-serif'
                            };
                        });
                    } catch (ocrErr) {
                        console.error("OCR execution error:", ocrErr);
                        items = [];
                    }
                }

                // Extract horizontal lines (separators)
                const horizontalLines = [];
                paths.forEach(p => {
                    if (p.type === 'rect') {
                        if (p.h < 3 && p.w > 15) {
                            horizontalLines.push({
                                y: pageHeight - p.y - p.h,
                                x: p.x,
                                width: p.w
                            });
                        }
                    } else if (p.type === 'path' && p.points.length >= 2) {
                        for (let k = 0; k < p.points.length - 1; k++) {
                            const pt1 = p.points[k];
                            const pt2 = p.points[k+1];
                            if (Math.abs(pt1.y - pt2.y) < 2 && Math.abs(pt1.x - pt2.x) > 15) {
                                horizontalLines.push({
                                    y: pageHeight - pt1.y,
                                    x: Math.min(pt1.x, pt2.x),
                                    width: Math.abs(pt1.x - pt2.x)
                                });
                            }
                        }
                    }
                });

                // Group text items into lines
                const textLines = [];
                const sortedItems = [...items].sort((a, b) => b.transform[5] - a.transform[5]);

                sortedItems.forEach(item => {
                    const y = item.transform[5];
                    const foundLine = textLines.find(line => Math.abs(line.y - y) < 6);
                    if (foundLine) {
                        foundLine.items.push(item);
                    } else {
                        textLines.push({
                            y: y,
                            items: [item]
                        });
                    }
                });

                textLines.forEach(line => {
                    line.items.sort((a, b) => a.transform[4] - b.transform[4]);
                });

                // Combine elements and sort top-to-bottom
                const pageElements = [];

                textLines.forEach(line => {
                    let maxFontSize = 10;
                    line.items.forEach(item => {
                        const fs = Math.round(Math.sqrt(item.transform[0]**2 + item.transform[1]**2));
                        if (fs > maxFontSize) maxFontSize = fs;
                    });
                    pageElements.push({
                        type: 'text',
                        y: pageHeight - line.y,
                        height: maxFontSize,
                        data: line
                    });
                });

                images.forEach(img => {
                    pageElements.push({
                        type: 'image',
                        y: img.y,
                        height: img.height,
                        data: img
                    });
                });

                horizontalLines.forEach(line => {
                    pageElements.push({
                        type: 'line',
                        y: line.y,
                        height: 1,
                        data: line
                    });
                });

                pageElements.sort((a, b) => a.y - b.y);

                // Build DOCX structure for the page
                let lastElementBottomY = -1;

                pageElements.forEach(el => {
                    const currentTopY = el.y;
                    const vGap = lastElementBottomY !== -1 ? Math.max(0, currentTopY - lastElementBottomY) : 0;
                    const spacingBefore = Math.round(vGap * 20);

                    if (el.type === 'text') {
                        const line = el.data;
                        const runs = [];
                        let lastX = -1;

                        line.items.forEach((item, idx) => {
                            const x = item.transform[4];
                            const fontSize = Math.round(Math.sqrt(item.transform[0]**2 + item.transform[1]**2));
                            const isBold = item.fontName?.toLowerCase().includes('bold') || false;
                            const isItalic = item.fontName?.toLowerCase().includes('italic') || item.fontName?.toLowerCase().includes('oblique') || false;

                            const style = textContent.styles[item.fontName];
                            const color = style?.color || "000000";

                            if (idx > 0) {
                                const hGap = x - lastX;
                                if (hGap > 4) {
                                    const spaces = Math.max(1, Math.floor(hGap / (fontSize * 0.4)));
                                    runs.push(new TextRun({ text: " ".repeat(spaces), size: fontSize * 2 }));
                                }
                            }

                            runs.push(new TextRun({
                                text: item.str,
                                size: fontSize * 2,
                                bold: isBold,
                                italics: isItalic,
                                color: color.replace('#', '')
                            }));

                            lastX = x + (item.width || item.str.length * (fontSize * 0.5));
                        });

                        const firstItem = line.items[0];
                        const indentLeft = Math.max(0, firstItem.transform[4]) * 20;

                        docChildren.push(new Paragraph({
                            spacing: { before: spacingBefore },
                            indent: { left: Math.round(indentLeft) },
                            children: runs
                        }));

                        lastElementBottomY = el.y + el.height;

                    } else if (el.type === 'image') {
                        const img = el.data;
                        
                        const imgCenter = img.x + img.width / 2;
                        const pageCenter = pageWidth / 2;
                        let imgAlign = AlignmentType.LEFT;
                        let imgIndent = undefined;

                        if (Math.abs(imgCenter - pageCenter) < 50) {
                            imgAlign = AlignmentType.CENTER;
                        } else {
                            imgIndent = { left: Math.round(Math.max(0, img.x) * 20) };
                        }

                        const displayWidth = Math.min(pageWidth - 80, img.width);
                        const displayHeight = (img.height / img.width) * displayWidth;

                        docChildren.push(new Paragraph({
                            alignment: imgAlign,
                            indent: imgIndent,
                            spacing: { before: spacingBefore, after: 100 },
                            children: [
                                new ImageRun({
                                    data: img.buffer,
                                    transformation: {
                                        width: displayWidth,
                                        height: displayHeight,
                                    },
                                }),
                            ],
                        }));

                        lastElementBottomY = el.y + img.height;

                    } else if (el.type === 'line') {
                        const line = el.data;
                        
                        const indentLeft = Math.max(0, line.x) * 20;
                        const indentRight = Math.max(0, pageWidth - line.x - line.width) * 20;

                        docChildren.push(new Paragraph({
                            spacing: { before: spacingBefore, after: 100 },
                            indent: { left: Math.round(indentLeft), right: Math.round(indentRight) },
                            border: {
                                bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 }
                            }
                        }));

                        lastElementBottomY = el.y + el.height;
                    }
                });

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
            if (ocrWorker) {
                await ocrWorker.terminate();
            }
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
