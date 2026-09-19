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
- `rick/photos/index.html` gallery, reads `PHOTOS` from `../data.js`. Photo files live in `rick/photos/`. Segments are collapsible `<details>` strips in route order (segment 1 on top), all collapsed by default; photos inside a segment are chronological, oldest first (Shawn's call, Sept 14, 2026). Each strip shows a cover photo chosen in `PICKS` (segment number to file name) near the top of the script; add a pick when a new segment gets photos, otherwise it falls back to the segment's newest photo.
- `rick/records/index.html` trip records page (longest day, most climbing, coldest night, highest camp, honor roll). Computed from `LOG` and `PHOTOS` at load, closed days only. Weather comes from Open-Meteo's reanalysis archive (`archive-api`) at each row's camp pin when the page loads, with the forecast model filling only days the archive lacks; camp elevations from the elevation API. Nothing is stored. Sept 15, 2026: the forecast archive said 0.13 in for the Sept 7 rain day at Loon Lake, the reanalysis says 1.05 in over 23 hours, matching Rick, so the archive is primary. Linked from the tracker's nav tab "Records".
- GoatCounter analytics, account `shawnandersonapps`, counter in the footer.

### data.js fields
- `START` Sept 6, 2026. The plan calendar is derived from SEGMENTS: `PLAN_DAYS` (sum of `days`) and `PLAN_END` (last segment's `end`), both in data.js. Originally 63 days to Nov 7; 58 days to Nov 2 since the Sept 14 segment 2 revision. Never hardcode 63 or Nov 7 in page copy.
- `SEGMENTS` nine segments. `miles` are Rick's own pre-trip onX Offroad routes (296.6, 320.5, 348.5, 341.6, 250.6, 334.1, 202.6, 344.9, 284.6 = 2,724.0). Segment 3 at 348.5 is correct, not a typo. Segment 2 was revised to 123.4 mi / 3,975 ft on Sept 14, 2026 (Moose Mountain fire bypass); the original numbers live in `revised:{on, miles, gain, why}` on that row and the segments table shows a "Revised" chip. TOTAL_PLAN is now about 2,527. `gain` is the official Bikepacking Roots climb. `days`, `start`, `end` are Rick's plan. `TOTAL_PLAN` is computed from SEGMENTS; never hardcode 2,724 in copy, read TOTAL_PLAN.
- `LOG` one row per calendar day: `{day, date, end, miles, gain, loss, lat?, lng?, notes, updates?, course?, done?}`.
  - `updates: [{time:"10:30 am", miles:17, gain:370, text:"..."}]` oldest first; multiple check-ins in one day, shown grouped under the day.
  - `done:false` marks today while he is still riding. Row shows "Riding now", is excluded from completed-day math. To close the day remove `done:false` and fill in end, miles, gain, loss, notes.
  - `high`, `low` (feet) the day's high and low point from the onX ride card, when known. Optional; the records page uses them for "Highest point reached" and "Lowest point reached". Add them when closing a day if the card shows them.
  - `wx: {hi, lo, rain, gust}` optional manual weather override for the records page (°F, °F, inches, mph). Normally absent; Open-Meteo fills it at load.
  - `course: N` how much a reroute that day changed the length of his course. Negative = shortcut (miles saved), positive = detour (miles added). See "Plan model" below.
- `LOCATION = {lat, lng, town, state, label, asOf, approx}` his last known position. `approx:false` means from his Garmin. Drives the "Where is Rick" block, the map, and the weather.
- `STATUS` one paragraph of intraday news shown under the position. Rewrite each update; `""` if nothing to say.
- `PROGRESS_MAP = {file, asOf, caption}` the zoomed-out map of the whole West with his track, shown under the route bar. Shawn sends a new screenshot every few days; overwrite `rick/photos/wwr-progress-map.jpg` (max 1600px) and bump `asOf`.
- `COVER` banner image file name (no extension) from rick/photos/.
- `PHOTOS` newest first: `{file, date, time?, caption}`. `time` is 24-hour "HH:MM" from the camera timestamp (Shawn sends Photos-app screenshots with the date and time in the header); the gallery sorts within a day by it and shows it. Photos without a time sort after the timed ones in array order. `by:"rick"` marks a caption as Rick's own words (from his shared-album comments); the gallery tags it "Rick", everything else "Shawn". Use Rick's caption verbatim when he has one, keep the "Day N." prefix. Each photo is `<file>.jpg` (max 1600px) plus `<file>-thumb.jpg` (640px) in rick/photos/. Resize with PIL, apply `exif_transpose`. Ride-map screenshots from onX are named `YYYY-MM-DD-dayN-ride-map`.
- Photos source (Sept 18, 2026): Shawn's public iCloud shared album "Rick Saunders - Canada to Mexico", https://photos.icloud.com/shared/album/0b04OS9cRFU_Y_682gOPxolQg (shortGUID is the last path part). No login needed:
  1. POST `https://ckdatabasews.icloud.com/database/1/com.apple.photos.cloud/production/public/records/resolve?remapEnums=true` body `{"shortGUIDs":[{"value":"<shortGUID>"}]}` (Content-Type text/plain, Origin https://photos.icloud.com). Result gives `zoneID` and `anonymousPublicAccess` {token (20 min TTL), databasePartition}.
  2. POST `<databasePartition>/database/1/com.apple.photos.cloud/production/shared/records/query?remapEnums=true&sharing_url_key=<shortGUID>&publicAccessAuthToken=<token>` with recordType `CPLAssetAndMasterByAssetDateWithoutHiddenOrDeleted` (filters direction ASCENDING, startRank 0), the zoneID, resultsLimit 400. CPLAsset has `assetDate` (epoch ms, use America/Boise), `masterRef`, `assetBatchId`; CPLMaster has `filenameEnc` (base64 IMG_####.HEIC) and `resJPEGMedRes`/`resOriginalRes` downloadURLs (replace `${f}` with any file name). HEIC originals convert with `sips -s format jpeg`.
  3. Captions: POST `.../shared/changes/zone` with the zoneID; CPLPost records carry `caption`, and an asset's `assetBatchId` equals its post's recordName. Treat those as Rick's words (`by:"rick"`). Location is not exposed. Match album photos to PHOTOS by date and time to find new ones.
- `LAST_UPDATED` page edit time as "Sept 9, 2026, 7:45 pm MT". Shawn is America/Boise; if your clock is UTC, convert. Shown in the blue "Last updated" band under the nav.

### Plan model (Shawn's decision, Sept 9, 2026; he is Rick's "race engineer")
- THE PLAN IS FIXED against Rick's own choices. Never edit `SEGMENTS.miles` because Rick rerouted.
- Exception (Shawn, Sept 14, 2026): a closure that removes the road (fire, washout) is a plan revision, not a reroute. Change the segment's `miles` and `gain` to the bypass route, re-time it at its original mi/day (`days` = round(new miles / original mi/day), new `end`), shift every later segment's `start`/`end` earlier by the days saved, and add `revised:{on, miles, gain, days, end, why}` with the originals. Do not add a `course` for it. Segment 2 on Sept 14: 320.5 mi / 8 days became 123.4 mi / 3 days (Sept 13 to 15), later segments moved up 5 days, plan finish Nov 2. Shawn's first cut kept the old dates and Needed pace showed 6 mi/day, which he rejected. Sept 18, 2026: Shawn also treated Rick's own reroute as a revision (not a shortcut): segment 3 became Darby to Mackay, 202.7 mi / 12,349 ft / 4 days (Sept 16 to 19), skipping Stanley, the Sawtooths and Hailey so Rick could go home to Idaho Falls for the weekend. Later segments moved up 3 more days. Shawn decides case by case which rule applies; ask when it is unclear.
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
- Status tiles (reworked Sept 19, 2026 around follower questions): two rows of five with a row label on the left. Trip: Miles ridden (real, since Sept 6), To Mexico (miles left plus about how much climbing, pro rata from segment `gain`), Versus plan (in DAYS ahead or behind, from where his position falls on the plan calendar), Needed pace (to the target date), Estimated finish (his pace per calendar day so far, zero days included). Segment N: this segment's miles, miles and climbing to its end town, average per riding day in it, needed pace to its end date, estimated arrival. `TARGET_FINISH` in data.js sets the target date; null means the plan's last segment end. Both rows use closed days only. Under 720px the row label becomes a full-width band.
- One current plan (Shawn, Sept 19, 2026): SEGMENTS is always Rick's current plan; when he changes a segment, overwrite miles/gain/days and keep the old numbers in `revised`. His original plan lives in onX only. Snap to the line: when a segment closes, set that day's `course` so his position equals the segment's end exactly (absorbs GPS drift and town miles); Shawn no longer computes course numbers.
- The segments table uses the live position (today's open row included), so a segment finished mid-day shows "Done · day N" right away and the next one shows "Riding". The five tiles, route bar, and chart use closed days only (Shawn's call, Sept 10, 2026).
- "Needed pace" = miles left in the current segment / riding days left to its planned end date; note shows trip pace to Nov 7 too.
- Under 720px the daily log and segments tables render as cards via CSS; any new `<td>` in those row templates needs the matching class (`l-*` / `s-*`) and a `data-l` label.
- Nav bar (Sept 11, 2026): the same `.nav` row of four pills (Tracker, Weather, Photos, Records) is on all four rick/ pages, under the cover on the tracker and at the top of the sub-pages. The current page's link has `class="on"` (red, with a caret). The CSS is duplicated in each page; if you add a page, add it to all four navs.
- The hosted Claude artifact copy of the tracker (claude.ai) is retired as of Sept 10, 2026; the live site is the only copy.

## danceflowers/ page

### What it is
A one-page storefront at shawnandersonapps.com/danceflowers/ for Leah's flowers. Handmade corsages ($25), boutonnières ($15), and bouquets ($35) for homecoming, prom, winter formal, and weddings. Pickup in Idaho Falls, pay at pickup with cash or Venmo, no payment taken on the site. The page collects an order and Leah confirms by text or email within a day.

### Files
- `danceflowers/index.html` the public page. CSS and JS inline, no `data.js`. Loads qrcodejs from cdnjs for the confirmation QR.
- `danceflowers/admin/index.html` Leah's order list (see "Admin page" below).
- The public page is not linked from the root landing page yet. Shawn is adding that link in a separate session (Sept 10, 2026); if it is still missing later, ask before adding it here.
- `supabase/danceflowers/*.sql` database setup scripts, numbered. GitHub Pages publishes this folder too, which is fine, there is nothing secret in it.
- No GoatCounter script on this page. Add the same `<script data-goatcounter=...>` tag the rick/ pages use if Shawn wants visit counts.

### Page sections (top to bottom, nav anchors in parentheses)
- Hero with cover photo, eyebrow, headline, two buttons, and a three-up price bar.
- What I make (`#types`): three cards, one per product, each with a photo, price, blurb, three bullets, and an "Add a ... to my order" link that bumps that item's quantity in the form.
- How it works (`#how`): three steps (send the order, Leah confirms, pick up and pay).
- Order (`#order`): the form on the left, a sticky "Your order" summary with running total on the right. Stacks on mobile.
- Good to know (`#faq`): seven short Q&As (lead time, pickup, dress matching, keeping it fresh, group orders, payment, plans changing).
- Footer with the "photos are placeholders" note, a link home, and a small "Leah's orders" link to the admin sign-in.

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

### Order form and where orders go (Supabase, live since Sept 10, 2026)
- Supabase project `DanceFlowers` in the "Shawn Anderson Apps" org, US East, free plan. URL and publishable key are the two constants at the top of the page script. Never put the secret/service_role key in the page.
- Schema is in `supabase/danceflowers/001_orders.sql` (paste into the SQL editor; safe to re-run). Tables: `products` (key, label, price; the server-side price list) and `orders`. The page never reads or writes the tables directly; it calls two RPC functions:
  - `place_order(payload)` validates, prices the items from `products`, inserts, and returns `{order_number, token, total, name}`. Order numbers start at 1001. `token` is a per-order secret the confirmation panel keeps in sessionStorage.
  - `mark_payment_sent(order_number, token)` flips status to `payment_sent`. Only works with the matching token and only from `new` or `confirmed`.
- Order statuses: new, confirmed, payment_sent, paid, ready, picked_up, cancelled. `internal_notes` is Leah's private column.
- Prices now live in SIX places: the five on the page plus the `products` table. The table is the one that decides the charged total; the page copies are display only.
- RLS: anon has no table access (functions run as security definer). `authenticated` can select and update orders. Signups are disabled in Auth, so only accounts created in the dashboard (Leah, Shawn) can log in.
- Admin page: `danceflowers/admin/index.html`, at shawnandersonapps.com/danceflowers/admin/. Supabase Auth email+password via supabase-js v2 from jsDelivr, session kept in localStorage. `noindex`. Tabs: Needs attention (new, payment_sent), In progress (confirmed, paid, ready), Done (picked_up, cancelled), All. Each order card: number, name, status pill, event and days until, items and total, text/call/email links, colors, customer notes, a status dropdown (saving sets `paid_at` / `payment_sent_at` the first time), and a private notes textarea that saves on change. Search box matches name, phone, email, order number, event. Reloads every 90 s while visible. Same palette as the public page, cards stack under 600px.
- Admin passwords: "Change password" in the top bar (signed in) calls `auth.updateUser`. "Forgot your password?" on the sign-in form calls `resetPasswordForEmail` with `redirectTo` = the admin URL; landing from that link fires PASSWORD_RECOVERY and shows the new-password form. Supabase sends those emails itself (built-in mailer, a few per hour). Requires `https://shawnandersonapps.com/danceflowers/admin/` in Authentication, URL Configuration, Redirect URLs. "Secure password change" is on, so a session older than 24 h must sign out and back in first; the page says so.
- Colors and photos (Sept 10, 2026): a swatch grid of 23 named colors (`COLORS` in the page, `COLOR_HEX` in the admin, `allowed_colors()` in SQL; all three must match) saved as `orders.color_picks text[]`, and up to 3 photos of a dress or tie. Photos are shrunk in the browser to 1600px JPEG and uploaded with the anon key to Storage bucket `order-photos` at `uploads/<uuid>/<uuid>.jpg` BEFORE `place_order` is called; the paths go in the payload and land in `orders.photos text[]`. The bucket is public-read at unguessable paths (so email links work), not listable, 8 MB cap, images only; anon can only insert under `uploads/`. Orphan uploads from abandoned forms are possible and harmless. `photo_url(path)` in SQL builds the public URL. The old free-text `colors` column stays as "Anything else about colors?". Setup is `004_colors_and_photos.sql`.
- Quantities are 0 to 50 per item. Required: at least one item, event type, event date (at least 5 days out, enforced by the date picker, the page's validate(), and place_order in Idaho time; `MIN_DAYS` in the script and `v_min` in the SQL must agree), name, phone. Email optional and format-checked. Honeypot field `website` drops bots.
- After a successful submit the form and summary hide and the confirmation panel (`#confirm`) shows: order number, recap, and a "Next step" block with a "Pay on Venmo" button and a QR code of the same link (QR hidden under 720px). `VENMO_USER` at the top of the script is Leah's handle; while it is empty the whole payment block is hidden. The Venmo link prefills the amount and the note "Dance Flowers order #NNNN". "I sent my payment" calls `mark_payment_sent`. The panel survives a refresh via sessionStorage (same tab only, forgotten after 12 hours); "Place another order" clears it. Shawn was confused by this once; if it comes up again, the answer is Place another order or a new tab.
- The site cannot see Venmo. "Payment sent" is the customer's word; Leah confirms it as `paid` in the admin once it shows in Venmo.
- `CONTACT_PHONE` at the top of the script goes into the failure message.
- Emails (live Sept 10, 2026): `supabase/danceflowers/002_email.sql`. A trigger on `orders` (after insert, and after update of status) calls Resend's API from inside Postgres with pg_net. The Resend key is in Supabase Vault under the name `resend_api_key` (stored by Shawn with `vault.create_secret`; never in the repo or the page). Recipients and addresses are rows in the `settings` table: `notify_to` (leah3401@gmail.com), `notify_cc` (blank), `from_address` ("Dance Flowers <flowers@shawnandersonapps.com>"), `reply_to`, `admin_url`, `venmo_user`, `customer_emails` ('true' sends the customer a copy with the Venmo button if they gave an email). Change these with an update, no code.
  - The customer copy words the Venmo button as a backup ("if you already sent it from the order page, ignore this"), since it goes out before they tap "I sent my payment". Latest wording is in `003_notice_and_email_copy.sql`.
  - Leah gets "New order #N from Name, Event Date, $Total" on insert and "Payment sent for order #N" when status becomes payment_sent. Reply-to is the customer.
  - Resend domain shawnandersonapps.com is verified (DKIM at resend._domainkey, MX and SPF on the `send` subdomain, all written by Resend's GoDaddy auto-configure). Resend region us-east-1.
  - Test orders 1001 and 1003 were placed by Claude; 1002 was probably Leah's Venmo test. Cancel them in the admin.

### Copy rules specific to this page
- The voice is Leah's, first person ("I confirm", "What I make"). Keep it that way.
- Stated promises on the page: confirmation within a day, pickup in Idaho Falls the day of or the day before, at least 5 days' notice (a week or more is better), and the payment policy below. Several sections repeat the same promise (hero lead, step 3, order intro, summary note, confirmation panel text, FAQ), so change them together.
- Payment policy (Shawn, Sept 10, 2026, kept deliberately casual since customers are friends and the kids' friends): Venmo when you order is easiest, cash at pickup is fine, flowers are paid for by pickup, no deposit. If plans change, text Leah early because she buys fresh flowers a few days ahead.
- Leah's contact details on the page: Venmo @Leah-Anderson-58 (`VENMO_USER`), phone 208-403-7323 (`CONTACT_PHONE`, also in the "What if plans change?" FAQ). Notification email, not yet wired: leah3401@gmail.com. If Leah changes any of these, update the hero lead, the How it works steps, the Order intro, the summary note, and the FAQ, since several repeat the same promise.
