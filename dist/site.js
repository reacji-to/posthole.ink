const copyStatus = document.querySelector('#copy-status');
document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = 'Copied!';
      copyStatus.textContent = '';
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
  document.querySelector('.feed-end').textContent = `${count} example ${count === 1 ? 'post' : 'posts'} · real text, not screenshots`;
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
document.querySelector('.replies').addEventListener('toggle', event => {
  event.target.querySelector('summary').textContent = event.target.open ? 'Hide reply' : 'Show 1 reply';
});
