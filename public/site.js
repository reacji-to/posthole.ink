const copyStatus = document.querySelector('#copy-status');
document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.classList.add('copied');
      const label = button.getAttribute('aria-label');
      button.setAttribute('aria-label', 'Copied');
      copyStatus.textContent = 'Copied to clipboard.';
      clearTimeout(button.copyReset);
      button.copyReset = setTimeout(() => {
        button.classList.remove('copied');
        button.setAttribute('aria-label', label === 'Copied' ? button.dataset.label : label);
        copyStatus.textContent = '';
      }, 2000);
      if (label !== 'Copied') button.dataset.label = label;
    } catch {
      const range = document.createRange();
      range.selectNodeContents(button.previousElementSibling);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copyStatus.textContent = 'Text selected. Copy it, then paste it into your agent or terminal.';
    }
  });
});
const search = document.querySelector('.search input');
const filters = [...document.querySelectorAll('[data-filter]')];
const posts = [...document.querySelectorAll('[data-platform]')];
const demo = document.querySelector('.archive-demo');
const picker = document.querySelector('#demo-style');
const frame = document.querySelector('#style-preview');
const originalFeed = document.querySelector('.archive-feed');
const play = document.querySelector('#play-styles');
const styles = [...picker.options];
// Lead with the distinctive formats, then complete a tour of all available styles.
const tour = ['original', 'ipod-color', 'ipod', 'tinder', 'gallery', 'netflix', 'terminal', 'hackernews'];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let playing = !reducedMotion.matches;
let timer;
let searchTimer;
let platform = 'all';
function schedule() {
  clearTimeout(timer);
  if (playing && !document.hidden) timer = setTimeout(() => {
    selectStyle(tour[(tour.indexOf(picker.value) + 1) % tour.length]);
  }, 8000);
}
function playback(value) {
  playing = value;
  play.setAttribute('aria-pressed', String(playing));
  play.setAttribute('aria-label', playing ? 'Pause style tour' : 'Play style tour');
  schedule();
}
function updateFrame() {
  if (picker.value === 'original') return;
  const params = new URLSearchParams({ view: picker.value, p: platform, q: search.value.trim() });
  frame.src = `demo/${picker.value}.html?${params}`;
}
function selectStyle(value, manual = false) {
  if (manual) playback(false);
  originalFeed.querySelectorAll('video').forEach(video => video.pause());
  // Unload the previous frame to stop any playing media.
  frame.removeAttribute('src');
  picker.value = value;
  const index = styles.findIndex(option => option.value === value);
  const label = styles[index].textContent;
  const position = document.querySelector('#style-position');
  position.textContent = `${index + 1} / ${styles.length}`;
  position.setAttribute('aria-label', `Style ${index + 1} of ${styles.length}`);
  frame.title = `Saved posts in ${label} style`;
  originalFeed.hidden = value !== 'original';
  frame.hidden = value === 'original';
  if (value === 'original') originalFeed.scrollTop = 0;
  updateFrame();
  schedule();
}
picker.addEventListener('change', () => selectStyle(picker.value, true));
document.querySelector('#previous-style').addEventListener('click', () => selectStyle(styles[(picker.selectedIndex - 1 + styles.length) % styles.length].value, true));
document.querySelector('#next-style').addEventListener('click', () => selectStyle(styles[(picker.selectedIndex + 1) % styles.length].value, true));
play.addEventListener('click', () => playback(!playing));
// Let visitors read, search, and use the demos without the tour moving on.
demo.addEventListener('pointerdown', event => {
  if (!event.target.closest('.style-controls')) playback(false);
});
demo.addEventListener('wheel', () => playback(false), { passive: true });
demo.addEventListener('keydown', event => {
  if (!event.target.closest('.style-controls')) playback(false);
});
window.addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
  if (event.data?.type === 'posthole-demo-interaction') playback(false);
});
document.addEventListener('visibilitychange', schedule);
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) playback(false); });
function filterPosts() {
  const query = search.value.trim().toLowerCase();
  let count = 0;
  posts.forEach(post => {
    post.hidden = (platform !== 'all' && post.dataset.platform !== platform) || !post.textContent.toLowerCase().includes(query);
    if (!post.hidden) count++;
  });
  document.querySelector('.empty').hidden = count > 0;
  document.querySelector('.feed-end').textContent = `${count} saved ${count === 1 ? 'post' : 'posts'} · real text, not screenshots`;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(updateFrame, 150);
}
filters.forEach(button => button.addEventListener('click', () => {
  platform = button.dataset.filter;
  playback(false);
  filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
  filterPosts();
}));
search.addEventListener('input', () => { playback(false); filterPosts(); });
document.querySelector('#clear-search').addEventListener('click', () => {
  search.value = '';
  filterPosts();
  search.focus();
});
document.querySelectorAll('[data-expand]').forEach(details => {
  details.addEventListener('toggle', () => {
    details.querySelector('summary').textContent = details.open ? details.dataset.close : details.dataset.expand;
  });
});

filterPosts();
playback(playing);
