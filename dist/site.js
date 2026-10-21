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
let platform = 'all';
function filterPosts() {
  const query = search.value.trim().toLowerCase();
  let count = 0;
  posts.forEach(post => {
    post.hidden = (platform !== 'all' && post.dataset.platform !== platform) || !post.textContent.toLowerCase().includes(query);
    if (!post.hidden) count++;
  });
  document.querySelector('.empty').hidden = count > 0;
  document.querySelector('.feed-end').textContent = `${count} saved ${count === 1 ? 'post' : 'posts'} · real text, not screenshots`;
}
filters.forEach(button => button.addEventListener('click', () => {
  platform = button.dataset.filter;
  filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
  filterPosts();
}));
search.addEventListener('input', filterPosts);
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
