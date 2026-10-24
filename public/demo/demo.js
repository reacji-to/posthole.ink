import { initInterfaceControls } from './interface-controls.js';
import { initCardInteractions } from './card-interactions.js';
import { initNetflix } from './netflix.js';

const feed = document.querySelector('.feed');
const params = new URLSearchParams(location.search);
const query = (params.get('q') || '').trim().toLowerCase();
const platform = params.get('p') || 'all';
for (const entry of [...feed.children]) {
  const source = entry.dataset.source;
  if ((platform !== 'all' && source !== platform) || !entry.textContent.toLowerCase().includes(query)) entry.remove();
}
const count = feed.children.length;
if (!count) {
  const empty = document.createElement('p'); empty.className = 'empty';
  empty.textContent = 'No posts match. Try another search or source.'; feed.append(empty);
}
// Always pass ?view so a remembered local viewer choice cannot redirect the demo.
initInterfaceControls(feed, async () => false);
initCardInteractions(feed);
if (document.body.dataset.view === 'netflix') initNetflix(feed, async () => false);
const kept = document.querySelector('.kept-filter');
if (kept) document.querySelector('.swipe-heading').before(kept);
function interaction() { parent.postMessage({ type: 'posthole-demo-interaction' }, location.origin); }
document.addEventListener('pointerdown', interaction, { passive: true });
document.addEventListener('keydown', interaction);
document.addEventListener('wheel', interaction, { passive: true });
document.addEventListener('play', interaction, true);
parent.postMessage({ type: 'posthole-demo-ready', count, view: document.body.dataset.view }, location.origin);
