import React, { useState, useRef, useEffect } from 'react';
import {
    Square,
    Download,
    Loader2,
    FileText,
    CheckCircle2,
    X,
    Settings,
    EyeOff
} from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Setup pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const RedactPdfTool = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [complete, setComplete] = useState(false);
    
    // Canvas & Selection State
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [pdfDocProxy, setPdfDocProxy] = useState(null);
    const [selection, setSelection] = useState(null); // {x, y, w, h} in percentages
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({x: 0, y: 0});
    const [tempBox, setTempBox] = useState(null); // {left, top, width, height} in pixels

    const onFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setComplete(false);
            setSelection(null);
            setTempBox(null);
            
            // Load PDF to render first page preview
            try {
                const arrayBuffer = await selectedFile.arrayBuffer();
                const proxy = await pdfjsLib.getDocument(arrayBuffer).promise;
                setPdfDocProxy(proxy);
                renderFirstPage(proxy);
            } catch (err) {
                console.error("Error loading PDF preview", err);
            }
        }
    };
    
    const renderFirstPage = async (proxy) => {
        if (!proxy || !canvasRef.current) return;
        try {
            const page = await proxy.getPage(1);
            // Limit width for preview
            const containerWidth = 400; 
            const viewport = page.getViewport({ scale: 1 });
            const scale = containerWidth / viewport.width;
            const scaledViewport = page.getViewport({ scale });
            
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;
            
            await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
        } catch(err) {
            console.error("Render error", err);
        }
    };
    
    // Re-render if canvas becomes available
    useEffect(() => {
        if (pdfDocProxy && canvasRef.current) {
            renderFirstPage(pdfDocProxy);
        }
    }, [pdfDocProxy]);

    const handlePointerDown = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDrawing(true);
        setStartPos({ x, y });
        setTempBox({ left: x, top: y, width: 0, height: 0 });
    };

    const handlePointerMove = (e) => {
        if (!isDrawing || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
        
        const left = Math.min(startPos.x, currentX);
        const top = Math.min(startPos.y, currentY);
        const width = Math.abs(currentX - startPos.x);
        const height = Math.abs(currentY - startPos.y);
        
        setTempBox({ left, top, width, height });
    };

    const handlePointerUp = () => {
        if (!isDrawing || !containerRef.current || !tempBox) return;
        setIsDrawing(false);
        if (tempBox.width > 10 && tempBox.height > 10) {
            const rect = containerRef.current.getBoundingClientRect();
            // Convert to percentages relative to the canvas size
            setSelection({
                x: tempBox.left / rect.width,
                y: tempBox.top / rect.height,
                w: tempBox.width / rect.width,
                h: tempBox.height / rect.height
            });
        } else {
            setSelection(null);
            setTempBox(null);
        }
    };

    const redactPDF = async () => {
        if (!file || !selection) return;
        setIsProcessing(true);
        try {
            const fileBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
            
            const pages = pdfDoc.getPages();
            
            for (const page of pages) {
                const { width, height } = page.getSize();
                
                // Draw black rectangle
                // pdf-lib origin (0,0) is bottom-left, our selection origin (0,0) is top-left
                const rectX = selection.x * width;
                const rectW = selection.w * width;
                const rectH = selection.h * height;
                const rectY = height - (selection.y * height) - rectH;
                
                page.drawRectangle({
                    x: rectX,
                    y: rectY,
                    width: rectW,
                    height: rectH,
                    color: rgb(0, 0, 0)
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `redacted_${file.name}`;
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
            <main className="main-layout single-col">
                <section>
                    {!file ? (
                        <div className="glass-card clickable" onClick={() => document.getElementById('redact-upload').click()}>
                            <div className="upload-zone">
                                <div className="huge-select-btn">Select PDF file</div>
                                <p className="upload-subtext">or drop PDF here</p>
                                <input type="file" id="redact-upload" hidden accept=".pdf" onChange={onFileChange} />
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="file-info-header" style={{ width: '100%', marginBottom: '1.5rem' }}>
                                <FileText />
                                <div className="file-details">
                                    <p className="file-name">{file.name}</p>
                                    <p className="file-meta">Source Document</p>
                                </div>
                                <button className="icon-btn" onClick={() => setFile(null)}><X size={20} /></button>
                            </div>
                            
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Draw a box over the area you want to redact</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
                                This black box will be applied to the exact same position on <b>all pages</b>.
                            </p>
                            
                            <div 
                                ref={containerRef}
                                style={{ 
                                    position: 'relative', 
                                    cursor: 'crosshair', 
                                    border: '1px solid var(--border-color)',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    display: 'inline-block',
                                    marginBottom: '2rem'
                                }}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerLeave={handlePointerUp}
                            >
                                <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
                                
                                {tempBox && (
                                    <div style={{
                                        position: 'absolute',
                                        left: tempBox.left,
                                        top: tempBox.top,
                                        width: tempBox.width,
                                        height: tempBox.height,
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        border: '1px solid white'
                                    }} />
                                )}
                            </div>

                            <button 
                                className="action-btn" 
                                onClick={redactPDF} 
                                disabled={isProcessing || (!selection && !isDrawing)}
                                style={{ maxWidth: '400px' }}
                            >
                                {isProcessing ? <><Loader2 className="animate-spin" /> Applied...</> : <><EyeOff size={20} /> Redact PDF</>}
                            </button>
                            
                            {complete && <div className="status-msg success"><CheckCircle2 size={16} /> Redacted successfully! Note: For extreme security, also compress this PDF to permanently flatten the black boxes.</div>}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default RedactPdfTool;
