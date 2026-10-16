# Brief: chinese-library → shared shell kit

Repo `Dong-Xuyong/chinese-library`, branch `main`, live https://dong-xuyong.github.io/chinese-library/. Kit: https://github.com/Dong-Xuyong/Dong-Xuyong.github.io/blob/main/ui/README.md (commit 5a75de7), demo /ui/demo.html.
Likely files: index.html, css/styles.css (Pages builds via workflow: edit source, not output).

1. In `<head>`: Encode Sans link, then `dong-ui/theme.css`, then `<link rel="stylesheet" href="/ui/shell.css?v=1">`, then the app's CSS.
2. First thing in `<body>`: the `<header class="dx-header">` snippet from the README, home link to `/`, title "Mandarin Vocabulary", theme toggle in `.dx-actions`.
3. Map the app's card, button, tab and font styles onto `--dx-card`, `--dx-border`, `--dx-radius`, `--dx-primary`, `--dx-fg`, `--dx-muted`, `--dx-font` (or add `dx-card`/`dx-btn` classes).
4. Remove duplicate page backgrounds, banner/hero art and opaque `html`/`body`/wrapper backgrounds so the kit art shows; never set `body::before/::after`.
App notes:
- `css/styles.css` loads before `dong-ui/theme.css`; order must be theme.css, shell.css, styles.css.
- Keep Noto Serif SC for hanzi (`--font-hanzi`/`--font-zh`); map UI font (`--font-ui`) to `var(--dx-font)`.
- `#topbar` and `.library-masthead`: fold the title into the dx-header; drop masthead/hero art.
- `.banner-error`/`.banner-loading` are status bars: keep. `.tab-bar` keeps behaviour.
Keep functionality untouched (ids, JS hooks, sync, storage). 360px wide: no horizontal scroll. AA text in light and dark. No console errors.
Merge to `main`, wait for Pages, verify live in both themes at 360px, then report the exact changed files.
