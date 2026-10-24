// The plain-text agent guide is the source of truth for the readable HTML page.
import fs from 'node:fs';
const directory = new URL('../public/install/', import.meta.url);
const source = fs.readFileSync(new URL('agent.txt', directory), 'utf8');
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inline = value => value.split(/(`[^`]+`|https?:\/\/[^\s]+)/g).map(part => {
  if (part.startsWith('`')) return `<code>${escape(part.slice(1,-1))}</code>`;
  if (/^https?:/.test(part)) {
    const url = part.replace(/[.,;]$/, '');
    return `<a href="${escape(url)}">${escape(url.replace(/^https?:\/\//,''))}</a>${escape(part.slice(url.length))}`;
  }
  return escape(part);
}).join('');
const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const lines = source.split('\n'), headings = [], output = [];
let index = 0;
while (index < lines.length) {
  const line = lines[index];
  if (!line.trim()) { index++; continue; }
  if (line.startsWith('```')) {
    const code = []; index++;
    while(index < lines.length && !lines[index].startsWith('```')) code.push(lines[index++]);
    index++; output.push(`<pre tabindex="0"><code>${escape(code.join('\n'))}</code></pre>`); continue;
  }
  if (line.startsWith('|')) {
    const rows = [];
    while(index < lines.length && lines[index].startsWith('|')) rows.push(lines[index++].split('|').slice(1,-1).map(v=>v.trim()));
    const [header,...body] = rows;
    output.push(`<div class="table-scroll" tabindex="0" aria-label="All settings and defaults"><table><thead><tr>${header.map(value=>`<th scope="col">${inline(value)}</th>`).join('')}</tr></thead><tbody>${body.map(row=>`<tr>${row.map(value=>`<td>${inline(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue;
  }
  if (line.startsWith('# ')) { output.push(`<h1>${inline(line.slice(2))}</h1>`); index++; continue; }
  if (line.startsWith('## ')) {
    const title = line.slice(3), id = slug(title); headings.push({title,id});
    output.push(`<h2 id="${id}"><a href="#${id}">${inline(title)}</a></h2>`); index++; continue;
  }
  const paragraph = [];
  while(index < lines.length && lines[index].trim() && !/^(#|\||```)/.test(lines[index])) paragraph.push(lines[index++]);
  output.push(`<p>${inline(paragraph.join(' '))}</p>`);
}
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Set up or change Posthole — installation guide</title><meta name="description" content="A complete agent guide to installing, configuring, verifying, updating, troubleshooting, and customizing Posthole."><link rel="icon" href="/icon.png"><link rel="stylesheet" href="/install/guide.css"></head><body><a class="skip-link" href="#guide">Skip to the guide</a><header><a class="brand" href="/"><img src="/icon.png" width="36" height="36" alt="">posthole</a><a href="/">Back to Posthole</a></header><div class="guide-layout"><aside><details class="contents" open><summary>In this guide</summary><nav aria-label="Guide contents">${headings.map(({title,id})=>`<a href="#${id}">${escape(title)}</a>`).join('')}</nav></details><a class="plain-text" href="/install/agent.txt">Plain text for your agent</a><a class="plain-text" href="https://github.com/reacji-to/posthole">Source repository</a></aside><main id="guide"><div class="guide-tools"><span>Checked against the source · October 24, 2026</span><a href="/install/agent.txt">Read as plain text</a></div>${output.join('\n')}<footer><a href="#guide">Back to top</a><a href="/">Posthole home</a></footer></main></div></body></html>`;
fs.writeFileSync(new URL('index.html', directory), html);
console.log(`Rendered installation guide: ${source.split(/\s+/).length} words, ${headings.length} sections.`);
