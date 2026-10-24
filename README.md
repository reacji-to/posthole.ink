# posthole.ink

The static landing page is served from `dist/`. No build or server runtime is needed for hosting.

The mini player cycles through all ten viewer interfaces every eight seconds. Choosing a style, searching, filtering, or interacting with a preview pauses the tour; Play resumes it. Reduced-motion users start paused.

Only `data/posts.json` and its previously curated public media are used. The demo never reads a user's archive. Search and platform filters apply to every style.

To refresh the demo from the extension's actual viewer implementation, install the extension viewer's dependencies and run:

```sh
node scripts/render-posts.mjs
bun scripts/render-interfaces.ts /path/to/posthole/viewer
```

The viewer path defaults to `../viewer` for the nested development checkout. The generated HTML, fonts, CSS, and controls are committed to `dist/demo/`. `demo.css` and `demo.js` are the landing-page adapters and are preserved by regeneration. `interfaces.json` records the supported interfaces from that viewer snapshot.

Run `npm install` and `npm test` for tour, selection, filtering, reduced-motion, and generated-asset checks. Preview with any static server rooted at `dist/`.
