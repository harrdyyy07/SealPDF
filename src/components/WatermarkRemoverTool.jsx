import React, { useState, useEffect } from 'react';
import {
    Eraser,
    Search,
    Trash2,
    Download,
    Loader2,
    FileText,
    CheckCircle2,
    X,
    AlertCircle,
    Info
} from 'lucide-react';
import { PDFDocument, PDFName, PDFRawStream, PDFArray } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Setup pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

import AuthDownloadWrapper from './AuthDownloadWrapper';
import MarketingSection from './MarketingSection';


const WatermarkRemoverTool = () => {
    const [file, setFile] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [complete, setComplete] = useState(false);
    
    // Detected potential watermarks
    const [detectedObjects, setDetectedObjects] = useState([]); // {id, name, count, type}
    const [hasAnnotations, setHasAnnotations] = useState(false);
    const [selectedObjects, setSelectedObjects] = useState(new Set());
    const [removeAnnots, setRemoveAnnots] = useState(false);
    const [targetText, setTargetText] = useState('');
    const [detectedText, setDetectedText] = useState([]); // {text, count, transform, fontName}
    const [selectedText, setSelectedText] = useState(new Set());
    const [watermarkFonts, setWatermarkFonts] = useState(new Set());

    const onFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setComplete(false);
            setDetectedObjects([]);
            setHasAnnotations(false);
            setDetectedText([]);
            setSelectedObjects(new Set());
            setSelectedText(new Set());
            setWatermarkFonts(new Set());
            setTargetText('');
            setRemoveAnnots(false);
            
            // Auto-scan file
            scanPDF(selectedFile);
        }
    };

    const scanPDF = async (pdfFile) => {
        setIsScanning(true);
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const pages = pdfDoc.getPages();
            
            const objectUsage = new Map(); // PDFRef -> {name, count, pages: []}
            let totalAnnotations = 0;

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                
                // Check Annotations
                const annots = pdfDoc.context.lookup(page.node.get(PDFName.of('Annots')));
                if (annots instanceof PDFArray) totalAnnotations += annots.size();

                // Check XObjects (Images/Forms)
                const resources = page.node.normalizedEntries().Resources;
                if (resources && resources.get(PDFName.of('XObject'))) {
                    const xObjects = resources.get(PDFName.of('XObject'));
                    if (xObjects.entries) {
                        for (const [name, ref] of xObjects.entries()) {
                            const refStr = ref.toString();
                            if (!objectUsage.has(refStr)) {
                                objectUsage.set(refStr, { name: name.decodeText(), count: 0, pages: [] });
                            }
                            const data = objectUsage.get(refStr);
                            data.count++;
                            data.pages.push(i);
                        }
                    }
                }
            }

            // --- SCAN TEXT (New: using pdfjs-dist) ---
            const textUsage = new Map(); // string -> count
            try {
                const pdfjsData = await pdfFile.arrayBuffer();
                const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfjsData }).promise;
                for (let i = 1; i <= Math.min(pages.length, 10); i++) { // Sample first 10 pages for speed
                    const page = await pdfjsDoc.getPage(i);
                    const content = await page.getTextContent();
                    const pageStrings = new Set();
                    for (const item of content.items) {
                        const s = item.str.trim();
                        if (s.length > 3) {
                            // Composite key: text + transform matrix + font (internal pdfjs name)
                            const transform = item.transform.join('_');
                            const fontKey = item.fontName; 
                            pageStrings.add(`${s}|@|${transform}|@|${fontKey}`);
                        }
                    }
                    for (const s of pageStrings) {
                        textUsage.set(s, (textUsage.get(s) || 0) + 1);
                    }
                }
            } catch (err) {
                console.error("Text scan error", err);
            }

            // Identify recurring text (appearing on multiple sample pages)
            const sampleCount = Math.min(pages.length, 10);
            const potentialTextWatermarks = Array.from(textUsage.entries())
                .filter(([_, count]) => count > 1)
                .map(([combined, count]) => {
                    const [text, transform, fontName] = combined.split('|@|');
                    return { text, count, transform, fontName, confidence: count / sampleCount };
                });
            
            setDetectedText(potentialTextWatermarks);
            // --- END SCAN TEXT ---

            // Identify recurring objects (appearing on more than 1 page or at least 50% of pages if doc is small)
            const potentialWatermarks = Array.from(objectUsage.entries())
                .filter(([_, data]) => data.count > 1 || (pages.length === 1 && data.count === 1))
                .map(([ref, data]) => ({
                    id: ref,
                    name: data.name,
                    count: data.count,
                    type: 'XObject'
                }));

            setDetectedObjects(potentialWatermarks);
            
            // --- MAGIC AUTO: High-Confidence Selection ---
            // Auto-select recurring elements that appear on >80% of sampled pages
            const autoSelectedObj = new Set();
            const autoSelectedText = new Set();
            const autoFonts = new Set();
            
            potentialWatermarks.forEach(obj => {
                if (obj.count / pages.length > 0.8) autoSelectedObj.add(obj.id);
            });
            potentialTextWatermarks.forEach(txt => {
                if (txt.confidence > 0.8) {
                    autoSelectedText.add(txt.text);
                    if (txt.fontName) autoFonts.add(txt.fontName);
                }
            });
            
            setSelectedObjects(autoSelectedObj);
            setSelectedText(autoSelectedText);
            setWatermarkFonts(autoFonts);
            setHasAnnotations(totalAnnotations > 0);
            if (totalAnnotations > 0) setRemoveAnnots(true);

        } catch (err) {
            console.error("Scan error", err);
        } finally {
            setIsScanning(false);
        }
    };

    const toggleObjectSelection = (id) => {
        const next = new Set(selectedObjects);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedObjects(next);
    };

    const removeWatermarks = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const pages = pdfDoc.getPages();

            // --- MAGIC AUTO: Document-level Stripping ---
            // 1. Remove OCG (Layers) - This often holds "per-document" watermarks
            const catalog = pdfDoc.catalog;
            if (catalog.get(PDFName.of('OCProperties'))) {
                catalog.delete(PDFName.of('OCProperties'));
            }

            // 0. Metadata Cleaning (some watermarks hide here)
            if (catalog.get(PDFName.of('PieceInfo'))) {
                catalog.delete(PDFName.of('PieceInfo'));
            }

            // 1. Process Annotations
            if (removeAnnots) {
                for (const page of pages) {
                    page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([]));
                }
            }

            // 2. Process Chosen XObjects
            if (selectedObjects.size > 0) {
                const targetNames = new Set(
                    detectedObjects
                        .filter(obj => selectedObjects.has(obj.id))
                        .map(obj => obj.name)
                );

                // Reusable replacement image for Resource Swap
                const transparentPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR42mP8/5+hAAGMAAMMDvPQnAAAAABJRU5ErkJggg==';
                const replacementImage = await pdfDoc.embedPng(transparentPng);

                for (const page of pages) {
                    const resources = page.node.normalizedEntries().Resources;
                    if (!resources) continue;
                    
                    const xObjectsDict = resources.get(PDFName.of('XObject'));
                    if (!xObjectsDict) continue;

                    for (const [name, _] of xObjectsDict.entries()) {
                        const nameStr = name.decodeText();
                        if (targetNames.has(nameStr)) {
                            xObjectsDict.set(name, replacementImage.ref);
                        }
                    }
                }
            }

            // 3. Process Text Scrubbing
            const finalTargetTextList = Array.from(selectedText);
            if (targetText.trim()) finalTargetTextList.push(targetText.trim());

            if (finalTargetTextList.length > 0) {
                for (const page of pages) {
                    const contentsRef = page.node.get(PDFName.of('Contents'));
                    const contents = pdfDoc.context.lookup(contentsRef);
                    const streams = [];
                    if (contents instanceof PDFRawStream) streams.push(contents);
                    else if (contents instanceof PDFArray) {
                        for (let j = 0; j < contents.size(); j++) {
                            const entry = pdfDoc.context.lookup(contents.get(j));
                            if (entry instanceof PDFRawStream) streams.push(entry);
                        }
                    }

                    for (const stream of streams) {
                        try {
                            // DECOMPRESS & CLEAN
                            // PDF FlateDecode streams often have Zlib headers (78 9C)
                            const data = stream.contents;
                            const decompressed = await decompressStream(data);
                            let contentStr = new TextDecoder().decode(decompressed);

                            // Identify which internal font reference (e.g. /F1) our target fonts map to on this page
                            const fontResources = page.node.get(PDFName.of('Resources'))?.get(PDFName.of('Font'));
                            const localWatermarkFontNames = new Set();
                            
                            if (fontResources) {
                                // Resolve any PDFJS font names back to their PDF references if possible, 
                                // otherwise we'll rely on the text scanning fallback
                                // Note: In simplistic cases, we just use the global font name list from our scan
                            }

                            let modified = false;
                            
                            // A: FONT-BASED EXCISION (AGGRESSIVE)
                            // This deletes the font switch and subsequent text blocks
                            const fontStripRegex = /\/([A-Za-z0-9]+)\s+([0-9.]+)\s+Tf/g;
                            // (Simplified for now - we'll focus on text string replacement with auto-detection)

                            // B: ADVANCED STRING Replacement
                            for (const t of finalTargetTextList) {
                                // Match (Target Text) Tj, (Target Text) TJ, [ (T) 5 (ext) ] TJ, <HEX> Tj
                                const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                
                                // Fragmented TJ Array Match (Aggressive)
                                // This matches [(F) 5 (r) -10 (a) (g) (m) (e) (n) (t)] TJ
                                const chars = t.split('').map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*-?[0-9.]*\\s*');
                                const tjArrayRegex = new RegExp('\\[?\\s*\\(' + chars + '\\).*?\\]?\\s*[TjTJ]', 'g');
                                
                                if (tjArrayRegex.test(contentStr)) {
                                    contentStr = contentStr.replace(tjArrayRegex, '() Tj');
                                    modified = true;
                                }

                                // Standard match fallback
                                const simpleRegex = new RegExp('\\(' + escaped + '\\)\\s*[TjTJ]', 'g');
                                if (simpleRegex.test(contentStr)) {
                                    contentStr = contentStr.replace(simpleRegex, '() Tj');
                                    modified = true;
                                }
                                
                                // Hex Match would require CMap lookup - for now, TJ coverage is the biggest win
                            }

                            if (modified) {
                                const compressed = await compressStream(new TextEncoder().encode(contentStr));
                                stream.setContents(compressed);
                            }
                        } catch (err) {
                            console.error("Stream scrubbing failed, skipping...", err);
                        }
                    }
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cleaned_${file.name}`;
            link.click();
            setComplete(true);
        } catch (error) {
            alert(`Error during processing: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- STREAM UTILS ---
    const decompressStream = async (data) => {
        // Try native DecompressionStream (Chrome/Safari/FF)
        // Handle Zlib header if present (78 9C or similar)
        let rawData = data;
        if (data[0] === 0x78 && data[1] === 0x9c) {
            rawData = data.slice(2, -4); // Strip Zlib header and checksum
        }
        
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        writer.write(rawData);
        writer.close();
        
        const reader = ds.readable.getReader();
        const chunks = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        
        const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const c of chunks) {
            result.set(c, offset);
            offset += c.length;
        }
        return result;
    };

    const compressStream = async (data) => {
        const cs = new CompressionStream('deflate'); // deflate usually includes zlib headers
        const writer = cs.writable.getWriter();
        writer.write(data);
        writer.close();
        
        const reader = cs.readable.getReader();
        const chunks = [];
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        
        const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const c of chunks) {
            result.set(c, offset);
            offset += c.length;
        }
        return result;
    };

    const toggleTextSelection = (text) => {
        const next = new Set(selectedText);
        if (next.has(text)) next.delete(text);
        else next.add(text);
        setSelectedText(next);
    };

    return (
        <div className="tool-content animate-fadeIn">
            <main className="main-layout">
                <section>
                    {!file ? (
                        <div className="glass-card clickable" onClick={() => document.getElementById('remove-upload').click()}>
                            <div className="upload-zone">
                                <div className="huge-select-btn">Select PDF to clean</div>
                                <p className="upload-subtext">or drop PDF here</p>
                                <input type="file" id="remove-upload" hidden accept=".pdf" onChange={onFileChange} />
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card">
                            <div className="file-info-header">
                                <FileText />
                                <div className="file-details">
                                    <p className="file-name">{file.name}</p>
                                    <p className="file-meta">Source Document</p>
                                </div>
                                <button className="icon-btn" onClick={() => setFile(null)}><X size={20} /></button>
                            </div>

                            {isScanning ? (
                                <div className="scanner-status" style={{ textAlign: 'center', padding: '2rem' }}>
                                    <Loader2 className="animate-spin" size={48} style={{ color: 'var(--accent-main)', marginBottom: '1rem' }} />
                                    <h3>Analyzing PDF structure...</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>Identifying recurring objects and watermarks</p>
                                </div>
                            ) : (
                                <div className="scan-results" style={{ padding: '1rem 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                        <Search size={20} style={{ color: 'var(--accent-main)' }} />
                                        <p style={{ fontWeight: 600 }}>We found {detectedObjects.length + detectedText.length + (hasAnnotations ? 1 : 0)} potential watermark elements.</p>
                                    </div>

                                    {detectedObjects.length === 0 && detectedText.length === 0 && !hasAnnotations ? (
                                        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                                            <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
                                            <p>No obvious recurring watermarks detected. Try "Edit PDF" for manual removal.</p>
                                        </div>
                                    ) : (
                                        <div className="detected-list">
                                            {hasAnnotations && (
                                                <div className={`detect-item ${removeAnnots ? 'selected' : ''}`} onClick={() => setRemoveAnnots(!removeAnnots)}>
                                                    <div className="detect-icon"><Info size={20} /></div>
                                                    <div className="detect-info">
                                                        <h4>Overlaid Annotations</h4>
                                                        <p>Stamp-based watermarks found on pages</p>
                                                    </div>
                                                    <div className="detect-check">{removeAnnots ? <CheckCircle2 size={20} /> : <div className="circle-check" />}</div>
                                                </div>
                                            )}

                                            {detectedText.map(obj => (
                                                <div 
                                                    key={obj.text} 
                                                    className={`detect-item ${selectedText.has(obj.text) ? 'selected' : ''}`}
                                                    onClick={() => toggleTextSelection(obj.text)}
                                                >
                                                    <div className="detect-icon" style={{ background: 'rgba(99, 102, 241, 0.1)' }}><FileText size={20} /></div>
                                                    <div className="detect-info">
                                                        <h4>"{obj.text}"</h4>
                                                        <p>Recurring Text (Found on {obj.count} sample pages)</p>
                                                    </div>
                                                    <div className="detect-check">{selectedText.has(obj.text) ? <CheckCircle2 size={20} /> : <div className="circle-check" />}</div>
                                                </div>
                                            ))}
                                            
                                            {detectedObjects.map(obj => (
                                                <div 
                                                    key={obj.id} 
                                                    className={`detect-item ${selectedObjects.has(obj.id) ? 'selected' : ''}`}
                                                    onClick={() => toggleObjectSelection(obj.id)}
                                                >
                                                    <div className="detect-icon"><FileText size={20} /></div>
                                                    <div className="detect-info">
                                                        <h4>{obj.name} ({obj.type})</h4>
                                                        <p>Found on {obj.count} pages</p>
                                                    </div>
                                                    <div className="detect-check">{selectedObjects.has(obj.id) ? <CheckCircle2 size={20} /> : <div className="circle-check" />}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <AuthDownloadWrapper>
                                        <button 
                                            className="action-btn" 
                                            onClick={removeWatermarks} 
                                            disabled={isProcessing || (selectedObjects.size === 0 && !removeAnnots)}
                                            style={{ marginTop: '2rem' }}
                                        >
                                            {isProcessing ? <><Loader2 className="animate-spin" /> Cleaning...</> : <><Eraser size={20} /> Remove Selected & Download</>}
                                        </button>
                                    </AuthDownloadWrapper>
                                    
                                    {complete && <div className="status-msg success" style={{ marginTop: '1rem' }}><CheckCircle2 size={16} /> Data stripped successfully! Check your download.</div>}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <aside className="glass-card">
                    <div className="aside-header">
                        <Eraser size={20} />
                        <h3>How it works</h3>
                    </div>
                    <div className="guide-content" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        <p style={{ marginBottom: '1rem' }}>
                            Unlike simple editors, this tool scans the <b>internal source code</b> of your PDF to find objects that repeat across pages.
                        </p>
                        <ul style={{ paddingLeft: '1.2rem', marginBottom: '1.5rem' }}>
                            <li style={{ marginBottom: '0.5rem' }}><b>Search:</b> Identifies recurring Images, Forms, and Text strings.</li>
                            <li style={{ marginBottom: '0.5rem' }}><b>Excise:</b> Deletes the target elements directly from the PDF streams.</li>
                            <li style={{ marginBottom: '0.5rem' }}><b>Clean:</b> Rebuilds the document without the watermark data.</li>
                        </ul>

                        <div className="control-item" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(99,102,241,0.05)', borderRadius: '8px' }}>
                            <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Search size={14} /> Manual Text Scrubber</label>
                            <input 
                                type="text" 
                                placeholder="e.g. VajraDeveloper.in" 
                                value={targetText} 
                                onChange={(e) => setTargetText(e.target.value)} 
                                style={{ fontSize: '0.85rem', width: '100%' }}
                            />
                            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>Enter exact text if it wasn't auto-detected.</p>
                        </div>
                        <div style={{ padding: '0.8rem', background: 'rgba(255, 150, 0, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 150, 0, 0.2)', display: 'flex', gap: '0.5rem' }}>
                            <AlertCircle size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ fontSize: '0.8rem' }}>This tool works best on digital watermarks. Hard-scanned watermarks may require the "Redact" tool.</p>
                        </div>
                    </div>
                </aside>
            </main>
            <MarketingSection toolId="remover_tool" />
        </div>
    );
};

export default WatermarkRemoverTool;
