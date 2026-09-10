// ===== DATA: edit here each day =====
const START = new Date(2026, 8, 6); // Sep 6 2026 (local)

// miles = Rick's pre-trip onX Offroad route for each segment (his true plan; the official Bikepacking Roots figures were 304/326/289/342/250/337/209/344/292 = 2,693). gain = official. days/dates = Rick's plan.
// DO NOT edit miles when he reroutes; put the change on that day's LOG row as course:N instead (negative saved, positive added).
const SEGMENTS = [
  {n:1, from:"Canada (Roosville)", to:"Superior, MT",   miles:296.6, gain:25000, days:7, start:"2026-09-06", end:"2026-09-12", season:"Early Jul to late Sep", seasonState:"ok",    note:"Porcupine Pass"},
  {n:2, from:"Superior",           to:"Darby, MT",      miles:320.5, gain:31000, days:8, start:"2026-09-13", end:"2026-09-20", season:"Early Jul to late Sep", seasonState:"ok",    note:"Biggest climbing segment. Moon Pass"},
  {n:3, from:"Darby",              to:"Hailey, ID",     miles:348.5, gain:23000, days:7, start:"2026-09-21", end:"2026-09-27", season:"Late Jun to late Sep",  seasonState:"tight", note:"Magruder Corridor, 125 mi / 14,000 ft"},
  {n:4, from:"Hailey",             to:"Bear Lake (UT line)", miles:341.6, gain:15000, days:7, start:"2026-09-28", end:"2026-10-04", season:"Mid May to late Sep", seasonState:"past", note:"Galena Pass. Carry 6 L water from here south"},
  {n:5, from:"Bear Lake",          to:"Soldier Summit, UT", miles:250.6, gain:14500, days:6, start:"2026-10-05", end:"2026-10-10", season:"Mid May to late Sep", seasonState:"past", note:""},
  {n:6, from:"Soldier Summit",     to:"Kanab, UT",      miles:334.1, gain:24000, days:8, start:"2026-10-11", end:"2026-10-18", season:"Late Jun to mid Oct",   seasonState:"tight", note:""},
  {n:7, from:"Kanab",              to:"Grand Canyon, AZ", miles:202.6, gain:10000, days:5, start:"2026-10-19", end:"2026-10-23", season:"Mid Apr to late Nov", seasonState:"ok",  note:"Vermilion Cliffs, Kaibab Plateau. Navajo Nation + Babbitt Ranch permits"},
  {n:8, from:"Grand Canyon",       to:"Globe, AZ",      miles:344.9, gain:22000, days:8, start:"2026-10-24", end:"2026-10-31", season:"Early May to late Nov", seasonState:"ok",  note:"AZ State Land recreation permit"},
  {n:9, from:"Globe",              to:"Sierra Vista (MX border)", miles:284.6, gain:21000, days:7, start:"2026-11-01", end:"2026-11-07", season:"Mid Sep to early May", seasonState:"ok", note:""},
];
const TOTAL_PLAN = Math.round(SEGMENTS.reduce((a,s)=>a+s.miles,0)*10)/10;

// One entry per calendar day. miles = that day's distance. gain/loss in ft. lat/lng = that night's camp (decimal degrees, from Rick's Garmin pin); shown as a Google Maps link in the daily log and the Last camp block.
// Multiple updates in one day: add updates:[{time:"10:30 am", miles:17, gain:370, text:"..."}] (oldest first) and they show grouped under the day's notes.
// course:N on a row = how much a reroute that day changed the length of his course, from the onX segment route with reroutes vs his original. Negative = shortcut (saved miles), positive = detour (added miles). Applied to his position; the plan does not change.
// While he is still riding, set done:false and keep miles/gain at the latest check-in; the row shows "Riding now" and stays out of the completed-day math. When the day ends, remove done:false and fill in end, miles, gain, loss, notes.
const LOG = [
  {day:1, date:"2026-09-06", end:"Loon Lake Campground, MT", miles:60, gain:3761, loss:2838, lat:48.59786, lng:-115.67161, notes:"Roosville border to Loon Lake. Big opener with a 4,266 ft high point."},
  {day:2, date:"2026-09-07", end:"Loon Lake Campground, MT", miles:0, gain:0, loss:0, lat:48.59786, lng:-115.67161, notes:"Rain day. Sat tight at camp all day and waited it out."},
  {day:3, date:"2026-09-08", end:"Troy Mine, near Bull Lake, MT", miles:45.6, gain:1749, loss:2895, lat:48.30558, lng:-115.84547, course:-6.8, notes:"Loon Lake to Troy Mine. Mostly downhill to the Kootenai River at 1,884 ft, restocked food in Troy, then south along Hwy 56 to camp near Bull Lake. Took a shortcut that trimmed 6.8 miles off segment 1 (296.6 planned, 289.8 with the reroute)."},
  {day:4, date:"2026-09-09", end:"Porcupine Pass, ID (Montana/Idaho line)", miles:56.5, gain:4431, loss:1876, lat:47.84681, lng:-115.88983, notes:"Troy Mine to Porcupine Pass. Down Hwy 56 past Bull Lake to the Hwy 200 junction near Noxon, then a 3,000 ft climb from the low point at 2,189 ft to the 5,205 ft pass. Camped ten feet into Idaho. First state down.", updates:[
    {time:"8:30 am", text:"Rolled out after a great night's sleep at the Troy Mine camp."},
    {time:"10:30 am", miles:17, gain:370, text:"Heading south on Hwy 56 toward Cabinet Gorge Reservoir, then he picks up Hwy 200 and keeps going south."},
    {time:"7:20 pm", miles:56.5, gain:4431, text:"Made the Idaho state line at Porcupine Pass and set up camp ten feet into Idaho. Big afternoon climb to the 5,205 ft pass."},
  ]},
  {day:5, date:"2026-09-10", end:"", miles:45.6, gain:2093, loss:4423, done:false, notes:"", updates:[
    {time:"12:00 pm", miles:16.3, gain:108, text:"Down off Porcupine Pass into Idaho, 2,579 ft of descent to Shoshone Creek at about 2,600 ft. Stopped to fill up with 7 liters of water from the creek."},
    {time:"4:30 pm", miles:45.6, gain:2093, text:"Checked in from Wallace, ID, down out of the Coeur d'Alene National Forest to the town on I-90. Low point of the day was 2,384 ft. Already past the 43 miles he needed today and not done yet."},
  ]},
];

// Rick's last known position. This drives the "Where is Rick?" block, the map, and the weather. Update whenever new coordinates come in, even mid-day.
// town = nearest town, state = 2-letter state, label = extra detail (forest, lake, pass), asOf = when the position was reported (Mountain time), approx:true shows an "approximate" tag instead of "from his Garmin".
const LOCATION = {lat:47.4741, lng:-115.9281, town:"Wallace", state:"ID", label:"In town on I-90 after the long descent out of the Coeur d'Alene National Forest, 45.6 miles into day 5", asOf:"Sept 10, 4:30 pm MT", approx:true};

// Intraday news that is not a completed day. Shows under the position. Set to "" when there is nothing to say. Only add a LOG row once the day is done.
const STATUS = "Day 5 still under way. Rick checked in from Wallace, ID at 4:30 pm with 45.6 miles so far, 2,093 ft of climbing and 4,423 ft of descent, off Porcupine Pass and down through the Coeur d'Alene National Forest. That is already past the 43 miles he needed today, and he is still rolling.";
// Cover photo for the top of the tracker page (file name without .jpg, from rick/photos/). Use a wide crop; the bottom third fades into the page.
// Zoomed-out map of the whole West with Rick's track so far (screenshot from the Windy/onX view). Re-shoot every few days, overwrite the same file, update asOf.
const PROGRESS_MAP = {file:"wwr-progress-map", asOf:"Sept 9, 2026, end of day 4", caption:"Blue and green at the top is Rick's track so far, Roosville to Porcupine Pass. The route runs south through Idaho, Utah and Arizona to the Mexican border at Sierra Vista."};
const COVER = "2026-09-06-roosville-start-cover";

// Photos: file names live in rick/photos/. Add the full-size jpg plus a -thumb.jpg. Newest first.
const PHOTOS = [
  {file:"2026-09-10-wallace-burger", date:"2026-09-10", caption:"Day 5. Lunch in Wallace, ID: bacon burger, sweet potato fries, and a berry shake."},
  {file:"2026-09-10-food-inventory", date:"2026-09-10", caption:"Day 5. Food inventory laid out on the ground next to the pannier, counting what is left."},
  {file:"2026-09-10-mossy-spring", date:"2026-09-10", caption:"Day 5. Mossy rock face with a spring trickling down it on the descent from Porcupine Pass toward Wallace."},
  {file:"2026-09-09-porcupine-pass-sign-selfie", date:"2026-09-09", caption:"Day 4. Rick at the Porcupine Pass 9 / State Line 9 sign on the Montana side, nine miles below the pass, loaded bike behind him."},
  {file:"2026-09-09-kootenai-sign-selfie", date:"2026-09-09", caption:"Day 4 morning. Rick at the Kootenai National Forest sign, fresh off a good night's sleep and about to head south for the Idaho line."},
  {file:"2026-09-09-day4-ride-map", date:"2026-09-09", caption:"Day 4 route on onX Offroad: Troy Mine to Porcupine Pass on the Idaho border, 56.5 mi, +4,431 / -1,876 ft. Green is the day, purple is the plan."},
  {file:"2026-09-08-troy-mine-camp", date:"2026-09-08", caption:"Day 3 camp near Troy Mine: tent under the firs, bike leaned up, gear spread out on the tarp to dry, and food bags hung in the trees."},
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
const LAST_UPDATED = "Sept 10, 2026, 4:44 pm MT";
// ===== END DATA =====
