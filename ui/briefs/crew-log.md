# Brief: crew-log → shared shell kit

Repo `Dong-Xuyong/crew-log`, branch `main`, live https://dong-xuyong.github.io/crew-log/. Kit: https://github.com/Dong-Xuyong/Dong-Xuyong.github.io/blob/main/ui/README.md (commit 5a75de7), demo /ui/demo.html.
Likely files: index.html, styles.css.

1. In `<head>`: Encode Sans link, then `dong-ui/theme.css`, then `<link rel="stylesheet" href="/ui/shell.css?v=1">`, then the app's CSS.
2. First thing in `<body>`: the `<header class="dx-header">` snippet from the README, home link to `/`, title "Crew Log", theme toggle in `.dx-actions`.
3. Map the app's card, button, tab and font styles onto `--dx-card`, `--dx-border`, `--dx-radius`, `--dx-primary`, `--dx-fg`, `--dx-muted`, `--dx-font` (or add `dx-card`/`dx-btn` classes).
4. Remove duplicate page backgrounds, banner/hero art and opaque `html`/`body`/wrapper backgrounds so the kit art shows; never set `body::before/::after`.
App notes:
- Delete the app's `body::before` / `html.dark body::before` gradient block (around line 44); the kit owns those pseudo-elements.
- `.topbar-*` brand/mark/dot: replace with dx-header; move sync, export and menu buttons into `.dx-actions` keeping ids and handlers.
- `.banner` is a status bar: keep. The skeleton loader stays, mapped to `--dx-card`.
Keep functionality untouched (ids, JS hooks, sync, storage). 360px wide: no horizontal scroll. AA text in light and dark. No console errors.
Merge to `main`, wait for Pages, verify live in both themes at 360px, then report the exact changed files.
