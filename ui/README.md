# Shell kit (`/ui/`)

One stylesheet, served from the hub origin, that gives every app the hub's look: the fixed portrait background with a soft dark overlay, translucent blurred cards, Encode Sans, the dong-ui colours, and one header with a home button. Live demo: <https://dong-xuyong.github.io/ui/demo.html>.

Light and dark follow the hub: `html.dark` (set by `dong-ui/theme.js`) or `[data-theme="dark"]` on `<html>`. With neither, `prefers-color-scheme` decides. Every rule is wrapped in `:where()`, so it has zero specificity and an app's own CSS always wins. Adopting the kit never needs `!important`.

## 1. Head

Load the kit after `dong-ui/theme.css` and before the app's own stylesheet:

```html
<link href="https://fonts.googleapis.com/css2?family=Encode+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="dong-ui/theme.css" />
<link rel="stylesheet" href="/ui/shell.css?v=1" />
<link rel="stylesheet" href="styles.css" />
```

Apps without a vendored `dong-ui/` can use the hub's copy: `/dong-ui/theme.css` and `/dong-ui/theme.js`.

## 2. Body and header

Add `class="dx"` to `<body>`; that turns on the background (`body.dx::before`) and overlay (`body.dx::after`). The header is the first element inside `<body>`. Replace any existing app header, banner, or hero with this:

```html
<header class="dx-header">
  <a class="dx-home" href="/" aria-label="Home">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>
  </a>
  <h1 class="dx-title">App title</h1>
  <div class="dx-actions">
    <button type="button" data-dong-theme-toggle aria-label="Toggle color theme"></button>
  </div>
</header>
```

`.dx-actions` is optional; put sync or menu buttons there too. Keep the app's existing element ids (for example `id="topbar"`) on the `<header>` if its JS uses them.

## 3. Suite tabs (apps in a suite)

Put directly after the header. `.suite-nav` (Career, Health, Study) gets the same style, so existing markup works unchanged.

```html
<nav class="dx-tabs" aria-label="Career sections">
  <a class="dx-tab" href="/career/" aria-current="page">Pipeline</a>
  <a class="dx-tab" href="/job-hunt/">Shortlist</a>
</nav>
```

## Classes

| Class | Use |
| --- | --- |
| `dx-header`, `dx-home`, `dx-title`, `dx-actions` | Sticky glass header |
| `dx` (on `<body>`) | Background art and overlay |
| `dx-tabs`, `dx-tab` | Pill tab bar; active tab has `aria-current="page"` or `aria-selected="true"` |
| `dx-card` | Translucent blurred card |
| `dx-btn`, `dx-btn--ghost` | Primary and secondary buttons, 44px tall |
| `dx-muted` | Secondary text |
| `dx-on-bg` | White shadowed text placed straight on the art |
| `dx-main` | Optional centred column, `min(720px, 100% - 24px)` |

## Variables

Map the app's own styles onto these instead of hard-coding colours:

| Variable | Meaning |
| --- | --- |
| `--dx-font` | Encode Sans stack |
| `--dx-bg` | Page colour under the art |
| `--dx-text`, `--dx-muted` | Text, secondary text |
| `--dx-card` | Card fill (94% opaque) |
| `--dx-accent` | Accent for links, active tabs, primary buttons |
| `--dx-radius` | 16px cards |

Extras: `--dx-card-solid`, `--dx-border`, `--dx-accent-fg` (text on accent), `--dx-accent-soft` (accent tint), `--dx-radius-sm` (10px), `--dx-blur`, `--dx-shadow`, `--dx-gap`, `--dx-overlay`.

Example: `.my-panel { background: var(--dx-card); border-radius: var(--dx-radius); }`.

## Rules for apps

- Don't set `body::before` or `body::after` on `body.dx`; the kit uses them for the background.
- Remove the app's own page background, banner image, and hero art. Opaque backgrounds on `html`, `body`, `main`, or app wrappers hide the art, so make them transparent.
- Keep body text on cards or the header. Text straight on the art needs `dx-on-bg`.
- Text colours are AA (4.5:1) on `--dx-card` and `--dx-header` in both themes. Check any app colour you keep against `--dx-card-solid`.
- Bump `?v=` only when the kit changes in a breaking way; this README will say so.
