// ===== DATA: edit here each day =====
const START = new Date(2026, 8, 6); // Sep 6 2026 (local)
const TOTAL_PLAN = 2693;

// miles + gain are the official Bikepacking Roots segment figures (they sum to 2,693). days/dates are Rick's plan.
const SEGMENTS = [
  {n:1, from:"Canada (Roosville)", to:"Superior, MT",   miles:304, gain:25000, days:7, start:"2026-09-06", end:"2026-09-12", season:"Early Jul to late Sep", seasonState:"ok",    note:"Porcupine Pass"},
  {n:2, from:"Superior",           to:"Darby, MT",      miles:326, gain:31000, days:8, start:"2026-09-13", end:"2026-09-20", season:"Early Jul to late Sep", seasonState:"ok",    note:"Biggest climbing segment. Moon Pass"},
  {n:3, from:"Darby",              to:"Hailey, ID",     miles:289, gain:23000, days:7, start:"2026-09-21", end:"2026-09-27", season:"Late Jun to late Sep",  seasonState:"tight", note:"Magruder Corridor, 125 mi / 14,000 ft"},
  {n:4, from:"Hailey",             to:"Bear Lake (UT line)", miles:342, gain:15000, days:7, start:"2026-09-28", end:"2026-10-04", season:"Mid May to late Sep", seasonState:"past", note:"Galena Pass. Carry 6 L water from here south"},
  {n:5, from:"Bear Lake",          to:"Soldier Summit, UT", miles:250, gain:14500, days:6, start:"2026-10-05", end:"2026-10-10", season:"Mid May to late Sep", seasonState:"past", note:""},
  {n:6, from:"Soldier Summit",     to:"Kanab, UT",      miles:337, gain:24000, days:8, start:"2026-10-11", end:"2026-10-18", season:"Late Jun to mid Oct",   seasonState:"tight", note:""},
  {n:7, from:"Kanab",              to:"Grand Canyon, AZ", miles:209, gain:10000, days:5, start:"2026-10-19", end:"2026-10-23", season:"Mid Apr to late Nov", seasonState:"ok",  note:"Vermilion Cliffs, Kaibab Plateau. Navajo Nation + Babbitt Ranch permits"},
  {n:8, from:"Grand Canyon",       to:"Globe, AZ",      miles:344, gain:22000, days:8, start:"2026-10-24", end:"2026-10-31", season:"Early May to late Nov", seasonState:"ok",  note:"AZ State Land recreation permit"},
  {n:9, from:"Globe",              to:"Sierra Vista (MX border)", miles:292, gain:21000, days:7, start:"2026-11-01", end:"2026-11-07", season:"Mid Sep to early May", seasonState:"ok", note:""},
];

// One entry per riding day. miles = that day's distance. gain/loss in ft. lat/lng optional (end-of-day camp).
const LOG = [
  {day:1, date:"2026-09-06", end:"Loon Lake Campground, MT", miles:60, gain:3761, loss:2838, notes:"Roosville border to Loon Lake. Big opener with a 4,266 ft high point."},
  {day:2, date:"2026-09-07", end:"Loon Lake Campground, MT", miles:0, gain:0, loss:0, notes:"Rain day. Sat tight at camp all day and waited it out."},
];

// Rick's last known position. This drives the "Where is Rick?" block, the map, and the weather. Update whenever new coordinates come in, even mid-day.
// town = nearest town, state = 2-letter state, label = extra detail (forest, lake, pass), asOf = when the position was reported (Mountain time), approx:true shows an "approximate" tag instead of "from his Garmin".
const LOCATION = {lat:48.79, lng:-115.62, town:"Near Loon Lake", state:"MT", label:"Kootenai National Forest, north of Eureka", asOf:"Sept 8, 9:35 am MT", approx:true};

// Intraday news that is not a completed day. Shows under the position. Set to "" when there is nothing to say. Only add a LOG row once the day is done.
const STATUS = "Day 3, still at Loon Lake. It rained for 24 hours straight yesterday and Rick rode it out in 35 square feet of tent. Holding this morning until the rain clears, then heading south.";
// Cover photo for the top of the tracker page (file name without .jpg, from rick/photos/). Use a wide crop; the bottom third fades into the page.
const COVER = "2026-09-06-roosville-start-cover";

// Photos: file names live in rick/photos/. Add the full-size jpg plus a -thumb.jpg. Newest first.
const PHOTOS = [
  {file:"2026-09-06-roosville-start", date:"2026-09-06", caption:"Day 0. Rick and the loaded bike at the Roosville border crossing, ready to roll south."},
];
const LAST_UPDATED = "Sept 8, 2026, 9:35 am MT";
// ===== END DATA =====
