var assert = require("assert");
var Hub = require("./hub.js");

var today = "2026-10-16";

function itemById(items, id) {
  var i;
  for (i = 0; i < items.length; i++) {
    if (items[i].id === id) return items[i];
  }
  return null;
}

function rowByLabel(rows, label) {
  var i;
  for (i = 0; i < rows.length; i++) {
    if (rows[i].label === label) return rows[i];
  }
  return null;
}

function baseSources() {
  return {
    journal: { entries: {} },
    nutrition: { days: {} },
    streetlifting: { sessions: {} },
    wiki: null,
    chinese: null,
    piano: null,
    referee: { games: [] },
    speakingRaw: null,
  };
}

// 1. Overdue missions stay visible.
assert.strictEqual(Hub.countdown(-1), "1 day overdue");
assert.strictEqual(Hub.countdown(-3), "3 days overdue");
var overdue = Hub.activeMissions(today, [
  { label: "File the form", due: "2026-10-14" },
  { label: "Not a date", due: "soon" },
]);
var past = rowByLabel(overdue, "File the form");
assert.ok(past);
assert.strictEqual(past.days, -2);
assert.strictEqual(overdue[0], past);
assert.strictEqual(rowByLabel(overdue, "Not a date"), null);

// 2. Crew Log due jobs.
var crew = Hub.crewMissions({
  jobs: [
    { id: "1", title: "2026-10-06 Thesis schedule to 31 Oct", status: "todo", due: "2026-10-31" },
    { id: "2", title: "2026-10-01 Write chapter", status: "in_progress", due: "2026-10-20" },
    { id: "3", title: "Finished draft", status: "complete", due: "2026-10-18" },
    { id: "4", title: "Dropped", status: "cancelled", due: "2026-10-18" },
    { id: "5", title: "Old done", status: "done", due: "2026-10-18" },
    { id: "6", title: "No date", status: "todo", due: null },
    { id: "7", title: "Bad date", status: "review", due: "31 Oct" },
    { id: "8", title: "", status: "todo", due: "2026-10-18" },
    { id: "9", status: "blocked", due: "2026-10-18" },
    { id: "10", title: "Keep raw title", status: "blocked", due: "2026-10-19" },
  ],
});
assert.strictEqual(crew.length, 3);
assert.strictEqual(crew[0].label, "Thesis schedule to 31 Oct");
assert.strictEqual(crew[0].due, "2026-10-31");
assert.strictEqual(crew[0].href, "/crew-log/");
assert.strictEqual(crew[1].label, "Write chapter");
assert.strictEqual(crew[2].label, "Keep raw title");
var thesis = rowByLabel(Hub.activeMissions(today, crew), "Thesis schedule to 31 Oct");
assert.ok(thesis);
assert.strictEqual(thesis.href, "/crew-log/");

// 3. Habits no longer double count.
assert.strictEqual(Hub.habitsLeft(null, today), 4);
assert.strictEqual(Hub.habitsLeft({
  habitDefs: [
    { id: "thesis" },
    { id: "training" },
    { id: "food_logged" },
    { id: "speaking" },
    { id: "weigh_in" },
  ],
}, today), 2);
assert.strictEqual(Hub.habitsLeft({
  habitDefs: [
    { id: "thesis" },
    { id: "training" },
    { id: "food_logged" },
    { id: "speaking" },
    { id: "weigh_in" },
  ],
  entries: {
    "2026-10-16": {
      habits: { thesis: true, training: false, speaking: true },
    },
  },
}, today), 1);

// 4. Food left only after the first meal.
assert.strictEqual(itemById(Hub.missingItems(baseSources(), today, 12).items, "food"), null);
var withMeal = baseSources();
withMeal.nutrition = {
  days: {
    "2026-10-16": {
      dayType: "training",
      meals: {
        lunch: [{ name: "rice", kcal: 400, protein: 20, carbs: 50, fat: 10 }],
      },
    },
  },
};
var food = itemById(Hub.missingItems(withMeal, today, 12).items, "food");
assert.ok(food);
assert.strictEqual(food.label, "Food left");

// 5. No training row on rest days.
var rest = baseSources();
rest.nutrition = { days: { "2026-10-16": { dayType: "rest" } } };
assert.strictEqual(itemById(Hub.missingItems(rest, today, 12).items, "training"), null);
var trainDay = baseSources();
trainDay.nutrition = { days: { "2026-10-16": { dayType: "training" } } };
assert.ok(itemById(Hub.missingItems(trainDay, today, 12).items, "training"));
var missingNutrition = baseSources();
missingNutrition.nutrition = null;
assert.ok(itemById(Hub.missingItems(missingNutrition, today, 12).items, "training"));

// 6. Speaking counts the Journal habit.
var spoken = baseSources();
spoken.journal = {
  entries: {
    "2026-10-16": { habits: { speaking: true } },
  },
};
assert.strictEqual(itemById(Hub.missingItems(spoken, today, 19).items, "speaking"), null);
assert.ok(itemById(Hub.missingItems(baseSources(), today, 19).items, "speaking"));

// 7. Evening journal from 18:00.
assert.strictEqual(itemById(Hub.missingItems(baseSources(), today, 9).items, "evening"), null);
assert.ok(itemById(Hub.missingItems(baseSources(), today, 18).items, "evening"));
assert.ok(itemById(Hub.missingItems(baseSources(), today, 19).items, "evening"));
assert.ok(itemById(Hub.missingItems(baseSources(), today).items, "evening"));
assert.strictEqual(Hub.lisbonHour(new Date("2026-10-16T17:30:00Z")), 18);
assert.strictEqual(Hub.lisbonHour(new Date("2026-01-15T00:00:00Z")), 0);

// 8. No past games.
assert.strictEqual(Hub.nextGameItem({
  games: [
    { date: "2026-10-10", home: "A", away: "B", time: "15:00", status: "upcoming" },
    { date: "2026-10-12", home: "C", away: "D", time: "18:00", status: "finished" },
  ],
}, today), null);
var next = Hub.nextGameItem({
  games: [
    { date: "2026-10-20", home: "Late", away: "Side", time: "20:00", status: "upcoming" },
    { date: "2026-10-17", home: "Soon", away: "Team", time: "16:00", status: "upcoming" },
    { date: "2026-10-10", home: "Old", away: "Club", time: "15:00", status: "upcoming" },
  ],
}, today);
assert.ok(next);
assert.ok(next.detail.indexOf("Soon x Team") !== -1);
assert.strictEqual(next.badge, "tomorrow");

// 9. Piano practice opens the log route.
var piano = itemById(Hub.missingItems(baseSources(), today, 12).items, "piano");
assert.ok(piano);
assert.strictEqual(piano.label, "Piano practice");
assert.strictEqual(piano.href, "/piano/#/log");

// 10. Merged Health hrefs.
var merged = Hub.missingItems(baseSources(), today, 20).items;
assert.strictEqual(itemById(merged, "meals").href, "/health/nutrition/#" + today);
assert.strictEqual(itemById(merged, "training").href, "/health/training/");
assert.strictEqual(itemById(Hub.missingItems(withMeal, today, 12).items, "food").href, "/health/nutrition/");
assert.strictEqual(itemById(merged, "speaking").href, "/speaking-analysis/");
assert.strictEqual(itemById(merged, "wiki"), null);

// 11. Greeting from the Lisbon hour.
assert.strictEqual(Hub.greeting(5), "Good morning");
assert.strictEqual(Hub.greeting(11), "Good morning");
assert.strictEqual(Hub.greeting(4), "Good evening");
assert.strictEqual(Hub.greeting(12), "Good afternoon");
assert.strictEqual(Hub.greeting(17), "Good afternoon");
assert.strictEqual(Hub.greeting(18), "Good evening");
assert.strictEqual(Hub.greeting(0), "Good evening");
assert.strictEqual(Hub.greeting(23), "Good evening");

// 12. Focus pick follows the priority, with morning before noon and evening from 18:00.
function fake(id) {
  return { id: id, label: id, href: "/", badge: "open" };
}
var pile = [
  fake("food"),
  fake("evening"),
  fake("habits"),
  fake("piano"),
  fake("speaking"),
  fake("chinese"),
  fake("wiki"),
  fake("meals"),
  fake("training"),
  fake("morning"),
  fake("next-game"),
];
assert.strictEqual(Hub.focusItem(pile, 9).id, "morning");
assert.strictEqual(Hub.focusItem(pile, 11).id, "morning");
assert.strictEqual(Hub.focusItem(pile, 12).id, "training");
assert.strictEqual(Hub.focusItem(pile, 14).id, "training");
assert.strictEqual(Hub.focusItem(pile, 20).id, "training");
assert.strictEqual(Hub.focusItem([fake("morning"), fake("evening"), fake("food")], 20).id, "evening");
assert.strictEqual(Hub.focusItem([fake("morning"), fake("evening"), fake("food")], 14).id, "food");
assert.strictEqual(Hub.focusItem([fake("evening"), fake("food")], 17).id, "food");
assert.strictEqual(Hub.focusItem([fake("morning")], 14), null);
assert.strictEqual(Hub.focusItem([fake("next-game")], 9), null);
assert.strictEqual(Hub.focusItem([], 9), null);
assert.strictEqual(Hub.focusItem(Hub.missingItems(baseSources(), today, 9).items, 9).id, "morning");
assert.strictEqual(Hub.focusItem(Hub.missingItems(baseSources(), today, 14).items, 14).id, "training");
assert.strictEqual(Hub.focusItem(Hub.missingItems(baseSources(), today, 20).items, 20).id, "training");

// 13. Alert groups keep area order and drop empty ones.
var grouped = Hub.groupItems(pile);
assert.deepStrictEqual(grouped.map(function (group) { return group.area; }), [
  "Journal",
  "Health",
  "Study",
  "Mandarin",
  "Practice",
  "Referee",
]);
assert.strictEqual(grouped[0].items.length, 3);
assert.deepStrictEqual(Hub.groupItems([fake("wiki"), fake("unknown-app")]).map(function (group) {
  return group.area;
}), ["Study"]);
assert.deepStrictEqual(Hub.groupItems([]), []);
assert.strictEqual(Hub.alertHeadline("Health", 2), "Health · 2 open");
assert.strictEqual(Hub.AREA_OF.training, "Health");
assert.strictEqual(Hub.AREA_OF.chinese, "Mandarin");
assert.strictEqual(Hub.AREA_OF["next-game"], "Referee");

// 14. Missions collapse into Admin then Crew. Within 3 days is urgent.
assert.strictEqual(Hub.MISSIONS[0].area, "Admin");
assert.strictEqual(Hub.MISSIONS[1].area, "Admin");
assert.strictEqual(crew[0].area, "Crew");
var missionRows = Hub.activeMissions(today, crew);
var missionGroups = Hub.groupMissions(missionRows);
assert.deepStrictEqual(missionGroups.map(function (group) { return group.area; }), ["Admin", "Crew"]);
assert.ok(missionGroups[0].items.length >= 2);
assert.strictEqual(missionGroups[1].items.length, 3);
assert.strictEqual(Hub.missionHeadline(Hub.activeMissions(today)), "Missions · 2 · next in 11d");
assert.strictEqual(Hub.missionUrgent(Hub.activeMissions(today)), false);
assert.strictEqual(Hub.missionUrgent([{ days: 3 }, { days: 11 }]), true);
assert.strictEqual(Hub.missionUrgent([{ days: 4 }]), false);
assert.strictEqual(Hub.missionUrgent([{ days: -1 }]), true);
assert.strictEqual(Hub.missionHeadline([{ days: 0 }, { days: 4 }]), "Missions · 2 · today");
assert.strictEqual(Hub.missionHeadline([{ days: -2 }]), "Missions · 1 · overdue");
assert.deepStrictEqual(Hub.groupMissions(crew.map(function (row) {
  return { label: row.label, due: row.due, days: 1, area: row.area };
})).map(function (group) { return group.area; }), ["Crew"]);

// 15. Active applications ignore saved and closed. A missing file is null.
assert.strictEqual(Hub.careerActive(null), null);
assert.strictEqual(Hub.careerActive(undefined), null);
assert.strictEqual(Hub.careerActive({}), null);
assert.strictEqual(Hub.careerActive({ jobs: [] }), 0);
assert.strictEqual(Hub.careerActive({
  jobs: [
    { stage: "saved" },
    { stage: "applied" },
    { stage: "screening" },
    { stage: "interview" },
    { stage: "offer" },
    { stage: "closed" },
    { stage: "nope" },
    null,
  ],
}), 4);

// 16. Tile counts, and a failed career read does not blank the other checks.
var openReport = Hub.missingItems(baseSources(), today, 9);
var openCounts = Hub.tileCounts(baseSources(), openReport, today);
assert.strictEqual(openCounts.journal, "2 open");
assert.strictEqual(openCounts.study, "—");
assert.strictEqual(openCounts.health, "open");
assert.strictEqual(openCounts.career, "—");
assert.strictEqual(openCounts.mandarin, "—");
assert.strictEqual(openCounts.referee, "—");
var counted = baseSources();
counted.career = { jobs: [{ stage: "applied" }, { stage: "saved" }, { stage: "closed" }] };
counted.wiki = { cards: { a: { due: "2026-10-16", reps: 1, st: "learning" } } };
counted.referee = { games: [{ date: "2026-10-19", home: "A", away: "B", time: "15:00" }] };
var countedReport = Hub.missingItems(counted, today, 9);
var countedTiles = Hub.tileCounts(counted, countedReport, today);
assert.strictEqual(countedTiles.career, "1");
assert.strictEqual(countedTiles.study, "1 left");
assert.strictEqual(countedTiles.referee, "3d");
assert.strictEqual(Hub.tileCounts(withMeal, Hub.missingItems(withMeal, today, 12), today).health, "1650 kcal");
counted.careerError = true;
assert.strictEqual(Hub.tileCounts(counted, countedReport, today).career, "—");
assert.strictEqual(Hub.tileCounts(counted, countedReport, today).journal, "2 open");
var careerFail = baseSources();
careerFail.careerError = true;
assert.strictEqual(Hub.missingItems(careerFail, today, 12).unknown, false);
careerFail.journalError = true;
assert.strictEqual(Hub.missingItems(careerFail, today, 12).unknown, true);

// 17. All apps lists every kept href, hides the two removed apps, and starts collapsed.
var fs = require("fs");
var html = fs.readFileSync(require("path").join(__dirname, "index.html"), "utf8");
var hubSrc = fs.readFileSync(require("path").join(__dirname, "hub.js"), "utf8");
[
  "/wiki-flashcards/",
  "/wiki-flashcards/#/aws",
  "/wiki-flashcards/insights/",
  "/health/",
  "/health/training/",
  "/health/nutrition/",
  "/career/",
  "/speaking-analysis/",
  "/job-hunt/",
  "/Resume/",
  "/journal/",
  "/mirror/",
  "/chinese-library/",
  "/piano/",
  "/thesis/",
  "/money/",
  "/crew-log/",
  "/referee-games/",
  "/roadmap/",
  "/last30days-archive/",
  "/afbraga-flashcards/",
  "/wiki-library/",
  "/law-wiki/",
].forEach(function (href) {
  assert.ok(html.indexOf('href="' + href + '"') !== -1, href);
});
assert.strictEqual(html.indexOf("/summer-outfits-2026/"), -1);
assert.strictEqual(html.indexOf("/gsi-study/"), -1);
["journal", "study", "health", "career", "mandarin", "referee"].forEach(function (name) {
  assert.ok(html.indexOf('data-tile="' + name + '"') !== -1, name);
});
assert.ok(html.indexOf('data-tile="study" href="/wiki-flashcards/"') !== -1);
assert.ok(html.indexOf('data-tile="health" href="/health/"') !== -1);
assert.ok(html.indexOf('data-tile="career" href="/career/"') !== -1);
var detailTags = html.match(/<details\b[^>]*>/gi) || [];
assert.ok(detailTags.length >= 1);
detailTags.forEach(function (tag) {
  assert.ok(!/\sopen(\s|=|>)/.test(tag + ">"), tag);
});
assert.strictEqual(hubSrc.indexOf(".open = true"), -1);
assert.strictEqual(hubSrc.indexOf('setAttribute("open"'), -1);
assert.strictEqual(hubSrc.indexOf("setAttribute('open'"), -1);

// 18. Seventh tile is Wiki Insights, pinned in the first two, with art and accents.
var tileOrder = [];
var tileRe = /data-tile="([^"]+)"/g;
var tileMatch;
while ((tileMatch = tileRe.exec(html))) tileOrder.push(tileMatch[1]);
assert.deepStrictEqual(tileOrder, [
  "journal",
  "wiki-insights",
  "study",
  "health",
  "career",
  "mandarin",
  "referee",
]);
assert.ok(tileOrder.indexOf("wiki-insights") <= 1);
assert.ok(html.indexOf('data-tile="wiki-insights" href="/wiki-flashcards/insights/"') !== -1);
assert.ok(html.indexOf("assets/art/banner.webp") !== -1);
assert.ok(html.indexOf("assets/art/wiki-insights.webp") !== -1);
assert.ok(html.indexOf('width="52"') !== -1);
assert.ok(html.indexOf('height="52"') !== -1);
assert.ok(html.indexOf('loading="lazy"') !== -1);
assert.ok(html.indexOf("styles.css?v=13") !== -1);
assert.ok(html.indexOf("hub.js?v=9") !== -1);
var css = fs.readFileSync(require("path").join(__dirname, "styles.css"), "utf8");
var palette = JSON.parse(fs.readFileSync(require("path").join(__dirname, "assets/art/palette.json"), "utf8"));
Object.keys(palette).forEach(function (key) {
  assert.ok(css.indexOf("--area-" + key + ": " + palette[key]) !== -1, key);
  assert.ok(fs.existsSync(require("path").join(__dirname, "assets/art", key + ".webp")), key);
});
assert.ok(css.indexOf("object-fit: cover") !== -1);
assert.ok(css.indexOf("object-position: center") !== -1);
function aroundHref(href) {
  var at = html.indexOf('href="' + href + '"');
  assert.ok(at !== -1, href);
  return html.slice(Math.max(0, at - 120), at + href.length + 160);
}
assert.ok(aroundHref("/health/training/").indexOf('data-area="health"') !== -1);
assert.ok(aroundHref("/health/nutrition/").indexOf('data-area="health"') !== -1);
assert.ok(aroundHref("/health/training/").indexOf("💚") !== -1);
assert.ok(aroundHref("/health/nutrition/").indexOf("💚") !== -1);
assert.ok(aroundHref("/job-hunt/").indexOf('data-area="career"') !== -1);
assert.ok(aroundHref("/Resume/").indexOf('data-area="career"') !== -1);
assert.ok(aroundHref("/speaking-analysis/").indexOf('data-area="career"') !== -1);
assert.ok(aroundHref("/job-hunt/").indexOf("💼") !== -1);
assert.ok(aroundHref("/Resume/").indexOf("💼") !== -1);
assert.strictEqual(Hub.rowVisual("training").area, "health");
assert.strictEqual(Hub.rowVisual("food").area, "health");
assert.strictEqual(Hub.rowVisual("meals").emoji, Hub.rowVisual("training").emoji);
assert.strictEqual(Hub.rowVisual("speaking").area, "career");
assert.strictEqual(Hub.rowVisual("speaking").emoji, "💼");
assert.strictEqual(Hub.rowVisual({ id: "next-game" }).area, "referee");
assert.strictEqual(Hub.rowVisual({ area: "Crew" }).emoji, "⚓");

console.log("hub.test.js: ok");
