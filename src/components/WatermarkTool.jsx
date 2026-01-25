import React, { useState } from 'react';
import {
    FileUp,
    Settings,
    Download,
    Type,
    Image as ImageIcon,
    Loader2,
    FileText,
    X,
    CheckCircle2
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

const WatermarkTool = () => {
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [complete, setComplete] = useState(false);

    // Watermark Settings
    const [type, setType] = useState('text');
    const [text, setText] = useState('CONFIDENTIAL');
    const [image, setImage] = useState(null);
    const [position, setPosition] = useState('center');
    const [opacity, setOpacity] = useState(0.5);
    const [fontSize, setFontSize] = useState(50);
    const [color, setColor] = useState('#6366f1');
    const [rotation, setRotation] = useState(-45);

    const onFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setComplete(false);
        }
    };

    const onImageChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target.result);
            };
            reader.readAsArrayBuffer(selectedFile);
        }
    };

    const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return rgb(r, g, b);
    };

    const addWatermark = async () => {
        if (!file) return;
        setIsProcessing(true);

        try {
            const fileBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const pages = pdfDoc.getPages();

            let watermarkImage = null;
            if (type === 'image' && image) {
                try {
                    watermarkImage = await pdfDoc.embedPng(image);
                } catch (e) {
                    watermarkImage = await pdfDoc.embedJpg(image);
                }
            }

            for (const page of pages) {
                const { width, height } = page.getSize();
                if (type === 'text') {
                    const textWidth = font.widthOfTextAtSize(text, parseFloat(fontSize));
                    const textHeight = parseFloat(fontSize);
                    let x = 0, y = 0;

                    if (position === 'center' || position === 'diagonal') {
                        x = width / 2 - textWidth / 2;
                        y = height / 2 - textHeight / 2;
                    } else if (position === 'top-left') {
                        x = 50; y = height - textHeight - 50;
                    } else if (position === 'top-right') {
                        x = width - textWidth - 50; y = height - textHeight - 50;
                    } else if (position === 'bottom-left') {
                        x = 50; y = 50;
                    } else if (position === 'bottom-right') {
                        x = width - textWidth - 50; y = 50;
                    }

                    page.drawText(text, {
                        x, y,
                        size: parseFloat(fontSize),
                        font,
                        color: hexToRgb(color),
                        opacity: parseFloat(opacity),
                        rotate: degrees(position === 'diagonal' ? 45 : parseFloat(rotation)),
                    });
                } else if (type === 'image' && watermarkImage) {
                    const imgDims = watermarkImage.scale(parseFloat(fontSize) / 100);
                    let x = 0, y = 0;
                    if (position === 'center') {
                        x = width / 2 - imgDims.width / 2; y = height / 2 - imgDims.height / 2;
                    } else if (position === 'top-left') {
                        x = 50; y = height - imgDims.height - 50;
                    } else if (position === 'top-right') {
                        x = width - imgDims.width - 50; y = height - imgDims.height - 50;
                    } else if (position === 'bottom-left') {
                        x = 50; y = 50;
                    } else if (position === 'bottom-right') {
                        x = width - imgDims.width - 50; y = 50;
                    }
                    page.drawImage(watermarkImage, {
                        x, y,
                        width: imgDims.width,
                        height: imgDims.height,
                        opacity: parseFloat(opacity),
                        rotate: degrees(parseFloat(rotation)),
                    });
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `watermarked_${file.name}`;
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
                        <div className="glass-card clickable" onClick={() => document.getElementById('pdf-upload').click()}>
                            <div className="upload-zone">
                                <div className="icon-circle"><FileUp size={48} color="#818cf8" /></div>
                                <h3>Upload PDF to Watermark</h3>
                                <p>Click or drag & drop</p>
                                <input type="file" id="pdf-upload" hidden accept=".pdf" onChange={onFileChange} />
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
                                <FileText size={64} style={{ opacity: 0.2 }} />
                                <p>Watermark will be applied to all pages</p>
                            </div>
                            <button className="action-btn" onClick={addWatermark} disabled={isProcessing || (type === 'image' && !image)}>
                                {isProcessing ? <><Loader2 className="animate-spin" /> Processing...</> : <><Download size={20} /> Add Watermark & Download</>}
                            </button>
                            {complete && <div className="status-msg success"><CheckCircle2 size={16} /> Downloaded successfully!</div>}
                        </div>
                    )}
                </section>

                <aside className="glass-card">
                    <div className="aside-header">
                        <Settings size={20} color="#818cf8" />
                        <h3>Settings</h3>
                    </div>
                    <div className="controls-group">
                        <div className="control-item">
                            <label>Type</label>
                            <div className="toggle-group">
                                <button className={`toggle-btn ${type === 'text' ? 'active' : ''}`} onClick={() => setType('text')}><Type size={14} /> Text</button>
                                <button className={`toggle-btn ${type === 'image' ? 'active' : ''}`} onClick={() => setType('image')}><ImageIcon size={14} /> Image</button>
                            </div>
                        </div>
                        {type === 'text' ? (
                            <div className="control-item">
                                <label>Text</label>
                                <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
                            </div>
                        ) : (
                            <div className="control-item">
                                <label>Image</label>
                                <input type="file" accept="image/*" onChange={onImageChange} />
                            </div>
                        )}
                        <div className="control-item">
                            <label>Position</label>
                            <select value={position} onChange={(e) => setPosition(e.target.value)}>
                                <option value="center">Center</option><option value="diagonal">Diagonal</option>
                                <option value="top-left">Top Left</option><option value="top-right">Top Right</option>
                                <option value="bottom-left">Bottom Left</option><option value="bottom-right">Bottom Right</option>
                            </select>
                        </div>
                        <div className="control-item">
                            <div className="label-row"><label>Opacity</label><span>{Math.round(opacity * 100)}%</span></div>
                            <input type="range" min="0" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(e.target.value)} />
                        </div>
                        <div className="control-item">
                            <div className="label-row"><label>{type === 'text' ? 'Size' : 'Scale'}</label><span>{fontSize}</span></div>
                            <input type="range" min="10" max="200" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
                        </div>
                        {type === 'text' && (
                            <div className="control-item">
                                <label>Color</label>
                                <div className="color-row"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} /><code>{color.toUpperCase()}</code></div>
                            </div>
                        )}
                        <div className="control-item">
                            <div className="label-row"><label>Rotation</label><span>{rotation}°</span></div>
                            <input type="range" min="-180" max="180" value={rotation} onChange={(e) => setRotation(e.target.value)} />
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default WatermarkTool;
