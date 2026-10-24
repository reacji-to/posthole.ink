import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../worker/auth.js';
const env = {BASIC_AUTH_USER:'test-user', BASIC_AUTH_PASSWORD:'test-password'};
const authorization = 'Basic ' + btoa('test-user:test-password');
const assets = {
  '/index.html':{type:'text/html',text:'Protected page'},
  '/style.css':{type:'text/css',text:'body{}'},
  '/demo/ipod.html':{type:'text/html',text:'Preview'},
  '/posts/media.mp4':{type:'video/mp4'},
  '/posthole.zip':{type:'application/zip'},
  '/install/index.html':{type:'text/html',text:'Installation guide'},
  '/install/agent.txt':{type:'text/plain',text:'Agent instructions'},
};
const request = (path, auth, options = {}) => new Request(`https://posthole.test${path}`, {...options, headers:{...(auth ? {Authorization:auth} : {}),...options.headers}});

test('every path requires credentials before any content or upstream fetch', async () => {
  let calls = 0;
  const worker = createHandler(assets, 'pinned-commit', () => { calls++; throw new Error('Must not fetch'); });
  for (const path of ['/', '/style.css', '/demo/ipod.html', '/posts/media.mp4', '/posthole.zip', '/install', '/install/', '/install/agent.txt', '/missing']) {
    for (const auth of [undefined, 'Basic !!!', 'Bearer token', 'Basic '+btoa('test-user:wrong')]) {
      const response = await worker.fetch(request(path, auth), env);
      assert.equal(response.status, 401);
      assert.match(response.headers.get('WWW-Authenticate'), /^Basic /);
      assert.match(response.headers.get('Cache-Control'), /no-store/);
      assert.equal(await response.text(), 'Authentication required.');
    }
  }
  assert.equal(calls, 0);
});

test('valid credentials serve pages, query strings, HEAD, and explicit failures', async () => {
  const worker = createHandler(assets, 'pinned-commit');
  assert.equal(await (await worker.fetch(request('/?view=gallery', authorization), env)).text(), 'Protected page');
  for (const path of ['/install', '/install/', '/install/index.html']) {
    const guide = await worker.fetch(request(path, authorization), env);
    assert.equal(guide.status, 200);
    assert.equal(await guide.text(), 'Installation guide');
  }
  const head = await worker.fetch(request('/style.css', authorization, {method:'HEAD'}), env);
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
  assert.equal((await worker.fetch(request('/missing', authorization), env)).status, 404);
  assert.equal((await worker.fetch(request('/toString', authorization), env)).status, 404);
  assert.equal((await worker.fetch(request('/', authorization, {method:'POST'}), env)).status, 405);
  assert.equal((await worker.fetch(request('/', authorization), {})).status, 503);
});

test('binary assets stream from a pinned allowlist without leaking site credentials', async () => {
  const worker = createHandler(assets, 'abc123', async (url, options) => {
    assert.equal(url, 'https://raw.githubusercontent.com/reacji-to/posthole.ink/abc123/public/posts/media.mp4');
    assert.equal(options.headers.has('Authorization'), false);
    assert.equal(options.headers.get('Range'), 'bytes=0-2');
    return new Response('abc', {status:206,headers:{'Content-Range':'bytes 0-2/100'}});
  });
  const result = await worker.fetch(request('/posts/media.mp4', authorization, {headers:{Range:'bytes=0-2'}}), env);
  assert.equal(result.status, 206); assert.equal(result.headers.get('Content-Type'), 'video/mp4');
  assert.equal(result.headers.get('Content-Range'), 'bytes 0-2/100');
  assert.equal(result.headers.get('Vary'), 'Authorization');
  assert.match(result.headers.get('Cache-Control'), /private, no-store/);
  assert.equal(await result.text(), 'abc');
});
