import React, { useState, useCallback } from 'react';
import {
  FileUp,
  Settings,
  Download,
  Type,
  Image as ImageIcon,
  Maximize,
  RotateCw,
  CheckCircle2,
  Loader2,
  FileText,
  X
} from 'lucide-react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

function App() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [complete, setComplete] = useState(false);

  // Watermark Settings
  const [type, setType] = useState('text'); // 'text' | 'image'
  const [text, setText] = useState('CONFIDENTIAL');
  const [image, setImage] = useState(null);
  const [position, setPosition] = useState('center'); // 'center', 'diagonal', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
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
      console.log('Starting PDF processing...');
      const fileBuffer = await file.arrayBuffer();
      // Use ignoreEncryption to allow processing restricted PDFs (won't work for password-protected ones though)
      const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      console.log('PDF loaded successfully');

      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      console.log(`Processing ${pages.length} pages...`);

      let watermarkImage = null;
      if (type === 'image' && image) {
        console.log('Embedding image watermark...');
        try {
          watermarkImage = await pdfDoc.embedPng(image);
        } catch (e) {
          console.warn('Failed to embed as PNG, trying JPG...', e);
          watermarkImage = await pdfDoc.embedJpg(image);
        }
      }

      for (const page of pages) {
        const { width, height } = page.getSize();

        if (type === 'text') {
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          const textHeight = fontSize; // Approximation
          let x = 0;
          let y = 0;

          if (position === 'center' || position === 'diagonal') {
            x = width / 2 - textWidth / 2;
            y = height / 2 - textHeight / 2;
          } else if (position === 'top-left') {
            x = 50;
            y = height - textHeight - 50;
          } else if (position === 'top-right') {
            x = width - textWidth - 50;
            y = height - textHeight - 50;
          } else if (position === 'bottom-left') {
            x = 50;
            y = 50;
          } else if (position === 'bottom-right') {
            x = width - textWidth - 50;
            y = 50;
          }

          page.drawText(text, {
            x,
            y,
            size: parseFloat(fontSize),
            font,
            color: hexToRgb(color),
            opacity: parseFloat(opacity),
            rotate: degrees(position === 'diagonal' ? 45 : parseFloat(rotation)),
          });
        } else if (type === 'image' && watermarkImage) {
          const imgDims = watermarkImage.scale(parseFloat(fontSize) / 100);
          let x = 0;
          let y = 0;

          if (position === 'center') {
            x = width / 2 - imgDims.width / 2;
            y = height / 2 - imgDims.height / 2;
          } else if (position === 'top-left') {
            x = 50;
            y = height - imgDims.height - 50;
          } else if (position === 'top-right') {
            x = width - imgDims.width - 50;
            y = height - imgDims.height - 50;
          } else if (position === 'bottom-left') {
            x = 50;
            y = 50;
          } else if (position === 'bottom-right') {
            x = width - imgDims.width - 50;
            y = 50;
          }

          page.drawImage(watermarkImage, {
            x,
            y,
            width: imgDims.width,
            height: imgDims.height,
            opacity: parseFloat(opacity),
            rotate: degrees(parseFloat(rotation)),
          });
        }
      }

      console.log('Saving PDF...');
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `watermarked_${file.name}`;
      link.click();

      console.log('PDF processed and download triggered');
      setComplete(true);
    } catch (error) {
      console.error('Detailed Error processing PDF:', error);
      alert(`Error processing PDF: ${error.message}. Please check if the PDF is password-protected or corrupted.`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>PDF Watermark</h1>
        <p className="subtitle">Add premium watermarks to your documents instantly</p>
      </header>

      <main className="main-layout">
        <section>
          {!file ? (
            <div className="glass-card" onClick={() => document.getElementById('pdf-upload').click()}>
              <div className="upload-zone">
                <div style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%' }}>
                  <FileUp size={48} color="#818cf8" />
                </div>
                <div>
                  <h3>Click to upload or drag & drop</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Select the PDF you want to watermark</p>
                </div>
                <input
                  type="file"
                  id="pdf-upload"
                  hidden
                  accept=".pdf"
                  onChange={onFileChange}
                />
              </div>
            </div>
          ) : (
            <div className="glass-card">
              <div className="file-info">
                <FileText color="#818cf8" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600 }}>{file.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="preview-container">
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FileText size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>Preview rendering not supported in browser</p>
                  <p style={{ fontSize: '0.8rem' }}>Watermark will be applied to all pages</p>
                </div>
              </div>

              <button
                className="action-btn"
                onClick={addWatermark}
                disabled={isProcessing || (type === 'image' && !image)}
              >
                {isProcessing ? (
                  <><Loader2 className="animate-spin" /> Processing...</>
                ) : (
                  <><Download size={20} /> Add Watermark & Download</>
                )}
              </button>

              {complete && (
                <div style={{ marginTop: '1rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <CheckCircle2 size={16} /> Watermark Added Successfully!
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Settings size={20} color="#818cf8" />
            <h3 style={{ fontSize: '1.25rem' }}>Settings</h3>
          </div>

          <div className="controls-group">
            <div className="control-item">
              <label>Watermark Type</label>
              <div className="button-group">
                <button
                  className={`toggle-btn ${type === 'text' ? 'active' : ''}`}
                  onClick={() => setType('text')}
                >
                  <Type size={14} inline /> Text
                </button>
                <button
                  className={`toggle-btn ${type === 'image' ? 'active' : ''}`}
                  onClick={() => setType('image')}
                >
                  <ImageIcon size={14} inline /> Image
                </button>
              </div>
            </div>

            {type === 'text' ? (
              <div className="control-item">
                <label>Watermark Text</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter watermark text..."
                />
              </div>
            ) : (
              <div className="control-item">
                <label>Watermark Image</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={onImageChange}
                />
                {image && <p style={{ fontSize: '0.7rem', color: '#4ade80' }}>Image loaded</p>}
              </div>
            )}

            <div className="control-item">
              <label>Position</label>
              <select value={position} onChange={(e) => setPosition(e.target.value)}>
                <option value="center">Center</option>
                <option value="diagonal">Diagonal</option>
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>

            <div className="control-item">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label>Opacity</label>
                <span style={{ fontSize: '0.75rem' }}>{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                className="range-input"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => setOpacity(e.target.value)}
              />
            </div>

            <div className="control-item">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label>{type === 'text' ? 'Font Size' : 'Scale'}</label>
                <span style={{ fontSize: '0.75rem' }}>{fontSize}px</span>
              </div>
              <input
                type="range"
                className="range-input"
                min="10"
                max="200"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
              />
            </div>

            {type === 'text' && (
              <div className="control-item">
                <label>Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                  <code style={{ fontSize: '0.8rem' }}>{color.toUpperCase()}</code>
                </div>
              </div>
            )}

            <div className="control-item">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label>Rotation</label>
                <span style={{ fontSize: '0.75rem' }}>{rotation}°</span>
              </div>
              <input
                type="range"
                className="range-input"
                min="-180"
                max="180"
                value={rotation}
                onChange={(e) => setRotation(e.target.value)}
              />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
