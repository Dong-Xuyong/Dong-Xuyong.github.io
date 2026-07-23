(function () {
  "use strict";

  var apps = [];
  var active = 0;
  var list = document.getElementById("app-list");

  function clampIndex(i) {
    if (!apps.length) return 0;
    return (i + apps.length) % apps.length;
  }

  function setActive(i, opts) {
    opts = opts || {};
    active = clampIndex(i);
    var items = list.querySelectorAll(".app");
    items.forEach(function (item, idx) {
      var on = idx === active;
      item.classList.toggle("is-active", on);
      if (on) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
      item.tabIndex = on ? 0 : -1;
    });
    if (opts.focus && items[active]) items[active].focus({ preventScroll: true });
    if (opts.scroll && items[active]) {
      items[active].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function openActive() {
    if (!apps[active]) return;
    window.location.href = apps[active].url;
  }

  function render() {
    list.innerHTML = "";
    apps.forEach(function (app, idx) {
      var item = document.createElement("a");
      item.className = "app";
      item.href = app.url;
      item.style.setProperty("--card-accent", app.accent || "var(--accent)");
      item.style.setProperty("--app-accent", app.accent || "var(--accent)");
      item.innerHTML =
        '<span class="app-index">' + String(idx + 1).padStart(2, "0") + "</span>" +
        '<div class="app-copy">' +
          "<h2>" + escapeHtml(app.title) + "</h2>" +
          "<p>" + escapeHtml(app.blurb) + "</p>" +
        "</div>" +
        '<span class="app-meta">' +
          "<span>" + escapeHtml(app.tag || "App") + "</span>" +
          '<span class="app-arrow" aria-hidden="true">→</span>' +
        "</span>";

      item.addEventListener("focus", function () {
        setActive(idx);
      });
      item.addEventListener("mouseenter", function () {
        setActive(idx);
      });
      list.appendChild(item);
    });
    setActive(active);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  document.addEventListener("keydown", function (e) {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive(active - 1, { focus: true, scroll: true });
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setActive(active + 1, { focus: true, scroll: true });
    } else if (e.key === "Enter" && document.activeElement === document.body) {
      e.preventDefault();
      openActive();
    }
  });

  try {
    var saved = sessionStorage.getItem("dx-apps-active");
    if (saved != null) active = parseInt(saved, 10) || 0;
  } catch (e) {}

  window.addEventListener("pagehide", function () {
    try {
      sessionStorage.setItem("dx-apps-active", String(active));
    } catch (e) {}
  });

  function loadApps(attempt) {
    attempt = attempt || 1;
    fetch("apps.json", { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("Failed to load apps.json");
        return r.json();
      })
      .then(function (data) {
        apps = Array.isArray(data) ? data : [];
        if (active >= apps.length) active = 0;
        render();
      })
      .catch(function (err) {
        if (attempt < 3) {
          setTimeout(function () {
            loadApps(attempt + 1);
          }, 350 * attempt);
          return;
        }
        list.innerHTML =
          '<p class="error">Could not load apps. ' +
          escapeHtml(err.message || String(err)) +
          "</p>";
      });
  }

  loadApps();
})();
