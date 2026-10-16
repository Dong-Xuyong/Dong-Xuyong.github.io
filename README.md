# Dong Apps (GitHub Pages hub)

Personal launcher for all public web apps.

**Live:** https://dong-xuyong.github.io/

## Source

Maintained in the Second Brain repo under `apps-hub/`, deployed to
[`Dong-Xuyong/Dong-Xuyong.github.io`](https://github.com/Dong-Xuyong/Dong-Xuyong.github.io).

```bash
python scripts/sync_apps_hub.py
```

## Add an app

Add a link under the matching group in the collapsed All apps list in `index.html`: Study, Health, Career, Daily, Life, or Reference. Deadline rows live in the `MISSIONS` array in `hub.js` with `area: "Admin"`. Then run the sync script.
