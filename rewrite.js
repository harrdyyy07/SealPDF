const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Tool.jsx'));

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Replace the upload zone contents for standard tools
    const uploadZoneRegex = /<div className="upload-zone">[\s\S]*?<input type="file" id="([^"]+)"([^>]*)>[\s\S]*?<\/div>/g;
    content = content.replace(uploadZoneRegex, (match, id, rest) => {
        return `<div className="upload-zone">
                                <div className="huge-select-btn">Select PDF files</div>
                                <p className="upload-subtext">or drop PDFs here</p>
                                <input type="file" id="${id}"${rest}>
                            </div>`;
    });

    // 2. Remove all color="#818cf8"
    content = content.replace(/color="#818cf8"/g, '');

    // 3. Update Merger files specifically
    if (file === 'MergerTool.jsx') {
        const mergerUploadRegex = /<label className="add-more-card clickable">[\s\S]*?<input type="file"([^>]+hidden[^>]+)>[\s\S]*?<\/label>/;
        content = content.replace(mergerUploadRegex, `<label className="upload-zone clickable" style={{ padding: '4rem 2rem', marginTop: '1rem', border: '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="huge-select-btn" style={{ pointerEvents: 'none' }}>Select more PDF files</div>
                            <p className="upload-subtext">or drop PDFs here</p>
                            <input type="file"$1>
                        </label>`);
    }
    
    // 4. Update Editor files specifically
    if (file === 'EditorTool.jsx') {
        const editorUploadRegex = /<div className="workspace-upload-zone"([^>]*)>[\s\S]*?<input type="file" id="([^"]+)"([^>]*)>[\s\S]*?<\/div>/;
        content = content.replace(editorUploadRegex, `<div className="workspace-upload-zone"$1>
                            <div className="huge-select-btn">Select PDF file</div>
                            <p className="upload-subtext" style={{marginTop:'1rem'}}>to edit and annotate</p>
                            <input type="file" id="$2"$3>
                        </div>`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Successfully rewrote upload zones in all Tool files.');
