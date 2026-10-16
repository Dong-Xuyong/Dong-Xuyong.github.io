# Brief: law-wiki → shared shell kit

Repo `Dong-Xuyong/law-wiki`, branch `master`, live https://dong-xuyong.github.io/law-wiki/. Kit: https://github.com/Dong-Xuyong/Dong-Xuyong.github.io/blob/main/ui/README.md (commit 5a75de7), demo /ui/demo.html.
Likely files: site/src/layouts/BaseLayout.astro, site/src/styles/global.css (Astro, workflow build).

1. In `<head>`: Encode Sans link, then `dong-ui/theme.css`, then `<link rel="stylesheet" href="/ui/shell.css?v=1">`, then the app's CSS.
2. First thing in `<body>`: the `<header class="dx-header">` snippet from the README, home link to `/`, title "Legal Research Wiki", theme toggle in `.dx-actions`.
3. Map the app's card, button, tab and font styles onto `--dx-card`, `--dx-border`, `--dx-radius`, `--dx-primary`, `--dx-fg`, `--dx-muted`, `--dx-font` (or add `dx-card`/`dx-btn` classes).
4. Remove duplicate page backgrounds, banner/hero art and opaque `html`/`body`/wrapper backgrounds so the kit art shows; never set `body::before/::after`.
App notes:
- Add the kit link and header once in `BaseLayout.astro`; it covers every page. Home link stays `href="/"` (hub), not the Astro base.
- UI is Portuguese: use `aria-label="Início"` on the home link.
- `header.site-header.nav-glass` becomes the dx-header; keep `.site-nav` links and `.tabbar` behaviour.
- `.corpus-hero`: drop decorative art; keep the search box. Check `npm run build` in `site/`.
Keep functionality untouched (ids, JS hooks, sync, storage). 360px wide: no horizontal scroll. AA text in light and dark. No console errors.
Merge to `master`, wait for Pages, verify live in both themes at 360px, then report the exact changed files.
