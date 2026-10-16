# Brief: Resume → shared shell kit

Repo `Dong-Xuyong/Resume`, branch `main`, live https://dong-xuyong.github.io/Resume/. Kit: https://github.com/Dong-Xuyong/Dong-Xuyong.github.io/blob/main/ui/README.md (commit 5a75de7), demo /ui/demo.html.
Likely files: index.html, assets/css/style.css.

1. In `<head>`: Encode Sans link, then `dong-ui/theme.css`, then `<link rel="stylesheet" href="/ui/shell.css?v=1">`, then the app's CSS.
2. First thing in `<body>`: the `<header class="dx-header">` snippet from the README, home link to `/`, title "Resume", theme toggle in `.dx-actions`.
3. Map the app's card, button, tab and font styles onto `--dx-card`, `--dx-border`, `--dx-radius`, `--dx-primary`, `--dx-fg`, `--dx-muted`, `--dx-font` (or add `dx-card`/`dx-btn` classes).
4. Remove duplicate page backgrounds, banner/hero art and opaque `html`/`body`/wrapper backgrounds so the kit art shows; never set `body::before/::after`.
App notes:
- `style.css` loads before `dong-ui/theme.css`; order must be theme.css, shell.css, style.css.
- Map `--ff-poppins` to `var(--dx-font)` and drop Poppins from the font link.
- The template paints its own page/sidebar backgrounds (`--eerie-black` etc.): make page-level ones transparent, map panels to `--dx-card`.
- Add dx-header plus the Career suite tabs (as on /career/, `aria-current` on Resume). Keep `.navbar` behaviour and ionicons.
Keep functionality untouched (ids, JS hooks, sync, storage). 360px wide: no horizontal scroll. AA text in light and dark. No console errors.
Merge to `main`, wait for Pages, verify live in both themes at 360px, then report the exact changed files.
