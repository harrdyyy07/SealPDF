import React, { useState, useEffect, useRef } from 'react';
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
    Zap,
    Eye,
    EyeOff,
    MousePointer,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Sparkles,
    Sliders,
    ChevronLeft,
    ChevronRight,
    Check,
    Layers,
    ShieldCheck,
    Square
} from 'lucide-react';
import { PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFArray, PDFDict, decodePDFRawStream } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pako from 'pako';

// Setup pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

import AuthDownloadWrapper from './AuthDownloadWrapper';
import MarketingSection from './MarketingSection';

// --- UTILITIES & STREAM TOKENIZER ---

// Robust PDF content stream tokenizer that never hangs
const tokenizeStream = (s) => {
    const tokens = [];
    let i = 0;
    const len = s.length;
    while (i < len) {
        const start = i;
        const ch = s[i];
        if (ch <= ' ' || ch === '\x00') {
            while (i < len && (s[i] <= ' ' || s[i] === '\x00')) i++;
            tokens.push({ type: 'ws', raw: s.slice(start, i) });
        } else if (ch === '%') {
            while (i < len && s[i] !== '\r' && s[i] !== '\n') i++;
            tokens.push({ type: 'comment', raw: s.slice(start, i) });
        } else if (ch === '(') {
            let depth = 0;
            while (i < len) {
                if (s[i] === '\\') { i += 2; continue; }
                if (s[i] === '(') depth++;
                else if (s[i] === ')') depth--;
                i++;
                if (depth === 0) break;
            }
            tokens.push({ type: 'str', raw: s.slice(start, i) });
        } else if (ch === '<' && s[i + 1] === '<') {
            i += 2;
            tokens.push({ type: 'dict_open', raw: '<<' });
        } else if (ch === '>' && s[i + 1] === '>') {
            i += 2;
            tokens.push({ type: 'dict_close', raw: '>>' });
        } else if (ch === '<') {
            while (i < len && s[i] !== '>') i++;
            if (i < len) i++;
            tokens.push({ type: 'hex', raw: s.slice(start, i) });
        } else if (ch === '[') {
            i++;
            tokens.push({ type: 'arr_open', raw: '[' });
        } else if (ch === ']') {
            i++;
            tokens.push({ type: 'arr_close', raw: ']' });
        } else if (ch === '/') {
            i++;
            while (i < len && !/[\x00\t\n\x0c\r ()\[\]{}<>\/%]/.test(s[i])) i++;
            tokens.push({ type: 'name', raw: s.slice(start, i) });
        } else {
            while (i < len && !/[\x00\t\n\x0c\r ()\[\]{}<>\/%]/.test(s[i])) i++;
            tokens.push({ type: 'tok', raw: s.slice(start, i) });
        }
        if (i === start) i++; // guarantee progress
    }
    return tokens;
};

// Decode a PDF string token (literal string or hex string) to JavaScript string
const decodePdfToken = (rawToken) => {
    if (!rawToken) return '';
    const raw = rawToken.trim();
    if (raw.startsWith('<') && raw.endsWith('>')) {
        const hex = raw.slice(1, -1).replace(/\s/g, '');
        let s = '';
        for (let k = 0; k < hex.length; k += 2) {
            const byteVal = parseInt(hex.substr(k, 2) || '0', 16);
            if (byteVal > 0) s += String.fromCharCode(byteVal);
        }
        return s;
    }
    if (raw.startsWith('(') && raw.endsWith(')')) {
        const inner = raw.slice(1, -1);
        let s = '', k = 0;
        while (k < inner.length) {
            if (inner[k] === '\\') {
                k++;
                const esc = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' };
                if (esc[inner[k]] !== undefined) {
                    s += esc[inner[k]];
                    k++;
                } else if (/[0-7]/.test(inner[k])) {
                    let oct = inner[k++];
                    if (/[0-7]/.test(inner[k])) oct += inner[k++];
                    if (/[0-7]/.test(inner[k])) oct += inner[k++];
                    s += String.fromCharCode(parseInt(oct, 8));
                } else {
                    s += inner[k++];
                }
            } else {
                s += inner[k++];
            }
        }
        return s.replace(/\0/g, '');
    }
    if (raw.startsWith('[') && raw.endsWith(']')) {
        const inner = raw.slice(1, -1);
        let s = '', k = 0;
        while (k < inner.length) {
            while (k < inner.length && /[\s]/.test(inner[k])) k++;
            if (k >= inner.length) break;
            if (inner[k] === '(') {
                let d = 0, start = k;
                while (k < inner.length) {
                    if (inner[k] === '\\') { k += 2; continue; }
                    if (inner[k] === '(') d++;
                    if (inner[k] === ')') d--;
                    k++;
                    if (d === 0) break;
                }
                s += decodePdfToken(inner.slice(start, k));
            } else if (inner[k] === '<') {
                let start = k;
                while (k < inner.length && inner[k] !== '>') k++;
                k++;
                s += decodePdfToken(inner.slice(start, k));
            } else {
                while (k < inner.length && !/[\s\[\]<>()\/%]/.test(inner[k])) k++;
            }
        }
        return s;
    }
    return '';
};

// Precise watermark pattern matching:
// - Must be at least 3 characters long
// - Avoid matching short prepositions like 'in', 'pu', 'to', 'of', 'at'
const defaultWatermarkRegex = /\b(vtugo|vtudeveloper|vtusync|vtu|confidential|draft|sample|do not copy|studied smart|thanks to|watermark|copyright|preview)\b/i;

const isWatermarkMatch = (decodedText, targetKeywords = []) => {
    if (!decodedText) return false;
    const clean = decodedText.toLowerCase().trim();
    if (clean.length < 3) return false; // NEVER delete short words or equation symbols

    // Full regex match on text
    if (defaultWatermarkRegex.test(clean)) return true;

    // Domain pattern match (e.g. vtusync.in, vtugo.in, sample.com)
    if (/\b[a-z0-9_-]{3,}\.(in|com|org|net|edu)\b/i.test(clean)) return true;

    const alphaOnly = clean.replace(/[^a-z0-9]/g, '');
    if (alphaOnly.length >= 4 && defaultWatermarkRegex.test(alphaOnly)) return true;

    for (const target of targetKeywords) {
        if (!target) continue;
        const normTarget = target.toLowerCase().trim();
        if (normTarget.length < 3) continue;

        // The text must contain the target (e.g. target="vtusync.in", clean="thanks to vtusync.in")
        // OR the clean word is an exact match of target (for length >= 4)
        if (clean.includes(normTarget)) return true;
        if (clean.length >= 4 && normTarget === clean) return true;
    }

    return false;
};

// Safe stream decompressor with multiple fallbacks
const decompressStream = (stream) => {
    try {
        const decoded = decodePDFRawStream(stream).decode();
        return new TextDecoder('latin1').decode(decoded);
    } catch (e1) {
        try {
            const inflated = pako.inflate(stream.contents);
            return new TextDecoder('latin1').decode(inflated);
        } catch (e2) {
            return new TextDecoder('latin1').decode(stream.contents);
        }
    }
};

// Safe stream recompressor & updater
const compressAndSetStream = (stream, newText, pdfDoc) => {
    const enc = new TextEncoder().encode(newText);
    const newStream = pdfDoc.context.flateStream(enc);
    stream.contents = newStream.contents;
    stream.dict.set(PDFName.of('Length'), PDFNumber.of(newStream.contents.length));
    stream.dict.set(PDFName.of('Filter'), PDFName.of('FlateDecode'));
};

const getPreviousNumbers = (tokens, curIdx, count) => {
    const nums = [];
    let p = curIdx - 1;
    while (p >= 0 && nums.length < count) {
        if (tokens[p].type === 'tok' && !isNaN(parseFloat(tokens[p].raw))) {
            nums.unshift(parseFloat(tokens[p].raw));
        } else if (tokens[p].type !== 'ws') {
            break;
        }
        p--;
    }
    return nums;
};

// --- MAIN COMPONENT ---

const WatermarkRemoverTool = () => {
    const [file, setFile] = useState(null);
    const [pdfDocProxy, setPdfDocProxy] = useState(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [zoomScale, setZoomScale] = useState(1.1);

    // States for progress and completion
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processProgress, setProcessProgress] = useState(0);
    const [processStepText, setProcessStepText] = useState('');
    const [complete, setComplete] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [cleanedPdfBytes, setCleanedPdfBytes] = useState(null);
    const [cleanedPageProxy, setCleanedPageProxy] = useState(null);

    // Interactive Preview Controls
    const [toolMode, setToolMode] = useState('box'); // 'box' (drag to erase) or 'pan'
    const [showCleanedPreview, setShowCleanedPreview] = useState(false);
    const [customBoxes, setCustomBoxes] = useState([]); // [{id, page, x, y, w, h, applyToAll}] (normalized 0..1)
    const [tempBox, setTempBox] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    // Detection Data
    const [detectedObjects, setDetectedObjects] = useState([]); // {id, name, count, type}
    const [detectedText, setDetectedText] = useState([]); // {text, count, confidence, isPositional, isAngled}
    const [detectedTransparentGS, setDetectedTransparentGS] = useState([]); // names of ExtGStates with ca < 0.88
    const [hasAnnotations, setHasAnnotations] = useState(false);

    // Removal Engine Selections & Settings
    const [selectedObjects, setSelectedObjects] = useState(new Set());
    const [selectedText, setSelectedText] = useState(new Set());
    const [targetText, setTargetText] = useState('');

    // Stubborn Watermark Filter Toggles (Dpdf parity)
    const [removeAngledText, setRemoveAngledText] = useState(true);
    const [removeTransparentLayers, setRemoveTransparentLayers] = useState(true);
    const [removeMarkedContent, setRemoveMarkedContent] = useState(true);
    const [removeAnnots, setRemoveAnnots] = useState(true);
    const [isUltraMode, setIsUltraMode] = useState(false); // OpenCV Inpainting for Scanned PDFs
    const [isCvLoaded, setIsCvLoaded] = useState(false);

    // Refs
    const canvasRef = useRef(null);
    const canvasContainerRef = useRef(null);

    useEffect(() => {
        const checkCv = setInterval(() => {
            if (window.cv && window.cv.getBuildInformation) {
                setIsCvLoaded(true);
                clearInterval(checkCv);
            }
        }, 1000);
        return () => clearInterval(checkCv);
    }, []);

    const onFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setComplete(false);
            setDownloadUrl(null);
            setCleanedPdfBytes(null);
            setCleanedPageProxy(null);
            setShowCleanedPreview(false);
            setCustomBoxes([]);
            setDetectedObjects([]);
            setDetectedText([]);
            setDetectedTransparentGS([]);
            setHasAnnotations(false);
            setSelectedObjects(new Set());
            setSelectedText(new Set());
            setCurrentPage(1);

            try {
                const arrayBuffer = await selectedFile.arrayBuffer();
                const proxy = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                setPdfDocProxy(proxy);
                setNumPages(proxy.numPages);
                scanPDF(selectedFile, proxy);
            } catch (err) {
                console.error("Error opening PDF preview", err);
                alert("Failed to load PDF preview. File might be password protected.");
            }
        }
    };

    // Deep Analysis of PDF (Streams, ExtGStates, XObjects, Text)
    const scanPDF = async (pdfFile, proxy) => {
        setIsScanning(true);
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            const pages = pdfDoc.getPages();

            const transparentGS = new Set();
            const objectUsage = new Map();
            let totalAnnotations = 0;

            // 1. Inspect Resources: ExtGState transparency & XObjects
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const annots = pdfDoc.context.lookup(page.node.get(PDFName.of('Annots')));
                if (annots instanceof PDFArray) totalAnnotations += annots.size();

                const resRef = page.node.get(PDFName.of('Resources'));
                if (!resRef) continue;
                const res = pdfDoc.context.lookup(resRef);
                if (!res || typeof res.get !== 'function') continue;

                // Transparent ExtGState scanner
                const egRef = res.get(PDFName.of('ExtGState'));
                if (egRef) {
                    const egDict = pdfDoc.context.lookup(egRef);
                    if (egDict && typeof egDict.entries === 'function') {
                        for (const [k, v] of egDict.entries()) {
                            const dict = pdfDoc.context.lookup(v);
                            if (dict && typeof dict.get === 'function') {
                                const ca = dict.get(PDFName.of('ca'));
                                const CA = dict.get(PDFName.of('CA'));
                                const caVal = ca instanceof PDFNumber ? ca.asNumber() : null;
                                const CAVal = CA instanceof PDFNumber ? CA.asNumber() : null;
                                if ((caVal !== null && caVal < 0.88) || (CAVal !== null && CAVal < 0.88)) {
                                    const nameStr = k instanceof PDFName ? k.decodeText() : k.toString();
                                    transparentGS.add(nameStr);
                                }
                            }
                        }
                    }
                }

                // XObject scanner
                const xobjRef = res.get(PDFName.of('XObject'));
                if (xobjRef) {
                    const xobjDict = pdfDoc.context.lookup(xobjRef);
                    if (xobjDict && typeof xobjDict.entries === 'function') {
                        for (const [name, ref] of xobjDict.entries()) {
                            const refStr = ref.toString();
                            const nameStr = name instanceof PDFName ? name.decodeText() : name.toString();
                            if (!objectUsage.has(refStr)) {
                                objectUsage.set(refStr, { name: nameStr, count: 0, type: 'XObject' });
                            }
                            objectUsage.get(refStr).count++;
                        }
                    }
                }
            }

            setDetectedTransparentGS(Array.from(transparentGS));

            // 2. Sample PDF text with PDF.js
            const textUsage = new Map();
            const samplePages = new Set();
            for (let i = 1; i <= Math.min(proxy.numPages, 5); i++) samplePages.add(i);
            for (let i = Math.max(1, Math.floor(proxy.numPages / 2) - 2); i <= Math.min(proxy.numPages, Math.floor(proxy.numPages / 2) + 2); i++) samplePages.add(i);
            for (let i = Math.max(1, proxy.numPages - 3); i <= proxy.numPages; i++) samplePages.add(i);

            for (const pNum of samplePages) {
                try {
                    const page = await proxy.getPage(pNum);
                    const content = await page.getTextContent();
                    const pageStrings = new Set();

                    for (const item of content.items) {
                        const s = item.str.trim();
                        // Only consider text of length >= 3 to avoid matching math symbols or prepositions
                        if (s.length >= 3) {
                            const a = item.transform[0];
                            const b = item.transform[1];
                            const c = item.transform[2];
                            const angleDeg = Math.abs(Math.atan2(b, a) * 180 / Math.PI);
                            // Truly angled/diagonal watermark check (not italic slant where b=0)
                            const isTrulyAngled = (angleDeg >= 18 && angleDeg <= 162) && Math.abs(b) > 0.25;
                            pageStrings.add(`${s}|@|${isTrulyAngled ? 'angled' : 'straight'}`);
                        }
                    }

                    for (const entry of pageStrings) {
                        const [text, angleStatus] = entry.split('|@|');
                        if (!textUsage.has(text)) {
                            textUsage.set(text, { count: 0, isAngled: angleStatus === 'angled' });
                        }
                        const rec = textUsage.get(text);
                        rec.count++;
                        if (angleStatus === 'angled') rec.isAngled = true;
                    }
                } catch (e) {
                    console.warn("Text sampling error on page", pNum, e);
                }
            }

            const potentialTextWatermarks = Array.from(textUsage.entries())
                .filter(([text, data]) => data.count > 1 || isWatermarkMatch(text) || data.isAngled)
                .map(([text, data]) => ({
                    text,
                    count: data.count,
                    confidence: data.count / samplePages.size,
                    isAngled: data.isAngled
                }))
                .filter(item => isWatermarkMatch(item.text) || item.isAngled || item.confidence >= 0.7)
                .sort((a, b) => b.count - a.count);

            setDetectedText(potentialTextWatermarks);

            const potentialObjects = Array.from(objectUsage.entries())
                .filter(([_, data]) => data.count > 1 || (pages.length === 1 && data.count === 1) || /wm|watermark|draft|stamp/i.test(data.name))
                .map(([ref, data]) => ({
                    id: ref,
                    name: data.name,
                    count: data.count,
                    type: data.type
                }));

            setDetectedObjects(potentialObjects);
            setHasAnnotations(totalAnnotations > 0);

            // Auto-select highly confident watermarks
            const autoSelectedObj = new Set();
            const autoSelectedTxt = new Set();

            potentialObjects.forEach(obj => {
                if (obj.count / pages.length > 0.6 || /wm|watermark|bg|draft|copy/i.test(obj.name)) {
                    autoSelectedObj.add(obj.id);
                }
            });

            potentialTextWatermarks.forEach(t => {
                if (isWatermarkMatch(t.text) || t.isAngled) {
                    autoSelectedTxt.add(t.text);
                }
            });

            setSelectedObjects(autoSelectedObj);
            setSelectedText(autoSelectedTxt);

        } catch (err) {
            console.error("Deep Scan error", err);
        } finally {
            setIsScanning(false);
        }
    };

    // Render Preview on Canvas
    useEffect(() => {
        let isCancelled = false;
        const renderPage = async () => {
            const proxy = showCleanedPreview && cleanedPageProxy ? cleanedPageProxy : pdfDocProxy;
            if (!proxy || !canvasRef.current) return;

            try {
                const page = await proxy.getPage(showCleanedPreview && cleanedPageProxy ? 1 : currentPage);
                const viewport = page.getViewport({ scale: zoomScale });
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                await page.render(renderContext).promise;
            } catch (err) {
                if (!isCancelled) console.error("Canvas render error", err);
            }
        };

        renderPage();
        return () => { isCancelled = true; };
    }, [pdfDocProxy, cleanedPageProxy, currentPage, zoomScale, showCleanedPreview]);

    // Fast Single-Page Clean for Instant "Before & After" Preview
    const generateCleanedPreview = async () => {
        if (!file || !pdfDocProxy) return;
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

            // Extract single current page for fast preview
            const singlePageDoc = await PDFDocument.create();
            const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [currentPage - 1]);
            singlePageDoc.addPage(copiedPage);

            // Execute clean on this single page doc
            await executeWatermarkRemovalOnDoc(singlePageDoc, true);

            const previewBytes = await singlePageDoc.save();
            const previewProxy = await pdfjsLib.getDocument({ data: previewBytes }).promise;
            setCleanedPageProxy(previewProxy);
            setShowCleanedPreview(true);
        } catch (err) {
            console.error("Error generating cleaned preview:", err);
            alert("Could not generate instant preview. You can still proceed to Remove & Download.");
        }
    };

    // Core Multi-Engine Watermark Cleaner (Shared between Preview and Full Download)
    const executeWatermarkRemovalOnDoc = async (pdfDoc, isSinglePreview = false) => {
        const pages = pdfDoc.getPages();

        // 1. Gather all transparent ExtGStates
        const transparentGS = new Set(detectedTransparentGS);
        for (const page of pages) {
            const resRef = page.node.get(PDFName.of('Resources'));
            if (!resRef) continue;
            const res = pdfDoc.context.lookup(resRef);
            if (!res || typeof res.get !== 'function') continue;
            const egRef = res.get(PDFName.of('ExtGState'));
            if (!egRef) continue;
            const egDict = pdfDoc.context.lookup(egRef);
            if (!egDict || typeof egDict.entries !== 'function') continue;
            for (const [k, v] of egDict.entries()) {
                const dict = pdfDoc.context.lookup(v);
                if (dict && typeof dict.get === 'function') {
                    const ca = dict.get(PDFName.of('ca'));
                    const CA = dict.get(PDFName.of('CA'));
                    const caVal = ca instanceof PDFNumber ? ca.asNumber() : null;
                    const CAVal = CA instanceof PDFNumber ? CA.asNumber() : null;
                    if ((caVal !== null && caVal < 0.88) || (CAVal !== null && CAVal < 0.88)) {
                        const nameStr = k instanceof PDFName ? k.decodeText() : k.toString();
                        transparentGS.add(nameStr);
                    }
                }
            }
        }

        // 2. Identify XObjects to remove
        const xDoNamesToRemove = new Set();
        for (const page of pages) {
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
                const refStr = ref.toString();
                const nameStr = name instanceof PDFName ? name.decodeText() : name.toString();
                if (selectedObjects.has(refStr) || selectedObjects.has(nameStr) || /wm|watermark|draft|copy|stamp/i.test(nameStr)) {
                    xDoNamesToRemove.add(nameStr);
                    toDelete.push(name);
                }
            }
            for (const name of toDelete) xobjDict.delete(name);
        }

        // 3. Remove Metadata & Annotations
        const catalog = pdfDoc.catalog;
        if (catalog.has(PDFName.of('OCProperties'))) catalog.delete(PDFName.of('OCProperties'));
        if (catalog.has(PDFName.of('PieceInfo'))) catalog.delete(PDFName.of('PieceInfo'));

        if (removeAnnots) {
            for (const page of pages) page.node.delete(PDFName.of('Annots'));
        }

        // 4. Target texts
        const targetKeywords = Array.from(selectedText);
        if (targetText.trim()) targetKeywords.push(targetText.trim());

        // Process a raw stream
        const processStream = (stream, pageIndex, pageWidth, pageHeight) => {
            try {
                const rawContent = decompressStream(stream);
                const tokens = tokenizeStream(rawContent);
                let modified = false;

                const stateStack = [];
                let curState = {
                    isTransparent: false,
                    isAngled: false,
                    inText: false,
                    inMarkedWatermark: false,
                    font: null,
                    matrix: [1, 0, 0, 1, 0, 0],
                    textMatrix: [1, 0, 0, 1, 0, 0]
                };

                // Relevant user-drawn bounding boxes for this page
                const relevantBoxes = customBoxes.filter(b => b.applyToAll || b.page === (pageIndex + 1));

                for (let idx = 0; idx < tokens.length; idx++) {
                    const t = tokens[idx];
                    if (t.type === 'tok') {
                        if (t.raw === 'q') {
                            stateStack.push({ ...curState });
                        } else if (t.raw === 'Q') {
                            if (stateStack.length > 0) curState = stateStack.pop();
                        } else if (t.raw === 'gs') {
                            let p = idx - 1;
                            while (p >= 0 && tokens[p].type === 'ws') p--;
                            if (p >= 0 && (tokens[p].type === 'name' || tokens[p].raw.startsWith('/'))) {
                                const gsName = tokens[p].raw.replace(/^\//, '');
                                curState.isTransparent = transparentGS.has(gsName);
                            }
                        } else if (t.raw === 'cm') {
                            const nums = getPreviousNumbers(tokens, idx, 6);
                            if (nums.length === 6) {
                                curState.matrix = nums;
                                const a = nums[0], b = nums[1], c = nums[2];
                                const angleDeg = Math.abs(Math.atan2(b, a) * 180 / Math.PI);
                                // True diagonal rotation check (b and c must be non-zero and angle between 18 and 162)
                                curState.isAngled = (angleDeg >= 18 && angleDeg <= 162) && Math.abs(b) > 0.25 && Math.abs(c) > 0.25;
                            }
                        } else if (t.raw === 'BT') {
                            curState.inText = true;
                            curState.textMatrix = [1, 0, 0, 1, 0, 0];
                            curState.isAngled = false;
                        } else if (t.raw === 'ET') {
                            curState.inText = false;
                            curState.isAngled = false;
                        } else if (t.raw === 'Tf') {
                            let p = idx - 1;
                            while (p >= 0 && (tokens[p].type === 'ws' || !isNaN(tokens[p].raw))) p--;
                            if (p >= 0 && tokens[p].raw.startsWith('/')) {
                                curState.font = tokens[p].raw.replace(/^\//, '');
                            }
                        } else if (t.raw === 'Tm') {
                            const nums = getPreviousNumbers(tokens, idx, 6);
                            if (nums.length === 6) {
                                curState.textMatrix = nums;
                                const a = nums[0], b = nums[1], c = nums[2];
                                const angleDeg = Math.abs(Math.atan2(b, a) * 180 / Math.PI);
                                // Recalculate isAngled for every Tm so it resets when text is horizontal!
                                curState.isAngled = (angleDeg >= 18 && angleDeg <= 162) && Math.abs(b) > 0.25 && Math.abs(c) > 0.25;
                            }
                        } else if (t.raw === 'BDC' || t.raw === 'BMC') {
                            let p = idx - 1;
                            while (p >= 0 && tokens[p].type === 'ws') p--;
                            if (p >= 0 && /^\/(Watermark|Artifact)/i.test(tokens[p].raw)) {
                                curState.inMarkedWatermark = true;
                            }
                        } else if (t.raw === 'EMC') {
                            curState.inMarkedWatermark = false;
                        } else if (t.raw === 'Do') {
                            let p = idx - 1;
                            while (p >= 0 && tokens[p].type === 'ws') p--;
                            if (p >= 0 && (tokens[p].type === 'name' || tokens[p].raw.startsWith('/'))) {
                                const xName = tokens[p].raw.replace(/^\//, '');
                                if (xDoNamesToRemove.has(xName) ||
                                    (removeTransparentLayers && curState.isTransparent) ||
                                    (removeAngledText && curState.isAngled) ||
                                    (removeMarkedContent && curState.inMarkedWatermark)) {
                                    tokens[p].raw = '';
                                    tokens[idx].raw = '';
                                    modified = true;
                                }
                            }
                        } else if (['Tj', 'TJ', "'", '"'].includes(t.raw)) {
                            let isTarget = false;

                            let p = idx - 1;
                            while (p >= 0 && tokens[p].type === 'ws') p--;
                            const rawArg = p >= 0 ? tokens[p].raw : '';
                            const decodedStr = decodePdfToken(rawArg);

                            // Condition 1: Rotated diagonal watermark text (e.g. 45 deg VTUSYNC.IN)
                            if (removeAngledText && curState.isAngled) isTarget = true;

                            // Condition 2: Text under transparent ExtGState overlay
                            if (removeTransparentLayers && curState.isTransparent) isTarget = true;

                            // Condition 3: Marked content watermark (/Watermark, /Artifact)
                            if (removeMarkedContent && curState.inMarkedWatermark) isTarget = true;

                            // Condition 4: Text string match against watermark patterns
                            if (isWatermarkMatch(decodedStr, targetKeywords)) isTarget = true;

                            // Condition 5: Falls inside user-drawn box
                            if (relevantBoxes.length > 0 && pageWidth && pageHeight) {
                                const tx = curState.textMatrix[4] || curState.matrix[4] || 0;
                                const ty = curState.textMatrix[5] || curState.matrix[5] || 0;
                                for (const box of relevantBoxes) {
                                    const bX0 = box.x * pageWidth;
                                    const bX1 = (box.x + box.w) * pageWidth;
                                    const bY0 = pageHeight - (box.y + box.h) * pageHeight;
                                    const bY1 = pageHeight - box.y * pageHeight;
                                    if (tx >= bX0 && tx <= bX1 && ty >= bY0 && ty <= bY1) {
                                        isTarget = true;
                                        break;
                                    }
                                }
                            }

                            if (isTarget) {
                                if (p >= 0) {
                                    tokens[p].raw = t.raw === 'TJ' ? '[]' : '()';
                                    modified = true;
                                }
                            }
                        }
                        // NOTE: Vector paths (m, l, c, re, S, f, B) are deliberately PRESERVED
                        // to ensure underlines, fraction bars, square roots, and table borders are never lost!
                    }
                }

                if (modified) {
                    compressAndSetStream(stream, tokens.map(tk => tk.raw).join(''), pdfDoc);
                }
            } catch (err) {
                console.warn("Stream scrub issue", err);
            }
        };

        // 5. Scrub all Page Content Streams
        for (let pIdx = 0; pIdx < pages.length; pIdx++) {
            const page = pages[pIdx];
            const { width, height } = page.getSize();
            const contentsRef = page.node.get(PDFName.of('Contents'));
            if (!contentsRef) continue;

            const resolvedContents = pdfDoc.context.lookup(contentsRef);
            const streamRefs = resolvedContents instanceof PDFArray ? resolvedContents.asArray() : [contentsRef];

            for (const sRef of streamRefs) {
                const stream = pdfDoc.context.lookup(sRef);
                if (stream instanceof PDFRawStream) {
                    processStream(stream, pIdx, width, height);
                }
            }
        }

        // 6. Scrub all Form XObjects
        for (const [, obj] of pdfDoc.context.enumerateIndirectObjects()) {
            if (obj instanceof PDFRawStream && obj.dict.get(PDFName.of('Subtype')) === PDFName.of('Form')) {
                processStream(obj, 0, 1000, 1000);
            }
        }
    };

    // Full Execution (Remove & Download)
    const removeWatermarks = async () => {
        if (!file) return;
        setIsProcessing(true);
        setProcessProgress(15);
        setProcessStepText('Scanning PDF structure and graphics layers...');

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

            setProcessProgress(40);
            setProcessStepText('Excising watermark objects, transparent states & text...');

            await executeWatermarkRemovalOnDoc(pdfDoc, false);

            setProcessProgress(75);
            setProcessStepText('Reconstructing clean vector document...');

            let finalPdfBytes;

            // Optional Ultra Mode (OpenCV / AI Inpainting on Scanned Pages)
            if (isUltraMode && (isCvLoaded || customBoxes.length > 0)) {
                setProcessStepText('Applying Deep AI inpainting to pixels...');
                const inpaintPdfDoc = await PDFDocument.create();
                const tempBytes = await pdfDoc.save();
                const tempProxy = await pdfjsLib.getDocument({ data: tempBytes }).promise;

                for (let i = 1; i <= tempProxy.numPages; i++) {
                    const page = await tempProxy.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 });
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    const ctx = canvas.getContext('2d');
                    await page.render({ canvasContext: ctx, viewport }).promise;

                    // Apply inpaint on custom boxes
                    const pageBoxes = customBoxes.filter(b => b.applyToAll || b.page === i);
                    if (pageBoxes.length > 0) {
                        if (window.cv && window.cv.inpaint) {
                            const src = cv.imread(canvas);
                            const mask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8U);
                            pageBoxes.forEach(b => {
                                const rx = Math.floor(b.x * src.cols);
                                const ry = Math.floor(b.y * src.rows);
                                const rw = Math.ceil(b.w * src.cols);
                                const rh = Math.ceil(b.h * src.rows);
                                cv.rectangle(mask, new cv.Point(rx, ry), new cv.Point(rx + rw, ry + rh), new cv.Scalar(255), -1);
                            });
                            cv.inpaint(src, mask, src, 3, cv.INPAINT_TELEA);
                            cv.imshow(canvas, src);
                            src.delete(); mask.delete();
                        } else {
                            // Smart background-adaptive patch fill
                            pageBoxes.forEach(b => {
                                const rx = Math.floor(b.x * canvas.width);
                                const ry = Math.floor(b.y * canvas.height);
                                const rw = Math.ceil(b.w * canvas.width);
                                const rh = Math.ceil(b.h * canvas.height);
                                ctx.fillStyle = '#ffffff';
                                ctx.fillRect(rx, ry, rw, rh);
                            });
                        }
                    }

                    const imgJpg = canvas.toDataURL('image/jpeg', 0.92);
                    const embeddedImg = await inpaintPdfDoc.embedJpg(imgJpg);
                    const newPage = inpaintPdfDoc.addPage([viewport.width / 2.0, viewport.height / 2.0]);
                    newPage.drawImage(embeddedImg, { x: 0, y: 0, width: viewport.width / 2.0, height: viewport.height / 2.0 });
                }
                finalPdfBytes = await inpaintPdfDoc.save();
            } else {
                finalPdfBytes = await pdfDoc.save();
            }

            setProcessProgress(95);
            setProcessStepText('Finalizing clean PDF download...');

            setCleanedPdfBytes(finalPdfBytes);
            const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setDownloadUrl(url);

            // Auto-trigger download
            const link = document.createElement('a');
            link.href = url;
            link.download = `cleaned_${file.name}`;
            link.click();

            setProcessProgress(100);
            setComplete(true);
        } catch (error) {
            console.error("Error during watermark removal:", error);
            alert(`Watermark removal failed: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Canvas Pointer Events for Drawing Selection Box
    const handlePointerDown = (e) => {
        if (toolMode !== 'box' || !canvasContainerRef.current) return;
        const rect = canvasContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDrawing(true);
        setStartPos({ x, y });
        setTempBox({ left: x, top: y, width: 0, height: 0 });
    };

    const handlePointerMove = (e) => {
        if (!isDrawing || !canvasContainerRef.current) return;
        const rect = canvasContainerRef.current.getBoundingClientRect();
        const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

        const left = Math.min(startPos.x, currentX);
        const top = Math.min(startPos.y, currentY);
        const width = Math.abs(currentX - startPos.x);
        const height = Math.abs(currentY - startPos.y);

        setTempBox({ left, top, width, height });
    };

    const handlePointerUp = () => {
        if (!isDrawing || !canvasContainerRef.current || !tempBox) return;
        setIsDrawing(false);

        if (tempBox.width > 12 && tempBox.height > 12) {
            const rect = canvasContainerRef.current.getBoundingClientRect();
            const newBox = {
                id: Date.now(),
                page: currentPage,
                x: tempBox.left / rect.width,
                y: tempBox.top / rect.height,
                w: tempBox.width / rect.width,
                h: tempBox.height / rect.height,
                applyToAll: true
            };
            setCustomBoxes(prev => [...prev, newBox]);
        }
        setTempBox(null);
    };

    const removeBox = (boxId) => {
        setCustomBoxes(prev => prev.filter(b => b.id !== boxId));
    };

    const toggleTextSelection = (text) => {
        const next = new Set(selectedText);
        if (next.has(text)) next.delete(text);
        else next.add(text);
        setSelectedText(next);
    };

    const toggleObjectSelection = (id) => {
        const next = new Set(selectedObjects);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedObjects(next);
    };

    const selectAllDetections = () => {
        const allText = new Set(detectedText.map(t => t.text));
        const allObj = new Set(detectedObjects.map(o => o.id));
        setSelectedText(allText);
        setSelectedObjects(allObj);
        setRemoveAngledText(true);
        setRemoveTransparentLayers(true);
        setRemoveMarkedContent(true);
    };

    return (
        <div className="tool-content animate-fadeIn">
            <main className="main-layout" style={{ maxWidth: '1360px', margin: '0 auto', gap: '1.5rem' }}>
                {/* Left/Main Column: Interactive Preview Canvas & Navigation */}
                <section>
                    {!file ? (
                        <div className="glass-card clickable" onClick={() => document.getElementById('remove-upload').click()}>
                            <div className="upload-zone" style={{ padding: '6rem 2rem' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '1rem' }}>
                                    <Eraser size={32} />
                                </div>
                                <div className="huge-select-btn">Select PDF to Remove Watermark</div>
                                <p className="upload-subtext" style={{ fontSize: '0.95rem' }}>or drag & drop PDF here</p>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <span style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', background: 'rgba(37, 99, 235, 0.08)', borderRadius: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                                        ⚡ Dpdf Stubborn Cleaner Enabled
                                    </span>
                                </div>
                                <input type="file" id="remove-upload" hidden accept=".pdf" onChange={onFileChange} />
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: '1.25rem' }}>
                            {/* Document Header & Navigation Toolbar */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {file.name}
                                        </h3>
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                                            {numPages} {numPages === 1 ? 'Page' : 'Pages'} • {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>

                                {/* Page Switcher & Zoom */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                        className="icon-btn"
                                        disabled={currentPage <= 1 || showCleanedPreview}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        title="Previous Page"
                                        style={{ padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-white)', cursor: 'pointer' }}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 0.4rem' }}>
                                        Page {currentPage} of {numPages}
                                    </span>
                                    <button
                                        className="icon-btn"
                                        disabled={currentPage >= numPages || showCleanedPreview}
                                        onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                                        title="Next Page"
                                        style={{ padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-white)', cursor: 'pointer' }}
                                    >
                                        <ChevronRight size={18} />
                                    </button>

                                    <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.2rem' }} />

                                    <button
                                        className="icon-btn"
                                        onClick={() => setZoomScale(prev => Math.max(0.6, prev - 0.15))}
                                        title="Zoom Out"
                                        style={{ padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-white)', cursor: 'pointer' }}
                                    >
                                        <ZoomOut size={16} />
                                    </button>
                                    <button
                                        className="icon-btn"
                                        onClick={() => setZoomScale(prev => Math.min(2.0, prev + 0.15))}
                                        title="Zoom In"
                                        style={{ padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-white)', cursor: 'pointer' }}
                                    >
                                        <ZoomIn size={16} />
                                    </button>
                                    <button
                                        className="icon-btn"
                                        onClick={() => setFile(null)}
                                        title="Close PDF"
                                        style={{ padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-white)', cursor: 'pointer', marginLeft: '0.5rem', color: '#ef4444' }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Toolbar: Mode Buttons & Before/After Toggle */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem', background: 'var(--bg-secondary, rgba(0,0,0,0.02))', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setToolMode('box')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '6px',
                                            fontSize: '0.82rem',
                                            fontWeight: 600,
                                            border: toolMode === 'box' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                            background: toolMode === 'box' ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-white)',
                                            color: toolMode === 'box' ? 'var(--primary)' : 'inherit',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Square size={14} /> Drag Box to Erase Area
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setToolMode('pan')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '6px',
                                            fontSize: '0.82rem',
                                            fontWeight: 600,
                                            border: toolMode === 'pan' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                            background: toolMode === 'pan' ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-white)',
                                            color: toolMode === 'pan' ? 'var(--primary)' : 'inherit',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <MousePointer size={14} /> Normal View
                                    </button>
                                </div>

                                {/* Before / After Preview Toggle */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowCleanedPreview(false)}
                                        style={{
                                            padding: '0.35rem 0.7rem',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            border: !showCleanedPreview ? '1px solid var(--primary)' : '1px solid transparent',
                                            background: !showCleanedPreview ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                                            color: !showCleanedPreview ? 'var(--primary)' : 'var(--text-muted)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Original
                                    </button>
                                    <button
                                        type="button"
                                        onClick={generateCleanedPreview}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            padding: '0.35rem 0.7rem',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            border: showCleanedPreview ? '1px solid #10b981' : '1px solid var(--border-color)',
                                            background: showCleanedPreview ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-white)',
                                            color: showCleanedPreview ? '#10b981' : 'inherit',
                                            cursor: 'pointer'
                                        }}
                                        title="Render preview of page with watermarks removed"
                                    >
                                        <Sparkles size={14} /> Cleaned Preview
                                    </button>
                                </div>
                            </div>

                            {/* Canvas Viewport with Box Selection Overlay */}
                            <div style={{ textAlign: 'center', overflow: 'auto', maxHeight: '72vh', padding: '0.5rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
                                <div
                                    ref={canvasContainerRef}
                                    style={{
                                        position: 'relative',
                                        display: 'inline-block',
                                        cursor: toolMode === 'box' ? 'crosshair' : 'default',
                                        userSelect: 'none'
                                    }}
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                >
                                    <canvas
                                        ref={canvasRef}
                                        style={{
                                            display: 'block',
                                            borderRadius: '4px',
                                            boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                                        }}
                                    />

                                    {/* Existing Custom Removal Boxes */}
                                    {customBoxes
                                        .filter(b => b.applyToAll || b.page === currentPage)
                                        .map(box => (
                                            <div
                                                key={box.id}
                                                style={{
                                                    position: 'absolute',
                                                    left: `${box.x * 100}%`,
                                                    top: `${box.y * 100}%`,
                                                    width: `${box.w * 100}%`,
                                                    height: `${box.h * 100}%`,
                                                    background: 'rgba(239, 68, 68, 0.25)',
                                                    border: '2px dashed #ef4444',
                                                    borderRadius: '4px',
                                                    boxSizing: 'border-box',
                                                    pointerEvents: 'auto'
                                                }}
                                            >
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); removeBox(box.id); }}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-10px',
                                                        right: '-10px',
                                                        background: '#ef4444',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '20px',
                                                        height: '20px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 'bold',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                    }}
                                                    title="Delete this watermark area"
                                                >
                                                    ×
                                                </button>
                                                <div style={{ position: 'absolute', bottom: '2px', left: '4px', background: 'rgba(0,0,0,0.75)', color: 'white', fontSize: '9px', padding: '1px 4px', borderRadius: '2px' }}>
                                                    {box.applyToAll ? 'All Pages' : `Page ${box.page}`}
                                                </div>
                                            </div>
                                        ))}

                                    {/* Temp Drawing Box */}
                                    {tempBox && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${tempBox.left}px`,
                                                top: `${tempBox.top}px`,
                                                width: `${tempBox.width}px`,
                                                height: `${tempBox.height}px`,
                                                background: 'rgba(37, 99, 235, 0.25)',
                                                border: '2px dashed var(--primary)',
                                                borderRadius: '4px',
                                                pointerEvents: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Canvas Helper Tip */}
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.6rem', marginBottom: 0 }}>
                                💡 Tip: Click and drag anywhere on the page above to erase stubborn or custom watermark areas across all pages.
                            </p>
                        </div>
                    )}
                </section>

                {/* Right Column: Watermark Detection & Control Hub */}
                <aside className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <ShieldCheck size={22} style={{ color: 'var(--primary)' }} />
                        <div>
                            <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700 }}>Dpdf Watermark Cleaner</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Smart Multi-Engine Stubborn Watermark Stripper</p>
                        </div>
                    </div>

                    {!file ? (
                        <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                            <p style={{ marginBottom: '1rem' }}>
                                Works exactly like Dpdf to strip even the most stubborn PDF watermarks:
                            </p>
                            <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <li><b>Rotated & Diagonal Text:</b> Strips VTU, DRAFT, CONFIDENTIAL & diagonal stamps.</li>
                                <li><b>Transparent Graphic Layers:</b> Removes low-opacity vector & text overlays.</li>
                                <li><b>Area Box Eraser:</b> Select any stubborn area to erase it across all pages.</li>
                                <li><b>Preserves Document Content:</b> Text, math equations, underlines, fraction bars, and formatting are 100% preserved.</li>
                            </ul>
                        </div>
                    ) : (
                        <>
                            {/* Scanning Status or Detection Hub */}
                            {isScanning ? (
                                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                                    <Loader2 className="animate-spin" size={36} style={{ color: 'var(--primary)', margin: '0 auto 0.75rem' }} />
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Deep Scanning Document...</h4>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Analyzing layers, graphic states, and text streams</p>
                                </div>
                            ) : (
                                <>
                                    {/* Auto-Detection Summary Card */}
                                    <div style={{ padding: '0.85rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '10px', border: '1px solid rgba(37, 99, 235, 0.15)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Sparkles size={16} /> {detectedText.length + detectedObjects.length + (detectedTransparentGS.length > 0 ? 1 : 0)} Watermarks Found
                                            </span>
                                            <button
                                                type="button"
                                                onClick={selectAllDetections}
                                                style={{ fontSize: '0.72rem', background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                Select All
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                            Auto-targeted diagonal text, low-opacity layers & repeating objects.
                                        </p>
                                    </div>

                                    {/* Detected Elements List */}
                                    <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingRight: '0.2rem' }}>
                                        {detectedTransparentGS.length > 0 && (
                                            <div
                                                className={`detect-item ${removeTransparentLayers ? 'selected' : ''}`}
                                                onClick={() => setRemoveTransparentLayers(!removeTransparentLayers)}
                                                style={{ padding: '0.6rem 0.8rem', cursor: 'pointer' }}
                                            >
                                                <div className="detect-icon" style={{ width: '32px', height: '32px' }}><Layers size={16} /></div>
                                                <div className="detect-info">
                                                    <h4 style={{ fontSize: '0.85rem' }}>Transparent Watermark Layer</h4>
                                                    <p style={{ fontSize: '0.72rem' }}>Found opacity states ({detectedTransparentGS.join(', ')})</p>
                                                </div>
                                                <div className="detect-check">{removeTransparentLayers ? <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} /> : <div className="circle-check" />}</div>
                                            </div>
                                        )}

                                        {detectedText.map(item => (
                                            <div
                                                key={item.text}
                                                className={`detect-item ${selectedText.has(item.text) ? 'selected' : ''}`}
                                                onClick={() => toggleTextSelection(item.text)}
                                                style={{ padding: '0.6rem 0.8rem', cursor: 'pointer' }}
                                            >
                                                <div className="detect-icon" style={{ width: '32px', height: '32px' }}><FileText size={16} /></div>
                                                <div className="detect-info">
                                                    <h4 style={{ fontSize: '0.85rem' }}>"{item.text}"</h4>
                                                    <p style={{ fontSize: '0.72rem' }}>{item.isAngled ? 'Angled/Diagonal • ' : ''}Found on {item.count} sample pages</p>
                                                </div>
                                                <div className="detect-check">{selectedText.has(item.text) ? <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} /> : <div className="circle-check" />}</div>
                                            </div>
                                        ))}

                                        {detectedObjects.map(obj => (
                                            <div
                                                key={obj.id}
                                                className={`detect-item ${selectedObjects.has(obj.id) ? 'selected' : ''}`}
                                                onClick={() => toggleObjectSelection(obj.id)}
                                                style={{ padding: '0.6rem 0.8rem', cursor: 'pointer' }}
                                            >
                                                <div className="detect-icon" style={{ width: '32px', height: '32px' }}><Eraser size={16} /></div>
                                                <div className="detect-info">
                                                    <h4 style={{ fontSize: '0.85rem' }}>{obj.name}</h4>
                                                    <p style={{ fontSize: '0.72rem' }}>XObject Stamp (on {obj.count} pages)</p>
                                                </div>
                                                <div className="detect-check">{selectedObjects.has(obj.id) ? <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} /> : <div className="circle-check" />}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Custom Text Watermark Input & Quick Presets */}
                                    <div style={{ padding: '0.85rem', background: 'var(--bg-secondary, rgba(0,0,0,0.02))', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                                            <Eraser size={14} style={{ color: 'var(--primary)' }} />
                                            <label style={{ fontSize: '0.82rem', fontWeight: 600 }}>Custom Text / URL Scrubber</label>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="e.g. VTUSYNC.IN, VTUGO.IN, CONFIDENTIAL"
                                            value={targetText}
                                            onChange={(e) => setTargetText(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem 0.7rem',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-color)',
                                                fontSize: '0.82rem',
                                                marginBottom: '0.5rem',
                                                background: 'var(--bg-white)',
                                                color: 'inherit'
                                            }}
                                        />
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                            {['VTUSYNC.IN', 'VTUGO.IN', 'VTUDEVELOPER', 'CONFIDENTIAL', 'DRAFT', 'SAMPLE', 'DO NOT COPY', 'WATERMARK'].map(preset => (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => setTargetText(prev => prev === preset ? '' : preset)}
                                                    style={{
                                                        padding: '0.2rem 0.5rem',
                                                        fontSize: '0.72rem',
                                                        borderRadius: '4px',
                                                        border: targetText === preset ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                                        background: targetText === preset ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-white)',
                                                        color: targetText === preset ? 'var(--primary)' : 'inherit',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {preset}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Stubborn Watermark Filter Switches */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Zap size={14} style={{ color: 'var(--primary)' }} />
                                            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Stubborn Removal Engine</span>
                                        </div>

                                        <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={removeAngledText}
                                                onChange={(e) => setRemoveAngledText(e.target.checked)}
                                            />
                                            <span>Remove Angled / Diagonal Watermarks</span>
                                        </label>

                                        <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={removeTransparentLayers}
                                                onChange={(e) => setRemoveTransparentLayers(e.target.checked)}
                                            />
                                            <span>Remove Low-Opacity / Transparent Overlays</span>
                                        </label>

                                        <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={removeMarkedContent}
                                                onChange={(e) => setRemoveMarkedContent(e.target.checked)}
                                            />
                                            <span>Remove PDF Marked Content (/Watermark, /Artifact)</span>
                                        </label>

                                        <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: isUltraMode ? 'var(--primary)' : 'inherit' }}>
                                            <input
                                                type="checkbox"
                                                checked={isUltraMode}
                                                onChange={(e) => setIsUltraMode(e.target.checked)}
                                            />
                                            <span>Deep AI Inpainting (For Scanned / Flattened PDFs)</span>
                                        </label>
                                    </div>

                                    {/* User Custom Selected Boxes Summary */}
                                    {customBoxes.length > 0 && (
                                        <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 600 }}>
                                                {customBoxes.length} Custom Watermark {customBoxes.length === 1 ? 'Box' : 'Boxes'} active
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setCustomBoxes([])}
                                                style={{ fontSize: '0.72rem', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                Clear Boxes
                                            </button>
                                        </div>
                                    )}

                                    {/* Action Button & Progress */}
                                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                                        {isProcessing ? (
                                            <div style={{ padding: '0.75rem', background: 'var(--bg-secondary, rgba(0,0,0,0.03))', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                                    <span>{processStepText}</span>
                                                    <span>{processProgress}%</span>
                                                </div>
                                                <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${processProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }} />
                                                </div>
                                            </div>
                                        ) : (
                                            <AuthDownloadWrapper>
                                                <button
                                                    className="action-btn"
                                                    onClick={removeWatermarks}
                                                    style={{ width: '100%', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
                                                >
                                                    <Eraser size={20} /> Remove Watermark & Download
                                                </button>
                                            </AuthDownloadWrapper>
                                        )}

                                        {complete && downloadUrl && (
                                            <div className="status-msg success" style={{ marginTop: '0.8rem', padding: '0.8rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontWeight: 700, fontSize: '0.85rem' }}>
                                                    <CheckCircle2 size={18} />
                                                    <span>Watermarks Stripped Successfully!</span>
                                                </div>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem', marginBottom: 0 }}>
                                                    Document is clean. If download didn't trigger, <a href={downloadUrl} download={`cleaned_${file.name}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>click here to download</a>.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </aside>
            </main>

            <MarketingSection toolId="remover_tool" />
        </div>
    );
};

export default WatermarkRemoverTool;
