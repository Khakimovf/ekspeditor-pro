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

    if (content.includes("'http://localhost:5000")) {
        content = content.replace(/'http:\/\/localhost:5000([^']*)'/g, "(import.meta.env.VITE_API_URL || 'http://localhost:5000') + '$1'");
        changed = true;
    }

    if (content.includes("`http://localhost:5000")) {
        content = content.replace(/`http:\/\/localhost:5000([^`]+)`/g, "`\\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`");
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(f, content);
        console.log('Updated ' + f);
    }
});
