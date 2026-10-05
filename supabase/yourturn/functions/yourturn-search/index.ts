// Your Turn restaurant search. Supabase Edge Function `yourturn-search` in the ShawnZapps project.
// The page sends a starting point, a radius, and the genres wanted or ruled out; this asks Google
// Places (New) for restaurants that fit and returns a trimmed list. Nothing is stored here: the page
// saves a place only when someone rates it, visits it, or corrects it.
// Secrets: GOOGLE_MAPS_API_KEY (ShawnZapps Google Cloud project, Places API (New) enabled). Never in the repo.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const USER_DAILY = 40;       // Google calls per person per 24 hours, unless yourturn_limits has a row for them
const MONTHLY = 900;         // Google calls for everyone per calendar month (the free allowance is 1,000)
const MAX_RADIUS = 40000;    // meters

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Genre keys match GENRES in the page. `ask` are Google types safe to send in a request;
// `also` are types only used to recognize a place in the results.
const GENRES: Record<string, { ask: string[]; also?: string[] }> = {
  american:      { ask: ["american_restaurant"], also: ["diner", "bar_and_grill"] },
  burgers:       { ask: ["hamburger_restaurant"] },
  pizza:         { ask: ["pizza_restaurant"] },
  mexican:       { ask: ["mexican_restaurant"] },
  italian:       { ask: ["italian_restaurant"] },
  chinese:       { ask: ["chinese_restaurant"] },
  japanese:      { ask: ["japanese_restaurant", "sushi_restaurant", "ramen_restaurant"] },
  thai:          { ask: ["thai_restaurant"] },
  indian:        { ask: ["indian_restaurant"] },
  bbq:           { ask: ["barbecue_restaurant"] },
  steak:         { ask: ["steak_house"] },
  seafood:       { ask: ["seafood_restaurant"] },
  sandwiches:    { ask: ["sandwich_shop"] },
  breakfast:     { ask: ["breakfast_restaurant", "brunch_restaurant"] },
  mediterranean: { ask: ["mediterranean_restaurant", "greek_restaurant", "middle_eastern_restaurant", "lebanese_restaurant", "turkish_restaurant"] },
  asian:         { ask: ["vietnamese_restaurant", "korean_restaurant", "indonesian_restaurant"], also: ["asian_restaurant"] },
};
// Checked in this order, so a burger place tagged American too comes out as Burgers.
const GENRE_ORDER = ["burgers", "pizza", "mexican", "japanese", "thai", "indian", "chinese", "italian", "bbq", "steak", "seafood",
  "mediterranean", "asian", "sandwiches", "breakfast", "american"];

// Counter-service places that are a step up from fast food. Google has no type for this, so it is
// a name list for the first guess; anyone can correct a place and the correction is saved.
const FAST_CASUAL = ["five guys", "costa vida", "cafe rio", "café rio", "chipotle", "qdoba", "panera", "jimmy john", "jersey mike",
  "firehouse subs", "mod pizza", "blaze pizza", "noodles & company", "noodles and company", "panda express", "shake shack",
  "smashburger", "habit burger", "cupbop", "zupas", "kneaders", "crumbl", "potbelly", "which wich", "mcalister", "wingstop",
  "rumbi", "mo' bettahs", "mo bettahs", "freddy's", "culver's", "raising cane", "slim chickens", "cava", "sweetgreen", "teriyaki madness",
  "pita pit", "moe's southwest", "jason's deli", "schlotzsky", "tropical smoothie", "einstein bros", "great harvest", "papa murphy"];

// Places that sell food but are not somewhere you go out to eat (Shawn's first deal had two Maverik gas stations).
const NOT_FOOD = ["gas_station", "convenience_store", "grocery_store", "supermarket"];
const isFood = (p: GPlace) => !(p.types ?? []).some((t) => NOT_FOOD.includes(t));

const PRICE: Record<string, number> = {
  PRICE_LEVEL_FREE: 0, PRICE_LEVEL_INEXPENSIVE: 1, PRICE_LEVEL_MODERATE: 2, PRICE_LEVEL_EXPENSIVE: 3, PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

const FIELDS = ["id", "displayName", "shortFormattedAddress", "formattedAddress", "location", "types", "primaryType", "primaryTypeDisplayName",
  "rating", "userRatingCount", "priceLevel", "businessStatus", "currentOpeningHours.openNow", "currentOpeningHours.nextCloseTime",
  "reservable", "googleMapsUri"].map((f) => "places." + f).join(",");

type GPlace = {
  id: string; displayName?: { text?: string }; shortFormattedAddress?: string; formattedAddress?: string;
  location?: { latitude: number; longitude: number }; types?: string[]; primaryType?: string; primaryTypeDisplayName?: { text?: string };
  rating?: number; userRatingCount?: number; priceLevel?: string; businessStatus?: string;
  currentOpeningHours?: { openNow?: boolean; nextCloseTime?: string }; reservable?: boolean; googleMapsUri?: string;
};

function guessGenre(p: GPlace): string {
  const types = new Set([p.primaryType, ...(p.types ?? [])].filter(Boolean) as string[]);
  // The primary type wins when it maps to a genre.
  for (const g of GENRE_ORDER) if (p.primaryType && [...GENRES[g].ask, ...(GENRES[g].also ?? [])].includes(p.primaryType)) return g;
  for (const g of GENRE_ORDER) if ([...GENRES[g].ask, ...(GENRES[g].also ?? [])].some((t) => types.has(t))) return g;
  return "other";
}
function guessStyle(p: GPlace): string {
  const name = (p.displayName?.text ?? "").toLowerCase();
  const types = p.types ?? [];
  if (FAST_CASUAL.some((n) => name.includes(n))) return "fast_casual";
  if (types.includes("fast_food_restaurant")) return "fast_food";
  if (types.includes("fine_dining_restaurant") || PRICE[p.priceLevel ?? ""] >= 4) return "fine";
  return "sit_down";
}
const trim = (p: GPlace) => ({
  id: p.id,
  name: p.displayName?.text ?? "",
  address: p.shortFormattedAddress ?? p.formattedAddress ?? "",
  lat: p.location?.latitude ?? null,
  lng: p.location?.longitude ?? null,
  type_label: p.primaryTypeDisplayName?.text ?? "",
  genre: guessGenre(p),
  style: guessStyle(p),
  rating: p.rating ?? null,
  count: p.userRatingCount ?? 0,
  price: p.priceLevel ? PRICE[p.priceLevel] ?? null : null,
  open: p.currentOpeningHours?.openNow ?? null,
  closes: p.currentOpeningHours?.nextCloseTime ?? null,
  reservable: p.reservable ?? null,
  maps: p.googleMapsUri ?? "",
});

async function google(path: string, body: unknown, key: string): Promise<GPlace[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || ("Google answered " + res.status));
  return (data.places ?? []).filter((p: GPlace) => !p.businessStatus || p.businessStatus === "OPERATIONAL");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // Who is asking. verify_jwt already rejected unsigned calls; this resolves the user.
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: who, error: whoErr } = await admin.auth.getUser(token);
  if (whoErr || !who?.user) return json({ error: "Sign in to search for places." }, 401);
  const userId = who.user.id;

  const key = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!key) return json({ error: "Restaurant search isn't connected to Google yet. Shawn still needs to add the key." }, 503);

  let body: { action?: string; lat?: number; lng?: number; radius_m?: number; want?: string[]; avoid?: string[]; styles?: string[]; query?: string };
  try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400); }
  const lat = Number(body.lat), lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return json({ error: "I need a starting point first." }, 400);
  const center = { latitude: lat, longitude: lng };

  // Caps: per person per day, and for everyone per calendar month, so the Google bill stays at zero.
  const sum = (rows: { calls: number }[] | null) => (rows ?? []).reduce((n, r) => n + (r.calls || 0), 0);
  const day = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const now = new Date();
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const [mine, all, own] = await Promise.all([
    admin.from("yourturn_usage").select("calls").eq("user_id", userId).gte("created_at", day),
    admin.from("yourturn_usage").select("calls").gte("created_at", month),
    admin.from("yourturn_limits").select("daily_limit").eq("user_id", userId).maybeSingle(),
  ]);
  if (sum(mine.data) >= (own.data?.daily_limit ?? USER_DAILY)) return json({ error: "You've reached today's search limit. It resets over the next 24 hours." }, 429);
  if (sum(all.data) >= MONTHLY) return json({ error: "Your Turn has used its Google searches for the month. Saved places still work." }, 429);

  const known = (list: unknown) => (Array.isArray(list) ? list : []).filter((g): g is string => typeof g === "string" && g in GENRES);
  let calls = 0;
  try {
    if (body.action === "find") {
      // Look a place up by name, near the starting point.
      const q = String(body.query ?? "").trim().slice(0, 80);
      if (q.length < 2) return json({ error: "Type a restaurant name." }, 400);
      calls = 1;
      const found = await google("searchText", {
        textQuery: q, pageSize: 8,
        locationBias: { circle: { center, radius: 30000 } },
      }, key);
      await admin.from("yourturn_usage").insert({ user_id: userId, kind: "find", calls });
      return json({ places: found.map(trim) });
    }

    const radius = Math.min(MAX_RADIUS, Math.max(500, Number(body.radius_m) || 5000));
    const want = known(body.want), avoid = known(body.avoid).filter((g) => !want.includes(g));
    const styles = Array.isArray(body.styles) ? body.styles : [];
    const onlyFast = styles.length === 1 && styles[0] === "fast_food";
    const noFast = styles.length > 0 && !styles.includes("fast_food") && !styles.includes("fast_casual");

    let included = ["restaurant"];
    if (want.length) included = want.flatMap((g) => GENRES[g].ask);
    else if (onlyFast) included = ["fast_food_restaurant"];
    const excluded = avoid.flatMap((g) => GENRES[g].ask).filter((t) => !included.includes(t));
    if (noFast && !included.includes("fast_food_restaurant")) excluded.push("fast_food_restaurant");
    excluded.push(...NOT_FOOD);

    const base = {
      includedTypes: included, excludedTypes: excluded, maxResultCount: 20,
      locationRestriction: { circle: { center, radius } },
    };
    // Google returns 20 at most per call. Asking twice, by popularity and by distance, gives a wider pool.
    calls = 2;
    const [popular, near] = await Promise.all([
      google("searchNearby", { ...base, rankPreference: "POPULARITY" }, key),
      google("searchNearby", { ...base, rankPreference: "DISTANCE" }, key),
    ]);
    await admin.from("yourturn_usage").insert({ user_id: userId, kind: "search", calls });
    const seen = new Set<string>();
    const places = [...popular, ...near].filter((p) => !seen.has(p.id) && seen.add(p.id)).filter(isFood).map(trim);
    return json({ places });
  } catch (err) {
    console.error("google error", err);
    if (calls) await admin.from("yourturn_usage").insert({ user_id: userId, kind: "error", calls });
    return json({ error: "Google couldn't answer that: " + (err instanceof Error ? err.message : "unknown error") }, 502);
  }
});
