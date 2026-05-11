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
    Info,
    Zap
} from 'lucide-react';
import { PDFDocument, PDFName, PDFRawStream, PDFArray, PDFDict } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Setup pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

import AuthDownloadWrapper from './AuthDownloadWrapper';
import MarketingSection from './MarketingSection';

// --- UTILS ---
const levenshteinDistance = (s, t) => {
    if (!s || !t) return 99;
    const m = s.length, n = t.length;
    const d = Array.from({ length: m + 1 }, () => new Uint8Array(n + 1));
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = s[i - 1] === t[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        }
    }
    return d[m][n];
};

const isFuzzyMatch = (s1, s2, threshold = 0.75) => {
    if (!s1 || !s2) return false;
    const l1 = s1.toLowerCase(), l2 = s2.toLowerCase();
    if (l1.includes(l2) || l2.includes(l1)) return true;
    const dist = levenshteinDistance(l1, l2);
    const maxLen = Math.max(l1.length, l2.length);
    return (1 - dist / maxLen) >= threshold;
};
// --- END UTILS ---


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
    const [watermarkFonts, setWatermarkFonts] = useState(new Set()); // Internal font names like /F1
    
    // AI Specific State
    const [isAiScanning, setIsAiScanning] = useState(false);
    const [aiProgress, setAiProgress] = useState(0);
    const [aiDetections, setAiDetections] = useState([]); // {text, bbox, page}
    const [isUltraMode, setIsUltraMode] = useState(false); // If true, use OpenCV inpainting on rasterized pages
    const [isNuclearMode, setIsNuclearMode] = useState(true); // If true, use aggressive font-based excision
    const [isCvLoaded, setIsCvLoaded] = useState(false);

    useEffect(() => {
        // Check if OpenCV is loaded from script tag
        const checkCv = setInterval(() => {
            if (window.cv && window.cv.getBuildInformation) {
                setIsCvLoaded(true);
                clearInterval(checkCv);
            }
        }, 1000);
        return () => clearInterval(checkCv);
    }, []);

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
            setAiDetections([]);
            setAiProgress(0);
            
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
                try {
                    const resolvedRes = pdfDoc.context.lookup(resources);
                    if (!resolvedRes || typeof resolvedRes.get !== 'function') return;

                    const xObjectsObj = resolvedRes.get(PDFName.of('XObject'));
                    if (!xObjectsObj) return;
                    
                    const xObjects = pdfDoc.context.lookup(xObjectsObj);
                    if (!xObjects || typeof xObjects.entries !== 'function') return;

                    for (const [name, ref] of xObjects.entries()) {
                        const refStr = ref.toString();
                        const nameStr = name instanceof PDFName ? name.decodeText() : 'Unknown';
                        
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
                                            if (nestedRes) scanResources(nestedRes);
                                        }
                                    }
                                } catch (e) {}
                            }
                        }
                        
                        const data = objectUsage.get(refStr);
                        if (data) data.count++;
                    }
                } catch (err) {
                    console.warn("Resource scan skipped for one branch", err);
                }
            };

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const annots = pdfDoc.context.lookup(page.node.get(PDFName.of('Annots')));
                if (annots instanceof PDFArray) totalAnnotations += annots.size();
                scanResources(page.node.get(PDFName.of('Resources')));
            }

            // --- SCAN TEXT (Diverse Sampling) ---
            const textUsage = new Map(); // string -> {count, transforms: Set, fonts: Set}
            try {
                const pdfjsData = await pdfFile.arrayBuffer();
                const pdfjsDoc = await pdfjsLib.getDocument({ data: pdfjsData }).promise;
                
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
                            const fontKey = item.fontName;
                            pageStrings.add(`${s}|@|${transform}|@|${fontKey}`);
                        }
                    }
                    for (const s of pageStrings) {
                        const [text, transform, fontKey] = s.split('|@|');
                        if (!textUsage.has(text)) textUsage.set(text, { count: 0, transforms: new Set(), fonts: new Set() });
                        const entry = textUsage.get(text);
                        entry.count++;
                        entry.transforms.add(transform);
                        entry.fonts.add(fontKey);
                    }
                }
            } catch (err) {
                console.error("Text scan error", err);
            }

            const actualSampleCount = new Set([
              ...Array.from({length: Math.min(pages.length, 10)}, (_, i) => i + 1),
              ...Array.from({length: 5}, (_, i) => Math.max(1, Math.floor(pages.length/2)-2) + i).filter(i => i <= pages.length),
              ...Array.from({length: 6}, (_, i) => Math.max(1, pages.length-5) + i).filter(i => i <= pages.length)
            ]).size;

            const potentialTextWatermarks = Array.from(textUsage.entries())
                .filter(([_, data]) => data.count > 1)
                .map(([text, data]) => ({ 
                    text, 
                    count: data.count, 
                    confidence: data.count / actualSampleCount,
                    isPositional: data.transforms.size === 1,
                    fontName: Array.from(data.fonts)[0] // Take first font used for this recurring text
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
            const autoFonts = new Set();
            
            potentialWatermarks.forEach(obj => {
                if (obj.count / pages.length > 0.8) autoSelectedObj.add(obj.id);
            });
            potentialTextWatermarks.forEach(txt => {
                if (txt.confidence > 0.8) {
                    autoSelectedText.add(txt.text);
                    // Extract internal font name (e.g. from g_d0_f1 take f1)
                    if (txt.fontName) {
                        const internalName = txt.fontName.split('_').pop();
                        // Internal names usually look like F1, F2...
                        // If it's something like f1, normalize to F1 for matching
                        autoFonts.add(internalName.toUpperCase());
                    }
                }
            });
            
            setSelectedObjects(autoSelectedObj);
            setSelectedText(autoSelectedText);
            setWatermarkFonts(autoFonts);
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

            // 3. Process Chosen XObjects — delete from resources + collect names for Do-removal
            const xDoNamesToRemove = new Set(); // XObject /names whose Do calls must be stripped
            if (selectedObjects.size > 0) {
                const targetRefs = new Set(Array.from(selectedObjects));
                for (const page of pages) {
                    try {
                        const resRef = page.node.get(PDFName.of('Resources'));
                        if (!resRef) continue;
                        const res = pdfDoc.context.lookup(resRef);
                        if (!res || typeof res.get !== 'function') continue;
                        const xobjRef = res.get(PDFName.of('XObject'));
                        if (!xobjRef) continue;
                        const xobjDict = pdfDoc.context.lookup(xobjRef);
                        if (!xobjDict || typeof xobjDict.entries !== 'function') continue;
                        const toDelete = [];
                        for (const [name, ref] of xobjDict.entries()) {
                            if (targetRefs.has(ref.toString())) {
                                const nameStr = name instanceof PDFName ? name.decodeText() : name.toString();
                                xDoNamesToRemove.add(nameStr);
                                toDelete.push(name);
                            }
                        }
                        for (const name of toDelete) xobjDict.delete(name);
                    } catch(e) {}
                }
            }

            // 4. TRUE TEXT ERASURE — PDF Content Stream Operator Parser
            const finalTargetTextList = Array.from(selectedText);
            if (targetText.trim()) finalTargetTextList.push(targetText.trim());

            if (finalTargetTextList.length > 0) {
                const normalizedTargets = finalTargetTextList.map(t => t.toLowerCase().trim()).filter(Boolean);

                // Inflate a Uint8Array using DecompressionStream
                const inflate = async (data) => {
                    for (const fmt of ['deflate', 'deflate-raw']) {
                        try {
                            let d = data;
                            if (fmt === 'deflate-raw' && data[0] === 0x78) d = data.slice(2, -4);
                            const ds = new DecompressionStream(fmt);
                            const w = ds.writable.getWriter(); w.write(d); w.close();
                            const r = ds.readable.getReader();
                            const chunks = []; while(true){const{done,value}=await r.read();if(done)break;chunks.push(value);}
                            const len = chunks.reduce((a,c)=>a+c.length,0);
                            const out = new Uint8Array(len); let off=0;
                            for(const c of chunks){out.set(c,off);off+=c.length;}
                            return out;
                        } catch(e) {}
                    }
                    return data;
                };

                // Deflate a Uint8Array
                const deflate = async (data) => {
                    const cs = new CompressionStream('deflate');
                    const w = cs.writable.getWriter(); w.write(data); w.close();
                    const r = cs.readable.getReader();
                    const chunks = []; while(true){const{done,value}=await r.read();if(done)break;chunks.push(value);}
                    const len = chunks.reduce((a,c)=>a+c.length,0);
                    const out = new Uint8Array(len); let off=0;
                    for(const c of chunks){out.set(c,off);off+=c.length;}
                    return out;
                };

                // Decode a PDF string token to a plain JS string
                const decodePdfStr = (raw) => {
                    if (raw.startsWith('<') && raw.endsWith('>')) {
                        const hex = raw.slice(1,-1).replace(/\s/g,'');
                        let s=''; for(let k=0;k<hex.length;k+=2) s+=String.fromCharCode(parseInt(hex.substr(k,2)||'0',16));
                        return s;
                    }
                    if (raw.startsWith('(') && raw.endsWith(')')) {
                        const inner = raw.slice(1,-1); let s='',k=0;
                        while(k<inner.length){
                            if(inner[k]==='\\'){k++;const m={n:'\n',r:'\r',t:'\t','(':'(', ')':')', '\\':'\\'};
                                if(m[inner[k]]!==undefined){s+=m[inner[k]];k++;}
                                else if(/[0-7]/.test(inner[k])){let o=inner[k++];if(/[0-7]/.test(inner[k]))o+=inner[k++];if(/[0-7]/.test(inner[k]))o+=inner[k++];s+=String.fromCharCode(parseInt(o,8));}
                                else s+=inner[k++];
                            } else s+=inner[k++];
                        }
                        return s;
                    }
                    return '';
                };

                // Extract combined text from a TJ array like [(abc) 5 (def)]
                const decodeTJArray = (raw) => {
                    const inner = raw.slice(1,-1); let s='',k=0;
                    while(k<inner.length){
                        while(k<inner.length&&/[\s]/.test(inner[k]))k++;
                        if(k>=inner.length)break;
                        if(inner[k]==='('){let d=0,start=k;while(k<inner.length){if(inner[k]==='\\'){k+=2;continue;}if(inner[k]==='(')d++;if(inner[k]===')')d--;k++;if(d===0)break;}s+=decodePdfStr(inner.slice(start,k));}
                        else if(inner[k]==='<'){let start=k;while(k<inner.length&&inner[k]!=='>')k++;k++;s+=decodePdfStr(inner.slice(start,k));}
                        else{while(k<inner.length&&!/[\s\[\]<>()\/%]/.test(inner[k]))k++;}
                    }
                    return s;
                };

                const matchesAny = (decoded) => {
                    const low = decoded.toLowerCase().trim();
                    if (!low || low.length < 3) return false;
                    
                    if (normalizedTargets.some(t => low.includes(t) || t.includes(low))) return true;
                    
                    // Nuclear Fuzzy Match
                    if (isNuclearMode) {
                        return normalizedTargets.some(t => isFuzzyMatch(low, t, 0.8));
                    }
                    return false;
                };

                // Read a single PDF token from content string starting at pos
                const readToken = (s, pos) => {
                    while(pos<s.length && /[\x00\t\n\x0c\r ]/.test(s[pos])) pos++;
                    if(pos>=s.length) return null;
                    const ch = s[pos];
                    if(ch==='%'){let e=pos;while(e<s.length&&s[e]!=='\n'&&s[e]!=='\r')e++;return{raw:s.slice(pos,e),end:e,type:'other'};}
                    if(ch==='('){let d=0,j=pos;while(j<s.length){if(s[j]==='\\'){j+=2;continue;}if(s[j]==='(')d++;if(s[j]===')')d--;j++;if(d===0)break;}return{raw:s.slice(pos,j),end:j,type:'str'};}
                    if(ch==='<'&&s[pos+1]!=='<'){let j=pos+1;while(j<s.length&&s[j]!=='>')j++;j++;return{raw:s.slice(pos,j),end:j,type:'str'};}
                    if(ch==='['){ let d=0,j=pos;while(j<s.length){if(s[j]==='\\'){j+=2;continue;}if(s[j]==='('){let d2=0;while(j<s.length){if(s[j]==='\\'){j+=2;continue;}if(s[j]==='(')d2++;if(s[j]===')')d2--;j++;if(d2===0)break;}continue;}if(s[j]==='<'&&s[j+1]!=='<'){while(j<s.length&&s[j]!=='>')j++;j++;continue;}if(s[j]==='[')d++;if(s[j]===']')d--;j++;if(d===0)break;}return{raw:s.slice(pos,j),end:j,type:'arr'};}
                    if(ch==='<'&&s[pos+1]==='<'){let d=0,j=pos;while(j<s.length){if(s[j]==='<'&&s[j+1]==='<'){d++;j+=2;}else if(s[j]==='>'&&s[j+1]==='>'){d--;j+=2;}else j++;if(d===0)break;}return{raw:s.slice(pos,j),end:j,type:'other'};}
                    let j=pos;while(j<s.length&&!/[\x00\t\n\x0c\r ()\[\]{}<>\/%]/.test(s[j]))j++;
                    if(j===pos) j++; // always advance to prevent infinite loop on unmatched delimiters
                    return{raw:s.slice(pos,j),end:j,type:'tok'};
                };

                // Scrub a decompressed content stream string
                const scrubContent = (content) => {
                    const tokens = []; let pos=0;
                    while(pos<content.length){
                        while(pos<content.length&&/[\x00\t\n\x0c\r ]/.test(content[pos])){tokens.push({raw:content[pos],type:'ws'});pos++;}
                        if(pos>=content.length)break;
                        const tok = readToken(content,pos);
                        if(!tok)break;
                        if(tok.end <= pos){ pos++; continue; } // safety: always advance
                        tokens.push(tok); pos=tok.end;
                    }
                    let modified = false;
                    let currentFontRef = null;

                    for(let i=0;i<tokens.length;i++){
                        const t = tokens[i];
                        if(t.type!=='tok') continue;

                        // Track Font Switch (e.g. /F1 12 Tf)
                        if (t.raw === 'Tf') {
                            let pi = i - 1;
                            while (pi >= 0 && (tokens[pi].type === 'ws' || !isNaN(tokens[pi].raw))) pi--;
                            if (pi >= 0 && tokens[pi].raw.startsWith('/')) {
                                currentFontRef = tokens[pi].raw.slice(1);
                            }
                        }

                        // NUCLEAR OPTION: If current font is a watermark font, strip ALL text operators
                        if (isNuclearMode && currentFontRef && watermarkFonts.has(currentFontRef)) {
                            if (['Tj', 'TJ', "'", '"'].includes(t.raw)) {
                                let pi = i - 1; while (pi >= 0 && tokens[pi].type === 'ws') pi--;
                                if (pi >= 0 && (tokens[pi].type === 'str' || tokens[pi].type === 'arr')) {
                                    tokens[pi].raw = t.raw === 'TJ' ? '[]' : '()';
                                    modified = true;
                                }
                            }
                        }

                        // Strip Do calls for deleted XObjects
                        if(t.raw==='Do'){
                            let pi=i-1; while(pi>=0&&tokens[pi].type==='ws')pi--;
                            if(pi>=0&&tokens[pi].type==='tok'&&tokens[pi].raw.startsWith('/')){
                                const xName = tokens[pi].raw.slice(1);
                                if(xDoNamesToRemove.has(xName)){tokens[pi].raw='';t.raw='';modified=true;}
                            }
                        } else if(t.raw==='Tj'||t.raw==="'"){
                            let pi=i-1; while(pi>=0&&tokens[pi].type==='ws')pi--;
                            if(pi>=0&&tokens[pi].type==='str'){
                                if(matchesAny(decodePdfStr(tokens[pi].raw))){tokens[pi].raw='()';modified=true;}
                            }
                        } else if(t.raw==='TJ'){
                            let pi=i-1; while(pi>=0&&tokens[pi].type==='ws')pi--;
                            if(pi>=0&&tokens[pi].type==='arr'){
                                if(matchesAny(decodeTJArray(tokens[pi].raw))){tokens[pi].raw='[]';modified=true;}
                            }
                        } else if(t.raw==='"'){
                            let pi=i-1; while(pi>=0&&tokens[pi].type==='ws')pi--;
                            if(pi>=0&&tokens[pi].type==='str'){
                                if(matchesAny(decodePdfStr(tokens[pi].raw))){tokens[pi].raw='()';modified=true;}
                            }
                        }
                    }
                    return { result: tokens.map(t=>t.raw).join(''), modified };
                };

                // Process a single PDFRawStream
                const processStream = async (stream) => {
                    try {
                        const filter = stream.dict.get(PDFName.of('Filter'));
                        const isFlate = filter === PDFName.of('FlateDecode');
                        const raw = stream.contents;
                        const bytes = isFlate ? await inflate(raw) : raw;
                        const text = new TextDecoder('latin1').decode(bytes);
                        const { result, modified } = scrubContent(text);
                        if (modified) {
                            const enc = new TextEncoder().encode(result);
                            if (isFlate) {
                                const compressed = await deflate(enc);
                                stream.setContents(compressed);
                            } else {
                                stream.setContents(enc);
                                stream.dict.delete(PDFName.of('Filter'));
                            }
                        }
                    } catch(e) { console.warn('stream scrub failed', e); }
                };

                // Process all page content streams + form XObjects
                for (const page of pages) {
                    const contents = page.node.get(PDFName.of('Contents'));
                    if (contents) {
                        const resolved = pdfDoc.context.lookup(contents);
                        const streams = resolved instanceof PDFArray ? resolved.asArray() : [resolved];
                        for (const s of streams) if (s instanceof PDFRawStream) await processStream(s);
                    }
                }
                for (const [, obj] of pdfDoc.context.enumerateIndirectObjects()) {
                    if (obj instanceof PDFRawStream && obj.dict.get(PDFName.of('Subtype')) === PDFName.of('Form')) {
                        await processStream(obj);
                    }
                }
            }

            let finalPdfBytes;
            
            // 4. Ultra Mode: AI Inpainting (Layer 3)
            if (isUltraMode && isCvLoaded) {
                const finalPdfDoc = await PDFDocument.create();
                const tempPdfBytes = await pdfDoc.save();
                const pdfjsDoc = await pdfjsLib.getDocument({ data: tempPdfBytes }).promise;

                for (let i = 1; i <= pdfjsDoc.numPages; i++) {
                    const page = await pdfjsDoc.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 });
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    await page.render({ canvasContext: ctx, viewport }).promise;

                    const src = cv.imread(canvas);
                    const mask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8U);
                    let hasMask = false;

                    aiDetections.forEach(d => {
                        // If this AI detection was selected (via selectedText)
                        if (selectedText.has(d.text)) {
                            // Tesseract coords are relative to its input size (which was 1.5 scale)
                            const scale = 2.0 / 1.5; 
                            
                            const rect = new cv.Rect(
                                Math.floor(d.bbox.x0 * scale) - 5, 
                                Math.floor(d.bbox.y0 * scale) - 5, 
                                Math.floor((d.bbox.x1 - d.bbox.x0) * scale) + 10, 
                                Math.floor((d.bbox.y1 - d.bbox.y0) * scale) + 10
                            );
                            
                            // Bounds check
                            rect.x = Math.max(0, rect.x);
                            rect.y = Math.max(0, rect.y);
                            rect.width = Math.min(src.cols - rect.x, rect.width);
                            rect.height = Math.min(src.rows - rect.y, rect.height);

                            cv.rectangle(mask, new cv.Point(rect.x, rect.y), new cv.Point(rect.x + rect.width, rect.y + rect.height), new cv.Scalar(255), -1);
                            hasMask = true;
                        }
                    });

                    if (hasMask) {
                        cv.inpaint(src, mask, src, 3, cv.INPAINT_TELEA);
                        cv.imshow(canvas, src);
                    }
                    
                    src.delete(); mask.delete();

                    const imgBytes = canvas.toDataURL('image/jpeg', 0.85);
                    const img = await finalPdfDoc.embedJpg(imgBytes);
                    const newPage = finalPdfDoc.addPage([viewport.width, viewport.height]);
                    newPage.drawImage(img, { x: 0, y: 0, width: viewport.width, height: viewport.height });
                }
                finalPdfBytes = await finalPdfDoc.save();
            } else {
                finalPdfBytes = await pdfDoc.save();
            }

            const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
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




    const toggleTextSelection = (text) => {
        const next = new Set(selectedText);
        if (next.has(text)) next.delete(text);
        else next.add(text);
        setSelectedText(next);
    };

    const runAiVisualScan = async () => {
        if (!file) return;
        setIsAiScanning(true);
        setAiProgress(0);
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfjsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            // Initialize Tesseract Worker (v5+ API compliant)
            const worker = await createWorker({
                logger: m => {
                    if (m && m.status === 'recognizing text') {
                        setAiProgress(Math.floor(m.progress * 100));
                    }
                }
            });

            // v5+ needs explicit load/init for some setups.
            await worker.loadLanguage('eng');
            await worker.initialize('eng');

            const maxPages = Math.min(pdfjsDoc.numPages, 3);
            const detections = [];

            for (let i = 1; i <= maxPages; i++) {
                const page = await pdfjsDoc.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 }); // Balanced scale for speed/accuracy
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport }).promise;
                
                const { data: { words } } = await worker.recognize(canvas);
                
                words.forEach(word => {
                    if (word.text.length > 3 && word.confidence > 60) {
                        detections.push({
                            text: word.text,
                            bbox: word.bbox,
                            page: i
                        });
                    }
                });
            }

            // Find common patterns across pages
            const textMap = new Map();
            detections.forEach(d => {
                const key = d.text.toLowerCase();
                if (!textMap.has(key)) textMap.set(key, []);
                textMap.get(key).push(d);
            });

            const repeated = [];
            for (const [text, instances] of textMap.entries()) {
                if (instances.length >= 2) {
                    repeated.push({
                        text: instances[0].text,
                        count: instances.length,
                        type: 'AI_VISUAL'
                    });
                }
            }

            setAiDetections(repeated);
            
            // Auto-select highly confident AI detections
            if (repeated.length > 0) {
                const nextSelected = new Set(selectedText);
                repeated.forEach(r => nextSelected.add(r.text));
                setSelectedText(nextSelected);
            }

            await worker.terminate();
        } catch (err) {
            console.error("AI Visual Scan Detailed Error:", err);
            alert(`AI Visual Scan failed: ${err.message}. Falling back to structural scan.`);
        } finally {
            setIsAiScanning(false);
        }
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

                        <div className="ai-controls" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Zap size={18} style={{ color: 'var(--accent-main)' }} />
                                <h4 style={{ margin: 0, fontSize: '1rem' }}>AI Visual Intelligence</h4>
                            </div>

                            <button 
                                className="secondary-btn" 
                                onClick={runAiVisualScan}
                                disabled={isAiScanning || !file}
                                style={{ width: '100%', marginBottom: '1rem', fontSize: '0.85rem' }}
                            >
                                {isAiScanning ? <><Loader2 className="animate-spin" size={16} /> Scanning {aiProgress}%</> : 'Run AI Visual Discovery'}
                            </button>

                            <div className="control-item" style={{ padding: '0.8rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                <label style={{ fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', fontWeight: 600 }}>
                                    <input 
                                        type="checkbox" 
                                        checked={isNuclearMode} 
                                        onChange={(e) => setIsNuclearMode(e.target.checked)}
                                    />
                                    Nuclear Mode (Font-Based Excision)
                                </label>
                                <p style={{ fontSize: '0.7rem', marginTop: '0.4rem', color: '#991b1b', opacity: 0.8 }}>Aggressively strips watermarks by targeting their underlying fonts. Recommended for stubborn text.</p>
                            </div>

                            <div className="control-item" style={{ padding: '0.8rem', background: 'rgba(99,102,241,0.05)', borderRadius: '8px', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <label style={{ fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={isUltraMode} 
                                            onChange={(e) => setIsUltraMode(e.target.checked)}
                                            disabled={!isCvLoaded}
                                        />
                                        Ultra Deep Clean (AI Inpainting)
                                    </label>
                                    {!isCvLoaded && <Loader2 className="animate-spin" size={12} style={{ marginLeft: 'auto' }} />}
                                </div>
                                <p style={{ fontSize: '0.7rem', marginTop: '0.4rem', opacity: 0.6 }}>Best for scanned PDFs. Uses OpenCV to heal pixels after removal.</p>
                            </div>

                            <div className="control-item" style={{ padding: '0.8rem', background: 'rgba(99,102,241,0.05)', borderRadius: '8px' }}>
                                <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><Search size={14} /> Manual Text Scrubber</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. vtudeveloper.in" 
                                    value={targetText} 
                                    onChange={(e) => setTargetText(e.target.value)} 
                                    style={{ fontSize: '0.85rem', width: '100%' }}
                                />
                                <p style={{ fontSize: '0.7rem', marginTop: '0.4rem', opacity: 0.6 }}>Enter text if it wasn't auto-detected. Use Nuclear Mode for best results.</p>
                            </div>
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
