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
    const [downloadUrl, setDownloadUrl] = useState(null);
    
    // Detected potential watermarks
    const [detectedObjects, setDetectedObjects] = useState([]); // {id, name, count, type}
    const [hasAnnotations, setHasAnnotations] = useState(false);
    const [selectedObjects, setSelectedObjects] = useState(new Set());
    const [removeAnnots, setRemoveAnnots] = useState(false);
    const [targetText, setTargetText] = useState('');
    const [detectedText, setDetectedText] = useState([]); // {text, count, transform, fontName}
    const [selectedText, setSelectedText] = useState(new Set());

    const onFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setComplete(false);
            setDownloadUrl(null);
            setDetectedObjects([]);
            setHasAnnotations(false);
            setDetectedText([]);
            setSelectedObjects(new Set());
            setSelectedText(new Set());
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
            
            const objectUsage = new Map(); // PDFRef -> {name, count, type}
            let totalAnnotations = 0;
            const visitedRefs = new Set();

            // Recursive XObject Scanner with Circular Protection
            const scanResources = (resources) => {
                if (!resources) return;
                const xObjects = resources.get(PDFName.of('XObject'));
                if (!xObjects || !(xObjects.entries)) return;

                for (const [name, ref] of xObjects.entries()) {
                    const refStr = ref.toString();
                    const nameStr = name.decodeText();
                    
                    if (!objectUsage.has(refStr)) {
                        objectUsage.set(refStr, { name: nameStr, count: 0, type: 'XObject' });
                        
                        // Deep scan if it's a Form XObject and not visited
                        if (!visitedRefs.has(refStr)) {
                            visitedRefs.add(refStr);
                            try {
                                const xObj = pdfDoc.context.lookup(ref);
                                if (xObj instanceof PDFRawStream) {
                                    const subtype = xObj.dict.get(PDFName.of('Subtype'));
                                    if (subtype === PDFName.of('Form')) {
                                        const nestedRes = xObj.dict.get(PDFName.of('Resources'));
                                        if (nestedRes) scanResources(pdfDoc.context.lookup(nestedRes));
                                    }
                                }
                            } catch (e) {}
                        }
                    }
                    
                    const data = objectUsage.get(refStr);
                    data.count++;
                }
            };

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const annots = pdfDoc.context.lookup(page.node.get(PDFName.of('Annots')));
                if (annots instanceof PDFArray) totalAnnotations += annots.size();
                scanResources(page.node.normalizedEntries().Resources);
            }

            // --- SCAN TEXT (Diverse Sampling) ---
            const textUsage = new Map(); // string -> {count, transforms: Set}
            try {
                const pdfjsData = await pdfFile.arrayBuffer();
                const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfjsData }).promise;
                
                // Sample Start, Middle, and End
                const numPages = pdfjsDoc.numPages;
                const sampleIndices = new Set();
                for (let i = 1; i <= Math.min(numPages, 10); i++) sampleIndices.add(i);
                for (let i = Math.max(1, Math.floor(numPages/2)-2); i <= Math.min(numPages, Math.floor(numPages/2)+2); i++) sampleIndices.add(i);
                for (let i = Math.max(1, numPages-5); i <= numPages; i++) sampleIndices.add(i);

                for (const i of sampleIndices) {
                    const page = await pdfjsDoc.getPage(i);
                    const content = await page.getTextContent();
                    const pageStrings = new Set();
                    
                    for (const item of content.items) {
                        const s = item.str.trim();
                        if (s.length > 3) {
                            const transform = item.transform.map(n => Math.round(n)).join('_');
                            pageStrings.add(`${s}|@|${transform}`);
                        }
                    }
                    for (const s of pageStrings) {
                        const [text, transform] = s.split('|@|');
                        if (!textUsage.has(text)) textUsage.set(text, { count: 0, transforms: new Set() });
                        const entry = textUsage.get(text);
                        entry.count++;
                        entry.transforms.add(transform);
                    }
                }
            } catch (err) {
                console.error("Text scan error", err);
            }

            // Identify recurring elements based on text frequency, regardless of absolute transform
            const sampleCount = Array.from(new Set(textUsage.keys())).length > 0 ? Array.from(textUsage.values())[0].count : 0; // heuristic
            // Actually, sampleCount is the size of sampleIndices
            const actualSampleCount = new Set([
              ...Array.from({length: Math.min(pages.length, 10)}, (_, i) => i + 1),
              ...Array.from({length: 5}, (_, i) => Math.max(1, Math.floor(pages.length/2)-2) + i).filter(i => i <= pages.length),
              ...Array.from({length: 6}, (_, i) => Math.max(1, pages.length-5) + i).filter(i => i <= pages.length)
            ]).size;

            const potentialTextWatermarks = Array.from(textUsage.entries())
                .filter(([_, data]) => data.count > 1) // On more than one sampled page
                .map(([text, data]) => ({ 
                    text, 
                    count: data.count, 
                    confidence: data.count / actualSampleCount,
                    isPositional: data.transforms.size === 1 // True if it's always in the same spot
                }))
                .sort((a, b) => b.count - a.count);
            
            setDetectedText(potentialTextWatermarks);

            const potentialWatermarks = Array.from(objectUsage.entries())
                .filter(([_, data]) => data.count > 1 || (pages.length === 1 && data.count === 1))
                .map(([ref, data]) => ({
                    id: ref,
                    name: data.name,
                    count: data.count,
                    type: 'XObject'
                }));

            setDetectedObjects(potentialWatermarks);
            
            const autoSelectedObj = new Set();
            const autoSelectedText = new Set();
            
            potentialWatermarks.forEach(obj => {
                if (obj.count / pages.length > 0.6) autoSelectedObj.add(obj.id);
            });
            potentialTextWatermarks.forEach(txt => {
                if (txt.confidence > 0.6) autoSelectedText.add(txt.text);
            });
            
            setSelectedObjects(autoSelectedObj);
            setSelectedText(autoSelectedText);
            setHasAnnotations(totalAnnotations > 0);
            if (totalAnnotations > 0) setRemoveAnnots(true);

        } catch (err) {
            console.error("Scan error", err);
            alert("Analysis failed. This PDF might be heavily protected.");
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

            // 1. Structural Cleaning
            const catalog = pdfDoc.catalog;
            if (catalog.has(PDFName.of('OCProperties'))) catalog.delete(PDFName.of('OCProperties'));
            if (catalog.has(PDFName.of('PieceInfo'))) catalog.delete(PDFName.of('PieceInfo'));

            // 2. Annotations
            if (removeAnnots) {
                for (const page of pages) page.node.delete(PDFName.of('Annots'));
            }

            // 3. Process Chosen XObjects with Circular Protection
            const visitedSwapRefs = new Set();
            if (selectedObjects.size > 0) {
                const targetRefs = new Set(Array.from(selectedObjects));
                const transparentPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR42mP8/5+hAAGMAAMMDvPQnAAAAABJRU5ErkJggg==';
                const replacementImage = await pdfDoc.embedPng(transparentPng);

                const swapResources = (resources) => {
                    if (!resources) return;
                    const xObjectsDict = resources.get(PDFName.of('XObject'));
                    if (!xObjectsDict || !(xObjectsDict.entries)) return;

                    for (const [name, ref] of xObjectsDict.entries()) {
                        const refStr = ref.toString();
                        if (targetRefs.has(refStr)) {
                            xObjectsDict.set(name, replacementImage.ref);
                        } else if (!visitedSwapRefs.has(refStr)) {
                            visitedSwapRefs.add(refStr);
                            try {
                                const xObj = pdfDoc.context.lookup(ref);
                                if (xObj instanceof PDFRawStream && xObj.dict.get(PDFName.of('Subtype')) === PDFName.of('Form')) {
                                    const nestedRes = xObj.dict.get(PDFName.of('Resources'));
                                    if (nestedRes) swapResources(pdfDoc.context.lookup(nestedRes));
                                }
                            } catch (e) {}
                        }
                    }
                };

                for (const page of pages) {
                    swapResources(page.node.normalizedEntries().Resources);
                }
            }

            // 4. Trace & Scrub Text Content
            const finalTargetTextList = Array.from(selectedText);
            if (targetText.trim()) finalTargetTextList.push(targetText.trim());

            if (finalTargetTextList.length > 0) {
                const targetStrsNoSpace = finalTargetTextList.map(t => t.toLowerCase().replace(/\s+/g, ''));
                const originalRegexes = finalTargetTextList.map(t => {
                    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    return new RegExp('\\((?:' + escaped + ')\\)\\s*[TjTJ]', 'ig');
                });

                const scrubStream = async (stream) => {
                    try {
                        const data = stream.contents;
                        const decompressed = await decompressStream(data);
                        let contentStr = new TextDecoder().decode(decompressed);
                        let modified = false;

                        // 1. Classic Full Match Replace
                        for (const reg of originalRegexes) {
                            if (reg.test(contentStr)) {
                                contentStr = contentStr.replace(reg, '() Tj');
                                modified = true;
                            }
                        }

                        // 2. Token Mapper (Aggressive Character Stripping)
                        let virtualString = '';
                        let indexMap = [];
                        let inString = false;
                        let escapeNext = false;
                        let parenDepth = 0;
                        
                        for (let i = 0; i < contentStr.length; i++) {
                            const char = contentStr[i];
                            if (escapeNext) {
                                if (inString && !/\s/.test(char)) {
                                    virtualString += char.toLowerCase();
                                    indexMap.push(i);
                                }
                                escapeNext = false;
                                continue;
                            }
                            if (char === '\\') {
                                escapeNext = true;
                                continue;
                            }
                            if (char === '(') {
                                parenDepth++;
                                if (parenDepth === 1) {
                                    inString = true;
                                    continue;
                                }
                            }
                            if (char === ')') {
                                parenDepth--;
                                if (parenDepth === 0) {
                                    inString = false;
                                    continue;
                                }
                            }
                            if (inString && !/\s/.test(char)) {
                                virtualString += char.toLowerCase();
                                indexMap.push(i);
                            }
                        }

                        if (virtualString.length > 0) {
                            let contentArr = contentStr.split('');
                            for (const target of targetStrsNoSpace) {
                                if (!target) continue;
                                let pos = 0;
                                while ((pos = virtualString.indexOf(target, pos)) !== -1) {
                                    for (let j = 0; j < target.length; j++) {
                                        const charIndexInContent = indexMap[pos + j];
                                        if (charIndexInContent !== undefined) {
                                            contentArr[charIndexInContent] = ' '; // Overwrite character with space
                                        }
                                    }
                                    modified = true;
                                    pos += target.length;
                                }
                            }
                            if (modified) {
                                contentStr = contentArr.join('');
                            }
                        }

                        if (modified) {
                            const compressed = await compressStream(new TextEncoder().encode(contentStr));
                            stream.setContents(compressed);
                        }
                    } catch (err) {}
                };

                // Scrub page contents
                for (const page of pages) {
                    const contents = page.node.get(PDFName.of('Contents'));
                    if (contents) {
                        const resolved = pdfDoc.context.lookup(contents);
                        const streams = resolved instanceof PDFArray ? resolved.array : [resolved];
                        for (const s of streams) {
                            if (s instanceof PDFRawStream) await scrubStream(s);
                        }
                    }
                }

                // Deep scrub all Form streams found in document context
                const allObjects = pdfDoc.context.enumerateIndirectObjects();
                for (const [ref, obj] of allObjects) {
                    if (obj instanceof PDFRawStream && obj.dict.get(PDFName.of('Subtype')) === PDFName.of('Form')) {
                        await scrubStream(obj);
                    }
                }
            }


            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `cleaned_${file.name}`;
            link.click();
            setComplete(true);
        } catch (error) {
            console.error(error);
            alert(`Error during processing: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- STREAM UTILS ---
    const decompressStream = async (data) => {
        // Try 'deflate' first (Zlib compatible)
        try {
            return await runDecompression(data, 'deflate');
        } catch (e) {
            // Fallback to 'deflate-raw' if it has manual Zlib header stripping
            try {
                let rawData = data;
                if (data[0] === 0x78) {
                    rawData = data.slice(2, -4);
                }
                return await runDecompression(rawData, 'deflate-raw');
            } catch (e2) {
                throw new Error("Decompression failed");
            }
        }
    };

    const runDecompression = async (data, format) => {
        const ds = new DecompressionStream(format);
        const writer = ds.writable.getWriter();
        writer.write(data);
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
        const cs = new CompressionStream('deflate');
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
                                            disabled={isProcessing || (selectedObjects.size === 0 && selectedText.size === 0 && !removeAnnots && !targetText.trim())}
                                            style={{ marginTop: '2rem' }}
                                        >
                                            {isProcessing ? <><Loader2 className="animate-spin" /> Cleaning...</> : <><Eraser size={20} /> Remove Selected & Download</>}
                                        </button>
                                    </AuthDownloadWrapper>
                                    
                                    {complete && (
                                        <div className="status-msg success" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <CheckCircle2 size={16} /> 
                                                <span>Data stripped successfully!</span>
                                            </div>
                                            {downloadUrl && (
                                                <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                                                    If download didn't start, <a href={downloadUrl} download={`cleaned_${file.name}`} style={{ color: 'var(--accent-main)', fontWeight: 600, textDecoration: 'underline' }}>click here to manual download</a>.
                                                </p>
                                            )}
                                        </div>
                                    )}
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
