/**
 * Phone hub for dong-xuyong.github.io.
 * Today checks are read-only. Missions is the editable deadline list.
 */
(function (root) {
  "use strict";

  var MISSIONS = [
    { label: "Renew AF Braga referee medical exam (EMD)", due: "2026-10-28" },
    { label: "Car IMT inspection (91-GQ-02)", due: "2026-10-27" },
  ];

  // Used only when journal.json has no usable habitDefs. Same ids as Journal.
  var DEFAULT_HABIT_IDS = [
    "thesis",
    "training",
    "food_logged",
    "weigh_in",
    "speaking",
    "sunlight",
    "protein_breakfast",
  ];

  var MORNING_FIELDS = [
    "mood",
    "energy",
    "feeling",
    "focus",
    "grateful",
    "makeGreat",
    "affirmation",
    "failureCost",
    "ifThen",
    "priorities",
  ];

  var EVENING_FIELDS = [
    "highlights",
    "better",
    "wins",
    "lesson",
    "chosenVsMomentum",
    "tomorrow",
  ];

  var LIST_FIELDS = { grateful: true, wins: true, tomorrow: true, priorities: true };

  function lisbonDay(date) {
    var fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Lisbon",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fmt.format(date);
  }

  function todayKey(now) {
    return lisbonDay(now || new Date());
  }

  function todayLabel(now) {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(now || new Date());
  }

  function daysLeft(today, due) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || !/^\d{4}-\d{2}-\d{2}$/.test(due)) return null;
    var a = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
    var b = Date.UTC(+due.slice(0, 4), +due.slice(5, 7) - 1, +due.slice(8, 10));
    return Math.round((b - a) / 86400000);
  }

  function activeMissions(today) {
    var rows = [];
    MISSIONS.forEach(function (mission) {
      if (!mission || typeof mission.label !== "string" || typeof mission.due !== "string") return;
      var left = daysLeft(today, mission.due);
      if (left == null || left < 0) return;
      rows.push({ label: mission.label, due: mission.due, days: left });
    });
    rows.sort(function (a, b) {
      return a.days - b.days || a.due.localeCompare(b.due);
    });
    return rows;
  }

  function countdown(days) {
    if (days === 0) return "today";
    if (days === 1) return "1 day";
    return days + " days";
  }

  function isRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function textFilled(value) {
    return String(value == null ? "" : value).trim() !== "";
  }

  function listFilled(value) {
    if (Array.isArray(value)) {
      return value.some(function (line) {
        return textFilled(line);
      });
    }
    return textFilled(value);
  }

  function fieldFilled(key, value) {
    if (key === "mood" || key === "energy") {
      var score = typeof value === "number" ? value : typeof value === "string" && /^\d$/.test(value.trim()) ? +value : NaN;
      return score === 1 || score === 2 || score === 3 || score === 4 || score === 5;
    }
    if (LIST_FIELDS[key]) return listFilled(value);
    return textFilled(value);
  }

  function fieldsOf(entry) {
    if (!isRecord(entry)) return {};
    if (isRecord(entry.fields)) return entry.fields;
    return entry;
  }

  function dayEntry(file, today) {
    if (!isRecord(file) || !isRecord(file.entries)) return null;
    var entry = file.entries[today];
    return isRecord(entry) ? entry : null;
  }

  function sectionFilled(entry, keys) {
    var fields = fieldsOf(entry);
    var i;
    for (i = 0; i < keys.length; i++) {
      if (fieldFilled(keys[i], fields[keys[i]])) return true;
    }
    return false;
  }

  function habitIds(file) {
    var raw = file && file.habitDefs;
    var out = [];
    var i;
    if (!Array.isArray(raw)) return DEFAULT_HABIT_IDS.slice();
    for (i = 0; i < raw.length; i++) {
      var item = raw[i];
      if (item && typeof item.id === "string" && item.id) out.push(item.id);
    }
    return out.length ? out : DEFAULT_HABIT_IDS.slice();
  }

  function habitsLeft(file, today) {
    var ids = habitIds(file);
    var entry = dayEntry(file, today);
    var habits = entry && isRecord(entry.habits) ? entry.habits : null;
    var left = 0;
    var i;
    if (!habits) return ids.length;
    for (i = 0; i < ids.length; i++) {
      if (habits[ids[i]] !== true) left += 1;
    }
    return left;
  }

  function mealsLogged(file, today) {
    if (!isRecord(file) || !isRecord(file.days)) return false;
    var day = file.days[today];
    if (!isRecord(day)) return false;
    var meals = day.meals;
    var keys;
    var i;
    if (Array.isArray(meals)) return meals.some(Boolean);
    if (!isRecord(meals)) return false;
    keys = Object.keys(meals);
    for (i = 0; i < keys.length; i++) {
      var list = meals[keys[i]];
      if (Array.isArray(list) && list.length > 0) return true;
    }
    return false;
  }

  function trainingLogged(file, today) {
    if (!isRecord(file) || !isRecord(file.sessions)) return false;
    return isRecord(file.sessions[today]);
  }

  function dueDay(due) {
    var ms;
    var parsed;
    var day;
    if (typeof due === "number" && isFinite(due)) {
      ms = due > 0 && due < 1e12 ? due * 1000 : due;
      day = lisbonDay(new Date(ms));
      return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
    }
    if (typeof due === "string") {
      day = due.trim().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
      parsed = Date.parse(due);
      if (!isNaN(parsed)) return lisbonDay(new Date(parsed));
    }
    return null;
  }

  function dueOnOrBefore(due, today) {
    var day = dueDay(due);
    return !!day && day <= today;
  }

  function eachValue(collection, visit) {
    if (Array.isArray(collection)) {
      collection.forEach(visit);
      return true;
    }
    if (!isRecord(collection)) return false;
    Object.keys(collection).forEach(function (key) {
      visit(collection[key]);
    });
    return true;
  }

  function wikiDueCount(file, today) {
    var saw = false;
    var count = 0;
    if (!eachValue(file && file.cards, function (card) {
      if (!isRecord(card) || !Object.prototype.hasOwnProperty.call(card, "due")) return;
      saw = true;
      if (card.st === "known") return;
      var studied = (typeof card.reps === "number" && card.reps > 0) || card.st === "unknown";
      if (!studied) return;
      if (dueOnOrBefore(card.due, today)) count += 1;
    })) return null;
    return saw ? count : null;
  }

  function chineseDueCount(file, today) {
    var saw = false;
    var count = 0;
    if (!eachValue(file && file.srs, function (card) {
      if (!isRecord(card) || !Object.prototype.hasOwnProperty.call(card, "due")) return;
      saw = true;
      if (dueOnOrBefore(card.due, today)) count += 1;
    })) return null;
    return saw ? count : null;
  }

  function speakingStatus(raw, today) {
    var parsed;
    var checkins;
    if (raw == null) return { skip: true };
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return { skip: true };
    }
    if (!isRecord(parsed)) return { skip: true };
    checkins = Array.isArray(parsed.checkins) ? parsed.checkins : [];
    return {
      skip: false,
      done: checkins.indexOf(today) !== -1,
    };
  }

  function item(id, badge, label, href) {
    return { id: id, badge: badge, label: label, href: href };
  }

  /**
   * sources.journal / nutrition / streetlifting / wiki / chinese are parsed
   * JSON or null when the file is missing. A true *Error flag means that
   * read failed and the check must stay unknown.
   * speakingRaw is the localStorage string, or null/undefined when absent.
   */
  function missingItems(sources, today) {
    var items = [];
    var unknown = false;
    var wikiCount;
    var chineseCount;
    var left;
    var speaking;

    if (sources.journalError) unknown = true;
    else {
      if (!sectionFilled(dayEntry(sources.journal, today), MORNING_FIELDS)) {
        items.push(item("morning", "open", "Morning journal", "/journal/#day/" + today));
      }
      if (!sectionFilled(dayEntry(sources.journal, today), EVENING_FIELDS)) {
        items.push(item("evening", "open", "Evening journal", "/journal/#day/" + today));
      }
      left = habitsLeft(sources.journal, today);
      if (left > 0) {
        items.push(item("habits", String(left), "Habits not ticked", "/journal/#habits"));
      }
    }

    if (sources.nutritionError) unknown = true;
    else if (!mealsLogged(sources.nutrition, today)) {
      items.push(item("meals", "open", "Meals not logged", "/nutrition/#" + today));
    }

    if (sources.streetError) unknown = true;
    else if (!trainingLogged(sources.streetlifting, today)) {
      items.push(item("training", "open", "Training not logged", "/streetlifting/"));
    }

    speaking = speakingStatus(sources.speakingRaw, today);
    if (!speaking.skip && !speaking.done) {
      items.push(item("speaking", "open", "Speaking practice", "/speaking-analysis/"));
    }

    if (sources.wikiError) unknown = true;
    else {
      wikiCount = wikiDueCount(sources.wiki, today);
      if (wikiCount > 0) {
        items.push(item("wiki", String(wikiCount), "Wiki cards due", "/wiki-flashcards/"));
      }
    }

    if (sources.chineseError) unknown = true;
    else {
      chineseCount = chineseDueCount(sources.chinese, today);
      if (chineseCount > 0) {
        items.push(item("chinese", String(chineseCount), "Mandarin cards due", "/chinese-library/"));
      }
    }

    return { items: items, unknown: unknown };
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function renderMissions(today) {
    var host = document.getElementById("missions");
    var rows = activeMissions(today);
    var list;
    if (!host) return;
    host.textContent = "";
    if (!rows.length) {
      host.hidden = true;
      return;
    }
    host.hidden = false;
    host.appendChild(el("h2", "", "Missions"));
    list = el("ul", "mission-list");
    rows.forEach(function (row) {
      var li = el("li");
      var badge = el("span", "badge" + (row.days <= 3 ? " badge-soon" : ""), countdown(row.days));
      li.appendChild(badge);
      li.appendChild(el("span", "row-label", row.label));
      list.appendChild(li);
    });
    host.appendChild(list);
  }

  function renderToday(state) {
    var host = document.getElementById("today-body");
    var list;
    var hint;
    if (!host) return;
    host.textContent = "";
    host.removeAttribute("data-today");

    if (!state.connected) {
      hint = el("p", "sync-hint");
      hint.appendChild(el("a", "", "Connect sync"));
      hint.lastChild.href = "/journal/";
      hint.appendChild(document.createTextNode(" to load today."));
      host.appendChild(hint);
      host.setAttribute("data-today", "hint");
    }

    if (state.loading) {
      host.appendChild(el("p", "sync-hint", "Checking today…"));
      host.setAttribute("data-today", "loading");
      return;
    }

    if (state.note) host.appendChild(el("p", "sync-hint", state.note));

    if (!state.items.length && state.connected && !state.unknown) {
      host.appendChild(el("p", "all-done", "All done today"));
      host.setAttribute("data-today", "done");
      return;
    }

    if (!state.items.length && state.connected && state.unknown && !state.loading) {
      host.setAttribute("data-today", "error");
    }

    if (state.items.length) {
      list = el("ul", "today-list");
      state.items.forEach(function (row) {
        var li = el("li");
        var link = el("a", "today-link");
        link.href = row.href;
        link.appendChild(el("span", "badge", row.badge));
        link.appendChild(el("span", "row-label", row.label));
        li.appendChild(link);
        list.appendChild(li);
      });
      host.appendChild(list);
      if (host.getAttribute("data-today") !== "hint") host.setAttribute("data-today", "open");
    }
  }

  function readSpeakingRaw() {
    try {
      if (!root.localStorage) return null;
      return root.localStorage.getItem("speaking-coach-practice");
    } catch (e) {
      return null;
    }
  }

  function loadToday(today) {
    var cfg = root.GhSync && root.GhSync.readConfig ? root.GhSync.readConfig() : null;
    var speakingRaw = readSpeakingRaw();
    if (!cfg) {
      var offline = missingItems(
        {
          speakingRaw: speakingRaw,
          journalError: true,
          nutritionError: true,
          streetError: true,
          wikiError: true,
          chineseError: true,
        },
        today
      );
      renderToday({ connected: false, items: offline.items, unknown: true });
      return;
    }

    renderToday({ connected: true, loading: true, items: [], unknown: true });

    var names = [
      ["journal", "journal"],
      ["nutrition", "nutrition"],
      ["streetlifting", "streetlifting"],
      ["wiki", "wiki-flashcards"],
      ["chinese", "chinese-library"],
    ];

    Promise.all(
      names.map(function (pair) {
        return root.GhSync.fetchJson(cfg, pair[1]).then(
          function (data) {
            return { key: pair[0], data: data, error: false };
          },
          function () {
            return { key: pair[0], data: null, error: true };
          }
        );
      })
    ).then(function (results) {
      var sources = { speakingRaw: speakingRaw };
      var failed = [];
      results.forEach(function (result) {
        sources[result.key] = result.data;
        if (result.key === "journal") sources.journalError = result.error;
        if (result.key === "nutrition") sources.nutritionError = result.error;
        if (result.key === "streetlifting") sources.streetError = result.error;
        if (result.key === "wiki") sources.wikiError = result.error;
        if (result.key === "chinese") sources.chineseError = result.error;
        if (result.error) failed.push(result.key);
      });
      var report = missingItems(sources, today);
      renderToday({
        connected: true,
        items: report.items,
        unknown: report.unknown,
        note: failed.length ? "Some logs could not be read." : "",
      });
    });
  }

  function boot() {
    var now = new Date();
    var today = todayKey(now);
    var date = document.getElementById("today-date");
    if (date) date.textContent = todayLabel(now);
    renderMissions(today);
    loadToday(today);
  }

  var api = {
    MISSIONS: MISSIONS,
    todayKey: todayKey,
    todayLabel: todayLabel,
    daysLeft: daysLeft,
    activeMissions: activeMissions,
    countdown: countdown,
    missingItems: missingItems,
    sectionFilled: sectionFilled,
    mealsLogged: mealsLogged,
    trainingLogged: trainingLogged,
    wikiDueCount: wikiDueCount,
    chineseDueCount: chineseDueCount,
    speakingStatus: speakingStatus,
    habitsLeft: habitsLeft,
    boot: boot,
  };

  root.Hub = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }
})(typeof window !== "undefined" ? window : globalThis);
