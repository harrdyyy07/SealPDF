import React, { useState } from 'react';
import {
    Image as ImageIcon,
    Download,
    Loader2,
    CheckCircle2,
    X,
    FilePlus
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

const ImageToPdfTool = () => {
    const [images, setImages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [complete, setComplete] = useState(false);

    const onImagesChange = (e) => {
        const selectedFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
        if (selectedFiles.length > 0) {
            setImages(prev => [...prev, ...selectedFiles]);
            setComplete(false);
        }
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const convertToPdf = async () => {
        if (images.length === 0) return;
        setIsProcessing(true);
        try {
            const pdfDoc = await PDFDocument.create();

            for (const imageFile of images) {
                const imgBuffer = await imageFile.arrayBuffer();
                let image;
                try {
                    if (imageFile.type === 'image/png') image = await pdfDoc.embedPng(imgBuffer);
                    else image = await pdfDoc.embedJpg(imgBuffer);
                } catch (e) {
                    // Fallback guess if type is missing or wrong
                    try { image = await pdfDoc.embedJpg(imgBuffer); }
                    catch { image = await pdfDoc.embedPng(imgBuffer); }
                }

                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `images_${new Date().getTime()}.pdf`;
            link.click();
            setComplete(true);
        } catch (error) {
            alert(`Error converting images: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="tool-content animate-fadeIn">
            <div className="main-layout single-col">
                <section className="glass-card">
                    <div className="tool-header">
                        <h3>Image to PDF</h3>
                        <p>Convert your photos and scanned images into a professional PDF</p>
                    </div>

                    <div className="merge-list">
                        {images.map((image, index) => (
                            <div key={index} className="merge-item glass-card secondary">
                                <ImageIcon className="file-icon" />
                                <div className="file-info">
                                    <span className="file-name">{image.name}</span>
                                    <span className="file-size">{(image.size / 1024).toFixed(1)} KB</span>
                                </div>
                                <div className="item-actions">
                                    <button onClick={() => removeImage(index)} className="delete-btn" title="Remove"><X size={16} /></button>
                                </div>
                            </div>
                        ))}

                        <label className="add-more-card clickable">
                            <FilePlus size={32} />
                            <span>Add Images</span>
                            <input type="file" multiple accept="image/*" hidden onChange={onImagesChange} />
                        </label>
                    </div>

                    {images.length > 0 && (
                        <button className="action-btn" onClick={convertToPdf} disabled={isProcessing}>
                            {isProcessing ? <><Loader2 className="animate-spin" /> Converting...</> : <><Download size={20} /> Convert & Download</>}
                        </button>
                    )}

                    {complete && <div className="status-msg success"><CheckCircle2 size={16} /> Images converted successfully!</div>}
                </section>
            </div>
        </div>
    );
};

export default ImageToPdfTool;
