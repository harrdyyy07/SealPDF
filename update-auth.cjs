const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Tool.jsx'));

for (let file of files) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Add import
    const componentName = file.split('.')[0];
    const importStatement = `import AuthDownloadWrapper from './AuthDownloadWrapper';\n\nconst ${componentName} = () => {`;
    if (!content.includes('import AuthDownloadWrapper')) {
        content = content.replace(`const ${componentName} = () => {`, importStatement);
    }

    // 2. Wrap the primary action element
    const elementsToWrap = [
        /(<button className="action-btn"[\s\S]*?<\/button>)/,
        /(<button className={`action-btn[\s\S]*?<\/button>)/,
        /(<a href=\{.*?\} download=\{.*?\} className="action-btn"[\s\S]*?<\/a>)/,
        /(<button className="export-action-btn"[\s\S]*?<\/button>)/
    ];

    if (!content.includes('<AuthDownloadWrapper') && !content.includes('<AuthDownloadWrapper>')) {
        for (let regex of elementsToWrap) {
            const match = content.match(regex);
            if (match) {
                let fallbackStyle = '';
                if (file === 'PageRemoverTool.jsx') fallbackStyle = ` buttonStyle={{ background: 'linear-gradient(to right, #ef4444, #f87171)' }}`;
                if (file === 'EditorTool.jsx') fallbackStyle = ` buttonClass="export-action-btn"`;
                
                content = content.replace(regex, `<AuthDownloadWrapper${fallbackStyle}>\n                                $1\n                            </AuthDownloadWrapper>`);
                break;
            }
        }
    }

    fs.writeFileSync(fullPath, content, 'utf8');
}
console.log('Update complete.');
