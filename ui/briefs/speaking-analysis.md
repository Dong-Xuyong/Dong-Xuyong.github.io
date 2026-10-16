# Brief: speaking-analysis → shared shell kit

Repo `Dong-Xuyong/speaking-analysis`, branch `main`, live https://dong-xuyong.github.io/speaking-analysis/. Kit: https://github.com/Dong-Xuyong/Dong-Xuyong.github.io/blob/main/ui/README.md (commit 5a75de7), demo /ui/demo.html.
Likely files: index.html, styles.css.

**Rebase on latest main right before merge; small diff only.**

1. In `<head>`: Encode Sans link, then `dong-ui/theme.css`, then `<link rel="stylesheet" href="/ui/shell.css?v=1">`, then the app's CSS.
2. First thing in `<body>`: the `<header class="dx-header">` snippet from the README, home link to `/`, title "Speaking Coach", theme toggle in `.dx-actions`.
3. Map the app's card, button, tab and font styles onto `--dx-card`, `--dx-border`, `--dx-radius`, `--dx-primary`, `--dx-fg`, `--dx-muted`, `--dx-font` (or add `dx-card`/`dx-btn` classes).
4. Remove duplicate page backgrounds, banner/hero art and opaque `html`/`body`/wrapper backgrounds so the kit art shows; never set `body::before/::after`.
App notes:
- Usopp is editing this repo right now: rebase on latest main right before merge; small diff only.
- Already loads `/career/suite.css`; keep the `.suite-nav` markup.
- Kit classes on `<header id="topbar">` (keep id). Keep IBM Plex Mono for `--font-mono`.
- `.learning-hero`: drop decorative art only.
Keep functionality untouched (ids, JS hooks, sync, storage). 360px wide: no horizontal scroll. AA text in light and dark. No console errors.
Merge to `main`, wait for Pages, verify live in both themes at 360px, then report the exact changed files.
