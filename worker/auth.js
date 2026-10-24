const encoder = new TextEncoder();
async function equalCredentials(actual, expected) {
  const [a, b] = await Promise.all([actual, expected].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const left = new Uint8Array(a), right = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}

export function createHandler(assets, sourceCommit, upstream = fetch) {
  return {
    async fetch(request, env) {
      if (!env.BASIC_AUTH_USER || !env.BASIC_AUTH_PASSWORD) {
        return new Response('Site authentication is not configured.', {status:503, headers:{'Cache-Control':'no-store'}});
      }
      const match = /^Basic\s+(\S+)$/i.exec(request.headers.get('Authorization') || '');
      let credentials = '';
      try { if (match) credentials = atob(match[1]); } catch { /* Invalid credentials receive the same challenge. */ }
      if (!match || !await equalCredentials(credentials, `${env.BASIC_AUTH_USER}:${env.BASIC_AUTH_PASSWORD}`)) {
        return new Response('Authentication required.', {status:401, headers:{
          'WWW-Authenticate':'Basic realm="Posthole", charset="UTF-8"',
          'Cache-Control':'private, no-store', 'Vary':'Authorization',
        }});
      }
      if (!['GET','HEAD'].includes(request.method)) {
        return new Response('Method not allowed.', {status:405, headers:{Allow:'GET, HEAD','Cache-Control':'no-store'}});
      }
      let pathname;
      try { pathname = decodeURIComponent(new URL(request.url).pathname); }
      catch { return new Response('Not found.', {status:404}); }
      if (pathname.endsWith('/')) pathname += 'index.html';
      const asset = Object.hasOwn(assets, pathname) ? assets[pathname] : null;
      if (!asset) return new Response('Not found.', {status:404, headers:{'Cache-Control':'no-store'}});
      const headers = new Headers({
        'Content-Type':asset.type, 'Cache-Control':'private, no-store',
        'Vary':'Authorization', 'X-Content-Type-Options':'nosniff',
        'Referrer-Policy':'same-origin', 'X-Robots-Tag':'noindex, nofollow',
      });
      if (asset.text !== undefined) return new Response(request.method === 'HEAD' ? null : asset.text, {headers});
      // Public binary assets are streamed from this exact source snapshot. Never
      // forward the site's Authorization header or accept an arbitrary URL/path.
      const upstreamHeaders = new Headers();
      if (request.headers.has('Range')) upstreamHeaders.set('Range', request.headers.get('Range'));
      const response = await upstream(`https://raw.githubusercontent.com/reacji-to/posthole.ink/${sourceCommit}/public${pathname}`, {
        method:request.method, headers:upstreamHeaders,
      });
      if (!response.ok) return new Response('Asset unavailable.', {status:502, headers:{'Cache-Control':'no-store'}});
      for (const key of ['Content-Length','Content-Range','Accept-Ranges']) {
        if (response.headers.has(key)) headers.set(key, response.headers.get(key));
      }
      return new Response(request.method === 'HEAD' ? null : response.body, {status:response.status, headers});
    },
  };
}
