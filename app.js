(function () {
  "use strict";

  var apps = [];
  var active = 0;
  var grid = document.getElementById("app-grid");
  var counter = document.getElementById("counter");
  var btnPrev = document.getElementById("btn-prev");
  var btnNext = document.getElementById("btn-next");
  var btnOpen = document.getElementById("btn-open");

  function clampIndex(i) {
    if (!apps.length) return 0;
    return (i + apps.length) % apps.length;
  }

  function setActive(i, opts) {
    opts = opts || {};
    active = clampIndex(i);
    var cards = grid.querySelectorAll(".app-card");
    cards.forEach(function (card, idx) {
      var on = idx === active;
      card.classList.toggle("is-active", on);
      card.setAttribute("aria-selected", on ? "true" : "false");
      card.tabIndex = on ? 0 : -1;
    });
    if (apps.length) {
      counter.textContent = active + 1 + " / " + apps.length;
      btnOpen.textContent = "Open " + apps[active].title;
      if (opts.focus && cards[active]) cards[active].focus({ preventScroll: true });
      if (opts.scroll && cards[active]) {
        cards[active].scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    } else {
      counter.textContent = "";
      btnOpen.textContent = "Open app";
    }
  }

  function openActive() {
    if (!apps[active]) return;
    window.location.href = apps[active].url;
  }

  function render() {
    grid.innerHTML = "";
    apps.forEach(function (app, idx) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "app-card";
      card.setAttribute("role", "option");
      card.style.setProperty("--card-accent", app.accent || "#d6ff4a");
      card.innerHTML =
        '<span class="app-index">' + String(idx + 1).padStart(2, "0") + "</span>" +
        '<div class="app-copy">' +
          "<h2>" + escapeHtml(app.title) + "</h2>" +
          "<p>" + escapeHtml(app.blurb) + "</p>" +
        "</div>" +
        '<span class="app-tag">' + escapeHtml(app.tag || "App") + "</span>" +
        '<span class="app-go">Press Enter to open →</span>';

      card.addEventListener("click", function () {
        if (active === idx) {
          openActive();
          return;
        }
        setActive(idx, { focus: true });
      });
      card.addEventListener("dblclick", openActive);
      grid.appendChild(card);
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

  btnPrev.addEventListener("click", function () {
    setActive(active - 1, { focus: true, scroll: true });
  });
  btnNext.addEventListener("click", function () {
    setActive(active + 1, { focus: true, scroll: true });
  });
  btnOpen.addEventListener("click", openActive);

  document.addEventListener("keydown", function (e) {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive(active - 1, { focus: true, scroll: true });
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      setActive(active + 1, { focus: true, scroll: true });
    } else if (e.key === "Enter") {
      e.preventDefault();
      openActive();
    }
  });

  // Restore last selection when returning via browser Back
  try {
    var saved = sessionStorage.getItem("dx-apps-active");
    if (saved != null) active = parseInt(saved, 10) || 0;
  } catch (e) {}

  window.addEventListener("pagehide", function () {
    try {
      sessionStorage.setItem("dx-apps-active", String(active));
    } catch (e) {}
  });

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
      grid.innerHTML =
        '<p class="footer">Could not load apps list. ' + escapeHtml(err.message || String(err)) + "</p>";
    });
})();
