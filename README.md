# Dong Apps (GitHub Pages hub)

Personal launcher for all public web apps.

**Live:** https://dong-xuyong.github.io/

## Apps

| App | URL |
|-----|-----|
| Wiki Flashcards | https://dong-xuyong.github.io/wiki-flashcards/ |
| AF Braga | https://dong-xuyong.github.io/afbraga-flashcards/ |
| Chinese Library | https://dong-xuyong.github.io/chinese-library/ |
| GSI Study | https://dong-xuyong.github.io/gsi-study/ |
| Resume | https://dong-xuyong.github.io/Resume/ |

## Navigation

- On the hub: **Prev / Next**, arrow keys, then **Open** (or Enter / double-click).
- Browser **Back** returns to the hub after opening an app.

## Source

Maintained in the Second Brain repo under `apps-hub/`, deployed to
[`Dong-Xuyong/Dong-Xuyong.github.io`](https://github.com/Dong-Xuyong/Dong-Xuyong.github.io).

```bash
python scripts/sync_apps_hub.py
```

## Add an app

1. Append an entry to `apps.json`.
2. Run the sync script (or push this folder to the user Pages repo).
