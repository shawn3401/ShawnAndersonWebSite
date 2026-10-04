// Dough app: rewrite a person's own steps for a different amount of time before baking.
// Supabase Edge Function `dough-adapt` in the ShawnZapps project. Shares the access list,
// daily cap, and usage log with `dough-ai`. Secret: ANTHROPIC_API_KEY.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.110.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = "claude-opus-5-5";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SYSTEM = `You adjust a home baker's dough method when the time they have before baking changes. You are given their ingredient percents (baker's percentages, flour is 100), their yeast type, the steps they wrote, the timing those steps were written for, and the new timing they want.

Rewrite the steps for the new timing and call the adapt_steps tool with the result. Rules:
- Keep their voice, their order, and everything timing does not affect (mixing, kneading, shaping, baking temperature) as close to word for word as you can. Change only what the new timing requires: water or milk temperature, how long and where the dough rests or rises, whether it goes in the refrigerator, and when to take it out.
- Shorter timings need more yeast and warmth. Longer timings need less yeast, cooler liquid, and time in the refrigerator. Give the new yeast percent for the same yeast type they are using. If the dough has no yeast, return 0.
- Rich doughs with butter, sugar, milk, or eggs rise slower than lean ones. Account for that.
- Times and temperatures in Fahrenheit. Refer to ingredients by name, not grams. One short step per item. Plain text, no markdown. Do not use em dashes or en dashes.
- In changes, say in two or three plain sentences what you changed and why, and note that these are starting points to check against how the dough looks.`;

const ADAPT_TOOL = {
  name: "adapt_steps",
  description: "Return the rewritten steps, the yeast percent for the new timing, and a short explanation.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["steps", "yeast_pct", "changes"],
    properties: {
      steps: { type: "array", items: { type: "string" }, description: "The full method for the new timing, in order." },
      yeast_pct: { type: "number", description: "Yeast as a percent of flour for the new timing, for the person's yeast type. 0 if there is no yeast." },
      changes: { type: "string", description: "Two or three plain sentences: what changed and why." },
    },
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: who, error: whoErr } = await admin.auth.getUser(token);
  if (whoErr || !who?.user) return json({ error: "Sign in to use the AI helper." }, 401);
  const userId = who.user.id;

  const { data: access } = await admin.from("dough_ai_access").select("daily_limit").eq("user_id", userId).maybeSingle();
  if (!access) return json({ error: "The AI helper isn't turned on for your account yet." }, 403);
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count: used } = await admin.from("dough_ai_usage").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
  if ((used ?? 0) >= access.daily_limit) return json({ error: "You've reached today's limit for the AI helper. It resets over the next 24 hours." }, 429);

  let body: { from?: unknown; to?: unknown; context?: unknown };
  try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400); }
  const ask = JSON.stringify({ written_for: body.from, new_timing: body.to, dough: body.context ?? {} }).slice(0, 14000);

  const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
  try {
    const res = await client.messages.stream({
      model: MODEL,
      max_tokens: 8000,
      output_config: { effort: "low" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: [ADAPT_TOOL],
      messages: [{ role: "user", content: `Adapt my steps to the new timing and call adapt_steps.\n\n<request>\n${ask}\n</request>` }],
    } as Anthropic.MessageStreamParams).finalMessage();
    await admin.from("dough_ai_usage").insert({
      user_id: userId,
      input_tokens: (res.usage.input_tokens ?? 0) + (res.usage.cache_read_input_tokens ?? 0) + (res.usage.cache_creation_input_tokens ?? 0),
      output_tokens: res.usage.output_tokens ?? 0,
    });
    const call = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "adapt_steps");
    if (!call || res.stop_reason === "max_tokens") return json({ error: "I couldn't rewrite those steps. Try again." }, 502);
    return json({ adapted: call.input });
  } catch (err) {
    console.error("anthropic error", err);
    if (err instanceof Anthropic.RateLimitError) return json({ error: "The AI is busy right now. Try again in a minute." }, 503);
    if (err instanceof Anthropic.APIError) return json({ error: "The AI couldn't do that: " + err.message }, 502);
    return json({ error: "Something went wrong reaching the AI." }, 502);
  }
});
