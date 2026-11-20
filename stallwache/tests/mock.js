// Mock für supabase-js – nur für den lokalen UI-Test
(() => {
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const day = (o) => { const d = new Date(now - o * 86400000); return d.toISOString().slice(0, 10); };
  const db = {
    hs_members: [{ user_id: 'u1', email: 'admin@test.de', name: 'Admin', role: 'admin', status: 'approved', tiles: {} }, { user_id: 'u2', email: 'partner@test.de', name: '', role: 'member', status: 'pending', tiles: {} }],
    hs_state: [{ id: 1, door: 'offen', io: { 'Endschalter oben': true, 'Endschalter unten': false, 'Motor auf': false, 'Motor zu': false, 'Schloss entriegelt': false, 'Ziegentür offen': false }, info: { sunrise: '07:41', sunset: '16:39', plan_auf: '08:11', plan_zu: '16:59', alarm_ab: '17:29', cams: ['Stall innen', 'Auslauf'], temp: 4.5, heizung: { modus: 'auto', an: true, temp: -1.5, quelle: 'Fühler am Stall' }, rfid_unbekannt: { chip: '900 555 000 111 222', ts: iso(now - 120000) } }, last_seen: iso(now - 20000), changed_at: iso(now - 3600000 * 5), snaps: { cam0: iso(now - 60000) } }],
    hs_config: [{ id: 1, data: { steuerung: 'logo', zeitart: 'sonne', auf_offset: 30, zu_offset: 20, auf_frueheste: '06:30', zu_spaeteste: '22:00', alarm_min: 30, lat: 47.67, lon: 9.59, auf_fix: '07:00', zu_fix: '20:00', ziegen: { modus: 'zeit', von: '08:00', bis: '18:00', sekunden: 10 }, traenke: { modus: 'auto', ein: 1, aus: 3 }, wetter: { aktiv: true, frost: 0, boeen: 70 }, stallpflicht: { aktiv: false, seit: iso(now - 3600000), von: 'Eva Egger', notiz: 'Aufstallung Bodenseekreis ab 21.11.' }, pflege: [{ key: 'futter', name: 'Futter nachfüllen', tage: 7 }, { key: 'wasser', name: 'Wasser wechseln', tage: 2 }, { key: 'ausmisten', name: 'Ausmisten', tage: 14 }] } }],
    hs_events: [{ id: 3, ts: iso(now - 3600000 * 5), kind: 'auf', text: 'Klappe geöffnet (LOGO-Astro)' }, { id: 2, ts: iso(now - 3600000 * 20), kind: 'zu', text: 'Klappe geschlossen – LOGO-Astro / Taster', bild: 'archiv/x.jpg' }, { id: 1, ts: iso(now - 3600000 * 21), kind: 'befehl', text: 'Admin: Klappe schließen' }, { id: 4, ts: iso(now - 3600000 * 3), kind: 'ziege', text: 'Lotte: Schloss entriegelt (10 s)' }, { id: 5, ts: iso(now - 3600000 * 1), kind: 'ziege', text: 'Lotte abgewiesen – außerhalb der Freigabe' }],
    hs_items: [
      ...Array.from({ length: 25 }, (_, i) => ({ id: 'e' + i, tile: 'eier', kind: 'eier', data: { datum: day(i), anzahl: 3 + (i * 7) % 4 }, created_at: iso(now - i * 86400000) })),
      { id: 'p1', tile: 'pflege', kind: 'pflege', data: { art: 'wasser', datum: day(3) }, created_at: iso(now), created_by: 'u1' },
      { id: 'p2', tile: 'pflege', kind: 'pflege', data: { art: 'futter', datum: day(1) }, created_at: iso(now), created_by: 'u1' },
      { id: 'h1', tile: 'herde', kind: 'huhn', data: { name: 'Berta', rasse: 'Sussex', farbe: 'weiß', status: 'aktiv', geschlecht: 'henne', schlupf: '2024-04-01' }, created_at: iso(now) },
      { id: 'h2', tile: 'herde', kind: 'huhn', data: { name: 'Gockel', rasse: 'Marans', status: 'aktiv', geschlecht: 'hahn' }, created_at: iso(now) },
      { id: 'h3', tile: 'herde', kind: 'huhn', data: { name: 'Frieda', rasse: 'Australorps', status: 'aktiv', geschlecht: 'henne' }, created_at: iso(now) },
      { id: 'z1', tile: 'ziegen', kind: 'ziege', data: { name: 'Lotte', chip: '900 123 456 789 012', aktiv: true } , created_at: iso(now) },
      { id: 'z2', tile: 'ziegen', kind: 'ziege', data: { name: 'Fritzi', chip: '', aktiv: true }, created_at: iso(now) },
      { id: 'g1', tile: 'gesundheit', kind: 'eintrag', data: { datum: day(2), art: 'behandlung', huhn: 'Berta', titel: 'Kalkbeine behandelt', notiz: 'Beine mit Öl eingerieben', wiedervorlage: day(-2) }, created_at: iso(now) },
    ],
    hs_commands: [], hs_push_subs: [],
    hs_wetter: [{ id: 1, updated_at: iso(now - 600000), data: { aktuell: { temp: 1.4, code: 3, boeen: 22 }, nacht: { tmin: -3.2, gmax: 35 }, tage: [{ datum: day(0), min: -3, max: 5, regen: 0.4, schnee: 0, boeen: 35, code: 3 }, { datum: day(-1), min: -5, max: 2, regen: 3, schnee: 4, boeen: 48, code: 73 }, { datum: day(-2), min: -1, max: 6, regen: 1, schnee: 0, boeen: 30, code: 61 }], warnungen: ['❄️ Frost: heute Nacht bis −3,2 °C – Tränke prüfen'] } }],
  };
  function q(table) {
    let rows = () => db[table] || [];
    const filters = []; let single = false, head = false, op = 'select', payload = null;
    const b = {
      select(_c, o) { if (o?.head) head = true; return b; }, eq(k, v) { filters.push((r) => (r[k] ?? r.data?.[k]) === v); return b; },
      order() { return b; }, neq(k, v) { filters.push((r) => r[k] !== v); return b; }, limit() { return b; }, in() { return b; },
      maybeSingle() { single = true; return b; }, single() { single = true; return b; },
      insert(p) { op = 'insert'; payload = p; return b; }, update(p) { op = 'update'; payload = p; return b; }, upsert(p) { op = 'insert'; payload = p; return b; }, delete() { op = 'delete'; return b; },
      then(res, rej) {
        let r = rows().filter((x) => filters.every((f) => f(x)));
        if (op === 'insert') { const n = { id: 'n' + Math.random(), created_at: new Date().toISOString(), ...payload }; db[table].push(n); r = [n]; }
        if (op === 'update') r.forEach((x) => Object.assign(x, payload));
        if (op === 'delete') db[table] = rows().filter((x) => !r.includes(x));
        const out = head ? { count: r.length, error: null } : { data: single ? (r[0] || null) : r, error: null };
        return Promise.resolve(out).then(res, rej);
      },
    };
    return b;
  }
  const img = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#3b4a2a"/><text x="20" y="100" fill="#fff" font-size="24">Testbild Stall</text></svg>');
  window.supabase = {
    createClient: () => ({
      auth: { getSession: async () => (location.search.includes('nologin') ? { data: { session: null } } : { data: { session: { user: { id: 'u1', email: 'admin@test.de' }, access_token: 'x' } } }), onAuthStateChange() {}, signOut: async () => {}, signInWithOtp: async () => ({}) },
      from: q,
      rpc: async (n) => n === 'hs_names' ? { data: [{ user_id: 'u1', name: 'Admin' }] } : n === 'hs_command' ? { data: 1 } : { data: null },
      storage: { from: () => ({
        createSignedUrl: async () => ({ data: { signedUrl: img + '#?a=1' } }),
        createSignedUrls: async (ps) => ({ data: ps.map(() => ({ signedUrl: img })) }),
        list: async () => ({ data: [{ name: '2026-11-20_165912_cam0_zu.jpg' }, { name: '2026-11-20_081103_cam0_auf.jpg' }] }),
      }) },
    }),
  };
})();
