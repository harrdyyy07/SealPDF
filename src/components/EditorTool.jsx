import React, { useState, useEffect, useRef } from 'react';
import {
    FileUp,
    Settings,
    Download,
    Type,
    Loader2,
    FileText,
    X,
    CheckCircle2,
    Plus,
    Trash2,
    MousePointer2,
    Square,
    Eraser,
    Hand,
    Image as ImageIcon,
    ZoomIn,
    ZoomOut,
    Maximize,
    ChevronLeft,
    ChevronRight,
    Undo2,
    Redo2,
    Signature
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Setting up the worker
import pkg from 'pdfjs-dist/package.json';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pkg.version}/pdf.worker.min.mjs`;

const EditorTool = () => {
    const [file, setFile] = useState(null);
    const [numPages, setNumPages] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRendering, setIsRendering] = useState(false);
    const [complete, setComplete] = useState(false);
    const [annotations, setAnnotations] = useState([]);
    const [activeAnnotation, setActiveAnnotation] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [pagesData, setPagesData] = useState([]); // [{ url, width, height, textContent }]
    const [activeTool, setActiveTool] = useState('select');
    const [zoom, setZoom] = useState(1.0);

    // Drag and Drop state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [draggedAnnId, setDraggedAnnId] = useState(null);

    const containerRef = useRef(null);
    const pageRefs = useRef([]);
    const editInputRef = useRef(null);

    const onFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setComplete(false);
            setAnnotations([]);
            renderPdfPreview(selectedFile);
        }
    };

    const renderPdfPreview = async (file) => {
        setIsRendering(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            setNumPages(pdf.numPages);

            const pages = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport }).promise;

                // Get Text Content for Smart Detection
                const textContent = await page.getTextContent();

                pages.push({
                    url: canvas.toDataURL(),
                    width: viewport.width / 2,
                    height: viewport.height / 2,
                    textContent: textContent.items.map(item => {
                        const fontSize = Math.sqrt(item.transform[0] ** 2 + item.transform[1] ** 2);
                        return {
                            str: item.str,
                            x: item.transform[4],
                            y: (viewport.height / 2) - item.transform[5] - fontSize,
                            width: item.width,
                            height: fontSize,
                            fontSize: fontSize
                        };
                    })
                });
            }
            setPagesData(pages);
        } catch (error) {
            console.error("Error rendering PDF:", error);
            alert("Failed to render PDF preview.");
        } finally {
            setIsRendering(false);
        }
    };

    const scrollToPage = (index) => {
        pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handlePageClick = (e, pageIndex) => {
        if (activeTool === 'select') {
            setActiveAnnotation(null);
            setEditingId(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;

        addAnnotation(activeTool, pageIndex + 1, x, y);
    };

    const addAnnotation = (type, page, x, y, extra = {}) => {
        const newId = annotations.length > 0 ? Math.max(...annotations.map(a => a.id)) + 1 : 1;
        let newAnnotation = { id: newId, page, x, y, type, ...extra };

        if (type === 'text') {
            newAnnotation = { ...newAnnotation, text: extra.text || 'New Text', size: extra.size || 16, color: extra.color || '#6366f1' };
        } else if (type === 'whiteout') {
            newAnnotation = { ...newAnnotation, width: extra.width || 100, height: extra.height || 30, color: '#ffffff' };
        } else if (type === 'shape') {
            newAnnotation = { ...newAnnotation, width: 100, height: 100, color: '#6366f1', fill: false, strokeWidth: 2 };
        } else if (type === 'image' || type === 'signature') {
            document.getElementById('image-upload-helper').click();
            setPendingAnnotation(newAnnotation);
            return;
        }

        setAnnotations([...annotations, newAnnotation]);
        setActiveAnnotation(newId);
        if (type === 'text') setEditingId(newId);
    };

    const onSmartTextClick = (e, pageIndex, item) => {
        e.stopPropagation();
        if (activeTool !== 'select') return;

        // Smart Replace: Add Whiteout + Matching Text
        const whiteoutId = annotations.length > 0 ? Math.max(...annotations.map(a => a.id)) + 1 : 1;
        const textId = whiteoutId + 1;

        const whiteout = {
            id: whiteoutId,
            page: pageIndex + 1,
            x: item.x - 2,
            y: item.y - 2,
            width: item.width + 4,
            height: item.height + 4,
            type: 'whiteout',
            color: '#ffffff'
        };

        const textAnn = {
            id: textId,
            page: pageIndex + 1,
            x: item.x,
            y: item.y,
            type: 'text',
            text: item.str,
            size: item.fontSize,
            color: '#000000',
            fontFamily: 'Helvetica' // Standard PDF font
        };

        setAnnotations([...annotations, whiteout, textAnn]);
        setActiveAnnotation(textId);
        setEditingId(textId);
    };

    const [pendingAnnotation, setPendingAnnotation] = useState(null);

    const onImageSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && pendingAnnotation) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const aspect = img.width / img.height;
                    const finalWidth = 150;
                    const finalHeight = 150 / aspect;

                    const ann = {
                        ...pendingAnnotation,
                        imageData: event.target.result,
                        width: finalWidth,
                        height: finalHeight,
                        imageType: selectedFile.type
                    };
                    setAnnotations([...annotations, ann]);
                    setActiveAnnotation(ann.id);
                    setPendingAnnotation(null);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const onMouseDown = (e, annId) => {
        if (activeTool !== 'select' || editingId === annId) return;
        e.stopPropagation();
        const ann = annotations.find(a => a.id === annId);
        if (!ann) return;

        setIsDragging(true);
        setDraggedAnnId(annId);
        setDragStartPos({ x: e.clientX / zoom - ann.x, y: e.clientY / zoom - ann.y });
        setActiveAnnotation(annId);
        setEditingId(null);
    };

    const onDoubleClick = (e, annId) => {
        e.stopPropagation();
        const ann = annotations.find(a => a.id === annId);
        if (ann && ann.type === 'text') {
            setEditingId(annId);
            setActiveAnnotation(annId);
        }
    };

    const onMouseMove = (e) => {
        if (!isDragging || draggedAnnId === null) return;

        const newX = e.clientX / zoom - dragStartPos.x;
        const newY = e.clientY / zoom - dragStartPos.y;

        setAnnotations(annotations.map(a =>
            a.id === draggedAnnId ? { ...a, x: newX, y: newY } : a
        ));
    };

    const onMouseUp = () => {
        setIsDragging(false);
        setDraggedAnnId(null);
    };

    const updateAnnotation = (id, fields) => {
        setAnnotations(annotations.map(a => a.id === id ? { ...a, ...fields } : a));
    };

    const removeAnnotation = (id) => {
        setAnnotations(annotations.filter(a => a.id !== id));
        if (activeAnnotation === id) setActiveAnnotation(null);
        if (editingId === id) setEditingId(null);
    };

    const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return rgb(r, g, b);
    };

    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingId]);

    const handleKeyDown = (e, id) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            setEditingId(null);
        } else if (e.key === 'Escape') {
            setEditingId(null);
        } else if (e.key === 'Backspace' && !editingId && activeAnnotation) {
            // Allow deleting annotation with backspace when selected but not editing
            removeAnnotation(activeAnnotation);
        }
    };

    // Global Key Listener for Deleting Selected Annotation
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (activeAnnotation && !editingId) {
                    // Don't trigger if user is typing in some other input elsewhere on page
                    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                        removeAnnotation(activeAnnotation);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [activeAnnotation, editingId]);

    const exportPdf = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const fileBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const pages = pdfDoc.getPages();

            for (const ann of annotations) {
                const pageIdx = ann.page - 1;
                if (pageIdx >= 0 && pageIdx < pages.length) {
                    const page = pages[pageIdx];
                    const { height } = page.getSize();
                    const x = parseFloat(ann.x);
                    const y = height - parseFloat(ann.y);

                    if (ann.type === 'text') {
                        page.drawText(ann.text, {
                            x,
                            y: y - parseFloat(ann.size),
                            size: parseFloat(ann.size),
                            font,
                            color: hexToRgb(ann.color || '#000000'),
                        });
                    } else if (ann.type === 'whiteout' || ann.type === 'shape') {
                        page.drawRectangle({
                            x,
                            y: y - parseFloat(ann.height),
                            width: parseFloat(ann.width),
                            height: parseFloat(ann.height),
                            color: ann.type === 'whiteout' ? rgb(1, 1, 1) : (ann.fill ? hexToRgb(ann.color) : undefined),
                            borderColor: ann.type === 'shape' ? hexToRgb(ann.color) : undefined,
                            borderWidth: ann.type === 'shape' ? parseFloat(ann.strokeWidth || 1) : 0,
                        });
                    } else if (ann.type === 'image' || ann.type === 'signature') {
                        const imgData = ann.imageData.split(',')[1];
                        const imgBytes = Uint8Array.from(atob(imgData), c => c.charCodeAt(0));
                        let pdfImage;
                        if (ann.imageType === 'image/png') pdfImage = await pdfDoc.embedPng(imgBytes);
                        else pdfImage = await pdfDoc.embedJpg(imgBytes);

                        page.drawImage(pdfImage, { x, y: y - parseFloat(ann.height), width: parseFloat(ann.width), height: parseFloat(ann.height) });
                    }
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `edited_${file.name}`;
            link.click();
            setComplete(true);
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="workspace-container animate-fadeIn" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
            {/* Top Workspace Bar */}
            <div className="workspace-top-bar glass-card">
                <div className="top-bar-left">
                    <button className="workspace-icon-btn" onClick={() => { setFile(null); setPagesData([]); }} title="Close Document">
                        <X size={20} />
                    </button>
                    <div className="divider" />
                    <div className="tool-selector">
                        <button className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`} onClick={() => setActiveTool('select')} title="Selection Mode">
                            <Hand size={18} /><span>Select</span>
                        </button>
                        <button className={`tool-btn ${activeTool === 'text' ? 'active' : ''}`} onClick={() => setActiveTool('text')} title="Add Text">
                            <Type size={18} /><span>Text</span>
                        </button>
                        <button className={`tool-btn ${activeTool === 'whiteout' ? 'active' : ''}`} onClick={() => { setActiveTool('whiteout'); setEditingId(null); }} title="Whiteout">
                            <Eraser size={18} /><span>Whiteout</span>
                        </button>
                        <button className={`tool-btn ${activeTool === 'shape' ? 'active' : ''}`} onClick={() => { setActiveTool('shape'); setEditingId(null); }} title="Add Shape">
                            <Square size={18} /><span>Shapes</span>
                        </button>
                        <button className={`tool-btn ${activeTool === 'image' ? 'active' : ''}`} onClick={() => { setActiveTool('image'); setEditingId(null); }} title="Add Image">
                            <ImageIcon size={18} /><span>Image</span>
                        </button>
                        <button className={`tool-btn ${activeTool === 'signature' ? 'active' : ''}`} onClick={() => { setActiveTool('signature'); setEditingId(null); }} title="Add Signature">
                            <Signature size={18} /><span>Sign</span>
                        </button>
                    </div>
                </div>

                <div className="top-bar-center">
                    <div className="zoom-controls">
                        <button className="icon-btn" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut size={16} /></button>
                        <span className="zoom-text">{Math.round(zoom * 100)}%</span>
                        <button className="icon-btn" onClick={() => setZoom(z => Math.min(3, z + 0.1))}><ZoomIn size={16} /></button>
                        <button className="icon-btn" onClick={() => setZoom(1.0)}><Maximize size={16} /></button>
                    </div>
                </div>

                <div className="top-bar-right">
                    <div className="divider" />
                    <button className="export-action-btn" onClick={exportPdf} disabled={isProcessing || !file}>
                        {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                        <span>Export</span>
                    </button>
                </div>
            </div>

            <div className="workspace-main">
                {/* Left Sidebar - Thumbnails */}
                {file && (
                    <aside className="workspace-left-sidebar glass-card">
                        <div className="sidebar-title">Pages</div>
                        <div className="thumbnails-list">
                            {pagesData.map((page, index) => (
                                <div key={index} className="thumbnail-card" onClick={() => scrollToPage(index)}>
                                    <div className="thumbnail-wrapper">
                                        <img src={page.url} alt={`P ${index + 1}`} />
                                    </div>
                                    <span className="page-number">{index + 1}</span>
                                </div>
                            ))}
                        </div>
                    </aside>
                )}

                {/* Central Workspace Area */}
                <div className="workspace-editor-area">
                    {!file ? (
                        <div className="workspace-upload-zone" onClick={() => document.getElementById('pdf-upload-workspace').click()}>
                            <div className="upload-inner">
                                <div className="icon-circle"><FileUp size={48} color="#818cf8" /></div>
                                <h2>Open PDF Workspace</h2>
                                <p>Click to choose a file or drag & drop</p>
                                <input type="file" id="pdf-upload-workspace" hidden accept=".pdf" onChange={onFileChange} />
                            </div>
                        </div>
                    ) : (
                        <div className="editor-scroll-container">
                            <div className="pages-canvas" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
                                {isRendering ? (
                                    <div className="rendering-overlay">
                                        <Loader2 className="animate-spin" size={48} />
                                        <p>Loading document pages...</p>
                                    </div>
                                ) : (
                                    pagesData.map((page, index) => (
                                        <div
                                            key={index}
                                            ref={el => pageRefs.current[index] = el}
                                            className="page-workspace-wrapper"
                                            style={{ width: page.width, height: page.height, marginBottom: '40px', cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
                                            onClick={(e) => handlePageClick(e, index)}
                                        >
                                            <img src={page.url} alt="" className="page-bg-img" style={{ width: page.width, height: page.height }} />

                                            {/* Text Detection Layer (Transparent) */}
                                            <div className="text-detection-layer" style={{ width: page.width, height: page.height }}>
                                                {page.textContent.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="detected-text-box"
                                                        style={{ left: item.x, top: item.y, width: item.width, height: item.height }}
                                                        onDoubleClick={(e) => onSmartTextClick(e, index, item)}
                                                        title="Double-click to edit original text"
                                                    />
                                                ))}
                                            </div>

                                            {/* Annotations Layer */}
                                            {annotations.filter(a => a.page === index + 1).map(ann => (
                                                <div
                                                    key={ann.id}
                                                    onMouseDown={(e) => onMouseDown(e, ann.id)}
                                                    onDoubleClick={(e) => onDoubleClick(e, ann.id)}
                                                    className={`annotation-item ${ann.type} ${activeAnnotation === ann.id ? 'active' : ''}`}
                                                    style={{
                                                        left: `${ann.x}px`,
                                                        top: `${ann.y}px`,
                                                        width: ann.type !== 'text' ? `${ann.width}px` : 'auto',
                                                        height: ann.type !== 'text' ? `${ann.height}px` : 'auto',
                                                        zIndex: activeAnnotation === ann.id ? 100 : 10
                                                    }}
                                                >
                                                    {ann.type === 'text' && (
                                                        editingId === ann.id ? (
                                                            <textarea
                                                                ref={editInputRef}
                                                                className="inline-text-editor"
                                                                value={ann.text}
                                                                onChange={(e) => updateAnnotation(ann.id, { text: e.target.value })}
                                                                onBlur={() => setEditingId(null)}
                                                                onKeyDown={(e) => handleKeyDown(e, ann.id)}
                                                                style={{ fontSize: `${ann.size}px`, color: ann.color || '#000', minWidth: '50px' }}
                                                            />
                                                        ) : (
                                                            <div style={{ fontSize: `${ann.size}px`, color: ann.color || '#000', fontWeight: 'bold', whiteSpace: 'pre' }}>
                                                                {ann.text}
                                                            </div>
                                                        )
                                                    )}
                                                    {ann.type === 'whiteout' && <div className="whiteout-fill" />}
                                                    {ann.type === 'shape' && (
                                                        <div style={{ width: '100%', height: '100%', border: `${ann.strokeWidth || 2}px solid ${ann.color || '#000'}`, backgroundColor: ann.fill ? ann.color : 'transparent' }} />
                                                    )}
                                                    {(ann.type === 'image' || ann.type === 'signature') && (
                                                        <img src={ann.imageData} alt="" style={{ width: '100%', height: '100%' }} />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Properties */}
                {file && (
                    <aside className="workspace-right-sidebar glass-card">
                        <div className="sidebar-header"><Settings size={18} /><span>Properties</span></div>

                        {!activeAnnotation ? (
                            <div className="empty-properties"><MousePointer2 size={32} /><p>Select an element to edit</p></div>
                        ) : (
                            <div className="properties-form">
                                {(() => {
                                    const ann = annotations.find(a => a.id === activeAnnotation);
                                    if (!ann) return null;
                                    return (
                                        <>
                                            <div className="prop-group"><div className="prop-header"><span className="type-badge">{ann.type.toUpperCase()}</span><button className="del-btn" onClick={() => removeAnnotation(ann.id)}><Trash2 size={14} /></button></div></div>
                                            {ann.type === 'text' && (
                                                <>
                                                    <div className="prop-item"><label>Text Content</label><textarea value={ann.text} onChange={(e) => updateAnnotation(ann.id, { text: e.target.value })} rows={3} /></div>
                                                    <div className="prop-item"><div className="label-row"><label>Font Size</label><span>{ann.size}px</span></div><input type="range" min="8" max="72" value={ann.size} onChange={(e) => updateAnnotation(ann.id, { size: parseInt(e.target.value) })} /></div>
                                                </>
                                            )}
                                            {(ann.type !== 'text') && (
                                                <div className="prop-row">
                                                    <div className="prop-item"><label>Width</label><input type="number" value={Math.round(ann.width)} onChange={(e) => updateAnnotation(ann.id, { width: parseInt(e.target.value) })} /></div>
                                                    <div className="prop-item"><label>Height</label><input type="number" value={Math.round(ann.height)} onChange={(e) => updateAnnotation(ann.id, { height: parseInt(e.target.value) })} /></div>
                                                </div>
                                            )}
                                            {ann.type === 'shape' && (
                                                <div className="prop-item checkbox"><input type="checkbox" id="fill-check" checked={ann.fill} onChange={(e) => updateAnnotation(ann.id, { fill: e.target.checked })} /><label htmlFor="fill-check">Fill Shape</label></div>
                                            )}
                                            {ann.type !== 'whiteout' && ann.type !== 'image' && ann.type !== 'signature' && (
                                                <div className="prop-item"><label>Color</label><div className="color-picker-input"><input type="color" value={ann.color || '#000000'} onChange={(e) => updateAnnotation(ann.id, { color: e.target.value })} /><span>{ann.color?.toUpperCase()}</span></div></div>
                                            )}
                                            <div className="prop-footer"><div className="coord">X: {Math.round(ann.x)} Y: {Math.round(ann.y)}</div><div className="page-idx">Page {ann.page}</div></div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        <div className="workspace-help">
                            <h4>Pro Tips</h4>
                            <ul>
                                <li><b>Double-click original text</b> to replace it instantly</li>
                                <li><b>Double-click annotations</b> to edit inline</li>
                                <li><b>Hand Tool</b> for moving and selection</li>
                            </ul>
                        </div>
                    </aside>
                )}
            </div>

            <input type="file" id="image-upload-helper" hidden accept="image/*" onChange={onImageSelect} />

            <style>{`
                .workspace-container { display: flex; flex-direction: column; height: calc(100vh - 120px); background: #111827; border-radius: 16px; overflow: hidden; position: relative; }
                .workspace-top-bar { height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; background: rgba(17, 24, 39, 0.8); border-bottom: 1px solid rgba(255, 255, 255, 0.1); z-index: 100; }
                .top-bar-left, .top-bar-right { display: flex; align-items: center; gap: 12px; }
                .divider { width: 1px; height: 24px; background: rgba(255, 255, 255, 0.1); margin: 0 8px; }
                .tool-selector { display: flex; background: rgba(0, 0, 0, 0.3); padding: 4px; border-radius: 12px; gap: 4px; }
                .tool-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; border: none; background: transparent; color: #94a3b8; cursor: pointer; transition: all 0.2s; font-size: 13px; font-weight: 500; }
                .tool-btn:hover { color: white; background: rgba(255, 255, 255, 0.05); }
                .tool-btn.active { background: #6366f1; color: white; }
                .zoom-controls { display: flex; align-items: center; gap: 12px; background: rgba(0, 0, 0, 0.2); padding: 4px 12px; border-radius: 10px; }
                .zoom-text { font-size: 13px; font-weight: 600; min-width: 45px; text-align: center; }
                .export-action-btn { display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 8px 16px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; font-size: 14px; }
                .workspace-main { flex: 1; display: flex; overflow: hidden; }
                .workspace-left-sidebar { width: 160px; background: rgba(0, 0, 0, 0.2); border-right: 1px solid rgba(255, 255, 255, 0.05); display: flex; flex-direction: column; padding: 16px; gap: 16px; }
                .sidebar-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                .thumbnails-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding-right: 4px; }
                .thumbnail-card { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; transition: transform 0.2s; }
                .thumbnail-card:hover { transform: translateY(-2px); }
                .thumbnail-wrapper { width: 100%; aspect-ratio: 1 / 1.4; background: white; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid transparent; }
                .thumbnail-card:hover .thumbnail-wrapper { border-color: #6366f1; }
                .thumbnail-wrapper img { width: 100%; height: 100%; object-fit: cover; }
                .page-number { font-size: 11px; color: #94a3b8; }
                .workspace-editor-area { flex: 1; background: #1f2937; position: relative; overflow: hidden; }
                .editor-scroll-container { width: 100%; height: 100%; overflow: auto; padding: 80px 40px; display: flex; justify-content: center; }
                .pages-canvas { display: flex; flex-direction: column; align-items: center; }
                .page-workspace-wrapper { background: white; box-shadow: 0 30px 60px rgba(0,0,0,0.5); position: relative; flex-shrink: 0; }
                .text-detection-layer { position: absolute; top: 0; left: 0; pointer-events: none; }
                .detected-text-box { position: absolute; cursor: text; transition: background 0.2s; pointer-events: auto; }
                .detected-text-box:hover { background: rgba(99, 102, 241, 0.1); border: 1px dashed rgba(99, 102, 241, 0.3); }
                .annotation-item { position: absolute; cursor: inherit; box-sizing: border-box; }
                .annotation-item.active { outline: 2px solid #6366f1; outline-offset: 2px; }
                .inline-text-editor { background: white; border: 2px solid #6366f1; border-radius: 4px; padding: 2px; outline: none; resize: both; min-width: 50px; font-family: sans-serif; box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
                .whiteout-fill { width: 100%; height: 100%; background: white; }
                .workspace-right-sidebar { width: 280px; background: rgba(0, 0, 0, 0.2); border-left: 1px solid rgba(255, 255, 255, 0.05); padding: 20px; display: flex; flex-direction: column; gap: 24px; }
                .sidebar-header { display: flex; align-items: center; gap: 8px; font-weight: 600; color: white; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; }
                .empty-properties { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #4b5563; text-align: center; gap: 12px; }
                .properties-form { display: flex; flex-direction: column; gap: 20px; }
                .prop-header { display: flex; justify-content: space-between; align-items: center; }
                .type-badge { background: rgba(99, 102, 241, 0.2); color: #818cf8; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
                .del-btn { background: rgba(239, 68, 68, 0.1); color: #f87171; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .prop-item label { display: block; font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 6px; }
                .prop-item input[type="text"], .prop-item input[type="number"], .prop-item textarea { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 12px; color: white; font-size: 13px; }
                .prop-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .checkbox { display: flex; align-items: center; gap: 8px; }
                .color-picker-input { display: flex; align-items: center; gap: 12px; }
                .color-picker-input input[type="color"] { width: 32px; height: 32px; border: none; background: none; cursor: pointer; }
                .prop-footer { display: flex; justify-content: space-between; font-size: 10px; color: #4b5563; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 12px; }
                .workspace-upload-zone { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 40px; cursor: pointer; }
                .upload-inner { max-width: 400px; text-align: center; padding: 40px; border: 2px dashed rgba(255,255,255,0.1); border-radius: 24px; transition: all 0.2s; }
                .upload-inner:hover { border-color: #6366f1; background: rgba(99, 102, 241, 0.05); }
                .workspace-help h4 { font-size: 12px; color: white; margin-bottom: 8px; }
                .workspace-help ul { font-size: 11px; color: #64748b; padding-left: 16px; }
                .workspace-help li { margin-bottom: 4px; }
            `}</style>
        </div>
    );
};

export default EditorTool;
