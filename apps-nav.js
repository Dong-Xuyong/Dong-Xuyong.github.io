/**
 * Floating Apps switcher — load on any site:
 *   <script src="https://dong-xuyong.github.io/apps-nav.js" defer></script>
 * Optional: <body data-apps-nav-id="wiki-flashcards">
 */
(function () {
  "use strict";

  var HUB = "https://dong-xuyong.github.io/";
  var MANIFEST = HUB + "apps.json";
  var STYLE_ID = "dx-apps-nav-style";
  var ROOT_ID = "dx-apps-nav";

  function currentId(apps) {
    var forced = document.body && document.body.getAttribute("data-apps-nav-id");
    if (forced) return forced;
    var host = location.hostname;
    var path = location.pathname.replace(/\/+$/, "") || "/";
    for (var i = 0; i < apps.length; i++) {
      try {
        var u = new URL(apps[i].url);
        var p = u.pathname.replace(/\/+$/, "") || "/";
        if (u.hostname === host && (path === p || path.indexOf(p + "/") === 0)) {
          return apps[i].id;
        }
      } catch (e) {}
    }
    return null;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = document.createElement("style");
    css.id = STYLE_ID;
    css.textContent =
      "#" + ROOT_ID + "{" +
        "position:fixed;z-index:2147483000;left:50%;" +
        "bottom:max(76px,calc(env(safe-area-inset-bottom) + 64px));" +
        "transform:translateX(-50%);display:flex;align-items:center;gap:4px;" +
        "padding:6px;border-radius:999px;border:1px solid rgba(255,255,255,.14);" +
        "background:rgba(12,16,22,.88);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);" +
        "box-shadow:0 10px 30px rgba(0,0,0,.35);font:600 12px/1 system-ui,-apple-system,Segoe UI,sans-serif;" +
        "color:#e8eef7;user-select:none" +
      "}" +
      "#" + ROOT_ID + " a,#" + ROOT_ID + " button{" +
        "appearance:none;border:0;background:transparent;color:inherit;cursor:pointer;" +
        "text-decoration:none;display:inline-flex;align-items:center;justify-content:center;" +
        "min-width:36px;height:34px;padding:0 10px;border-radius:999px;gap:6px" +
      "}" +
      "#" + ROOT_ID + " a:hover,#" + ROOT_ID + " button:hover{background:rgba(255,255,255,.1)}" +
      "#" + ROOT_ID + " .dx-home{font-weight:700;letter-spacing:.02em}" +
      "#" + ROOT_ID + " .dx-sep{width:1px;height:18px;background:rgba(255,255,255,.16);margin:0 2px}" +
      "#" + ROOT_ID + " .dx-label{max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" +
        "opacity:.72;font-weight:500;padding:0 4px;pointer-events:none}" +
      "@media (max-width:420px){#" + ROOT_ID + " .dx-label{display:none}}";
    document.head.appendChild(css);
  }

  function render(apps) {
    if (!apps || !apps.length) return;
    var id = currentId(apps);
    var idx = -1;
    for (var i = 0; i < apps.length; i++) {
      if (apps[i].id === id) { idx = i; break; }
    }
    // On the hub itself, skip the floating bar
    if (location.hostname === "dong-xuyong.github.io" &&
        (location.pathname === "/" || location.pathname === "/index.html")) {
      return;
    }

    injectStyles();
    var existing = document.getElementById(ROOT_ID);
    if (existing) existing.remove();

    var root = document.createElement("nav");
    root.id = ROOT_ID;
    root.setAttribute("aria-label", "Apps switcher");

    var home = document.createElement("a");
    home.href = HUB;
    home.className = "dx-home";
    home.title = "All apps";
    home.textContent = "Apps";
    root.appendChild(home);

    var sep = document.createElement("span");
    sep.className = "dx-sep";
    sep.setAttribute("aria-hidden", "true");
    root.appendChild(sep);

    var prev = document.createElement("a");
    var next = document.createElement("a");
    if (idx >= 0) {
      var prevApp = apps[(idx - 1 + apps.length) % apps.length];
      var nextApp = apps[(idx + 1) % apps.length];
      prev.href = prevApp.url;
      prev.title = "Previous: " + prevApp.title;
      prev.setAttribute("aria-label", "Previous app: " + prevApp.title);
      prev.textContent = "←";
      next.href = nextApp.url;
      next.title = "Next: " + nextApp.title;
      next.setAttribute("aria-label", "Next app: " + nextApp.title);
      next.textContent = "→";

      var label = document.createElement("span");
      label.className = "dx-label";
      label.textContent = apps[idx].title;
      root.appendChild(prev);
      root.appendChild(label);
      root.appendChild(next);
    } else {
      prev.href = HUB;
      prev.textContent = "←";
      prev.title = "All apps";
      next.href = HUB;
      next.textContent = "→";
      next.title = "All apps";
      root.appendChild(prev);
      root.appendChild(next);
    }

    document.body.appendChild(root);
  }

  function boot() {
    fetch(MANIFEST, { credentials: "omit", cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(render)
      .catch(function () {
        // Offline / blocked: still offer a home link
        render([
          { id: "hub", title: "Apps", url: HUB, accent: "#fff" }
        ]);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
