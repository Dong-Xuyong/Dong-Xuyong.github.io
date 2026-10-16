# Brief: speaking-analysis → shared shell kit

Repo `Dong-Xuyong/speaking-analysis`, branch `main`, live https://dong-xuyong.github.io/speaking-analysis/. Kit: https://github.com/Dong-Xuyong/Dong-Xuyong.github.io/blob/main/ui/README.md (commit 5a75de7), demo /ui/demo.html.
Likely files: index.html (styles.css only if the header needs a tweak).

**Base on e9cb6b4 or later (Usopp's minimal cleanup). Additive kit link and header with a home button ONLY.**

1. In `<head>`: add `<link rel="stylesheet" href="/ui/shell.css?v=1">` after `dong-ui/theme.css` and before the app's CSS.
2. First thing in `<body>`: the `<header class="dx-header">` snippet from the README, home link to `/`, title "Speaking Coach", theme toggle in `.dx-actions`. If a header already exists, put the kit classes on it and keep its id.

Do NOT re-add the suite nav, footer, ink-wash decoration or dashboard; Usopp removed them on purpose. No other restyling, no new sections. Keep the app minimal.

Keep functionality untouched (ids, JS hooks, storage). 360px wide: no horizontal scroll. AA text in light and dark. No console errors.
Rebase on latest main right before merge. Merge to `main`, wait for Pages, verify live in both themes at 360px, then report the exact changed files.
