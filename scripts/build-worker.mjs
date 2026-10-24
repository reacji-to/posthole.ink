import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const {commit:sourceCommit} = JSON.parse(fs.readFileSync(path.join(root, '.openai/asset-source.json'), 'utf8'));
if (!/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error('Invalid asset source commit.');
// Binary URLs must reference a committed snapshot containing these same assets.
const changed = execFileSync('git', ['status','--porcelain','--','public'], {cwd:root, encoding:'utf8'});
if (changed.trim()) throw new Error('Commit public/ before building the protected worker.');
execFileSync('git', ['diff','--exit-code',sourceCommit,'--','public'], {cwd:root, stdio:'pipe'});
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.json':'application/json','.txt':'text/plain; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4',
  '.woff2':'font/woff2','.zip':'application/zip'};
const assets = {};
function collect(directory, relative = '') {
  for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
    const name = path.posix.join(relative, entry.name);
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(filename, name);
    else if (entry.isFile()) {
      const extension = path.extname(name);
      assets['/' + name] = {type:types[extension] || 'application/octet-stream'};
      if (['.html','.css','.js','.json','.txt'].includes(extension)) assets['/' + name].text = fs.readFileSync(filename, 'utf8');
    } else throw new Error(`Unsupported asset: ${name}`);
  }
}
collect(path.join(root, 'public'));
const output = path.join(root, 'dist');
fs.rmSync(output, {recursive:true, force:true});
fs.mkdirSync(path.join(output, 'server'), {recursive:true});
fs.mkdirSync(path.join(output, '.openai'), {recursive:true});
const source = fs.readFileSync(path.join(root, 'worker/auth.js'), 'utf8');
fs.writeFileSync(path.join(output, 'server/index.js'), `${source}\nexport default createHandler(${JSON.stringify(assets)}, ${JSON.stringify(sourceCommit)});\n`);
fs.copyFileSync(path.join(root, '.openai/hosting.json'), path.join(output, '.openai/hosting.json'));
console.log(`Built a protected Worker for ${Object.keys(assets).length} assets from ${sourceCommit}.`);
