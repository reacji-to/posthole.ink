// Render only the explicitly curated public posts; no access to the source archive.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const posts = JSON.parse(fs.readFileSync(path.join(root, 'data/posts.json'), 'utf8'));
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function text(value) {
  return value.split(/(https?:\/\/[^\s]+)/g).map(part => /^https?:\/\//.test(part)
    ? `<a href="${escape(part)}" target="_blank" rel="noopener noreferrer">${escape(part.replace(/^https?:\/\//, ''))}</a>`
    : escape(part).replace(/@Wattenberger/g, '<a href="https://x.com/Wattenberger" target="_blank" rel="noopener noreferrer">@Wattenberger</a>')).join('');
}
const paragraphs = value => value.split('\n\n').map(p=>`<p>${text(p).replace(/\n/g,'<br>')}</p>`).join('');
const date = value => new Date(value).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
const media = post => post.media.map(m=>`<a class="saved-media" href="${escape(m.src)}" target="_blank" rel="noopener noreferrer"><img src="${escape(m.src)}" width="${m.width}" height="${m.height}" alt="${escape(m.alt)}" loading="lazy"></a>`).join('');
const xMark='<svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
function author(p){return `<div class="post-author"><a href="${escape(p.author.url)}" target="_blank" rel="noopener noreferrer"><img src="${escape(p.author.avatar)}" alt="" class="avatar"></a><div><a class="author-link" href="${escape(p.author.url)}" target="_blank" rel="noopener noreferrer"><strong>${escape(p.author.name)}</strong></a><span>${p.platform==='x'?'@'+escape(p.author.handle)+' · ':''}<a href="${escape(p.url)}" target="_blank" rel="noopener noreferrer"><time datetime="${escape(p.created_at)}">${date(p.created_at)}</time></a></span></div>${p.platform==='x'?`<span class="source-mark" aria-label="X">${xMark}</span>`:'<span class="linkedin-mark" aria-label="LinkedIn">in</span>'}</div>`;}
const cards = posts.map(p=>{
  const parts=p.text.split('\n\n');
  const copy=p.text.length>360?`${paragraphs(parts.slice(0,3).join('\n\n'))}<details class="post-more" data-expand="Show more" data-close="Show less"><summary>Show more</summary>${paragraphs(parts.slice(3).join('\n\n'))}</details>`:paragraphs(p.text);
  const parent=p.parent?`<details class="replies" data-expand="View earlier post in this thread" data-close="Hide earlier post"><summary>View earlier post in this thread</summary><div class="thread-parent">${author(p.parent)}${paragraphs(p.parent.text)}${media(p.parent)}<a class="source-link" href="${escape(p.parent.url)}" target="_blank" rel="noopener noreferrer">View original post ↗</a></div></details>`:'';
  return `<article class="sample-card ${p.platform==='linkedin'?'linkedin':''}" data-platform="${p.platform}">${author(p)}<div class="saved-copy">${copy}</div>${media(p)}<div class="saved-meta"><span>${p.metrics.likes!=null?`${p.metrics.likes} likes · ${p.metrics.bookmarks ?? 0} bookmarks`: 'Saved from LinkedIn'}</span><a class="source-link" href="${escape(p.url)}" target="_blank" rel="noopener noreferrer">View original ↗</a></div>${parent}</article>`;
}).join('\n');
const file=path.join(root,'dist/index.html');
fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/<!-- posts:start -->[\s\S]*?<!-- posts:end -->/,`<!-- posts:start -->\n${cards}\n<!-- posts:end -->`));
console.log(`Rendered ${posts.length} selected posts from data.`);
