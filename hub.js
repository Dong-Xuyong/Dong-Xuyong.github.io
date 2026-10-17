/**
 * Phone hub for dong-xuyong.github.io.
 * Today checks are read-only. Missions is the editable deadline list.
 */
(function (root) {
  "use strict";

  var MISSIONS = [
    { label: "Renew AF Braga referee medical exam (EMD)", due: "2026-10-28", area: "Admin" },
    { label: "Car IMT inspection", due: "2026-10-27", area: "Admin" },
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

  // Some engines still report midnight as 24.
  function lisbonHour(date) {
    var fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      hour: "2-digit",
      hourCycle: "h23",
    });
    var parts = fmt.formatToParts(date);
    var i;
    var hour = NaN;
    for (i = 0; i < parts.length; i++) {
      if (parts[i].type === "hour") hour = +parts[i].value;
    }
    if (hour === 24) return 0;
    return hour;
  }

  // 5–11 morning, 12–17 afternoon, otherwise evening. Hour is a Lisbon hour.
  function greeting(hour) {
    var h = hour;
    if (typeof h !== "number" || !isFinite(h)) h = lisbonHour(new Date());
    if (h === 24) h = 0;
    if (h >= 5 && h <= 11) return "Good morning";
    if (h >= 12 && h <= 17) return "Good afternoon";
    return "Good evening";
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

  function activeMissions(today, extra) {
    var rows = [];
    var missions = Array.isArray(extra) ? MISSIONS.concat(extra) : MISSIONS;
    missions.forEach(function (mission) {
      var left;
      var row;
      if (!mission || typeof mission.label !== "string" || typeof mission.due !== "string") return;
      left = daysLeft(today, mission.due);
      if (left == null) return;
      row = { label: mission.label, due: mission.due, days: left };
      if (typeof mission.area === "string" && mission.area) row.area = mission.area;
      if (typeof mission.href === "string" && mission.href) row.href = mission.href;
      rows.push(row);
    });
    rows.sort(function (a, b) {
      return a.days - b.days || a.due.localeCompare(b.due);
    });
    return rows;
  }

  function countdown(days) {
    if (days === 0) return "today";
    if (days === 1) return "1 day";
    if (days === -1) return "1 day overdue";
    if (days < 0) return (-days) + " days overdue";
    return days + " days";
  }

  function crewMissions(file) {
    var jobs;
    var out = [];
    var i;
    var job;
    var title;
    var due;
    var label;
    if (!isRecord(file) || !Array.isArray(file.jobs)) return [];
    jobs = file.jobs;
    for (i = 0; i < jobs.length; i++) {
      job = jobs[i];
      if (!isRecord(job)) continue;
      title = job.title;
      if (typeof title !== "string" || title.trim() === "") continue;
      due = job.due;
      if (typeof due !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(due)) continue;
      if (job.status === "complete" || job.status === "cancelled" || job.status === "done") continue;
      label = title.replace(/^\d{4}-\d{2}-\d{2} /, "");
      if (!label) label = title;
      out.push({ label: label, due: due, href: "/crew-log/", area: "Crew" });
    }
    return out;
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

  // journal.json quotes["YYYY-MM-DD"].text. Same field as Journal
  // (Dong-Xuyong/journal). Empty when the day has no quote.
  var JOURNAL_CARD_EMPTY = "Journal · write today";

  function quoteOfDay(file, today) {
    var quote;
    var text;
    if (!isRecord(file) || !isRecord(file.quotes)) return "";
    quote = file.quotes[today];
    if (!isRecord(quote) || typeof quote.text !== "string") return "";
    text = quote.text.replace(/\s+/g, " ").trim();
    return text;
  }

  function journalCardText(file, today) {
    return quoteOfDay(file, today) || JOURNAL_CARD_EMPTY;
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
    var id;
    for (i = 0; i < ids.length; i++) {
      id = ids[i];
      if (id === "training" || id === "food_logged" || id === "speaking") continue;
      if (!habits || habits[id] !== true) left += 1;
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

  function dayStamp(value) {
    if (typeof value !== "string") return "";
    var day = value.trim().slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : "";
  }

  function finiteNumber(value) {
    if (typeof value === "number" && isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && isFinite(+value)) return +value;
    return null;
  }

  // A calendar day stays as written. A timestamp is the Lisbon day it falls on.
  function practiceDay(value) {
    var trimmed;
    var parsed;
    if (typeof value === "number") return lisbonDayFromMs(value);
    if (typeof value !== "string") return "";
    trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{4}-\d{2}-\d{2}[T ]/.test(trimmed)) {
      parsed = Date.parse(trimmed);
      if (!isNaN(parsed)) return lisbonDay(new Date(parsed));
    }
    return dayStamp(trimmed);
  }

  // Legacy on-device check-in blob. Usopp does not use this key.
  function speakingDone(raw, today) {
    var parsed;
    var checkins;
    var i;
    if (raw == null || raw === "") return false;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return false;
    }
    if (!isRecord(parsed)) return false;
    checkins = Array.isArray(parsed.checkins) ? parsed.checkins : [];
    for (i = 0; i < checkins.length; i++) {
      if (practiceDay(checkins[i]) === today) return true;
    }
    return false;
  }

  // A bare array, or any list hanging off an object. Anything else is empty.
  function listsIn(file) {
    var out = [];
    var keys;
    var i;
    if (file == null || file === "") return out;
    if (typeof file === "string") {
      try {
        return listsIn(JSON.parse(file));
      } catch (e) {
        return out;
      }
    }
    if (Array.isArray(file)) {
      out.push(file);
      return out;
    }
    if (!isRecord(file)) return out;
    keys = Object.keys(file);
    for (i = 0; i < keys.length; i++) {
      if (Array.isArray(file[keys[i]])) out.push(file[keys[i]]);
    }
    return out;
  }

  // requireDone is reps.json: the row's date must match and done must be true.
  // index.json sessions count when date matches, even without a done flag.
  function listHasPractice(list, today, requireDone) {
    var i;
    var row;
    if (!Array.isArray(list)) return false;
    for (i = 0; i < list.length; i++) {
      row = list[i];
      if (!isRecord(row)) continue;
      if (practiceDay(row.date) !== today) continue;
      if (requireDone && row.done !== true) continue;
      return true;
    }
    return false;
  }

  function practiceListHas(file, today, requireDone) {
    var lists;
    var i;
    try {
      lists = listsIn(file);
    } catch (e) {
      return false;
    }
    for (i = 0; i < lists.length; i++) {
      if (listHasPractice(lists[i], today, requireDone)) return true;
    }
    return false;
  }

  function speakingHabitOn(sources, today) {
    var journalEntry;
    if (!sources || sources.journalError) return false;
    journalEntry = dayEntry(sources.journal, today);
    return !!(journalEntry && isRecord(journalEntry.habits) && journalEntry.habits.speaking === true);
  }

  // Usopp does not write practice into progress-sync. A Lisbon day is done
  // when any of these is true: localStorage speaking-done:YYYY-MM-DD === "1",
  // reps.json has that date with done true, or index.json has a session that day.
  function speakingLogged(sources, today) {
    if (!sources || typeof today !== "string") return false;
    try {
      if (sources.speakingMark === true) return true;
      if (practiceListHas(sources.speakingCatalog, today, false)) return true;
      if (practiceListHas(sources.speakingPractice, today, true)) return true;
    } catch (e) {
      return false;
    }
    return false;
  }

  function speakingStatus(sources, today) {
    var done = false;
    try {
      done = speakingHabitOn(sources, today) || speakingLogged(sources, today);
    } catch (e) {
      done = false;
    }
    return {
      done: done,
      label: "Speaking practice",
      href: "/speaking-analysis/",
      badge: done ? "✓" : "open",
      action: done ? "✓" : "Go",
    };
  }

  // piano.json sessions are keyed by YYYY-MM-DD. A day is logged when minutes > 0.
  function pianoLogged(file, today) {
    var sessions;
    var session;
    var i;
    var minutes;
    if (!isRecord(file)) return false;
    sessions = file.sessions;
    session = null;
    if (Array.isArray(sessions)) {
      for (i = 0; i < sessions.length; i++) {
        if (isRecord(sessions[i]) && dayStamp(sessions[i].date) === today) session = sessions[i];
      }
    } else if (isRecord(sessions)) {
      session = sessions[today];
    } else {
      return false;
    }
    if (typeof session === "number") return session > 0;
    if (!isRecord(session)) return false;
    minutes = finiteNumber(session.minutes);
    return minutes != null && minutes > 0;
  }

  function item(id, badge, label, href) {
    return { id: id, badge: badge, label: label, href: href };
  }

  function gameTimeKey(time) {
    var match;
    var hour;
    if (typeof time !== "string") return "99:99";
    match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
    if (!match) return "99:99";
    hour = match[1].length === 1 ? "0" + match[1] : match[1];
    return hour + ":" + match[2];
  }

  function formatGameDate(date) {
    var parsed = new Date(date + "T12:00:00Z");
    if (isNaN(parsed.getTime())) return date;
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Lisbon",
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(parsed);
  }

  function gameBadge(days) {
    if (days === 0) return "today";
    if (days === 1) return "tomorrow";
    if (days > 1) return "in " + days + "d";
    return "";
  }

  // Games are upcoming when the Lisbon date is today or later. Next is the
  // soonest of those; null when none.
  function nextGameItem(file, today) {
    var games;
    var i;
    var future;
    var futureKey;
    var chosen;
    var day;
    var home;
    var away;
    var time;
    var days;
    var detail;
    var row;
    if (!isRecord(file) || !Array.isArray(file.games)) return null;
    games = file.games;
    future = null;
    futureKey = "";
    for (i = 0; i < games.length; i++) {
      var game = games[i];
      var key;
      if (!isRecord(game)) continue;
      day = dayStamp(game.date);
      if (!day) continue;
      if (day < today) continue;
      home = typeof game.home === "string" ? game.home.trim() : "";
      away = typeof game.away === "string" ? game.away.trim() : "";
      if (!home || !away) continue;
      key = day + "T" + gameTimeKey(game.time);
      if (!future || key < futureKey) {
        future = game;
        futureKey = key;
      }
    }
    chosen = future;
    if (!chosen) return null;
    day = dayStamp(chosen.date);
    home = chosen.home.trim();
    away = chosen.away.trim();
    time = typeof chosen.time === "string" ? chosen.time.trim() : "";
    days = daysLeft(today, day);
    detail = home + " x " + away + ", " + formatGameDate(day);
    if (time) detail += ", " + time;
    row = item("next-game", gameBadge(days), "Next game", "/referee-games/");
    row.detail = detail;
    return row;
  }

  var CARD_GOAL = 20;
  var TRAIN_TARGETS = { calories: 2050, protein: 150, carbs: 225, fat: 60 };
  var REST_TARGETS = { calories: 1650, protein: 150, carbs: 130, fat: 60 };

  function positiveNum(value) {
    var n = finiteNumber(value);
    return n != null && n > 0 ? n : 0;
  }

  function epochMs(value) {
    var n = finiteNumber(value);
    if (n == null) return null;
    if (n > 0 && n < 1e12) return n * 1000;
    return n;
  }

  function lisbonDayFromMs(value) {
    var ms = epochMs(value);
    if (ms == null) return "";
    return lisbonDay(new Date(ms));
  }

  function exerciseRole(name) {
    var n = String(name || "").toLowerCase();
    if (/\b(walk|walking)\b/.test(n)) return "walk";
    if (/\bmobility\b|\bstretch(?:ing)?\b/.test(n)) return "mobility";
    if (/\bwork(?:\s|-)?shift\b|\bshift\b/.test(n) || /\bwork\b/.test(n)) return "work";
    if (/\brun(?:ning)?\b|\bjog(?:ging)?\b/.test(n)) return "run";
    return "other";
  }

  function durationMinutes(entry) {
    var mins;
    if (!isRecord(entry)) return null;
    mins = finiteNumber(entry.durationMin);
    if (mins != null && mins > 0) return mins;
    mins = finiteNumber(entry.minutes);
    if (mins != null && mins > 0) return mins;
    return null;
  }

  function entryTrains(entry) {
    var minutes;
    if (!isRecord(entry)) return false;
    if (exerciseRole(entry.name || entry.type || "") !== "run") return false;
    minutes = durationMinutes(entry);
    return minutes != null && minutes >= 30;
  }

  function normalizeDayType(value) {
    var v;
    if (typeof value !== "string") return null;
    v = value.trim().toLowerCase();
    if (v === "training" || v === "active" || v === "train") return "training";
    if (v === "rest" || v === "rest-day" || v === "off") return "rest";
    return null;
  }

  function countSets(session) {
    var lifts;
    var n = 0;
    if (!isRecord(session) || !isRecord(session.lifts)) return 0;
    lifts = session.lifts;
    Object.keys(lifts).forEach(function (name) {
      if (Array.isArray(lifts[name])) n += lifts[name].length;
    });
    return n;
  }

  function hasStreetSession(session) {
    if (!isRecord(session)) return false;
    if (countSets(session) > 0) return true;
    if (positiveNum(session.liftKcal) > 0) return true;
    return Array.isArray(session.activities) && session.activities.length > 0;
  }

  function streetSession(file, today) {
    if (!isRecord(file) || !isRecord(file.sessions)) return null;
    return isRecord(file.sessions[today]) ? file.sessions[today] : null;
  }

  function inferDayType(day, session) {
    var list;
    var activities;
    var i;
    var activity;
    if (hasStreetSession(session)) return "training";
    list = day && Array.isArray(day.exercise) ? day.exercise : [];
    for (i = 0; i < list.length; i++) {
      if (entryTrains(list[i])) return "training";
    }
    activities = session && Array.isArray(session.activities) ? session.activities : [];
    for (i = 0; i < activities.length; i++) {
      activity = activities[i];
      if (!isRecord(activity)) continue;
      if (entryTrains({
        name: activity.type || activity.name,
        durationMin: activity.durationMin,
        minutes: activity.minutes,
      })) return "training";
    }
    return "rest";
  }

  // NutritionCore.resolveDayType: dayType wins, else a streetlifting session
  // or a run of 30 minutes or more. Anything else is a rest day.
  function resolveDayType(day, session) {
    var override = normalizeDayType(day && day.dayType);
    if (override) return override;
    return inferDayType(day, session);
  }

  function dayTargets(goals, type) {
    var g = isRecord(goals) ? goals : {};
    var rest = isRecord(g.restDay) ? g.restDay : {};
    var base = type === "rest" ? REST_TARGETS : TRAIN_TARGETS;
    var source = type === "rest" ? rest : g;
    return {
      calories: positiveNum(source.calories) || base.calories,
      protein: positiveNum(source.protein) || base.protein,
      carbs: positiveNum(source.carbs) || base.carbs,
      fat: positiveNum(source.fat) || base.fat,
    };
  }

  function nutritionDay(file, today) {
    if (!isRecord(file) || !isRecord(file.days)) return null;
    return isRecord(file.days[today]) ? file.days[today] : null;
  }

  function mealTotals(day) {
    var totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    var meals = day && day.meals;
    function addItem(entry) {
      if (!isRecord(entry)) return;
      totals.kcal += finiteNumber(entry.kcal) || 0;
      totals.protein += finiteNumber(entry.protein) || 0;
      totals.carbs += finiteNumber(entry.carbs) || 0;
      totals.fat += finiteNumber(entry.fat) || 0;
    }
    function addList(list) {
      var i;
      if (!Array.isArray(list)) return;
      for (i = 0; i < list.length; i++) addItem(list[i]);
    }
    if (Array.isArray(meals)) addList(meals);
    else if (isRecord(meals)) {
      Object.keys(meals).forEach(function (key) {
        addList(meals[key]);
      });
    }
    return totals;
  }

  function macroBit(letter, left) {
    var n = Math.round(left);
    if (n <= 0) return letter + " ✓";
    return letter + " " + n + "g";
  }

  // A missing file or a missing day counts as nothing eaten, so the row shows
  // the full targets. Once calories and every macro are met, the row is done.
  function foodLeftItem(nutrition, street, today) {
    var day = nutritionDay(nutrition, today);
    var type = resolveDayType(day, streetSession(street, today));
    var targets = dayTargets(isRecord(nutrition) ? nutrition.goals : null, type);
    var eaten = mealTotals(day);
    var leftCal = targets.calories - eaten.kcal;
    var leftP = targets.protein - eaten.protein;
    var leftC = targets.carbs - eaten.carbs;
    var leftF = targets.fat - eaten.fat;
    var row;
    if (Math.round(leftCal) <= 0 && Math.round(leftP) <= 0 && Math.round(leftC) <= 0 && Math.round(leftF) <= 0) {
      return null;
    }
    row = item("food", Math.max(0, Math.round(leftCal)) + " kcal", "Food left", "/health/nutrition/");
    row.detail = "Left: " + [macroBit("P", leftP), macroBit("C", leftC), macroBit("F", leftF)].join(" · ");
    return row;
  }

  // null reviewedToday means this file has no review timestamps and no review log.
  function cardQuota(due, reviewedToday) {
    if (due == null) return null;
    if (due <= 0) return 0;
    if (reviewedToday == null) return Math.min(due, CARD_GOAL);
    return Math.min(due, Math.max(0, CARD_GOAL - reviewedToday));
  }

  function cardTodoItem(id, name, left, href) {
    return item(id, String(left), name + ": " + left + " to do", href);
  }

  // wiki-flashcards.json analytics.events: { t, type: "review" }.
  // Count reviews whose timestamp falls on today in Europe/Lisbon.
  // Without that log, count cards whose last timestamp is today.
  // Returns null when neither is stored.
  function wikiReviewedToday(file, today) {
    var events = isRecord(file) && isRecord(file.analytics) ? file.analytics.events : null;
    var count = 0;
    var saw = false;
    var i;
    if (Array.isArray(events)) {
      for (i = 0; i < events.length; i++) {
        var ev = events[i];
        if (!isRecord(ev) || ev.type !== "review") continue;
        if (lisbonDayFromMs(ev.t) === today) count += 1;
      }
      return count;
    }
    if (!eachValue(file && file.cards, function (card) {
      var last;
      if (!isRecord(card) || !Object.prototype.hasOwnProperty.call(card, "last")) return;
      last = epochMs(card.last);
      if (last == null) return;
      saw = true;
      if (lisbonDay(new Date(last)) === today) count += 1;
    })) return null;
    return saw ? count : null;
  }

  // chinese-library.json journey.events: { date, type: "study", count }.
  // Sum today's study count. The app stores one rolling event per local date.
  // Without that log, count srs cards whose last timestamp is today in Lisbon.
  // Returns null when neither is stored.
  function chineseReviewedToday(file, today) {
    var events = isRecord(file) && isRecord(file.journey) ? file.journey.events : null;
    var count = 0;
    var saw = false;
    var i;
    if (Array.isArray(events)) {
      for (i = 0; i < events.length; i++) {
        var ev = events[i];
        var n;
        if (!isRecord(ev) || ev.type !== "study") continue;
        if (dayStamp(ev.date) !== today) continue;
        n = finiteNumber(ev.count);
        count += n != null && n > 0 ? n : 1;
      }
      return count;
    }
    if (!eachValue(file && file.srs, function (card) {
      var last;
      if (!isRecord(card) || !Object.prototype.hasOwnProperty.call(card, "last")) return;
      last = epochMs(card.last);
      if (last == null) return;
      saw = true;
      if (lisbonDay(new Date(last)) === today) count += 1;
    })) return null;
    return saw ? count : null;
  }

  /**
   * sources.journal / nutrition / streetlifting / wiki / chinese are parsed
   * JSON or null when the file is missing. A true *Error flag means that
   * read failed and the check must stay unknown.
   * speakingMark is localStorage speaking-done:YYYY-MM-DD === "1".
   * speakingCatalog is speaking-analysis data/index.json.
   * speakingPractice is speaking-analysis data/reps.json.
   * Practice is not stored in progress-sync. A missing log is not done.
   * piano is piano.json, or null when that file is missing.
   * referee is referee-games.json, or null when that file is missing.
   * Next game is omitted when the file is missing or nothing is upcoming.
   * Food left renders only after the first meal is logged.
   */
  function missingItems(sources, today, hour) {
    var items = [];
    var unknown = false;
    var wikiDue;
    var chineseDue;
    var wikiLeft;
    var chineseLeft;
    var food;
    var left;
    var next;
    var showEvening;
    var nutDay;
    var speech;
    showEvening = !(typeof hour === "number" && isFinite(hour)) || hour >= 18;
    if (sources.journalError) unknown = true;
    else {
      if (!sectionFilled(dayEntry(sources.journal, today), MORNING_FIELDS)) {
        items.push(item("morning", "open", "Morning journal", "/journal/#day/" + today));
      }
      if (showEvening && !sectionFilled(dayEntry(sources.journal, today), EVENING_FIELDS)) {
        items.push(item("evening", "open", "Evening journal", "/journal/#day/" + today));
      }
      left = habitsLeft(sources.journal, today);
      if (left > 0) {
        items.push(item("habits", String(left), "Habits not ticked", "/journal/#habits"));
      }
    }

    if (sources.nutritionError) unknown = true;
    else if (!mealsLogged(sources.nutrition, today)) {
      items.push(item("meals", "open", "Meals not logged", "/health/nutrition/#" + today));
    }

    if (!sources.nutritionError && mealsLogged(sources.nutrition, today)) {
      food = foodLeftItem(sources.nutrition, sources.streetlifting, today);
      if (food) items.push(food);
    }

    if (sources.streetError) unknown = true;
    else if (!trainingLogged(sources.streetlifting, today)) {
      nutDay = sources.nutritionError ? null : nutritionDay(sources.nutrition, today);
      if (!(nutDay && normalizeDayType(nutDay.dayType) === "rest")) {
        items.push(item("training", "open", "Training not logged", "/health/training/"));
      }
    }

    speech = speakingStatus(sources, today);
    if (!speech.done) {
      items.push(item("speaking", speech.badge, speech.label, speech.href));
    }

    if (sources.pianoError) unknown = true;
    else if (!pianoLogged(sources.piano, today)) {
      items.push(item("piano", "open", "Piano practice", "/piano/#/log"));
    }

    if (sources.wikiError) unknown = true;
    else {
      wikiDue = wikiDueCount(sources.wiki, today);
      wikiLeft = cardQuota(wikiDue, wikiReviewedToday(sources.wiki, today));
      if (wikiLeft > 0) {
        items.push(cardTodoItem("wiki", "Wiki cards", wikiLeft, "/wiki-flashcards/"));
      }
    }

    if (sources.chineseError) unknown = true;
    else {
      chineseDue = chineseDueCount(sources.chinese, today);
      chineseLeft = cardQuota(chineseDue, chineseReviewedToday(sources.chinese, today));
      if (chineseLeft > 0) {
        items.push(cardTodoItem("chinese", "Mandarin cards", chineseLeft, "/chinese-library/"));
      }
    }

    next = nextGameItem(sources.referee, today);
    if (next) items.push(next);

    return { items: items, unknown: unknown, speakingDone: speech.done };
  }

  var AREA_OF = {
    morning: "Journal",
    evening: "Journal",
    habits: "Journal",
    meals: "Health",
    food: "Health",
    training: "Health",
    wiki: "Study",
    chinese: "Mandarin",
    speaking: "Practice",
    piano: "Practice",
    "next-game": "Referee",
  };

  var AREA_ORDER = ["Journal", "Health", "Study", "Mandarin", "Practice", "Referee"];

  // Training and meals share Health. Speaking shares Career. Piano and the
  // mission groups keep their own marks; they are not palette areas.
  var ROW_VISUAL = {
    morning: { emoji: "📖", area: "journal" },
    evening: { emoji: "📖", area: "journal" },
    habits: { emoji: "📖", area: "journal" },
    meals: { emoji: "💚", area: "health" },
    food: { emoji: "💚", area: "health" },
    training: { emoji: "💚", area: "health" },
    wiki: { emoji: "📚", area: "study" },
    chinese: { emoji: "🏮", area: "mandarin" },
    speaking: { emoji: "💼", area: "career" },
    piano: { emoji: "🎹", area: "piano" },
    "next-game": { emoji: "⚽", area: "referee" },
  };

  function rowVisual(row) {
    var id = typeof row === "string" ? row : row && row.id;
    var area;
    if (id && ROW_VISUAL[id]) return ROW_VISUAL[id];
    area = row && typeof row.area === "string" ? row.area : "";
    if (area === "Admin") return { emoji: "📋", area: "admin" };
    if (area === "Crew") return { emoji: "⚓", area: "crew" };
    return null;
  }

  function areaSlug(name) {
    return String(name || "").trim().toLowerCase();
  }

  var PALETTE_AREAS = {
    journal: true,
    study: true,
    health: true,
    career: true,
    mandarin: true,
    referee: true,
    "wiki-insights": true,
  };

  function paletteArea(area) {
    return area && PALETTE_AREAS[area] ? area : "";
  }

  // Morning is the focus only before noon. Evening joins the list from 18:00,
  // matching missingItems. Wiki due is a row under Study, not a focus card.
  // Anything else in this list is always eligible.
  var FOCUS_IDS = [
    "morning",
    "training",
    "meals",
    "chinese",
    "speaking",
    "piano",
    "habits",
    "evening",
    "food",
  ];

  var MISSION_AREAS = ["Admin", "Crew"];

  function groupByArea(rows, areaOf, order) {
    var buckets = {};
    var seen = order.slice();
    var out = [];
    if (!Array.isArray(rows)) return [];
    rows.forEach(function (row) {
      var area = areaOf(row);
      if (!area) return;
      if (!buckets[area]) buckets[area] = [];
      buckets[area].push(row);
      if (seen.indexOf(area) === -1) seen.push(area);
    });
    seen.forEach(function (area) {
      if (buckets[area] && buckets[area].length) out.push({ area: area, items: buckets[area] });
    });
    return out;
  }

  function groupItems(items) {
    return groupByArea(items, function (row) {
      if (!row || typeof row.id !== "string") return "";
      return AREA_OF[row.id] || "";
    }, AREA_ORDER);
  }

  function focusItem(items, hour) {
    var byId = {};
    var h = typeof hour === "number" && isFinite(hour) ? hour : null;
    var i;
    var id;
    if (!Array.isArray(items)) return null;
    for (i = 0; i < items.length; i++) {
      if (items[i] && typeof items[i].id === "string" && !byId[items[i].id]) byId[items[i].id] = items[i];
    }
    for (i = 0; i < FOCUS_IDS.length; i++) {
      id = FOCUS_IDS[i];
      if (!byId[id]) continue;
      if (id === "morning" && !(h != null && h < 12)) continue;
      if (id === "evening" && !(h == null || h >= 18)) continue;
      return byId[id];
    }
    return null;
  }

  // True when wiki cards are the only thing that would have filled the focus
  // card. The done card stays hidden; the count renders under Study instead.
  function hideDoneCard(items, hour) {
    var wiki;
    if (focusItem(items, hour)) return false;
    wiki = findItem(Array.isArray(items) ? items : [], "wiki");
    return !!wiki;
  }

  function groupMissions(rows) {
    return groupByArea(rows, function (row) {
      if (!row || typeof row.area !== "string") return "";
      return row.area;
    }, MISSION_AREAS);
  }

  function alertHeadline(area, count) {
    return area + " · " + count + " open";
  }

  // Count is every alert and mission row. Each area is named once, in the
  // same order as the groups, with that area's emoji.
  function bundleSummary(alerts, missions) {
    var alertRows = Array.isArray(alerts) ? alerts : [];
    var missionRows = Array.isArray(missions) ? missions : [];
    var parts = [];
    var n = alertRows.length + missionRows.length;
    function pushGroup(group) {
      var mark;
      var bit;
      if (!group || !group.area || !group.items || !group.items.length) return;
      mark = rowVisual(group.items[0]);
      bit = mark && mark.emoji ? mark.emoji + " " + group.area : group.area;
      parts.push(bit);
    }
    groupItems(alertRows).forEach(pushGroup);
    groupMissions(missionRows).forEach(pushGroup);
    if (!n) return "0 missing";
    if (!parts.length) return String(n) + " missing";
    return n + " missing · " + parts.join(", ");
  }

  // Drop the focus row. Wiki due stays, so it renders under Study.
  function rowsForAlerts(items, focusId) {
    var out = [];
    var i;
    if (!Array.isArray(items)) return out;
    for (i = 0; i < items.length; i++) {
      if (!items[i]) continue;
      if (focusId && items[i].id === focusId) continue;
      out.push(items[i]);
    }
    return out;
  }

  var bundleAlerts = [];
  var bundleMissions = [];

  function paintBundle() {
    var host = document.getElementById("bundle");
    var summary = document.getElementById("bundle-summary");
    var label = document.getElementById("bundle-label");
    var n = bundleAlerts.length + bundleMissions.length;
    var text = bundleSummary(bundleAlerts, bundleMissions);
    if (label) label.textContent = text;
    if (summary) {
      summary.title = text;
      summary.setAttribute("aria-label", text);
    }
    if (!host) return;
    if (!n) {
      host.hidden = true;
      if (summary) summary.classList.remove("is-soon");
      return;
    }
    host.hidden = false;
    if (summary) summary.classList.toggle("is-soon", missionUrgent(bundleMissions));
  }

  function missionHeadline(rows) {
    var next;
    var when;
    if (!Array.isArray(rows) || !rows.length) return "";
    next = rows[0];
    if (next.days < 0) when = "overdue";
    else if (next.days === 0) when = "today";
    else when = "next in " + next.days + "d";
    return "Missions · " + rows.length + " · " + when;
  }

  function missionUrgent(rows) {
    var i;
    if (!Array.isArray(rows)) return false;
    for (i = 0; i < rows.length; i++) {
      if (rows[i] && typeof rows[i].days === "number" && rows[i].days <= 3) return true;
    }
    return false;
  }

  var ACTIVE_STAGES = { applied: true, screening: true, interview: true, offer: true };

  // Null when the career file is missing. saved and closed do not count.
  function careerActive(file) {
    var jobs;
    var n = 0;
    var i;
    var stage;
    if (!isRecord(file) || !Array.isArray(file.jobs)) return null;
    jobs = file.jobs;
    for (i = 0; i < jobs.length; i++) {
      if (!isRecord(jobs[i])) continue;
      stage = jobs[i].stage;
      if (typeof stage === "string" && ACTIVE_STAGES[stage]) n += 1;
    }
    return n;
  }

  function findItem(items, id) {
    var i;
    for (i = 0; i < items.length; i++) {
      if (items[i] && items[i].id === id) return items[i];
    }
    return null;
  }

  function journalTile(sources, items) {
    var n = 0;
    var i;
    var id;
    if (!sources || sources.journalError) return "—";
    for (i = 0; i < items.length; i++) {
      id = items[i] && items[i].id;
      if (id === "morning" || id === "evening" || id === "habits") n += 1;
    }
    return n ? n + " open" : "✓";
  }

  function cardsTile(sources, items, id, errKey, today) {
    var file;
    var row;
    var due;
    var reviewed;
    var left;
    if (!sources || sources[errKey]) return "—";
    row = findItem(items, id);
    if (row && row.badge) return String(row.badge) + " left";
    file = id === "wiki" ? sources.wiki : sources.chinese;
    due = id === "wiki" ? wikiDueCount(file, today) : chineseDueCount(file, today);
    reviewed = id === "wiki" ? wikiReviewedToday(file, today) : chineseReviewedToday(file, today);
    left = cardQuota(due, reviewed);
    if (left == null) return "—";
    if (left === 0) return "✓";
    return String(left) + " left";
  }

  function healthTile(sources, items, today) {
    var food;
    var nutDay;
    if (!sources || (sources.nutritionError && sources.streetError)) return "—";
    food = findItem(items, "food");
    if (food && food.badge) return food.badge;
    if (!sources.streetError && trainingLogged(sources.streetlifting, today)) return "✓";
    nutDay = sources.nutritionError ? null : nutritionDay(sources.nutrition, today);
    if (nutDay && normalizeDayType(nutDay.dayType) === "rest") return "✓";
    if (findItem(items, "training")) return "open";
    if (sources.nutritionError || sources.streetError) return "—";
    return "✓";
  }

  function careerTile(sources) {
    var n;
    if (!sources || sources.careerError) return "—";
    n = careerActive(sources.career);
    if (n == null) return "—";
    return String(n);
  }

  function refereeTile(sources, today) {
    var next;
    var match;
    if (!sources || sources.refereeError) return "—";
    next = nextGameItem(sources.referee, today);
    if (!next || !next.badge) return "—";
    if (next.badge === "today") return "today";
    if (next.badge === "tomorrow") return "1d";
    match = /^in (\d+)d$/.exec(next.badge);
    if (match) return match[1] + "d";
    return "—";
  }

  function tileCounts(sources, report, today) {
    var items = report && Array.isArray(report.items) ? report.items : [];
    return {
      journal: journalTile(sources, items),
      study: cardsTile(sources, items, "wiki", "wikiError", today),
      health: healthTile(sources, items, today),
      career: careerTile(sources),
      mandarin: cardsTile(sources, items, "chinese", "chineseError", today),
      referee: refereeTile(sources, today),
    };
  }

  function neutralTiles() {
    return {
      journal: "—",
      study: "—",
      health: "—",
      career: "—",
      mandarin: "—",
      referee: "—",
    };
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function shortDays(days) {
    if (days === 0) return "today";
    if (days === 1) return "1d";
    if (days === -1) return "1d over";
    if (days < 0) return (-days) + "d over";
    return days + "d";
  }

  function lineRow(row, badgeText, soon) {
    var line = row.href ? el("a", "line") : el("div", "line");
    var mark = rowVisual(row);
    var badge;
    if (row.href) line.href = row.href;
    line.appendChild(lineLabel(row));
    if (badgeText) {
      badge = el("span", "badge" + (soon ? " badge-soon" : ""), badgeText);
      if (mark && paletteArea(mark.area)) badge.setAttribute("data-area", paletteArea(mark.area));
      line.appendChild(badge);
    }
    return line;
  }

  function renderMissions(today, extra) {
    var host = document.getElementById("missions");
    var rows = activeMissions(today, extra);
    var details;
    var summary;
    var groups;
    bundleMissions = rows;
    if (!host) {
      paintBundle();
      return;
    }
    host.textContent = "";
    if (!rows.length) {
      host.hidden = true;
      paintBundle();
      return;
    }
    host.hidden = false;
    details = el("details", "sheet missions-details");
    summary = el("summary", missionUrgent(rows) ? "is-soon" : "");
    summary.appendChild(el("span", "row-label", missionHeadline(rows)));
    details.appendChild(summary);
    groups = groupMissions(rows);
    groups.forEach(function (group) {
      var block = el("div", "area-block");
      var list = el("ul", "line-list");
      block.setAttribute("data-area", areaSlug(group.area));
      block.appendChild(el("h3", "area-label", group.area));
      group.items.forEach(function (row) {
        var li = el("li");
        li.appendChild(lineRow(row, shortDays(row.days), row.days <= 3));
        list.appendChild(li);
      });
      block.appendChild(list);
      details.appendChild(block);
    });
    host.appendChild(details);
    paintBundle();
  }

  function speakingDoneCard() {
    var mark = rowVisual("speaking");
    var card = el("a", "focus-card");
    var check;
    card.href = "/speaking-analysis/";
    card.setAttribute("data-speaking-card", "done");
    if (mark && paletteArea(mark.area)) card.setAttribute("data-area", paletteArea(mark.area));
    card.appendChild(lineLabel({ id: "speaking", label: "Speaking practice" }));
    check = el("span", "go", "✓");
    check.setAttribute("aria-label", "Done");
    card.appendChild(check);
    return card;
  }

  function renderFocus(state) {
    var host = document.getElementById("focus");
    var card;
    if (!host) return;
    host.textContent = "";
    host.removeAttribute("data-focus");
    host.removeAttribute("data-speaking");
    if (!state.connected) {
      card = el("a", "focus-card");
      card.href = "/journal/";
      card.appendChild(el("span", "row-label", "Connect sync"));
      card.appendChild(el("span", "go", "Go"));
      host.appendChild(card);
      host.setAttribute("data-focus", "connect");
      return;
    }
    if (state.loading) {
      host.appendChild(el("p", "sync-hint", "Checking today…"));
      host.setAttribute("data-focus", "loading");
      return;
    }
    if (state.note) host.appendChild(el("p", "sync-hint", state.note));
    if (state.speakingDone) host.setAttribute("data-speaking", "done");
    if (state.focus) {
      var focusMark = rowVisual(state.focus);
      var focusBadge;
      var action = state.focus.done ? "✓" : "Go";
      card = el("a", "focus-card");
      card.href = state.focus.href;
      if (focusMark && paletteArea(focusMark.area)) card.setAttribute("data-area", paletteArea(focusMark.area));
      card.appendChild(lineLabel(state.focus));
      if (!state.focus.done && state.focus.badge) {
        focusBadge = el("span", "badge", state.focus.badge);
        if (focusMark && paletteArea(focusMark.area)) focusBadge.setAttribute("data-area", paletteArea(focusMark.area));
        card.appendChild(focusBadge);
      }
      card.appendChild(el("span", "go", action));
      if (state.focus.done) card.setAttribute("data-speaking-card", "done");
      host.appendChild(card);
      host.setAttribute("data-focus", state.focus.id);
      if (state.speakingDone && state.focus.id !== "speaking") host.appendChild(speakingDoneCard());
      return;
    }
    if (state.speakingDone) host.appendChild(speakingDoneCard());
    if (state.hideDone) {
      host.setAttribute("data-focus", state.unknown ? "error" : "off");
      return;
    }
    if (!state.unknown) {
      host.appendChild(el("p", "focus-card focus-done", "All done today"));
      host.setAttribute("data-focus", "done");
      return;
    }
    if (!state.speakingDone) host.setAttribute("data-focus", "error");
  }

  function lineLabel(row) {
    var text = row.label;
    var mark = rowVisual(row);
    var node = el("span", "row-label");
    var emoji;
    if (row.detail) text += " · " + row.detail;
    if (mark && mark.emoji) {
      emoji = el("span", "row-emoji", mark.emoji);
      emoji.setAttribute("aria-hidden", "true");
      node.appendChild(emoji);
      node.appendChild(document.createTextNode(text));
    } else {
      node.textContent = text;
    }
    return node;
  }

  function renderAlerts(items) {
    var host = document.getElementById("alerts");
    var groups;
    bundleAlerts = Array.isArray(items) ? items : [];
    if (!host) {
      paintBundle();
      return;
    }
    host.textContent = "";
    groups = groupItems(bundleAlerts);
    groups.forEach(function (group) {
      var details = el("details", "sheet alert-group");
      var summary = el("summary");
      var list = el("ul", "line-list");
      details.setAttribute("data-area", areaSlug(group.area));
      summary.appendChild(el("span", "row-label", alertHeadline(group.area, group.items.length)));
      details.appendChild(summary);
      group.items.forEach(function (row) {
        var li = el("li");
        li.appendChild(lineRow(row, row.badge, false));
        list.appendChild(li);
      });
      details.appendChild(list);
      host.appendChild(details);
    });
    paintBundle();
  }

  function renderJournal(text) {
    var card = document.getElementById("journal-card");
    var node = document.getElementById("journal-line");
    var line = text && String(text).trim() ? String(text).trim() : JOURNAL_CARD_EMPTY;
    if (node) node.textContent = line;
    if (!card) return;
    if (line === JOURNAL_CARD_EMPTY) card.removeAttribute("title");
    else card.title = line;
  }

  function renderTiles(counts) {
    var nodes;
    var i;
    var node;
    var key;
    var slot;
    if (!counts || typeof document === "undefined") return;
    nodes = document.querySelectorAll("[data-tile]");
    for (i = 0; i < nodes.length; i++) {
      node = nodes[i];
      key = node.getAttribute("data-tile");
      slot = node.querySelector(".tile-count");
      if (!slot || !Object.prototype.hasOwnProperty.call(counts, key)) continue;
      slot.textContent = counts[key];
    }
  }

  var SPEAKING_INDEX_URL = "https://dong-xuyong.github.io/speaking-analysis/data/index.json";
  var SPEAKING_REPS_URL = "https://dong-xuyong.github.io/speaking-analysis/data/reps.json";

  function readSpeakingMark(today) {
    try {
      if (!root.localStorage) return false;
      return root.localStorage.getItem("speaking-done:" + today) === "1";
    } catch (e) {
      return false;
    }
  }

  function fetchSpeakingPublic() {
    var fetchFn = root.fetch;
    function one(url) {
      var busted = url + "?t=" + Date.now();
      if (typeof fetchFn !== "function") return Promise.resolve(null);
      return fetchFn(busted, { cache: "no-store" }).then(
        function (res) {
          if (!res || !res.ok) return null;
          return res.json().catch(function () {
            return null;
          });
        },
        function () {
          return null;
        }
      );
    }
    return Promise.all([one(SPEAKING_INDEX_URL), one(SPEAKING_REPS_URL)]).then(
      function (pair) {
        return {
          key: "speakingPublic",
          data: { catalog: pair[0], practice: pair[1] },
          error: false,
        };
      },
      function () {
        return { key: "speakingPublic", data: { catalog: null, practice: null }, error: false };
      }
    );
  }

  function loadToday(today) {
    var cfg = root.GhSync && root.GhSync.readConfig ? root.GhSync.readConfig() : null;
    var speakingMark = readSpeakingMark(today);
    var hour = lisbonHour(new Date());
    var names;
    var jobs;
    if (!cfg) {
      renderJournal(JOURNAL_CARD_EMPTY);
      renderFocus({ connected: false });
      renderAlerts([]);
      renderTiles(neutralTiles());
      renderWeather("");
      return;
    }

    renderJournal(JOURNAL_CARD_EMPTY);
    renderFocus({ connected: true, loading: true });
    renderAlerts([]);
    loadBriefWeather(cfg, today);

    root.GhSync.fetchJson(cfg, "crew-log").then(
      function (data) {
        renderMissions(today, crewMissions(data));
      },
      function () {}
    );

    names = [
      ["journal", "journal"],
      ["nutrition", "nutrition"],
      ["streetlifting", "streetlifting"],
      ["wiki", "wiki-flashcards"],
      ["chinese", "chinese-library"],
      ["piano", "piano"],
      ["referee", "referee-games"],
      ["career", "career"],
    ];

    jobs = names.map(function (pair) {
      return root.GhSync.fetchJson(cfg, pair[1]).then(
        function (data) {
          return { key: pair[0], data: data, error: false };
        },
        function () {
          return { key: pair[0], data: null, error: true };
        }
      );
    });
    jobs.push(fetchSpeakingPublic());

    Promise.all(jobs).then(function (results) {
      var sources = { speakingMark: speakingMark };
      var failed = [];
      var report;
      var focus;
      var alerts = [];
      results.forEach(function (result) {
        sources[result.key] = result.data;
        if (result.key === "speakingPublic") {
          sources.speakingCatalog = result.data && result.data.catalog;
          sources.speakingPractice = result.data && result.data.practice;
          return;
        }
        if (result.key === "referee") return;
        // A failed career read must not mark the other checks unknown.
        if (result.key === "career") {
          sources.careerError = result.error;
          return;
        }
        if (result.key === "journal") sources.journalError = result.error;
        if (result.key === "nutrition") sources.nutritionError = result.error;
        if (result.key === "streetlifting") sources.streetError = result.error;
        if (result.key === "wiki") sources.wikiError = result.error;
        if (result.key === "chinese") sources.chineseError = result.error;
        if (result.key === "piano") sources.pianoError = result.error;
        if (result.error) failed.push(result.key);
      });
      report = missingItems(sources, today, hour);
      focus = focusItem(report.items, hour);
      alerts = rowsForAlerts(report.items, focus && focus.id);
      renderJournal(sources.journalError ? JOURNAL_CARD_EMPTY : journalCardText(sources.journal, today));
      renderFocus({
        connected: true,
        focus: focus,
        speakingDone: report.speakingDone,
        unknown: report.unknown,
        hideDone: hideDoneCard(report.items, hour),
        note: failed.length ? "Some logs could not be read." : "",
      });
      renderAlerts(alerts);
      renderTiles(tileCounts(sources, report, today));
    });
  }

  // Morning Brief: progress-sync mirror.json via GhSync.fetchJson(cfg, "mirror").
  // days[today].hubWeather is { date, tempC, minC, maxC, emoji, updatedAt }.
  // today is the Europe/Lisbon date. Hide when the object or date does not match.
  function roundDegrees(value) {
    var n = finiteNumber(value);
    if (n == null) return null;
    return Math.round(n);
  }

  function isWeatherEmoji(token) {
    if (typeof token !== "string") return false;
    token = token.trim();
    if (!token || token.length > 16) return false;
    if (/[A-Za-z0-9]/.test(token)) return false;
    if (/^[\s.,:;·•|/\\-]+$/.test(token)) return false;
    return true;
  }

  function hubWeatherLine(file, today) {
    var day;
    var weather;
    var emoji;
    var now;
    var low;
    var high;
    if (typeof today !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return "";
    if (!isRecord(file) || !isRecord(file.days)) return "";
    day = file.days[today];
    if (!isRecord(day) || !isRecord(day.hubWeather)) return "";
    weather = day.hubWeather;
    if (weather.date !== today) return "";
    emoji = typeof weather.emoji === "string" ? weather.emoji.trim() : "";
    now = roundDegrees(weather.tempC);
    low = roundDegrees(weather.minC);
    high = roundDegrees(weather.maxC);
    if (!isWeatherEmoji(emoji) || now == null || low == null || high == null) return "";
    return emoji + " " + now + "° · " + low + "°/" + high + "°";
  }

  function renderWeather(line) {
    var node;
    if (typeof document === "undefined") return;
    node = document.getElementById("today-weather");
    if (!node) return;
    if (!line) {
      node.textContent = "";
      node.hidden = true;
      return;
    }
    node.textContent = line;
    node.hidden = false;
  }

  function loadBriefWeather(cfg, today) {
    renderWeather("");
    if (!cfg || !root.GhSync || typeof root.GhSync.fetchJson !== "function") return;
    root.GhSync.fetchJson(cfg, "mirror").then(
      function (data) {
        renderWeather(hubWeatherLine(data, today));
      },
      function () {
        renderWeather("");
      }
    );
  }

  function boot() {
    var now = new Date();
    var today = todayKey(now);
    var hello = document.getElementById("greet-hello");
    var date = document.getElementById("today-date");
    if (hello) hello.textContent = greeting(lisbonHour(now));
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
    crewMissions: crewMissions,
    lisbonHour: lisbonHour,
    missingItems: missingItems,
    sectionFilled: sectionFilled,
    mealsLogged: mealsLogged,
    trainingLogged: trainingLogged,
    foodLeftItem: foodLeftItem,
    resolveDayType: resolveDayType,
    cardQuota: cardQuota,
    wikiReviewedToday: wikiReviewedToday,
    chineseReviewedToday: chineseReviewedToday,
    wikiDueCount: wikiDueCount,
    chineseDueCount: chineseDueCount,
    speakingDone: speakingDone,
    speakingStatus: speakingStatus,
    pianoLogged: pianoLogged,
    nextGameItem: nextGameItem,
    habitsLeft: habitsLeft,
    greeting: greeting,
    hubWeatherLine: hubWeatherLine,
    quoteOfDay: quoteOfDay,
    journalCardText: journalCardText,
    hideDoneCard: hideDoneCard,
    bundleSummary: bundleSummary,
    rowsForAlerts: rowsForAlerts,
    AREA_OF: AREA_OF,
    groupItems: groupItems,
    focusItem: focusItem,
    groupMissions: groupMissions,
    careerActive: careerActive,
    tileCounts: tileCounts,
    alertHeadline: alertHeadline,
    missionHeadline: missionHeadline,
    missionUrgent: missionUrgent,
    rowVisual: rowVisual,
    boot: boot,
  };

  root.Hub = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
  }
})(typeof window !== "undefined" ? window : globalThis);
