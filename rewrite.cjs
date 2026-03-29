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
                                <div className="huge-select-btn">Select PDF file</div>
                                <p className="upload-subtext">or drop PDF here</p>
                                <input type="file" id="${id}"${rest}>
                            </div>`;
    });

    // 2. Replace the upload zone contents for Merger
    if (file === 'MergerTool.jsx') {
        const mergerUploadRegex = /<label className="add-more-card clickable">[\s\S]*?<input type="file"([^>]+hidden[^>]+)>[\s\S]*?<\/label>/;
        content = content.replace(mergerUploadRegex, `<label className="upload-zone clickable" style={{ padding: '3rem 2rem', marginTop: '1rem', border: '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div className="huge-select-btn" style={{ pointerEvents: 'none', backgroundColor: '#333', color: 'white' }}>+ Add more files</div>
                            <input type="file"$1>
                        </label>`);
    }

    // 3. Remove all color="#818cf8"
    content = content.replace(/color="#818cf8"/g, '');

    fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Successfully rewrote upload zones in all Tool files.');
