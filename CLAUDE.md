# ShawnAndersonWebSite

Shawn Anderson's personal site, shawnandersonapps.com, plain HTML on GitHub Pages (branch `main`, repo root = site root). No build step, no framework. Two live sub-sites are actively maintained:

- `rick/` Rick Saunders' Western Wildlands Route tracker (Canada to Mexico by bike, Sept 6 to Nov 7, 2026). Updated most days.
- `danceflowers/` Dance Flowers, Leah's corsage, boutonnière, and bouquet business for school dances and weddings in Idaho Falls. Landing page plus order form. See "danceflowers/ page" below.

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

## danceflowers/ page

### What it is
A one-page storefront at shawnandersonapps.com/danceflowers/ for Leah's flowers. Handmade corsages ($25), boutonnières ($15), and bouquets ($35) for homecoming, prom, winter formal, and weddings. Pickup in Idaho Falls, pay at pickup with cash or Venmo, no payment taken on the site. The page collects an order and Leah confirms by text or email within a day.

### Files
- `danceflowers/index.html` the whole thing. CSS and JS inline, no `data.js`, no other files. Not linked from the root landing page yet (`index.html` at the root does not mention it).
- No GoatCounter script on this page. Add the same `<script data-goatcounter=...>` tag the rick/ pages use if Shawn wants visit counts.

### Page sections (top to bottom, nav anchors in parentheses)
- Hero with cover photo, eyebrow, headline, two buttons, and a three-up price bar.
- What I make (`#types`): three cards, one per product, each with a photo, price, blurb, three bullets, and an "Add a ... to my order" link that bumps that item's quantity in the form.
- How it works (`#how`): three steps (send the order, Leah confirms, pick up and pay).
- Order (`#order`): the form on the left, a sticky "Your order" summary with running total on the right. Stacks on mobile.
- Good to know (`#faq`): six short Q&As (lead time, pickup, dress matching, keeping it fresh, group orders, payment).
- Footer with the "photos are placeholders" note and a link home.

### Look
Same structure as the tracker (color tokens on `:root`, dark palette under `prefers-color-scheme` guarded with `:root:not([data-theme="light"])` and again under `:root[data-theme="dark"]`), but a warmer palette: cream background, rose accent (`--rose`), sage for the step numbers. Display font is Cormorant Garamond, body is Source Sans 3, both from Google Fonts. Breakpoints at 820px (cards, steps, and the order grid go single column), 720px (hero and headline sizes), 560px (form fields single column), 440px (quantity rows).

### Prices live in five places; change all of them together
1. `<meta name="description">` in the head.
2. The `.pricebar` in the hero.
3. The `.price` div in each product card.
4. The `.pr` div on each item row in the order form ("$25 each").
5. The `PRICES` object in the script at the bottom. This one drives the running total and the order payload, so it is the one that matters for money.

### Photos
Every photo on the page is a stock placeholder hotlinked from Pexels or Unsplash, tagged "Placeholder photo" on the cards, with a matching note in the footer. When Leah sends real photos: put them in `danceflowers/photos/` (create it), resize to max 1600px wide with PIL and `exif_transpose` like the rick/ photos, point the hero `<img>`, the three card `<img>` tags, and the `og:image` meta at the local files, then delete the "Placeholder photo" tags and the footer note.

### Order form and where orders go
- Quantities are 0 to 50 per item, changed by the + and − buttons or typed. The summary and total re-render on every change.
- Required: at least one item, event type, event date (date picker min is today), name, phone. Email and notes optional. Email is format-checked if given. A hidden honeypot field named `website` silently drops bot submissions.
- Submission is decided by two constants at the top of the script, `SUPABASE_URL` and `SUPABASE_KEY`. Both are empty today, so the form uses the fallback: it opens the visitor's mail app with a prefilled order addressed to `FALLBACK_EMAIL` (currently shawn3401@gmail.com). The visitor still has to hit send. Change `FALLBACK_EMAIL` to Leah's address when she wants orders directly.
- To switch to Supabase: create a project, make a table `orders` with columns matching the payload built by `collect()` (`items` jsonb, `total` numeric, `event_type`, `event_date` date, `colors`, `name`, `phone`, `email` nullable, `notes`, `page`, `ua` as text, plus a default `created_at`), enable RLS with an insert-only policy for the anon role and no select, then paste the project URL and the anon (publishable) key into the two constants. The page POSTs to `/rest/v1/orders` with `Prefer: return=minimal`. Confirm the success message reads right, since it promises a text to the phone number given.
- The error message on a failed send says "text me directly" but the page shows no phone number anywhere. Ask Shawn or Leah for a number before adding one; do not invent it.

### Copy rules specific to this page
- The voice is Leah's, first person ("I confirm", "What I make"). Keep it that way.
- Stated promises on the page: confirmation within a day, pickup in Idaho Falls the day of or the day before, cash or Venmo, no deposit, a week's notice is ideal. If Leah changes any of these, update the hero lead, the How it works steps, the Order intro, the summary note, and the FAQ, since several repeat the same promise.
