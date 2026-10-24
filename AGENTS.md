# Keep the demo, extension, and local server synchronized

Russell requires all Posthole surfaces to stay in sync at all times (2026-10-24).

- The Posthole repo (`../`, or `reacji-to/posthole`) owns extension and viewer implementations. Read its `AGENTS.md` when available.
- Derive demo styles, labels, controls, layout, and behavior from the real viewer. Never ship a demo-only implementation of a product change.
- After viewer changes run `npm run render:interfaces`, then `npm run check:viewer` and `npm test`. Commit the regenerated HTML, styles, controls, catalog, and source hashes in the same change. `POSTHOLE_VIEWER` can identify another viewer checkout for the check.
- Keep the website's extension download current whenever extension code changes. Rebuild and test it from the actual extension source; do not hand-edit the ZIP.
- Use only the curated public demo records/media. Never import private archive data into the site.
- Preserve authentication and hosting configuration, including concurrent changes. Publish only after sync checks pass; report any incomplete sync or deployment explicitly.

The reacji extension owns all reaction behavior; this website must not introduce its own reaction implementation.
