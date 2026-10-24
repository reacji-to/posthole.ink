// Run with: node --test scripts/demo.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const root = new URL('../public/', import.meta.url);
function setup(reduced = false) {
  const { document, window } = parseHTML(fs.readFileSync(new URL('index.html', root), 'utf8'));
  const picker = document.querySelector('#demo-style');
  const options = [...picker.querySelectorAll('option')];
  let value = 'original';
  Object.defineProperties(picker, {
    options: { value: options },
    value: { get: () => value, set: next => { value = next; } },
    selectedIndex: { get: () => options.findIndex(option => option.value === value) },
  });
  document.querySelectorAll('video').forEach(video => { video.pause = () => {}; });
  const timers = new Map(); let id = 0;
  const media = { matches: reduced, addEventListener() {} };
  const context = { document, window, navigator: {}, matchMedia: () => media,
    location: { origin: 'http://localhost' }, URLSearchParams,
    setTimeout(fn, ms) { timers.set(++id, { fn, ms }); return id; },
    clearTimeout(key) { timers.delete(key); } };
  vm.runInNewContext(fs.readFileSync(new URL('site.js', root), 'utf8'), context);
  return { document, window, picker, options,
    tick(ms) { for (const [key, timer] of [...timers]) if (timer.ms === ms) { timers.delete(key); timer.fn(); } },
    choose(style) { picker.value = style; picker.dispatchEvent(new window.Event('change')); },
  };
}

test('the autoplay tour visits every supported interface and loops', () => {
  const app = setup(); const seen = new Set([app.picker.value]);
  for (let i = 0; i < app.options.length; i++) { app.tick(8000); seen.add(app.picker.value); }
  assert.equal(seen.size, app.options.length);
  assert.deepEqual(app.options.map(option => option.value), Object.keys(JSON.parse(app.document.querySelector('#interface-catalog').textContent)));
  assert.equal(app.picker.value, 'original');
  assert.equal(app.document.querySelector('.archive-feed').hidden, false);
});

test('manual selection pauses; transport wraps and can resume autoplay', () => {
  const app = setup(); app.choose('terminal'); app.tick(8000);
  assert.equal(app.picker.value, 'terminal');
  assert.equal(app.document.querySelector('#play-styles').getAttribute('aria-pressed'), 'false');
  app.document.querySelector('#next-style').click();
  assert.equal(app.picker.value, 'netflix');
  app.document.querySelector('#next-style').click();
  assert.equal(app.picker.value, 'original');
  app.document.querySelector('#previous-style').click();
  assert.equal(app.picker.value, 'netflix');
  app.document.querySelector('#play-styles').click(); app.tick(8000);
  assert.equal(app.picker.value, 'terminal');
});

test('search and source selection reach the same frame with encoded parameters', () => {
  const app = setup(); app.choose('ipod-color');
  app.document.querySelector('[data-filter=linkedin]').click();
  const search = app.document.querySelector('.search input');
  search.value = 'code & software'; search.dispatchEvent(new app.window.Event('input'));
  app.tick(150);
  const src = app.document.querySelector('#style-preview').src;
  const params = new URL(src, 'http://localhost').searchParams;
  assert.equal(params.get('view'), 'ipod-color');
  assert.equal(params.get('p'), 'linkedin');
  assert.equal(params.get('q'), 'code & software');
  app.tick(8000); assert.equal(app.picker.value, 'ipod-color');
});

test('reduced motion starts paused and the user can explicitly play', () => {
  const app = setup(true); app.tick(8000); assert.equal(app.picker.value, 'original');
  app.document.querySelector('#play-styles').click(); app.tick(8000);
  assert.equal(app.picker.value, 'ipod-color');
});

test('every generated interface has only curated posts and local existing media', () => {
  const app = setup();
  for (const option of app.options.filter(option => option.value !== 'original')) {
    const { document } = parseHTML(fs.readFileSync(new URL(`demo/${option.value}.html`, root), 'utf8'));
    assert.equal(document.querySelectorAll('.post-entry').length, 24);
    for (const node of document.querySelectorAll('img[src],video[src],script[src],link[href]')) {
      const src = node.getAttribute('src') || node.getAttribute('href');
      assert.ok(fs.existsSync(new URL(src, new URL('demo/', root))), `Missing asset: ${src}`);
    }
    assert.equal(document.querySelectorAll('[data-next]').length, 0);
  }
});
