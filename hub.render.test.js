// Renders the home with today-check data and asserts the missing sheet stays off.
var assert = require("assert");

function makeEl(tag) {
  var node = {
    tagName: String(tag || "div").toUpperCase(),
    nodeType: 1,
    id: "",
    className: "",
    hidden: false,
    title: "",
    href: "",
    children: [],
    attrs: {},
    _text: "",
    appendChild: function (child) {
      this.children.push(child);
      return child;
    },
    setAttribute: function (name, value) {
      this.attrs[name] = String(value);
    },
    getAttribute: function (name) {
      return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null;
    },
    removeAttribute: function (name) {
      delete this.attrs[name];
    },
    addEventListener: function () {},
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
  };
  node.classList = {
    toggle: function (name, force) {
      var parts = node.className.split(/\s+/).filter(Boolean);
      var has = parts.indexOf(name) !== -1;
      var on = force === undefined ? !has : !!force;
      if (on && !has) parts.push(name);
      if (!on) parts = parts.filter(function (part) { return part !== name; });
      node.className = parts.join(" ");
      return on;
    },
    add: function (name) { node.classList.toggle(name, true); },
    remove: function (name) { node.classList.toggle(name, false); },
  };
  Object.defineProperty(node, "textContent", {
    get: function () {
      if (this.children.length) {
        return this.children.map(function (child) {
          return child.textContent || "";
        }).join("");
      }
      return this._text;
    },
    set: function (value) {
      this._text = value == null ? "" : String(value);
      this.children = [];
    },
  });
  return node;
}

function lisbonToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function mount() {
  var ids = ["greet-hello", "today-date", "journal-card", "journal-line", "focus", "missions", "today-weather"];
  var byId = {};
  ids.forEach(function (id) {
    var node = makeEl(id === "focus" ? "section" : "div");
    node.id = id;
    byId[id] = node;
  });
  global.document = {
    readyState: "complete",
    getElementById: function (id) { return byId[id] || null; },
    createElement: function (tag) { return makeEl(tag); },
    createTextNode: function (text) { return { nodeType: 3, textContent: String(text), children: [] }; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: function () {},
  };
  global.localStorage = {
    getItem: function () { return null; },
    setItem: function () {},
  };
  global.fetch = function () {
    return Promise.resolve({
      ok: false,
      json: function () { return Promise.resolve(null); },
    });
  };
  global.GhSync = {
    readConfig: function () {
      return { token: "test-token", repo: "Dong-Xuyong/progress-sync" };
    },
    fetchJson: function (cfg, appId) {
      var today = lisbonToday();
      var files = {
        "crew-log": {
          jobs: [{ title: "File the harbour form", due: "2020-01-01", status: "open" }],
        },
        journal: { entries: {} },
        nutrition: { days: {} },
        streetlifting: { sessions: {} },
        "wiki-flashcards": { cards: { a: { due: today, reps: 1, st: "learning" } } },
        "chinese-library": { srs: { a: { due: today } } },
        piano: { sessions: {} },
        "referee-games": { games: [] },
        career: { jobs: [] },
        mirror: { days: {} },
      };
      return Promise.resolve(Object.prototype.hasOwnProperty.call(files, appId) ? files[appId] : null);
    },
  };
  delete require.cache[require.resolve("./hub.js")];
  require("./hub.js");
  return byId;
}

function walk(node, visit) {
  if (!node || node.nodeType === 3) return;
  visit(node);
  (node.children || []).forEach(function (child) { walk(child, visit); });
}

function flush() {
  return new Promise(function (resolve) { setTimeout(resolve, 30); });
}

mount();
flush().then(function () {
  var Hub = require("./hub.js");
  var byId = {
    focus: document.getElementById("focus"),
    missions: document.getElementById("missions"),
  };
  var missions = byId.missions;
  var focus = byId.focus;
  var classes = [];
  var sheetLabels = ["Journal", "Health", "Study", "Mandarin", "Practice", "Referee"];
  walk(missions, function (node) {
    if (node.className) classes.push(node.className);
  });
  walk(focus, function (node) {
    if (node.className) classes.push(node.className);
  });

  assert.strictEqual(document.getElementById("alerts"), null);
  assert.strictEqual(document.getElementById("bundle"), null);
  assert.strictEqual(missions.hidden, false);
  assert.ok(/^Pendentes · \d+ · (overdue|today|next in \d+d)$/.test(missions.children[0].children[0].getAttribute("aria-label")));
  assert.ok(missions.textContent.indexOf("Pendentes · ") !== -1);
  assert.ok(missions.textContent.indexOf("Renew AF Braga referee medical exam (EMD)") !== -1);
  assert.ok(missions.textContent.indexOf("Car IMT inspection") !== -1);
  assert.ok(missions.textContent.indexOf("File the harbour form") !== -1);
  assert.ok(missions.textContent.indexOf("Admin") !== -1);
  assert.ok(missions.textContent.indexOf("Crew") !== -1);
  assert.strictEqual(missions.textContent.indexOf("missing"), -1);
  assert.ok(classes.indexOf("sheet missions-details") !== -1);
  assert.strictEqual(classes.filter(function (name) { return name.indexOf("alert-group") !== -1; }).length, 0);
  assert.strictEqual(missions.children[0].getAttribute("open"), null);

  sheetLabels.forEach(function (area) {
    assert.strictEqual(missions.textContent.indexOf(area + " · "), -1, area);
    assert.strictEqual(focus.textContent.indexOf(area + " · "), -1, area);
  });

  var todayLabels = [
    "Morning journal",
    "Evening journal",
    "Habits not ticked",
    "Meals not logged",
    "Training not logged",
    "Wiki cards",
    "Mandarin cards",
    "Speaking practice",
    "Piano practice",
  ];
  var shown = todayLabels.filter(function (label) {
    return focus.textContent.indexOf(label) !== -1 || missions.textContent.indexOf(label) !== -1;
  });
  assert.ok(shown.length <= 1, "today-check rows on home: " + shown.join(", ") + " focus=" + focus.textContent);
  todayLabels.forEach(function (label) {
    assert.strictEqual(missions.textContent.indexOf(label), -1, label);
  });
  assert.ok(focus.textContent.indexOf("All done today") === -1);
  assert.strictEqual(Hub.missionHeadline([{ days: -1 }]), "Pendentes · 1 · overdue");
  console.log("hub.render.test.js: ok");
}).catch(function (err) {
  console.error(err);
  process.exit(1);
});
