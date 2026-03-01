import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
        }
    });
    return results;
}

const files = walk('d:/ekspeditor/frontend/src');
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;

    // Replace the fallback from 'http://localhost:5000' to ''
    let newContent = content.replace(/\(import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000'\)/g, "(import.meta.env.VITE_API_URL || '')");
    newContent = newContent.replace(/\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000'\}/g, "${import.meta.env.VITE_API_URL || ''}");

    if (content !== newContent) {
        fs.writeFileSync(f, newContent);
        console.log('Updated ' + f);
    }
});
