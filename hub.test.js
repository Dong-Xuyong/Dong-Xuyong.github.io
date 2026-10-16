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

console.log("hub.test.js: ok");
