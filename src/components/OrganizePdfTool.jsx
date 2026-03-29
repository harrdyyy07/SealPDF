import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { RefreshCw, Download, FileUp, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';

const OrganizePdfTool = () => {
    const [file, setFile] = useState(null);
    const [pages, setPages] = useState([]); // [{ id, idx: original_index, deleted }]
    const [isOrganizing, setIsOrganizing] = useState(false);
    const [error, setError] = useState('');
    const [organizedPdfUrl, setOrganizedPdfUrl] = useState(null);

    const onFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const uploadedFile = e.target.files[0];
            setFile(uploadedFile);
            setOrganizedPdfUrl(null);
            setError('');
            
            try {
                const fileData = await uploadedFile.arrayBuffer();
                const doc = await PDFDocument.load(fileData);
                const count = doc.getPageCount();
                const initialPages = [];
                for(let i=0; i<count; i++) {
                     initialPages.push({ id: `page_${i}_${Date.now()}`, idx: i, deleted: false });
                }
                setPages(initialPages);
            } catch (err) {
                console.error(err);
                setError('Failed to load PDF to organize: ' + err.message);
                setFile(null);
            }
        }
    };

    const movePage = (index, direction) => {
        const newPages = [...pages];
        if (direction === -1 && index > 0) {
            [newPages[index-1], newPages[index]] = [newPages[index], newPages[index-1]];
        } else if (direction === 1 && index < newPages.length - 1) {
            [newPages[index+1], newPages[index]] = [newPages[index], newPages[index+1]];
        }
        setPages(newPages);
    };

    const toggleDelete = (index) => {
        const newPages = [...pages];
        newPages[index].deleted = !newPages[index].deleted;
        setPages(newPages);
    };

    const handleOrganize = async () => {
        const activePages = pages.filter(p => !p.deleted);
        if (activePages.length === 0) {
            setError('All pages are deleted. Please keep at least one page.');
            return;
        }

        try {
            setIsOrganizing(true);
            setError('');
            const fileData = await file.arrayBuffer();
            const sourceDoc = await PDFDocument.load(fileData);
            
            const newDoc = await PDFDocument.create();
            const indicesToCopy = activePages.map(p => p.idx);
            
            const copiedPages = await newDoc.copyPages(sourceDoc, indicesToCopy);
            copiedPages.forEach(p => newDoc.addPage(p));

            const newPdfBytes = await newDoc.save();
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            setOrganizedPdfUrl(URL.createObjectURL(blob));
        } catch (err) {
            console.error(err);
            setError('Failed to organize pages: ' + err.message);
        } finally {
            setIsOrganizing(false);
        }
    };

    return (
        <div className="main-layout single-col animate-fadeIn">
            <div className="glass-card">
                {!file ? (
                    <div className="upload-zone clickable" onClick={() => document.getElementById('pdf-upload-org').click()}>
                        <div className="huge-select-btn">Select PDF file</div>
                        <p className="upload-subtext" style={{ marginTop: '1rem' }}>or drop PDF here</p>
                        <input type="file" id="pdf-upload-org" hidden accept=".pdf" onChange={onFileChange} />
                    </div>
                ) : (
                    <div className="controls-group">
                        <div className="file-info-header">
                            <FileUp className="file-icon" />
                            <div className="file-details">
                                <p className="file-name">{file.name}</p>
                            </div>
                            <button className="icon-btn" onClick={() => { setFile(null); setPages([]); }}>✕</button>
                        </div>

                        {!organizedPdfUrl ? (
                            <>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Use arrows to reorder. Click trash to delete a page.</p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                                    {pages.map((p, index) => (
                                        <div key={p.id} style={{ 
                                            background: p.deleted ? '#fee2e2' : '#f8fafc',
                                            border: `1px solid ${p.deleted ? '#ef4444' : 'var(--border-color)'}`,
                                            borderRadius: '8px',
                                            padding: '1rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            opacity: p.deleted ? 0.6 : 1
                                        }}>
                                            <span style={{ fontWeight: 'bold' }}>{p.idx + 1}</span>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => movePage(index, -1)} disabled={index === 0 || p.deleted} className="icon-btn" style={{ padding: '0.2rem' }}><ArrowLeft size={16}/></button>
                                                <button onClick={() => toggleDelete(index)} className="icon-btn" style={{ padding: '0.2rem', color: p.deleted ? '#ef4444' : '' }}><Trash2 size={16}/></button>
                                                <button onClick={() => movePage(index, 1)} disabled={index === pages.length - 1 || p.deleted} className="icon-btn" style={{ padding: '0.2rem' }}><ArrowRight size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {error && <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>}

                                <button 
                                    className={`action-btn ${isOrganizing ? 'animate-pulse' : ''}`}
                                    onClick={handleOrganize}
                                    disabled={isOrganizing || pages.every(p => p.deleted)}
                                >
                                    <RefreshCw />
                                    {isOrganizing ? 'Organizing...' : 'Organize PDF'}
                                </button>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <RefreshCw size={48} color="#16a34a" style={{ marginBottom: '1rem' }} />
                                <h2>PDF Organized Successfully!</h2>
                                <a href={organizedPdfUrl} download={`organized_${file.name}`} className="action-btn" style={{ textDecoration: 'none' }}>
                                    <Download /> Download PDF
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizePdfTool;
