// bun scripts/render-interfaces.ts [path/to/posthole/viewer]
// Snapshot the real viewer using ONLY the already-curated public demo records.
// The generated public/demo files are self-contained; hosting needs no Bun server.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viewer = path.resolve(process.argv[2] || path.join(root, '../viewer'));
const { Card, Page, files } = await import(path.join(viewer, 'views.tsx'));
const { INTERFACES } = await import(path.join(viewer, 'interfaces.ts'));
const curated = JSON.parse(fs.readFileSync(path.join(root, 'data/posts.json'), 'utf8'));
const output = path.join(root, 'public/demo');
fs.mkdirSync(path.join(output, 'assets'), { recursive: true });
// Resolve media from this site's curated assets, never the private archive.
files.base = null;
function record(p) {
  return { ...p, kind: 'post', key: `${p.platform}:${p.id}`, title: null,
    author: { ...p.author, avatar_url: `../${p.author.avatar}`, avatar_file: null },
    media: p.media.map(m => ({ ...m, type: m.type || 'image', url: `../${m.src}`,
      file: null, thumbnail_file: null, thumbnail_url: m.poster ? `../${m.poster}` : null })),
    links: [], extra: {}, link_card: null, reply_to: null, quote_of: null,
  };
}
for (const view of Object.keys(INTERFACES).filter(id => id !== 'original')) {
  const cards = curated.map(p => {
    const post = record(p);
    return Card({ post, folder: '', key: post.key, saved: 0, view,
      quoted: p.parent ? { post: record(p.parent), folder: '' } : null });
  });
  let html = '<!doctype html>' + Page({ children: cards, counts: {}, total: cards.length,
    query: new URLSearchParams({ view }) }).toString();
  html = html.replaceAll('href="/icon.png"', 'href="../icon.png"')
    .replaceAll('src="/icon.png"', 'src="../icon.png"')
    .replaceAll('href="/style.css"', 'href="viewer.css"')
    .replaceAll('href="/interfaces.css"', 'href="interfaces.css"')
    .replaceAll('href="/netflix.css"', 'href="netflix.css"')
    .replace('src="/client.js"', 'src="demo.js"')
    .replace('</head>', '<link rel="stylesheet" href="demo.css"></head>');
  fs.writeFileSync(path.join(output, `${view}.html`), html);
}
for (const file of ['interfaces.css', 'netflix.css', 'interface-controls.js', 'card-interactions.js', 'netflix.js']) {
  fs.copyFileSync(path.join(viewer, file), path.join(output, file));
}
fs.copyFileSync(path.join(viewer, 'style.css'), path.join(output, 'viewer.css'));
for (const file of ['chirp-regular.woff2', 'chirp-bold.woff2']) {
  fs.copyFileSync(path.join(viewer, 'assets', file), path.join(output, 'assets', file));
}
fs.writeFileSync(path.join(root, 'public/interfaces.json'), JSON.stringify(INTERFACES));
console.log(`Rendered ${Object.keys(INTERFACES).length - 1} interfaces from ${curated.length} public posts.`);
