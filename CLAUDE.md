# ShawnAndersonWebSite

Shawn Anderson's personal site, shawnandersonapps.com, plain HTML on GitHub Pages (branch `main`, repo root = site root). No build step, no framework. Two live sub-sites are actively maintained:

- `rick/` Rick Saunders' Western Wildlands Route tracker (Canada to Mexico by bike, Sept 6 to Nov 7, 2026). Updated most days.
- `danceflowers/` Leah's flowers page.

Everything else at the root (`index.html`, etc.) is the personal landing site.

## Working rules (all pages)

- Edit files in place, commit, and `git push origin main`. Do it yourself; Shawn does not want to run Terminal commands.
- Before editing: `git pull --ff-only origin main`. Shawn has clones on a MacBook Air (primary, source of truth) and a Mac mini (read-only, may be behind). If a push is rejected "fetch first": `git pull --rebase origin main && git push origin main`.
- Commit messages: short, plain, what changed ("Day 5: Porcupine Pass to Thompson Falls, 48 mi").
- Shawn cannot be reached mid-ride by Rick, so never invent data. Ask for anything missing.
- Writing style for anything shown on the site or sent to Shawn: no em dashes or en dashes used to set off phrases (use commas, parentheses, or a new sentence). Plain, warm, specific.
- Render test before pushing a layout change: `npx playwright screenshot` is not installed; instead open `rick/index.html` in a headless Chromium (Playwright if available) at 1100px and 390px wide and eyeball the tiles, the daily log, and the segments table. Both tables turn into stacked cards under 720px.

## rick/ tracker

### Files
- `rick/index.html` the tracker page. All CSS and JS inline. Reads `data.js` at load.
- `rick/data.js` ALL daily data. This is the only file that changes on a normal day.
- `rick/weather/index.html` weather page (Open-Meteo + Windy embed), reads `LOCATION` from `../data.js`.
- `rick/photos/index.html` gallery, reads `PHOTOS` from `../data.js`. Photo files live in `rick/photos/`.
- GoatCounter analytics, account `shawnandersonapps`, counter in the footer.

### data.js fields
- `START` Sept 6, 2026. 63 planned days, finish Nov 7.
- `SEGMENTS` nine segments. `miles` are Rick's own pre-trip onX Offroad routes (296.6, 320.5, 348.5, 341.6, 250.6, 334.1, 202.6, 344.9, 284.6 = 2,724.0). Segment 3 at 348.5 is correct, not a typo. `gain` is the official Bikepacking Roots climb. `days`, `start`, `end` are Rick's plan. `TOTAL_PLAN` is computed from SEGMENTS; never hardcode 2,724 in copy, read TOTAL_PLAN.
- `LOG` one row per calendar day: `{day, date, end, miles, gain, loss, lat?, lng?, notes, updates?, course?, done?}`.
  - `updates: [{time:"10:30 am", miles:17, gain:370, text:"..."}]` oldest first; multiple check-ins in one day, shown grouped under the day.
  - `done:false` marks today while he is still riding. Row shows "Riding now", is excluded from completed-day math. To close the day remove `done:false` and fill in end, miles, gain, loss, notes.
  - `course: N` how much a reroute that day changed the length of his course. Negative = shortcut (miles saved), positive = detour (miles added). See "Plan model" below.
- `LOCATION = {lat, lng, town, state, label, asOf, approx}` his last known position. `approx:false` means from his Garmin. Drives the "Where is Rick" block, the map, and the weather.
- `STATUS` one paragraph of intraday news shown under the position. Rewrite each update; `""` if nothing to say.
- `PROGRESS_MAP = {file, asOf, caption}` the zoomed-out map of the whole West with his track, shown under the route bar. Shawn sends a new screenshot every few days; overwrite `rick/photos/wwr-progress-map.jpg` (max 1600px) and bump `asOf`.
- `COVER` banner image file name (no extension) from rick/photos/.
- `PHOTOS` newest first: `{file, date, caption}`. Each photo is `<file>.jpg` (max 1600px) plus `<file>-thumb.jpg` (640px) in rick/photos/. Resize with PIL, apply `exif_transpose`. Ride-map screenshots from onX are named `YYYY-MM-DD-dayN-ride-map`.
- `LAST_UPDATED` page edit time as "Sept 9, 2026, 7:45 pm MT". Shawn is America/Boise; if your clock is UTC, convert. Shown in the blue "Last updated" band under the nav.

### Plan model (Shawn's decision, Sept 9, 2026; he is Rick's "race engineer")
- THE PLAN IS FIXED. Never edit `SEGMENTS.miles` because Rick rerouted.
- Reroutes are recorded on that day's LOG row as `course:N`. Shawn computes N in onX: he keeps a cloned route "Segment N with Shortcuts" mirroring what Rick actually rode plus the remaining plan; N = that route's total minus the original segment total. Day 3: 296.6 original, 289.8 with the shortcut, so `course:-6.8`. A detour (for example into Idaho Falls to see family) would be positive.
- Position = miles ridden minus sum of `course`. Versus plan, route bar, chart, segment status, remaining miles, projected finish and needed pace all use position. "Miles ridden" always shows real pedaled miles with a note about miles saved or added.
- Rick's onX plan is the target he committed to; a shortcut is a gain against it and a detour a cost.

### Daily update routine
1. Shawn sends: onX ride card (distance, gain, loss, high/low point), the wide onX map screenshot (green = ridden, purple = plan), his coordinates (DMS like 47°50'48.5"N 115°53'23.4"W; convert to decimal), optional photos (ASK which day they are from; batches often arrive a day late), and whether he rerouted (`course`).
2. Midday: add or update today's row with `done:false`, current miles/gain, and an `updates` entry. Update LOCATION (approx:true if no Garmin pin), STATUS, LAST_UPDATED.
3. End of day: close the row (remove `done:false`, fill end/miles/gain/loss/notes, add the final check-in to `updates`), add the ride map and any photos to PHOTOS, LOCATION with Garmin pin, STATUS, LAST_UPDATED.
4. Commit and push. Tell Shawn in one line; he hard-refreshes the site. Give him Rick's standing (ridden, position vs plan, needed pace to the next segment end) so he can text it to Rick.
5. Do not run `git status` from a sandboxed shell that cannot remove files in `.git` (it can leave a stale `index.lock`). From a normal Terminal it is fine.

### Layout notes
- Status tiles (5): Miles ridden, Versus plan, Average per day, Needed pace, Projected finish.
- "Needed pace" = miles left in the current segment / riding days left to its planned end date; note shows trip pace to Nov 7 too.
- Under 720px the daily log and segments tables render as cards via CSS; any new `<td>` in those row templates needs the matching class (`l-*` / `s-*`) and a `data-l` label.
- The hosted Claude artifact copy of the tracker (claude.ai) is retired as of Sept 10, 2026; the live site is the only copy.
