// Florian HQ – Push-Versand (Supabase Edge Function "push")
// GET  → liefert den öffentlichen VAPID-Schlüssel (erzeugt beim ersten Aufruf ein Schlüsselpaar)
// POST → wird vom Datenbank-Trigger aufgerufen und verschickt die Benachrichtigung
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

type Cfg = { hook_secret: string; vapid_public: string | null; vapid_private: string | null };

async function loadConfig(): Promise<Cfg> {
  const { data, error } = await sb.rpc("fhq_push_config");
  if (error) throw error;
  let cfg = (Array.isArray(data) ? data[0] : data) as Cfg;
  if (!cfg?.vapid_public) {
    const keys = webpush.generateVAPIDKeys();
    await sb.rpc("fhq_set_vapid", { pub: keys.publicKey, priv: keys.privateKey });
    const again = await sb.rpc("fhq_push_config");
    cfg = (Array.isArray(again.data) ? again.data[0] : again.data) as Cfg;
  }
  return cfg;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const cfg = await loadConfig();

    if (req.method === "GET") return json({ publicKey: cfg.vapid_public });

    if (req.headers.get("x-hook-secret") !== cfg.hook_secret) return json({ error: "unauthorized" }, 401);

    const msg = await req.json();
    const { data: subs, error } = await sb.rpc("fhq_push_targets", {
      cat: msg.category,
      excl: msg.exclude ?? null,
      admin_only: !!msg.adminOnly,
    });
    if (error) throw error;

    webpush.setVapidDetails("https://florian-hq.netlify.app", cfg.vapid_public!, cfg.vapid_private!);
    const payload = JSON.stringify({ title: msg.title, body: msg.body, url: msg.url || "/" });

    let sent = 0;
    const gone: string[] = [];
    await Promise.all((subs ?? []).map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 60 * 60 * 24, urgency: msg.adminOnly ? "high" : "normal" },
        );
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.id); // Abo existiert nicht mehr
      }
    }));
    if (gone.length) await sb.from("push_subs").delete().in("id", gone);

    return json({ sent, removed: gone.length });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
