# posthole.ink

The landing page source lives in `public/`. A small server-side Worker protects every route with HTTP Basic authentication, including previews, images, videos, and the download. Credentials are set as hosted secrets `BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD`; they are never included in source or browser bundles.

Run `npm run build` after committing changes to `public/`. The build embeds text assets and streams binary assets through the authenticated Worker from the exact committed GitHub source snapshot. The GitHub repository is public; site authentication controls access on the hosted domain. The deployment artifact contains only the Worker and hosting metadata, so there is no public static route around authentication. If credentials are missing, the server refuses all requests.

The mini player cycles through all ten viewer interfaces every eight seconds. Choosing a style, searching, filtering, or interacting with a preview pauses the tour; Play resumes it. Reduced-motion users start paused.

Only `data/posts.json` and its previously curated public media are used. The demo never reads a user's archive. Search and platform filters apply to every style.

To refresh the demo from the extension's actual viewer implementation, install the extension viewer's dependencies and run:

```sh
node scripts/render-posts.mjs
bun scripts/render-interfaces.ts /path/to/posthole/viewer
```

The viewer path defaults to `../viewer` for the nested development checkout. The generated HTML, fonts, CSS, and controls are committed to `public/demo/`. `demo.css` and `demo.js` are the landing-page adapters and are preserved by regeneration. `interfaces.json` records the supported interfaces from that viewer snapshot.

Run `npm install` and `npm test` for tour, selection, filtering, reduced-motion, and generated-asset checks. Preview with any static server rooted at `public/` for copy/layout work.
