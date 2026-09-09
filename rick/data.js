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
  {day:3, date:"2026-09-08", end:"Troy Mine, near Bull Lake, MT", miles:45.6, gain:1749, loss:2895, lat:48.30558, lng:-115.84547, notes:"Loon Lake to Troy Mine. Mostly downhill to the Kootenai River at 1,884 ft, restocked food in Troy, then south along Hwy 56 to camp near Bull Lake."},
];

// Rick's last known position. This drives the "Where is Rick?" block, the map, and the weather. Update whenever new coordinates come in, even mid-day.
// town = nearest town, state = 2-letter state, label = extra detail (forest, lake, pass), asOf = when the position was reported (Mountain time), approx:true shows an "approximate" tag instead of "from his Garmin".
const LOCATION = {lat:48.30558, lng:-115.84547, town:"Bull Lake", state:"MT", label:"Camped for the night near Troy Mine, north end of Bull Lake, Hwy 56 corridor", asOf:"Sept 8, 8:30 pm MT", approx:false};

// Intraday news that is not a completed day. Shows under the position. Set to "" when there is nothing to say. Only add a LOG row once the day is done.
const STATUS = "Day 3 done: 45.6 miles, Loon Lake to Troy Mine. Restocked in Troy midday and pushed another 14 miles south to camp near Bull Lake. Three days in, 105.6 miles.";
// Cover photo for the top of the tracker page (file name without .jpg, from rick/photos/). Use a wide crop; the bottom third fades into the page.
const COVER = "2026-09-06-roosville-start-cover";

// Photos: file names live in rick/photos/. Add the full-size jpg plus a -thumb.jpg. Newest first.
const PHOTOS = [
  {file:"2026-09-08-day3-ride-map", date:"2026-09-08", caption:"Day 3 route on onX Offroad: Loon Lake Campground to Troy Mine, 45.6 mi, +1,749 / -2,895 ft. Green is the day, purple is the plan."},
  {file:"2026-09-06-loon-lake-camp", date:"2026-09-06", caption:"Day 1. Camp at Loon Lake Campground after 60 miles: tent up, helmet on the table, rain moving in."},
  {file:"2026-09-06-tent-interior", date:"2026-09-06", caption:"Day 1. Inside the tent at Loon Lake: camp chair, dry bags, and gear drying out. This became home for the next 24 hours of rain."},
  {file:"2026-09-06-bear-hang", date:"2026-09-06", caption:"Day 1. Food bag hung high in the cedars. Grizzly country."},
  {file:"2026-09-06-loon-lake-lily-pads", date:"2026-09-06", caption:"Day 1. Loon Lake under low clouds, lily pads on the water."},
  {file:"2026-09-06-river-bridge", date:"2026-09-06", caption:"Day 1. Old steel truss bridge on the way south from the border."},
  {file:"2026-09-06-downed-tree", date:"2026-09-06", caption:"Day 1. First obstacle of the trip: a fresh blowdown across the road below a rock slide."},
  {file:"2026-09-06-selfie-fog", date:"2026-09-06", caption:"Day 1. Wet but smiling, fog hanging in the trees on the climb."},
  {file:"2026-09-06-handlebar-view-fog", date:"2026-09-06", caption:"Day 1. Handlebar view with 17 miles to go to Loon Lake, clouds lifting off the valley."},
  {file:"2026-09-06-day1-ride-map", date:"2026-09-06", caption:"Day 1 route on onX Offroad: Roosville to Loon Lake Campground, 60 mi, +3,761 / -2,838 ft, 4,266 ft high point."},
  {file:"2026-09-06-roosville-start", date:"2026-09-06", caption:"Day 0. Rick and the loaded bike at the Roosville border crossing, ready to roll south."},
];
const LAST_UPDATED = "Sept 8, 2026, 8:50 pm MT";
// ===== END DATA =====
