// Florian HQ – Kalender-Abo (Supabase Edge Function "ical")
// GET ?t=<persönlicher Token>&g=aktive|jugend|alle&ev=1|0  → text/calendar
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const esc = (s: unknown) =>
  String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
// Zeilen nach RFC 5545 auf 75 Oktette falten
function fold(line: string) {
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > 74) { out.push(cur); cur = " " + ch; } else cur += ch;
  }
  out.push(cur);
  return out.join("\r\n");
}
const ymd = (d: string) => d.replaceAll("-", "");
const stamp = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
function addHours(date: string, time: string, h: number) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, hh + h, mm));
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}T${p(t.getUTCHours())}${p(t.getUTCMinutes())}00`;
}
function nextDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10).replaceAll("-", "");
}
function vevent(uid: string, date: string, time: string, summary: string, location: string, desc: string, hours: number) {
  const L = ["BEGIN:VEVENT", `UID:${uid}@florian-hq`, `DTSTAMP:${stamp()}`];
  const m = /^(\d{1,2}):(\d{2})/.exec(time || "");
  if (m) {
    const t = `${m[1].padStart(2, "0")}:${m[2]}`;
    L.push(`DTSTART;TZID=Europe/Berlin:${ymd(date)}T${t.replace(":", "")}00`, `DTEND;TZID=Europe/Berlin:${addHours(date, t, hours)}`);
  } else {
    L.push(`DTSTART;VALUE=DATE:${ymd(date)}`, `DTEND;VALUE=DATE:${nextDay(date)}`);
  }
  L.push(`SUMMARY:${esc(summary)}`);
  if (location) L.push(`LOCATION:${esc(location)}`);
  if (desc) L.push(`DESCRIPTION:${esc(desc)}`);
  L.push("END:VEVENT");
  return L.map(fold).join("\r\n");
}
const TZ = [
  "BEGIN:VTIMEZONE", "TZID:Europe/Berlin",
  "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST", "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT",
  "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET", "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD",
  "END:VTIMEZONE",
].join("\r\n");

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const tok = url.searchParams.get("t") || "";
  const g = url.searchParams.get("g") || "alle";
  const withEvents = url.searchParams.get("ev") !== "0";
  if (!/^[0-9a-f]{20,64}$/.test(tok)) return new Response("Ungültiger Link", { status: 400 });

  const { data, error } = await sb.rpc("fhq_cal_feed", { tok });
  if (error) return new Response("Fehler", { status: 500 });
  if (!data) return new Response("Link ungültig oder Konto nicht freigeschaltet", { status: 403 });

  const name = g === "aktive" ? "Dienstplan Aktive" : g === "jugend" ? "Dienstplan Jugend" : "Dienstplan";
  const ev: string[] = [];
  for (const d of data.duties as Array<Record<string, string>>) {
    if (g !== "alle" && d.grp !== g) continue;
    const pre = g === "alle" ? (d.grp === "jugend" ? "Jugend: " : "Aktive: ") : "";
    const desc = [d.lead && `Leitung: ${d.lead}`, d.note].filter(Boolean).join("\n");
    ev.push(vevent(`duty-${d.id}`, d.date, d.time, `🚒 ${pre}${d.topic}`, d.place, desc, 2));
  }
  if (withEvents) {
    for (const e of data.events as Array<Record<string, string>>) {
      ev.push(vevent(`event-${e.id}`, e.date, e.time, `🎉 ${e.title}`, e.place, e.note, 3));
    }
  }
  const body = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Florian HQ//FF Nonnenhorn//DE", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:FF Nonnenhorn – ${name}`), "X-WR-TIMEZONE:Europe/Berlin",
    "REFRESH-INTERVAL;VALUE=DURATION:PT2H", "X-PUBLISHED-TTL:PT2H",
    TZ, ...ev, "END:VCALENDAR",
  ].join("\r\n") + "\r\n";

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="florian-hq.ics"',
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
