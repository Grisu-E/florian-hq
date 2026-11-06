/* Florian HQ – App-Logik (Supabase) */
'use strict';

/* ---------- Symbole & Bereiche ---------- */
const ICONS = {
  fahrzeuge:'<svg viewBox="0 0 24 24"><path d="M2 17V7h11v10"/><path d="M13 10h4.5l3.5 3.5V17h-2"/><path d="M8 17h7"/><circle cx="6" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/><path d="M5 4h5"/></svg>',
  material:'<svg viewBox="0 0 24 24"><path d="M9.5 3h5L19 19H5L9.5 3z"/><path d="M7.8 9.5h8.4M6.4 14.5h11.2"/><path d="M3 21h18"/></svg>',
  eis:'<svg viewBox="0 0 24 24"><path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17"/><path d="m9 3.5 3 2 3-2M9 20.5l3-2 3 2"/></svg>',
  raum:'<svg viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M6 21V3h10v18"/><path d="M16 6h2.5v15"/><circle cx="13" cy="12.5" r=".9"/></svg>',
  fest:'<svg viewBox="0 0 24 24"><path d="M12 3 2 20h20L12 3z"/><path d="M12 3v17"/><path d="M9 20l3-6 3 6"/><path d="M12 3l1.5-1.5"/></svg>',
  doc:'<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="1.5"/><path d="M9 4V2.5h6V4"/><path d="m8.5 10 1.5 1.5 3-3M8.5 16l1.5 1.5 3-3"/><path d="M15 10.5h1.5M15 16.5h1.5"/></svg>',
  news:'<svg viewBox="0 0 24 24"><path d="M3 10v4h3l6 4V6L6 10H3z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  'duty-aktive':'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M12 13v5M9.5 15.5h5"/></svg>',
  'duty-jugend':'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m9 15 2 2 4-4"/></svg>',
  events:'<svg viewBox="0 0 24 24"><path d="M4 21V4"/><path d="M4 4h13l-2.5 4L17 12H4"/><path d="M9 21h6M12 15v6"/></svg>',
  expenses:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M15 15h3"/><path d="M7 3h10"/></svg>',
  me:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
  quiz:'<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.3 6.8 19l1-5.8L3.6 9.1l5.8-.8z"/></svg>',
  clothing:'<svg viewBox="0 0 24 24"><path d="M8 3l4 3 4-3 5 4-3 4-2-1.5V21H8V9.5L6 11 3 7z"/></svg>',
  todo:'<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/></svg>',
  assign:'<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 3v3h6V3M8 11h8M8 15h5"/></svg>',
  who:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2c2.8.2 5 2.6 5 5.8"/></svg>',
  org:'<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/></svg>',
  lead:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M4 4l2 2M20 4l-2 2"/></svg>',
  members:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.2c3 .2 5.5 2.6 5.5 5.8"/></svg>',
  defects:'<svg viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/></svg>'
};
const CATS = [
  {k:'fahrzeuge', n:'Fahrzeuge', ph:'z. B. MTW'},
  {k:'material', n:'Übungsmaterial', ph:'z. B. Übungspuppe'},
  {k:'raum', n:'Raum', ph:'z. B. Schulungsraum'},
  {k:'fest', n:'Festzubehör', ph:'z. B. Biertischgarnitur'}
];
const DUTY = {'duty-aktive':{g:'aktive',n:'Dienstplan Aktive'}, 'duty-jugend':{g:'jugend',n:'Dienstplan Jugend'}};
const ROLE_NAME = {pending:'wartet', member:'Mitglied', admin:'App-Master'};
const FN_NAME = {kommandant:'Kommandant', gruppenfuehrer:'Gruppenführer', geraetewart:'Gerätewart', kassier:'Kassier'};
const VIEWS = ['home','news','duty-aktive','duty-jugend','events','org','who','doc','members','me','quiz','clothing','todo','assign','defects','push','lead','expenses'];
const catName = k => k==='eis'?'Crushed-Eis':((CATS.find(c=>c.k===k)||{}).n || k);

const TABLES = ['profiles','items','reservations','docs','news','duties','events','shifts','signups','ice','org','duty_rsvp','defects','push_subs','qual_types','member_quals','duty_attendance','expenses','res_contacts','absences','clothing_sizes','clothing_requests','quiz_questions','quiz_results','cal_tokens','clothing_issued','clothing_stock','todo_lists','todos','role_assign'];
const S = {
  view:'home', openCat:null, data:{}, loaded:{},
  me:null, profile:null,
  formFor:null, openForm:null, editOrg:null, orgQ:'', skipRestore:false,
  errs:{}, confirm:null, contactEdit:null, lastRes:null, orgOpen:new Set(), orgAll:false, orgTab:'areas', docFilter:'offen', busy:false, showPast:{}, urls:{}, urlPending:new Set()
};
TABLES.forEach(t=>{ S.data[t]=[]; S.loaded[t]=false; });

/* ---------- Supabase ---------- */
const CFG = window.FLORIAN_CONFIG || {};
const configured = CFG.supabaseUrl && !CFG.supabaseUrl.includes('DEIN-PROJEKT') && CFG.supabaseAnonKey && !CFG.supabaseAnonKey.includes('DEIN-');
const sb = configured ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey) : null;

/* ---------- Helfer ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2,'0');
const localISO = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const nowISO = () => localISO(new Date());
const today = () => nowISO().slice(0,10);
const D = t => S.data[t];
function fmtDT(s){ const d=new Date(s); return d.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'})+' '+pad(d.getHours())+':'+pad(d.getMinutes()); }
function fmtRange(a,b){ const da=new Date(a), dbb=new Date(b);
  if (da.toDateString()===dbb.toDateString()) return fmtDT(a)+'–'+pad(dbb.getHours())+':'+pad(dbb.getMinutes());
  return fmtDT(a)+' → '+fmtDT(b); }
function fmtDay(s){ if(!s) return ''; return new Date(s+'T00:00').toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'}); }
function fmtDayLong(s){ return new Date(s+'T00:00').toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'}); }
function fmtDate(s){ if(!s) return ''; const [y,m,d]=s.split('-'); return `${d}.${m}.${y}`; }
function dateBox(s){ const d=new Date(s+'T00:00'); return `<div class="datebox"><span class="wd">${esc(d.toLocaleDateString('de-DE',{weekday:'short'}).replace('.',''))}</span><span class="d">${pad(d.getDate())}</span><span class="m">${esc(d.toLocaleDateString('de-DE',{month:'short'}).replace('.',''))}</span></div>`; }
function nameOf(id){ const p=D('profiles').find(x=>x.id===id); return (p&&p.name)||'Kamerad/in'; }
const who = id => `<span class="who">${esc(nameOf(id))}</span>`;
const isMember = () => !!S.profile && (S.profile.role==='member'||S.profile.role==='admin');
const isAdmin = () => !!S.profile && S.profile.role==='admin';
const isMaster = isAdmin;
const fns = () => (S.profile && S.profile.functions) || [];
const hasFn = f => isMember() && fns().includes(f);
const canLead = () => isMaster() || hasFn('kommandant') || hasFn('gruppenfuehrer');
const canGear = () => isMaster() || hasFn('kommandant') || hasFn('geraetewart');
const canCmd  = () => isMaster() || hasFn('kommandant');
const canStaff = () => canLead() || canGear();
const mgr = canLead;
const isTreasurer = () => isMember() && (isMaster() || hasFn('kassier') || !!S.profile.treasurer);
const roleLabel = p => [p.role==='admin'?'App-Master':null, ...((p.functions||[]).map(f=>FN_NAME[f]))].filter(Boolean).join(' · ') || ROLE_NAME[p.role] || '';
const eur = n => (Math.round((+n||0)*100)/100).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
const ro = () => !isMember();
const mine = by => canStaff() || (S.me && by===S.me);
const lockNote = () => mgr()?'':'<p class="sub" style="margin-top:4px">Anlegen und Ändern ist Kommandant und Gruppenführern vorbehalten.</p>';
function delBtn(col,id,label='Löschen'){
  const key=col+'-'+id;
  return S.confirm===key
    ? `<button class="btn danger small" data-act="del" data-col="${col}" data-id="${esc(id)}">Wirklich ${label.toLowerCase()}</button><button class="btn ghost small" data-act="cancel-confirm">Nein</button>`
    : `<button class="btn ghost small" data-act="ask" data-key="${esc(key)}">${label}</button>`;
}
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>t.hidden=true,2800); }
function notice(msg){ const n=$('#notice'); n.textContent=msg||''; n.hidden=!msg; }
function snapshotForm(root){
  const vals={}; root.querySelectorAll('input:not([type=file]),select,textarea').forEach(el=>{ if(el.id) vals[el.id]=el.value; });
  const a=document.activeElement; return {vals, focus: a&&root.contains(a)?a.id:null};
}
function restoreForm(root,snap){
  Object.entries(snap.vals).forEach(([id,v])=>{ const el=root.querySelector('#'+CSS.escape(id)); if(el) el.value=v; });
  if(snap.focus){ const el=root.querySelector('#'+CSS.escape(snap.focus)); if(el) el.focus({preventScroll:true}); }
}
const val = id => { const el=document.getElementById(id); return el?el.value.trim():''; };
const errP = k => S.errs[k]?`<p class="err">${esc(S.errs[k])}</p>`:'';
const loadingOr = (cols, html) => cols.every(c=>S.loaded[c]) ? html : `<div class="panel"><div class="empty">Lade …</div></div>`;

/* Datenbank-Zeilen in die Form bringen, mit der die Ansichten arbeiten */
function norm(r){
  return {...r, by:r.created_by, createdAt:r.created_at, itemId:r.item_id, itemName:r.item_name,
    from:r.starts?String(r.starts).slice(0,16):undefined, to:r.ends?String(r.ends).slice(0,16):undefined,
    doneBy:r.done_by, doneAt:r.done_at, group:r.grp, eventId:r.event_id, shiftId:r.shift_id,
    parentId:r.parent_id, order:r.sort, dutyId:r.duty_id, userId:r.user_id, typeId:r.type_id, time:r.time!=null?String(r.time).slice(0,5):r.time};
}

/* ---------- Laden & Live-Aktualisierung ---------- */
async function load(t){
  const {data,error}=await sb.from(t).select('*');
  if(error){ console.warn(t,error); S.loaded[t]=true; return; }
  S.data[t]=(data||[]).map(norm); S.loaded[t]=true;
  if(t==='profiles' && S.me){ const p=S.data.profiles.find(x=>x.id===S.me); if(p) S.profile=p; }
}
const reloadTimers={};
function scheduleReload(t){
  if(!TABLES.includes(t)) return;
  clearTimeout(reloadTimers[t]);
  reloadTimers[t]=setTimeout(async()=>{ await load(t); if(t==='profiles') return route(); schedule(); },150);
}
let pending=false;
function schedule(){ if(pending) return; pending=true; requestAnimationFrame(()=>{ pending=false; render(); }); }
let channel=null;
function subscribe(){
  if(channel) return;
  channel=sb.channel('florian-hq').on('postgres_changes',{event:'*',schema:'public'},p=>scheduleReload(p.table)).subscribe();
}
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible' && isMember()) TABLES.forEach(scheduleReload); });

/* ---------- Schreiben ---------- */
function errText(error){
  const m=(error&&error.message)||'';
  if(/row-level security|permission denied/i.test(m)) return 'Dafür fehlt dir die Berechtigung.';
  if(/duplicate key/i.test(m)) return 'Du bist hier schon eingetragen.';
  if(/fetch|network/i.test(m)) return 'Keine Verbindung. Bitte Netz prüfen und nochmal versuchen.';
  return 'Speichern hat nicht geklappt: '+m;
}
async function run(table, q, okMsg){
  const {error}=await q;
  if(error){ toast(errText(error)); return false; }
  if(okMsg) toast(okMsg);
  await load(table); schedule();
  return true;
}
const ins = (t,row,msg) => run(t, sb.from(t).insert(row), msg);
const upd = (t,id,row,msg) => run(t, sb.from(t).update(row).eq('id',id), msg);
const del = (t,id,msg) => run(t, sb.from(t).delete().eq('id',id), msg);

/* ---------- Übersicht: Kacheln ---------- */
function tile(key,name,meta,{pressed=false,alert=false,attr=''}={}){
  return `<button class="tile ${alert?'alert':''}" ${attr} aria-pressed="${pressed}"><span class="ico">${ICONS[key]}</span><span class="name">${esc(name)}</span><span class="meta">${meta}</span></button>`;
}
function renderTiles(){
  const t=today(), n=nowISO();
  const news=[...D('news')].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  const weekAgo=new Date(Date.now()-7*864e5).toISOString();
  const fresh=news.filter(x=>(x.createdAt||'')>weekAgo).length;
  const nextDuty=g=>D('duties').filter(d=>d.group===g&&d.date>=t).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0];
  const dutyMeta=g=>{ const d=nextDuty(g); return d?`Nächster: ${esc(fmtDay(d.date))}<br>${esc(d.topic)}`:'Noch keine Termine'; };
  const evs=D('events').filter(e=>e.date>=t).sort((a,b)=>a.date.localeCompare(b.date));
  const evIds=new Set(evs.map(e=>e.id));
  const gaps=D('shifts').filter(s=>evIds.has(s.eventId)).reduce((sum,s)=>sum+Math.max(0,(+s.need||0)-D('signups').filter(x=>x.shiftId===s.id).length),0);
  const openDocs=D('docs').filter(d=>d.status!=='eingepflegt').length;
  const od=D('defects').filter(x=>x.status!=='erledigt'); const out=od.filter(x=>x.urgency==='ausser_dienst').length;
  $('#tiles-info').innerHTML =
    tile('news','Neues in der Wehr', news.length?`${fresh?fresh+' neu · ':''}${esc(news[0].title)}`:'Noch keine Beiträge',{attr:'data-goto="news"',alert:fresh>0}) +
    tile('events','Veranstaltungen', evs.length?`${esc(fmtDay(evs[0].date))} · ${esc(evs[0].title)}${gaps?`<br>${gaps} Helfer gesucht`:''}`:'Nichts geplant',{attr:'data-goto="events"',alert:gaps>0}) +
    tile('duty-aktive','Dienstplan Aktive', dutyMeta('aktive'),{attr:'data-goto="duty-aktive"'}) +
    tile('duty-jugend','Dienstplan Jugend', dutyMeta('jugend'),{attr:'data-goto="duty-jugend"'}) +
    tile('defects','Mängel', od.length?`${od.length} offen${out?` · ${out} außer Dienst`:''}`:'Alles in Ordnung',{attr:'data-goto="defects"',alert:od.length>0});
  const iceUp=D('ice').filter(x=>x.date>=t);
  const iceToday=D('ice').filter(x=>x.date===t).reduce((s,x)=>s+(+x.bags||0),0);
  $('#tiles-res').innerHTML = CATS.map(c=>catTile(c,n)).join('') +
    tile('eis','Crushed-Eis', `${iceToday} Säcke heute · ${iceUp.length} Anmeldungen`,{attr:'data-cat="eis"',pressed:S.openCat==='eis'});
  let org = tile('org','Organigramm', D('org').length?`${D('org').length} Funktionen`:'Noch nicht hinterlegt',{attr:'data-goto="org"'}) +
    (()=>{ const open=D('todos').filter(x=>!x.done); const mine=open.filter(x=>x.assignee===S.me).length;
      return tile('todo','Aufgaben', mine?`${mine} für mich offen`:(open.length?`${open.length} offen`:(mgr()?'To-do-Listen':'Nichts offen')),{attr:'data-goto="todo"',alert:mine>0}); })() +
    (canStaff()?tile('assign','Zuständigkeiten', `${D('role_assign').length} Rollen · ${D('res_contacts').length} Verantwortliche`,{attr:'data-goto="assign"'}):'') +
    tile('who','Wer macht was?', D('org').length?`${orgPersons().length} Personen`:'Noch nicht hinterlegt',{attr:'data-goto="who"'}) +
    tile('doc','Übungsdoku', `${openDocs} offen · ${D('docs').length-openDocs} eingepflegt`,{attr:'data-goto="doc"',alert:mgr()&&openDocs>0}) +
    (()=>{ const ex=D('expenses').filter(x=>x.status==='offen'); const sum=ex.reduce((a,x)=>a+(+x.amount||0),0);
      return tile('expenses','Private Ausgaben', ex.length?`${ex.length} offen · ${eur(sum)}`:(isTreasurer()?'Nichts zu erstatten':'Auslage einreichen'),{attr:'data-goto="expenses"',alert:isTreasurer()&&ex.length>0}); })();
  if(canLead()||canCmd()){
    const fr=D('member_quals').filter(q=>D('qual_types').some(x=>x.id===q.typeId&&x.kind==='frist'));
    const red=fr.filter(q=>fristState(q).k===0).length, yel=fr.filter(q=>fristState(q).k===1).length;
    const waiting=D('profiles').filter(p=>p.role==='pending').length;
    org += (canLead()?tile('lead','Führung', red||yel?`${red?red+' abgelaufen':''}${red&&yel?' · ':''}${yel?yel+' bald fällig':''}`:'Fristen & Beteiligung',{attr:'data-goto="lead"',alert:red+yel>0}):'') +
      (canCmd()?      tile('members','Mitglieder', waiting?`${waiting} warten auf Freigabe`:`${D('profiles').filter(p=>p.role!=='pending').length} Mitglieder`,{attr:'data-goto="members"',alert:waiting>0}):'');
  }
  $('#tiles-org').innerHTML = org;
  const myOpenDuties=D('duties').filter(d=>d.date>=t&&!D('duty_rsvp').some(r=>r.dutyId===d.id&&r.userId===S.me)&&d.date<=addDays(t,14)).length;
  const clOpen=D('clothing_requests').filter(x=>x.status==='offen');
  $('#tiles-me').innerHTML =
    tile('me','Meine Seite', myOpenDuties?`${myOpenDuties} Dienste ohne Rückmeldung`:'Dienste, Fristen, Kalender',{attr:'data-goto="me"',alert:myOpenDuties>0}) +
    tile('quiz','Wissenstest & Leistungs\u00ADabzeichen', `${D('quiz_questions').length} Übungsfragen`,{attr:'data-goto="quiz"'}) +
    tile('clothing','Kleiderkammer', canGear()?(clOpen.length?`${clOpen.length} offene Anfragen`:'Nichts offen'):'Größen & Bedarf melden',{attr:'data-goto="clothing"',alert:canGear()&&clOpen.length>0});
}
function catTile(c,n){
  const items=D('items').filter(i=>i.cat===c.k).length;
  const busy=D('reservations').filter(r=>r.cat===c.k && r.to>n).length;
  return tile(c.k,c.n,`${items} ${items===1?'Eintrag':'Einträge'} · ${busy} reserviert`,{attr:`data-cat="${c.k}"`,pressed:S.openCat===c.k});
}

/* ---------- Reservierungen ---------- */
/* Verantwortliche: Eintrag am Item überschreibt den der Kategorie */
const contactsOf = key => D('res_contacts').filter(c=>c.key===key && (c.user_id||c.phone||c.name));
function contactFor(itemId,cat){ const own=itemId?contactsOf(itemId):[]; return own.length?own:contactsOf(cat); }
function waNumber(p){ let d=String(p||'').replace(/[^\d+]/g,''); if(d.startsWith('+')) d=d.slice(1); else if(d.startsWith('00')) d=d.slice(2); else if(d.startsWith('0')) d='49'+d.slice(1); return d.length>=8?d:''; }
const contactName = c => c ? (c.user_id?nameOf(c.user_id):(c.name||'')) : '';
function contactLine(key,cat,label){
  const own=contactsOf(key), list=own.length?own:(cat?contactsOf(cat):[]);
  const txt=list.length?`${list.map(c=>esc(contactName(c)||'Nummer hinterlegt')+(c.phone?' 📱':'')).join(', ')}${!own.length&&cat?' <span class="muted">(wie Kategorie)</span>':''}`:'<span class="muted">niemand hinterlegt</span>';
  const edit=!canGear()?'':(cat?` <button class="linkbtn" data-act="contact-edit" data-id="${esc(key)}">${own.length?'ändern':'eigene festlegen'}</button>`:` <button class="linkbtn" data-goto="assign">ändern</button>`);
  return `<p class="contact-line">${esc(label||'Verantwortlich')}: ${txt}${edit}</p>${S.contactEdit===key?contactForm(key,own):''}`;
}
function contactForm(key,own){
  const k=esc(key);
  return `<div class="contact-edit">${own.map(c=>`<span class="aname">${esc(contactName(c))}${c.phone?' · 📱':''}<button data-act="rc-del" data-id="${esc(c.id)}" aria-label="entfernen">×</button></span>`).join('')}
    <form class="assign-add two" data-form="rc-add" data-id="${k}"><input id="rc-n-${k}" list="dl-members" maxlength="60" placeholder="Name" autocomplete="off"><input id="rc-p-${k}" type="tel" maxlength="30" placeholder="WhatsApp-Nr. (optional)"><button class="btn primary small" type="submit">+ Hinzufügen</button><button class="btn ghost small" type="button" data-act="contact-cancel">Fertig</button></form>${errP('rc-'+key)}${memberDatalist()}</div>`;
}
function lastResBanner(scope){
  const L=S.lastRes; if(!L||L.scope!==scope) return '';
  const list=contactFor(L.itemId,L.cat);
  const pushed=list.filter(c=>c.user_id&&c.user_id!==S.me).map(contactName);
  const wa=list.filter(c=>waNumber(c.phone));
  return `<div class="res-done"><p><strong>✓ ${esc(L.title)}</strong>${pushed.length?`<br>${esc(pushed.join(', '))} ${pushed.length>1?'wurden':'wurde'} per Push informiert.`:''}</p>
    <div class="actions">${wa.map(c=>`<a class="btn wa" href="https://wa.me/${waNumber(c.phone)}?text=${encodeURIComponent(L.text)}" target="_blank" rel="noopener">📱 ${esc(contactName(c)||'Verantwortlichen')} per WhatsApp</a>`).join('')}<button class="btn ghost small" data-act="res-done-close">Schließen</button></div></div>`;
}
function itemRes(id){ const n=nowISO(); return D('reservations').filter(r=>r.itemId===id && r.to>n).sort((a,b)=>a.from.localeCompare(b.from)); }
function statusChip(id){
  if(D('defects').some(x=>x.itemId===id && x.status!=='erledigt' && x.urgency==='ausser_dienst')) return `<span class="chip busy">außer Dienst (Mangel)</span>`;
  const n=nowISO(); const act=D('reservations').find(r=>r.itemId===id && r.from<=n && r.to>n);
  return act ? `<span class="chip busy">belegt bis ${esc(fmtDT(act.to))}</span>` : `<span class="chip free">jetzt frei</span>`;
}
function reserveForm(item){
  const d=new Date(); d.setMinutes(0,0,0); d.setHours(d.getHours()+1);
  const e=new Date(d); e.setHours(e.getHours()+3);
  const i=esc(item.id);
  return `<form class="inline" data-form="reserve" data-id="${i}">
    <label for="rf-from-${i}">Von<input type="datetime-local" id="rf-from-${i}" required value="${localISO(d)}"></label>
    <label for="rf-to-${i}">Bis<input type="datetime-local" id="rf-to-${i}" required value="${localISO(e)}"></label>
    <label for="rf-why-${i}">Wofür<input id="rf-why-${i}" maxlength="80" placeholder="z. B. Jugendübung" required></label>
    <div class="form-actions"><button class="btn primary" type="submit">Verbindlich reservieren</button><button class="btn ghost" type="button" data-act="close-form">Abbrechen</button></div>
    ${errP('r-'+item.id)}
  </form>`;
}
function renderCat(){
  const c=CATS.find(x=>x.k===S.openCat);
  const items=D('items').filter(i=>i.cat===c.k).sort((a,b)=>a.name.localeCompare(b.name,'de'));
  let html=`<div class="panel"><div class="panel-head">
    <div><h2>${esc(c.n)}</h2><p class="sub">„Reservieren“ antippen, Zeitraum und Zweck eintragen. Überschneidungen werden geblockt.</p>${contactLine(c.k,null,'Verantwortlich für alle '+c.n)}</div>
    <div class="actions">${ro()?'':`<button class="btn" data-act="open-form" data-form="add-item">+ Eintrag anlegen</button>`}<button class="btn ghost" data-act="close-cat">Schließen</button></div></div>${lastResBanner(c.k)}`;
  if(S.openForm==='add-item' && !ro()){
    html+=`<form class="inline" data-form="add-item">
      <label for="add-name">Bezeichnung<input id="add-name" required maxlength="60" placeholder="${esc(c.ph)}"></label>
      <label for="add-note">Hinweis<input id="add-note" maxlength="120" placeholder="z. B. Schlüssel beim Gerätewart"></label>
      <div class="form-actions"><button class="btn primary" type="submit">Anlegen</button><button class="btn ghost" type="button" data-act="close-form">Abbrechen</button></div>
      ${errP('add-item')}</form>`;
  }
  if(!S.loaded.items) html+=`<div class="empty">Lade Einträge …</div>`;
  else if(!items.length) html+=`<div class="empty"><strong>Hier ist noch nichts angelegt.</strong>Leg über „+ Eintrag anlegen“ das erste Stück an, dann können alle es reservieren.</div>`;
  else html+=items.map(it=>{
    const up=itemRes(it.id).slice(0,4);
    return `<div class="row">
      <div class="info">
        <div style="display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center"><h3>${esc(it.name)}</h3>${statusChip(it.id)}</div>
        ${it.note?`<p class="note">${esc(it.note)}</p>`:''}
        ${contactLine(it.id,it.cat)}
        ${up.length?`<ul class="slots">${up.map(r=>`<li><span class="when">${esc(fmtRange(r.from,r.to))}</span>${who(r.by)}<span class="why">${esc(r.purpose)}</span></li>`).join('')}</ul>`:''}
      </div>
      <div class="actions">
        <button class="btn primary" data-act="reserve" data-id="${esc(it.id)}">Reservieren</button>
        ${mine(it.by)?delBtn('items',it.id):''}
      </div>
      ${S.formFor===it.id?reserveForm(it):''}
    </div>`;
  }).join('');
  return html+'</div>';
}

/* ---------- Crushed-Eis ---------- */
function renderIce(){
  const t=today();
  const showPast=S.showPast.ice;
  const list=D('ice').filter(x=>showPast?true:x.date>=t).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));
  let html=`<div class="panel"><div class="panel-head">
    <div><h2>Crushed-Eis</h2><p class="sub">Meld an, wann du wie viel Eis brauchst. Pro Tag wird zusammengezählt, damit die Maschinen rechtzeitig laufen.</p>${contactLine('eis',null,'Verantwortlich für die Eismaschinen')}</div>
    <div class="actions"><button class="btn ghost" data-act="toggle-past" data-key="ice">${showPast?'Nur kommende':'Auch vergangene'}</button><button class="btn ghost" data-act="close-cat">Schließen</button></div></div>
    <form class="inline" data-form="ice">
      <label for="ice-date">Datum<input type="date" id="ice-date" required value="${t}"></label>
      <label for="ice-time">Abholung um<input type="time" id="ice-time" required value="17:00"></label>
      <label for="ice-bags">Menge (Säcke)<input type="number" id="ice-bags" required min="1" max="200" value="2"></label>
      <label for="ice-why">Wofür<input id="ice-why" maxlength="80" placeholder="z. B. Sommerfest Getränkestand" required></label>
      <div class="form-actions"><button class="btn primary" type="submit">Eis anmelden</button></div>
      ${errP('ice')}</form>${lastResBanner('eis')}`;
  if(!S.loaded.ice) return html+`<div class="empty">Lade Anmeldungen …</div></div>`;
  if(!list.length) return html+`<div class="empty"><strong>Noch kein Eis angemeldet.</strong>Trag oben ein, wann du Eis brauchst.</div></div>`;
  const days=[...new Set(list.map(x=>x.date))];
  html+=days.map(day=>{
    const rows=list.filter(x=>x.date===day);
    const sum=rows.reduce((s,x)=>s+(+x.bags||0),0);
    return `<div class="day-head"><span class="when">${esc(fmtDayLong(day))}</span><span class="chip ice">${sum} ${sum===1?'Sack':'Säcke'} gesamt</span></div>` +
      rows.map(x=>`<div class="row ${day<t?'past':''}">
        <div class="info">
          <div style="display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center"><h3>${+x.bags||0} ${(+x.bags)===1?'Sack':'Säcke'}</h3><span class="chip ${x.done?'done':'open'}">${x.done?'bereitgestellt':'offen'}</span></div>
          <ul class="slots"><li><span class="when">ab ${esc(x.time||'')} Uhr</span>${who(x.by)}<span class="why">${esc(x.purpose)}</span></li></ul>
        </div>
        <div class="actions"><button class="btn small ${x.done?'':'primary'}" data-act="ice-done" data-id="${esc(x.id)}">${x.done?'Zurück auf offen':'Bereitgestellt'}</button>${mine(x.by)?delBtn('ice',x.id,'Stornieren'):''}</div>
      </div>`).join('');
  }).join('');
  return html+'</div>';
}

function renderUpcoming(){
  const n=nowISO();
  const list=D('reservations').filter(r=>r.to>n).sort((a,b)=>a.from.localeCompare(b.from)).slice(0,15);
  let html=`<div class="panel upcoming"><div class="panel-head"><div><h2>Als Nächstes belegt</h2><p class="sub">Alle laufenden und kommenden Reservierungen der Wehr.</p></div></div>`;
  if(!S.loaded.reservations) return html+`<div class="empty">Lade Reservierungen …</div></div>`;
  if(!list.length) return html+`<div class="empty"><strong>Noch nichts reserviert.</strong>Wähle oben eine Kachel und reserviere Fahrzeug, Material oder Raum.</div></div>`;
  html+=list.map(r=>{
    const active=r.from<=n;
    return `<div class="row">
      <span class="chip ${active?'busy':'free'}">${active?'läuft':'geplant'}</span>
      <div class="info">
        <div class="cat-dot">${esc(catName(r.cat))}</div>
        <h3>${esc(r.itemName)}</h3>
        <ul class="slots"><li><span class="when">${esc(fmtRange(r.from,r.to))}</span>${who(r.by)}<span class="why">${esc(r.purpose)}</span></li></ul>
      </div>
      <div class="actions">${mine(r.by)?delBtn('reservations',r.id,'Stornieren'):''}</div>
    </div>`;
  }).join('');
  return html+'</div>';
}

/* ---------- Neues in der Wehr ---------- */
function renderNews(){
  const list=[...D('news')].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  const weekAgo=new Date(Date.now()-7*864e5).toISOString();
  let html=`<div class="panel"><div class="panel-head">
    <div><h2>Neues in der Wehr</h2><p class="sub">Infos, Termine, Durchsagen. Was alle wissen sollten.</p>${lockNote()}</div>
    ${canStaff()?`<div class="actions"><button class="btn primary" data-act="open-form" data-form="news">+ Neuigkeit</button></div>`:''}</div>`;
  if(S.openForm==='news' && canStaff()){
    html+=`<form class="inline" data-form="news" style="grid-template-columns:1fr">
      <label for="news-title">Überschrift<input id="news-title" required maxlength="90" placeholder="z. B. Neue Atemschutzgeräte sind da"></label>
      <label for="news-text">Text<textarea id="news-text" required maxlength="2000"></textarea></label>
      <div class="form-actions"><button class="btn primary" type="submit">Veröffentlichen</button><button class="btn ghost" type="button" data-act="close-form">Abbrechen</button></div>
      ${errP('news')}</form>`;
  }
  if(!list.length) html+=`<div class="empty"><strong>Noch keine Neuigkeiten.</strong>${canStaff()?'Über „+ Neuigkeit“ schreibst du den ersten Beitrag.':'Sobald die Bearbeiter etwas posten, steht es hier.'}</div>`;
  else html+=list.map(x=>`<div class="row">
    <div class="info">
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">${(x.createdAt||'')>weekAgo?'<span class="news-new">neu</span>':''}<h3>${esc(x.title)}</h3></div>
      <div class="facts">${who(x.by)} · ${esc(x.createdAt?new Date(x.createdAt).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'}):'')}</div>
      <p class="text">${esc(x.text)}</p>
    </div>
    <div class="actions">${canStaff()?delBtn('news',x.id):''}</div>
  </div>`).join('');
  return loadingOr(['news'], html+'</div>');
}

/* ---------- Dienstplan ---------- */
const RSVP = {yes:{n:'Komme',c:'done',i:'✓'}, maybe:{n:'Vielleicht',c:'open',i:'?'}, no:{n:'Komme nicht',c:'busy',i:'✗'}};
function rsvpBlock(d, past){
  const rs=D('duty_rsvp').filter(r=>r.dutyId===d.id);
  const my=rs.find(r=>r.userId===S.me);
  const cnt=k=>rs.filter(r=>r.status===k).length;
  const open=S.showPast['rsvp-'+d.id];
  const names=k=>rs.filter(r=>r.status===k).map(r=>esc(nameOf(r.userId))).sort((a,b)=>a.localeCompare(b,'de')).join(', ')||'–';
  return `<div class="rsvp">
    ${past?'':`<div class="rsvp-btns" role="group" aria-label="Zu- oder Absage">${Object.entries(RSVP).map(([k,v])=>`<button class="rsvp-btn ${k}" data-act="rsvp" data-id="${esc(d.id)}" data-status="${k}" aria-pressed="${my&&my.status===k?'true':'false'}">${v.i} ${v.n}</button>`).join('')}</div>`}
    <button class="rsvp-sum" data-act="toggle-past" data-key="rsvp-${esc(d.id)}" aria-expanded="${!!open}">
      <span class="chip done">${cnt('yes')} kommen</span><span class="chip open">${cnt('maybe')} vielleicht</span><span class="chip busy">${cnt('no')} nicht</span>
      <span class="rsvp-more">${open?'Namen ausblenden':'Wer kommt?'}</span>
    </button>
    ${open?`<div class="rsvp-names"><p><b>Kommen:</b> ${names('yes')}</p><p><b>Vielleicht:</b> ${names('maybe')}</p><p><b>Kommen nicht:</b> ${names('no')}</p>${mgr()&&absOn(d.date).length?`<p><b>Abgemeldet:</b> ${[...new Set(absOn(d.date).map(a=>a.userId))].map(u=>esc(nameOf(u))).join(', ')}</p>`:''}</div>`:''}
  </div>`;
}
async function setRsvp(dutyId,status){
  const mine=D('duty_rsvp').find(r=>r.dutyId===dutyId && r.userId===S.me);
  if(mine && mine.status===status){ await run('duty_rsvp', sb.from('duty_rsvp').delete().eq('duty_id',dutyId).eq('user_id',S.me), 'Rückmeldung zurückgenommen'); return; }
  await run('duty_rsvp', sb.from('duty_rsvp').upsert({duty_id:dutyId,user_id:S.me,status,updated_at:new Date().toISOString()},{onConflict:'duty_id,user_id'}), 'Gespeichert: '+RSVP[status].n);
}

function renderDuty(viewKey){
  const {g,n}=DUTY[viewKey]; const t=today(); const fk='duty-'+g;
  const all=D('duties').filter(d=>d.group===g).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||'')));
  const upcoming=all.filter(d=>d.date>=t), past=all.filter(d=>d.date<t).reverse();
  let html=`<div class="panel"><div class="panel-head">
    <div><h2>${esc(n)}</h2><p class="sub">${g==='jugend'?'Übungsabende und Termine der Jugendfeuerwehr.':'Übungsdienste und Termine der aktiven Mannschaft.'}</p>${lockNote()}</div>
    <div class="actions"><button class="btn ghost" data-goto="me" title="Kalender-Abo auf Meine Seite">📅 In meinen Kalender</button>${mgr()?`<button class="btn primary" data-act="open-form" data-form="${fk}">+ Dienst eintragen</button>`:''}</div></div>`;
  if(S.openForm===fk && mgr()){
    html+=`<form class="inline" data-form="duty" data-group="${g}">
      <label for="${fk}-date">Datum<input type="date" id="${fk}-date" required></label>
      <label for="${fk}-time">Beginn<input type="time" id="${fk}-time" required value="19:00"></label>
      <label for="${fk}-topic" class="span-all">Thema<input id="${fk}-topic" required maxlength="90" placeholder="z. B. Technische Hilfeleistung – Stabilisieren"></label>
      <label for="${fk}-place">Ort<input id="${fk}-place" maxlength="60" placeholder="z. B. Gerätehaus"></label>
      <label for="${fk}-lead">Leitung<input id="${fk}-lead" maxlength="60" placeholder="Name"></label>
      <label for="${fk}-note">Hinweis<input id="${fk}-note" maxlength="120" placeholder="z. B. Schutzausrüstung komplett"></label>
      <div class="form-actions"><button class="btn primary" type="submit">Eintragen</button><button class="btn ghost" type="button" data-act="close-form">Abbrechen</button></div>
      ${errP('duty')}</form>`;
  }
  const row=d=>`<div class="row dated ${d.date<t?'past':''}">
    ${dateBox(d.date)}
    <div class="info">
      <h3>${esc(d.topic)}</h3>
      <div class="facts"><span><b>${esc(d.time||'')} Uhr</b></span>${d.place?`<span>${esc(d.place)}</span>`:''}${d.lead?`<span>Leitung: <b>${esc(d.lead)}</b></span>`:''}</div>
      ${d.note?`<p class="note">${esc(d.note)}</p>`:''}
      ${rsvpBlock(d, d.date<t)}
    </div>
    <div class="actions">${mgr()?delBtn('duties',d.id):''}</div>
  </div>`;
  if(!upcoming.length) html+=`<div class="empty"><strong>Keine kommenden Dienste.</strong>${mgr()?'Über „+ Dienst eintragen“ legst du den ersten Termin an.':'Der Plan erscheint hier, sobald Termine eingetragen sind.'}</div>`;
  else{
    let month='';
    html+=upcoming.map(d=>{
      const m=new Date(d.date+'T00:00').toLocaleDateString('de-DE',{month:'long',year:'numeric'});
      const head=m!==month?`<div class="day-head"><span class="when">${esc(m)}</span></div>`:''; month=m; return head+row(d);
    }).join('');
  }
  if(past.length){
    html+=`<div class="day-head"><span class="when">Vergangene Dienste (${past.length})</span><button class="btn ghost small" data-act="toggle-past" data-key="${fk}">${S.showPast[fk]?'Ausblenden':'Anzeigen'}</button></div>`;
    if(S.showPast[fk]) html+=past.map(row).join('');
  }
  return loadingOr(['duties'], html+'</div>');
}

/* ---------- Veranstaltungen & Arbeitsdienste ---------- */
function renderShift(sh){
  const sig=D('signups').filter(s=>s.shiftId===sh.id).sort((a,b)=>(a.createdAt||'').localeCompare(b.createdAt||''));
  const need=+sh.need||0; const full=need>0&&sig.length>=need;
  const amIn=sig.some(s=>s.by===S.me && !s.name);
  const i=esc(sh.id);
  const people=sig.map(s=>{
    const self=s.by===S.me && !s.name;
    return `<span class="person ${self?'self':''}">${s.name?esc(s.name):who(s.by)}${mine(s.by)?`<button data-act="unsign" data-id="${esc(s.id)}" aria-label="Austragen">×</button>`:''}</span>`;
  }).join('') + Array.from({length:Math.max(0,need-sig.length)},()=>'<span class="gap-slot">frei</span>').join('');
  return `<div class="shift ${full?'full':''}">
    <div style="min-width:0">
      <div style="display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center"><strong>${esc(sh.task)}</strong><span class="when">${esc(sh.start||'')}–${esc(sh.end||'')} Uhr</span>
        <span class="chip ${full?'done':'open'}">${sig.length}/${need}${full?' voll':''}</span></div>
      <div class="people">${people||'<span class="gap-slot">noch niemand</span>'}</div>
      ${full?'':`<form class="mini" data-form="addname" data-id="${i}"><input id="an-${i}" maxlength="40" placeholder="Jemand anderen eintragen (Name)"><button class="btn small" type="submit">Eintragen</button></form>`}
    </div>
    <div class="actions">${amIn?`<button class="btn small" data-act="sign-off" data-id="${i}">Mich austragen</button>`:`<button class="btn small primary" data-act="sign-on" data-id="${i}" ${full?'disabled':''}>${full?'Voll':'Ich bin dabei'}</button>`}${mgr()?delBtn('shifts',sh.id):''}</div>
  </div>`;
}
function renderEvent(ev,t){
  const shifts=D('shifts').filter(s=>s.eventId===ev.id).sort((a,b)=>(a.start||'').localeCompare(b.start||'')||(a.task||'').localeCompare(b.task||''));
  const fk='shift-'+ev.id, i=esc(ev.id);
  return `<article class="panel ${ev.date<t?'past':''}">
    <div class="row dated">
      ${dateBox(ev.date)}
      <div class="info">
        <h3>${esc(ev.title)}</h3>
        <div class="facts">${ev.time?`<span><b>ab ${esc(ev.time)} Uhr</b></span>`:''}${ev.place?`<span>${esc(ev.place)}</span>`:''}</div>
        ${ev.note?`<p class="text">${esc(ev.note)}</p>`:''}
      </div>
      <div class="actions">${mgr()?delBtn('events',ev.id):''}</div>
    </div>
    <div class="shifts">
      <div class="shifts-head"><h4>Arbeitsdienste</h4>${mgr()?`<button class="btn small" data-act="open-form" data-form="${fk}">+ Arbeitsdienst</button>`:''}</div>
      ${S.openForm===fk&&mgr()?`<form class="formbox" data-form="shift" data-id="${i}">
        <label for="${fk}-task">Aufgabe<input id="${fk}-task" required maxlength="60" placeholder="z. B. Ausschank, Grill, Aufbau"></label>
        <label for="${fk}-start">Von<input type="time" id="${fk}-start" required value="10:00"></label>
        <label for="${fk}-end">Bis<input type="time" id="${fk}-end" required value="14:00"></label>
        <label for="${fk}-need">Benötigt (Personen)<input type="number" id="${fk}-need" required min="1" max="50" value="3"></label>
        <div class="form-actions"><button class="btn primary" type="submit">Anlegen</button><button class="btn ghost" type="button" data-act="close-form">Abbrechen</button></div>
        ${errP('shift')}</form>`:''}
      ${shifts.length?shifts.map(renderShift).join(''):`<p class="sub">Noch keine Arbeitsdienste angelegt.</p>`}
    </div>
  </article>`;
}
function renderEvents(){
  const t=today();
  const all=[...D('events')].sort((a,b)=>a.date.localeCompare(b.date));
  const up=all.filter(e=>e.date>=t), past=all.filter(e=>e.date<t).reverse();
  let html=`<div class="panel"><div class="panel-head">
    <div><h2>Bevorstehende Veranstaltungen</h2><p class="sub">Feste, Tage der offenen Tür, Einsätze für den Verein. Bei jeder Veranstaltung trägt sich ein, wer arbeitet.</p>${lockNote()}</div>
    ${mgr()?`<div class="actions"><button class="btn primary" data-act="open-form" data-form="event">+ Veranstaltung</button></div>`:''}</div>`;
  if(S.openForm==='event' && mgr()){
    html+=`<form class="inline" data-form="event">
      <label for="ev-title" class="span-all">Name<input id="ev-title" required maxlength="80" placeholder="z. B. Sommerfest"></label>
      <label for="ev-date">Datum<input type="date" id="ev-date" required></label>
      <label for="ev-time">Beginn<input type="time" id="ev-time"></label>
      <label for="ev-place">Ort<input id="ev-place" maxlength="60" placeholder="z. B. Festplatz"></label>
      <label for="ev-note" class="span-all">Beschreibung<textarea id="ev-note" maxlength="800" style="min-height:70px"></textarea></label>
      <div class="form-actions"><button class="btn primary" type="submit">Anlegen</button><button class="btn ghost" type="button" data-act="close-form">Abbrechen</button></div>
      ${errP('event')}</form>`;
  }
  if(!up.length) html+=`<div class="empty"><strong>Keine Veranstaltungen geplant.</strong>${mgr()?'Über „+ Veranstaltung“ legst du die nächste an.':''}</div>`;
  html+='</div>';
  html+=up.map(e=>renderEvent(e,t)).join('');
  if(past.length){
    html+=`<div class="toolbar"><h4>Vergangene Veranstaltungen (${past.length})</h4><button class="btn ghost small" data-act="toggle-past" data-key="events">${S.showPast.events?'Ausblenden':'Anzeigen'}</button></div>`;
    if(S.showPast.events) html+=past.map(e=>renderEvent(e,t)).join('');
  }
  return loadingOr(['events','shifts','signups'], html);
}

/* ---------- Organigramm ---------- */
function orgChildren(pid){ const ids=new Set(D('org').map(n=>n.id)); return D('org').filter(n=> pid ? n.parentId===pid : (!n.parentId || !ids.has(n.parentId))).sort((a,b)=>(+a.order||0)-(+b.order||0)||(a.createdAt||'').localeCompare(b.createdAt||'')); }
function orgDesc(id){ const out=new Set([id]); let grow=true; while(grow){ grow=false; D('org').forEach(n=>{ if(n.parentId&&out.has(n.parentId)&&!out.has(n.id)){ out.add(n.id); grow=true; } }); } return out; }
function orgPath(n){ const byId=Object.fromEntries(D('org').map(x=>[x.id,x])); const parts=[]; let p=byId[n.parentId], guard=0; while(p&&guard++<20){ parts.unshift(p.role); p=byId[p.parentId]; } return parts.join(' › '); }
function contact(label,v,href){ return v?`<span class="contact"><span aria-hidden="true">${label}</span><a class="v" href="${esc(href)}">${esc(v)}</a><button data-act="copy" data-v="${esc(v)}">Kopieren</button></span>`:''; }
function orgCard(n,withPath){
  return `<div class="org-card">
    <div style="min-width:0"><div class="org-role">${esc(n.role)}</div><div class="org-name">${esc(n.name||'– unbesetzt –')}</div></div>
    <div class="actions">${canCmd()&&S.orgEdit?`<button class="btn ghost small" data-act="edit-org" data-id="${esc(n.id)}">Bearbeiten</button>`:''}</div>
    ${withPath&&n.parentId?`<div class="crumb">${esc(orgPath(n))}</div>`:''}
    ${n.area?`<p class="note"><b style="color:var(--ink)">Verantwortlich für:</b> ${esc(n.area)}</p>`:''}
    ${(n.phone||n.email)?`<div class="contacts">${contact('Tel.',n.phone,'tel:'+String(n.phone||'').replace(/[^\d+]/g,''))}${contact('Mail',n.email,'mailto:'+(n.email||''))}</div>`:''}
  </div>`;
}
function orgBranch(n,depth){ const kids=depth<12?orgChildren(n.id):[]; return `<li>${orgCard(n,false)}${kids.length?`<ul>${kids.map(k=>orgBranch(k,depth+1)).join('')}</ul>`:''}</li>`; }
function orgForm(){
  const ed=S.editOrg&&S.editOrg!=='new'?D('org').find(n=>n.id===S.editOrg):null;
  const blocked=ed?orgDesc(ed.id):new Set();
  const opts=[...D('org')].filter(n=>!blocked.has(n.id)).sort((a,b)=>a.role.localeCompare(b.role,'de'));
  const v=k=>esc(ed?ed[k]||'':'');
  return `<form class="inline" data-form="org" style="margin:14px 20px">
    <label for="org-role">Funktion<input id="org-role" required maxlength="60" value="${v('role')}" placeholder="z. B. Gerätewart"></label>
    <label for="org-name">Name<input id="org-name" maxlength="60" value="${v('name')}" placeholder="Vor- und Nachname"></label>
    <label for="org-parent">Untergeordnet unter<select id="org-parent"><option value="">— oberste Ebene —</option>${opts.map(n=>`<option value="${esc(n.id)}" ${(ed?ed.parentId:S.orgParent)===n.id?'selected':''}>${esc(n.role)}${n.name?' · '+esc(n.name):''}</option>`).join('')}</select></label>
    <label for="org-order">Reihenfolge<input id="org-order" type="number" min="0" max="99" value="${ed?esc(ed.order??0):0}"></label>
    <label for="org-area" class="span-all">Verantwortlich für<input id="org-area" maxlength="200" value="${v('area')}" placeholder="z. B. Atemschutzgeräte, Prüffristen, Schlüsselverwaltung"></label>
    <label for="org-phone">Telefon<input id="org-phone" type="tel" maxlength="40" value="${v('phone')}"></label>
    <label for="org-mail">E-Mail<input id="org-mail" type="email" maxlength="80" value="${v('email')}"></label>
    <div class="form-actions"><button class="btn primary" type="submit">${ed?'Speichern':'Hinzufügen'}</button><button class="btn ghost" type="button" data-act="close-form">Abbrechen</button>${ed?delBtn('org',ed.id,'Funktion löschen'):''}</div>
    ${errP('org')}</form>`;
}
/* ---------- Organigramm: Schaubild + Bereiche zum Aufklappen + Ansicht „Wer macht was?“ ---------- */
const orgEditBtn = (n,label='✎') => canCmd()&&S.orgEdit?`<button class="org-ed" data-act="edit-org" data-id="${esc(n.id)}" aria-label="${esc(n.role)} bearbeiten">${label}</button>`:'';
const orgAddBtn = n => canCmd()&&S.orgEdit?`<button class="org-add" data-act="org-add-under" data-id="${esc(n.id)}">+ Unterpunkt</button>`:'';
function orgContacts(n){
  const tel=n.phone?`<a class="org-c" href="tel:${esc(String(n.phone).replace(/[^\d+]/g,''))}" aria-label="${esc(n.name||n.role)} anrufen">📞</a>`:'';
  const mail=n.email?`<a class="org-c" href="mailto:${esc(n.email)}" aria-label="${esc(n.name||n.role)} mailen">✉️</a>`:'';
  return tel+mail;
}
const orgPeople = s => String(s||'').split(/\s*(?:\/|,|\s\+\s|\bund\b)\s*/).map(x=>x.trim()).filter(Boolean);
const isPerson = t => /^[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]+(\s+[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]+)+$/.test(t);
const initials = t => { const w=t.split(/\s+/); return ((w[0]||'')[0]+(w.length>1?(w[w.length-1]||'')[0]:'')).toUpperCase(); };
function nameChips(s,{small=false}={}){
  if(!s) return '<span class="free">unbesetzt</span>';
  return orgPeople(s).map(t=>isPerson(t)
    ? `<button class="pchip${small?' sm':''}" data-act="org-person" data-v="${esc(t)}" title="Alle Aufgaben von ${esc(t)}"><span class="av">${esc(initials(t))}</span>${esc(t)}</button>`
    : `<span class="pchip grp${small?' sm':''}">${esc(t)}</span>`).join('');
}
/* Bereich (Kind einer obersten Ebene) und Farbe je Knoten */
function orgAreas(){ return orgChildren(null).flatMap(r=>orgChildren(r.id)); }
function orgHueMap(){ const m={}; orgAreas().forEach((a,i)=>{ orgDesc(a.id).forEach(id=>m[id]=i%7); }); return m; }
function orgRows(pid,depth){
  return orgChildren(pid).map(n=>`<li class="org-li d${Math.min(depth,3)}">
      <div class="org-row"><span class="fn">${esc(n.role)}${n.area?`<small>${esc(n.area)}</small>`:''}</span><span class="nm">${nameChips(n.name,{small:true})}${orgContacts(n)}${orgEditBtn(n)}</span></div>
    </li>${depth<8?orgRows(n.id,depth+1):''}`).join('');
}
function orgBox(n,hue){
  const open=S.orgAll||S.orgOpen.has(n.id), cnt=orgDesc(n.id).size-1;
  return `<div class="obox hue${hue} ${open?'open':''}" id="org-${esc(n.id)}">
    <div class="obox-h">
      <button class="obox-t" data-act="org-toggle" data-id="${esc(n.id)}" aria-expanded="${open}">
        <span class="obadge">${esc((n.role||'?')[0])}</span>
        <span class="obox-tx"><span class="obox-name">${esc(n.role)}</span><span class="obox-sub">${cnt?`${cnt} Aufgaben`:'keine Unterpunkte'}</span></span>
        <span class="chev" aria-hidden="true">▾</span>
      </button>${orgEditBtn(n)}
    </div>
    <div class="obox-lead"><span class="lbl">Leitung</span>${nameChips(n.name)}${orgContacts(n)}</div>
    ${n.area?`<p class="org-area-note">${esc(n.area)}</p>`:''}
    ${open&&cnt?`<ul class="org-ul">${orgRows(n.id,1)}</ul>`:''}${open?orgAddBtn(n):''}
  </div>`;
}
function orgChart(){
  const hue=orgHueMap();
  return `<div class="ochart">${orgChildren(null).map(r=>{
    const kids=orgChildren(r.id);
    return `<div class="otree ${kids.length>2?'big':'small'}">
      <div class="onode root" ><span class="o-role">${esc(r.role)}</span><span class="o-name">${esc(r.name||'–')}</span></div>
      ${kids.length?`<div class="okids" style="--n:${kids.length}">${kids.map(k=>`<button class="onode hue${hue[k.id]}" data-act="org-open" data-id="${esc(k.id)}"><span class="o-role">${esc(k.role)}</span><span class="o-name">${esc(orgPeople(k.name).join(' · ')||'–')}</span><span class="o-cnt">${orgDesc(k.id).size-1||''}</span></button>`).join('')}</div>`:''}
    </div>`; }).join('')}</div>`;
}
function orgPersons(){
  const hue=orgHueMap(), areaOf={}; orgAreas().forEach(a=>orgDesc(a.id).forEach(id=>areaOf[id]=a));
  const map=new Map();
  D('org').forEach(n=>orgPeople(n.name).filter(isPerson).forEach(p=>{
    if(!map.has(p)) map.set(p,[]); map.get(p).push({n,hue:hue[n.id],area:areaOf[n.id]});
  }));
  return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0],'de'));
}
function renderOrgPeople(q){
  const list=orgPersons().filter(([p,t])=>!q||p.toLowerCase().includes(q)||t.some(x=>x.n.role.toLowerCase().includes(q)));
  if(!list.length) return `<div class="empty"><strong>Niemand gefunden.</strong>Versuch es mit einem anderen Namen.</div>`;
  return `<div class="pgrid">${list.map(([p,tasks])=>`<div class="pcard">
      <div class="pcard-h"><span class="av big">${esc(initials(p))}</span><div><div class="pname">${esc(p)}</div><div class="obox-sub">${tasks.length} ${tasks.length===1?'Aufgabe':'Aufgaben'}</div></div></div>
      <div class="ptasks">${tasks.map(t=>`<button class="tchip hue${t.hue??'r'}" data-act="org-open" data-id="${esc((t.area||t.n).id)}" title="${esc(orgPath(t.n))}">${esc(t.n.role)}</button>`).join('')}</div>
    </div>`).join('')}</div>`;
}
/* Klassisches Organigramm: Wurzel → Bereiche nebeneinander → Aufgaben als Baum darunter */
function otNames(s){
  if(!s) return '<span class="free">unbesetzt</span>';
  return orgPeople(s).map(t=>isPerson(t)?`<button class="ot-person" data-act="org-person" data-v="${esc(t)}">${esc(t)}</button>`:`<span class="ot-grp">${esc(t)}</span>`).join('<span class="ot-sep">, </span>');
}
function otNode(n,cls,hue){
  return `<div class="ot-node ${cls} hue${hue??'r'}" id="org-${esc(n.id)}">
    <div class="ot-role">${esc(n.role)}${orgEditBtn(n)}</div>
    <div class="ot-names">${otNames(n.name)}${orgContacts(n)}</div>
    ${n.area?`<div class="ot-note">${esc(n.area)}</div>`:''}
  </div>`;
}
function otVert(pid,hue,depth){
  const kids=depth<8?orgChildren(pid):[];
  return kids.length?`<ul class="ot-v">${kids.map(k=>`<li>${otNode(k,'leaf',hue)}${otVert(k.id,hue,depth+1)}</li>`).join('')}</ul>`:'';
}
function orgTree(r){
  const hue=orgHueMap(), kids=orgChildren(r.id);
  return `<div class="ot-tree ${kids.length>1?'':'solo'}">
    ${otNode(r,'root',null)}
    ${kids.length?`<ul class="ot-h">${kids.map(k=>`<li class="hue${hue[k.id]??'r'}">${otNode(k,'l1',hue[k.id])}${otVert(k.id,hue[k.id],1)}${orgAddBtn(k)}</li>`).join('')}</ul>`:''}
  </div>`;
}
function renderOrg(tab){
  const all=D('org'); const q=S.orgQ.trim().toLowerCase();
  let html=`<div class="panel"><div class="panel-head">
    <div><h2>${tab==='people'?'Wer macht was?':'Organigramm'}</h2><p class="sub">${tab==='people'?'Alle Kameraden mit ihren Aufgaben. Aufgabe antippen zeigt sie im Organigramm.':'Wer ist wofür zuständig? Namen antippen zeigt alle Aufgaben der Person.'}</p></div>
    ${canCmd()?`<div class="actions">${S.orgEdit?`<button class="btn primary" data-act="edit-org" data-id="new">+ Funktion</button>`:''}<button class="btn ${S.orgEdit?'':'ghost'}" data-act="org-edit-mode" aria-pressed="${!!S.orgEdit}">${S.orgEdit?'Fertig':'✎ Bearbeiten'}</button></div>`:''}</div>`;
  if(S.editOrg && canCmd()) html+=orgForm();
  if(!all.length) return loadingOr(['org'], html+`<div class="empty"><strong>Noch kein Organigramm hinterlegt.</strong>${canCmd()?'Über „✎ Bearbeiten“ → „+ Funktion“ anlegen.':'Sobald die Bearbeiter es anlegen, steht es hier.'}</div></div>`);
  html+=`<div class="org-tools">
    <input id="org-q" type="search" placeholder="${tab==='people'?'Name suchen':'Suchen: Aufgabe oder Name'}" value="${esc(S.orgQ)}" aria-label="Organigramm durchsuchen">
  </div>`;
  if(tab==='people') html+=renderOrgPeople(q);
  else if(q){
    const hue=orgHueMap();
    const hits=all.filter(n=>[n.role,n.name,n.area].some(x=>(x||'').toLowerCase().includes(q)));
    html+= hits.length?`<ul class="org-ul org-hits">${hits.map(n=>`<li class="org-li"><div class="org-row"><span class="fn"><span class="dot hue${hue[n.id]??'r'}"></span>${esc(n.role)}<small>${esc(orgPath(n))}</small></span><span class="nm">${nameChips(n.name,{small:true})}${orgContacts(n)}${orgEditBtn(n)}</span></div></li>`).join('')}</ul>`:`<div class="empty"><strong>Nichts gefunden.</strong>Versuch es mit einem anderen Stichwort.</div>`;
  } else {
    html+=`<div class="org-bar"><span class="count">${all.length} Funktionen · ${orgPersons().length} Personen</span><span class="count ot-hint">← zum Verschieben wischen →</span></div>`;
    html+=`<div class="ot-scroll"><div class="ot-canvas">${orgChildren(null).map(r=>orgTree(r)).join('')}</div></div>`;
  }
  return loadingOr(['org'], html+'</div>');
}

/* ---------- Mängel ---------- */
const URG={normal:{n:'normal',c:'free'},dringend:{n:'dringend',c:'open'},ausser_dienst:{n:'außer Dienst',c:'busy'}};
const DST={offen:{n:'offen',c:'open'},in_arbeit:{n:'in Arbeit',c:'ice'},erledigt:{n:'erledigt',c:'done'}};
function renderDefects(){
  const items=[...D('items')].sort((a,b)=>(catName(a.cat)+a.name).localeCompare(catName(b.cat)+b.name,'de'));
  const all=[...D('defects')].sort((a,b)=>{const u={ausser_dienst:0,dringend:1,normal:2};return (u[a.urgency]-u[b.urgency])||(b.createdAt||'').localeCompare(a.createdAt||'');});
  const open=all.filter(x=>x.status!=='erledigt'), done=all.filter(x=>x.status==='erledigt');
  let html=`<div class="panel"><div class="panel-head">
    <div><h2>Mängel melden</h2><p class="sub">Etwas kaputt, fehlt oder nicht einsatzbereit? Kurz eintragen – Gerätewart und Kommandant werden benachrichtigt.</p></div></div>
    <form class="inline" data-form="defect" style="margin:14px 20px">
      <label for="df-item">Betrifft<select id="df-item">${items.map(i=>`<option value="${esc(i.id)}">${esc(catName(i.cat))}: ${esc(i.name)}</option>`).join('')}<option value="">Sonstiges (unten benennen)</option></select></label>
      <label for="df-other">Gegenstand (falls Sonstiges)<input id="df-other" maxlength="60" placeholder="z. B. Funkgerät 3"></label>
      <label for="df-urg">Dringlichkeit<select id="df-urg"><option value="normal">normal</option><option value="dringend">dringend</option><option value="ausser_dienst">außer Dienst – nicht benutzen!</option></select></label>
      <label for="df-title" class="span-all">Was ist kaputt?<input id="df-title" required maxlength="90" placeholder="z. B. Blaulicht hinten links ohne Funktion"></label>
      <label for="df-desc" class="span-all">Details<textarea id="df-desc" maxlength="800" style="min-height:70px" placeholder="optional"></textarea></label>
      <div class="form-actions"><button class="btn primary" type="submit">Mangel melden</button></div>
      ${errP('defect')}
    </form></div>`;
  const row=x=>`<div class="row">
    <div class="info">
      <div style="display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center"><span class="cat-dot">${esc(x.item_name)}</span><span class="chip ${URG[x.urgency].c}">${URG[x.urgency].n}</span><span class="chip ${DST[x.status].c}">${DST[x.status].n}</span></div>
      <h3 style="margin-top:4px">${esc(x.title)}</h3>
      ${x.description?`<p class="text">${esc(x.description)}</p>`:''}
      <div class="facts"><span>gemeldet von ${who(x.by)} am ${esc(new Date(x.createdAt).toLocaleDateString('de-DE'))}</span>${x.status==='erledigt'&&x.doneBy?`<span>erledigt von ${who(x.doneBy)}${x.doneAt?' am '+esc(new Date(x.doneAt).toLocaleDateString('de-DE')):''}</span>`:''}</div>
    </div>
    <div class="actions">${canGear()?`
      ${x.status==='offen'?`<button class="btn small" data-act="defect-status" data-id="${esc(x.id)}" data-status="in_arbeit">In Arbeit</button>`:''}
      ${x.status!=='erledigt'?`<button class="btn small primary" data-act="defect-status" data-id="${esc(x.id)}" data-status="erledigt">Erledigt</button>`:`<button class="btn small" data-act="defect-status" data-id="${esc(x.id)}" data-status="offen">Wieder öffnen</button>`}
      ${delBtn('defects',x.id)}`:''}</div>
  </div>`;
  html+=`<div class="panel"><div class="panel-head"><div><h2>Offene Mängel</h2>${canGear()?'':'<p class="sub">Status ändern können Gerätewart und Kommandant.</p>'}</div><span class="count">${open.length} offen</span></div>
    ${open.length?open.map(row).join(''):'<div class="empty"><strong>Keine offenen Mängel.</strong>Alles einsatzbereit.</div>'}
    ${done.length?`<div class="day-head"><span class="when">Erledigt (${done.length})</span><button class="btn ghost small" data-act="toggle-past" data-key="defects">${S.showPast.defects?'Ausblenden':'Anzeigen'}</button></div>${S.showPast.defects?done.map(row).join(''):''}`:''}
  </div>`;
  return loadingOr(['defects','items'], html);
}

/* ---------- Push-Benachrichtigungen ---------- */
const PUSH_CATS=[['news','Neues in der Wehr'],['aktive','Dienstplan Aktive'],['jugend','Dienstplan Jugend'],['events','Veranstaltungen'],['defects','Mängel (Gerätewart/Kommandant)'],['fristen','Fristen-Erinnerung (Führung)'],['meine_fristen','Meine eigenen Fristen'],['expenses','Private Ausgaben'],['reservations','Reservierungen, für die ich verantwortlich bin'],['kleider','Kleiderkammer-Anfragen (Gerätewart/Kommandant)'],['erinnerung','Erinnerung am Vortag eines Dienstes'],['aufgaben','Meine Aufgaben (To-do)']];
const pushSupported=()=>('serviceWorker' in navigator)&&('PushManager' in window)&&('Notification' in window);
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
S.pushEndpoint=null;
async function refreshPushState(){
  if(!pushSupported()) return;
  try{ const reg=await navigator.serviceWorker.ready; const sub=await reg.pushManager.getSubscription(); S.pushEndpoint=sub?sub.endpoint:null; }catch(_){ S.pushEndpoint=null; }
}
function myPushRow(){ return S.pushEndpoint ? D('push_subs').find(x=>x.endpoint===S.pushEndpoint) : null; }
function b64ToBytes(b64){ const pad='='.repeat((4-b64.length%4)%4); const raw=atob((b64+pad).replace(/-/g,'+').replace(/_/g,'/')); return Uint8Array.from(raw,c=>c.charCodeAt(0)); }
async function enablePush(){
  if(!pushSupported()) return toast('Dieses Gerät bzw. dieser Browser unterstützt keine Benachrichtigungen.');
  const perm=await Notification.requestPermission();
  if(perm!=='granted') return toast('Benachrichtigungen wurden nicht erlaubt. Du kannst das in den Browser-Einstellungen ändern.');
  try{
    const r=await fetch(CFG.supabaseUrl+'/functions/v1/push',{headers:{apikey:CFG.supabaseAnonKey}});
    const {publicKey}=await r.json();
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToBytes(publicKey)});
    const j=sub.toJSON();
    const prefs=Object.fromEntries(PUSH_CATS.map(([k])=>[k,true]));
    const ok=await run('push_subs', sb.from('push_subs').upsert({endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,prefs},{onConflict:'endpoint'}), 'Benachrichtigungen sind an');
    if(ok){ S.pushEndpoint=j.endpoint; render(); }
  }catch(e){ console.warn(e); toast('Einschalten hat nicht geklappt. Bitte nochmal versuchen.'); }
}
async function disablePush(){
  try{
    const reg=await navigator.serviceWorker.ready; const sub=await reg.pushManager.getSubscription();
    if(sub){ await sb.from('push_subs').delete().eq('endpoint',sub.endpoint); await sub.unsubscribe(); }
  }catch(e){ console.warn(e); }
  S.pushEndpoint=null; await load('push_subs'); toast('Benachrichtigungen sind aus'); render();
}
async function setPushPref(cat,on){
  const row=myPushRow(); if(!row) return;
  const prefs={...(row.prefs||{}),[cat]:on};
  await run('push_subs', sb.from('push_subs').update({prefs}).eq('id',row.id), on?'Eingeschaltet':'Ausgeschaltet');
}
function renderPush(){
  const row=myPushRow();
  let body;
  if(!pushSupported()){
    body = isIOS()&&!isStandalone()
      ? `<div class="empty"><strong>Auf dem iPhone zuerst zum Home-Bildschirm hinzufügen.</strong>Öffne Florian HQ in Safari, tippe auf <b>Teilen</b> → <b>Zum Home-Bildschirm</b> und starte die App dann über das neue Symbol. Danach kannst du hier Benachrichtigungen einschalten.</div>`
      : `<div class="empty"><strong>Dieser Browser unterstützt keine Benachrichtigungen.</strong>Versuch es mit Chrome, Edge, Firefox oder Safari (Mac/iPhone ab iOS 16.4 über den Home-Bildschirm).</div>`;
  } else if(!row){
    body = `<div class="empty"><strong>Benachrichtigungen sind auf diesem Gerät aus.</strong>Du bekommst eine Meldung, wenn es Neuigkeiten, neue Dienste oder Veranstaltungen gibt. Du kannst einzelne Bereiche jederzeit wieder abschalten.</div>
      <div style="padding:0 20px 20px"><button class="btn primary" data-act="push-on">🔔 Benachrichtigungen einschalten</button></div>`;
  } else {
    body = `<div class="row"><div class="info"><h3>Benachrichtigungen sind an</h3><p class="note">Wähle, worüber du informiert werden willst. Gilt nur für dieses Gerät.</p></div><div class="actions"><button class="btn danger small" data-act="push-off">Alle ausschalten</button></div></div>
      ${PUSH_CATS.filter(([k])=>(k==='defects'||k==='kleider')?canGear():(k==='fristen'?canLead():true)).map(([k,n])=>{const on=(row.prefs||{})[k]!==false;return `<div class="row"><div class="info"><h3 style="font-size:16px">${esc(n)}</h3></div><div class="actions"><button class="switch" role="switch" aria-checked="${on}" data-act="push-pref" data-key="${k}" aria-label="${esc(n)}"><span></span></button></div></div>`;}).join('')}`;
  }
  return `<div class="panel"><div class="panel-head"><div><h2>Benachrichtigungen</h2><p class="sub">Push-Meldungen aufs Handy oder den Computer.</p></div></div>${body}</div>`;
}

/* ---------- Wehrführung (nur Bearbeiter) ---------- */
S.leadTab='catalog'; S.leadYear=new Date().getFullYear(); S.leadGroup='aktive'; S.attDuty=null; S.qualPrefill=null; S.fristFilter='';
const people=()=>D('profiles').filter(p=>p.role==='member'||p.role==='admin').sort((a,b)=>(a.name||'').localeCompare(b.name||'','de'));
const qTypes=k=>D('qual_types').filter(t=>t.kind===k).sort((a,b)=>(a.sort-b.sort)||a.name.localeCompare(b.name,'de'));
function addMonths(d,m){ const x=new Date(d+'T00:00'); const day=x.getDate(); x.setMonth(x.getMonth()+m); if(x.getDate()<day) x.setDate(0); return `${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}`; }
const daysUntil=d=>Math.round((new Date(d+'T00:00')-new Date(today()+'T00:00'))/864e5);
function fristState(q){ if(!q.expires) return {c:'free',n:'ohne Ablauf',k:3}; const t=D('qual_types').find(x=>x.id===q.typeId); const warn=(t&&t.remind_days!=null)?t.remind_days:60; const n=daysUntil(q.expires); if(n<0) return {c:'busy',n:`seit ${-n} Tg. abgelaufen`,k:0}; if(n<=warn) return {c:'open',n:`noch ${n} Tg.`,k:1}; return {c:'done',n:`noch ${n} Tg.`,k:2}; }
function personOpts(sel){ return people().map(p=>`<option value="${esc(p.id)}" ${p.id===sel?'selected':''}>${esc(p.name||p.email)}</option>`).join(''); }
function typeOpts(k,sel){ return qTypes(k).map(t=>`<option value="${esc(t.id)}" ${t.id===sel?'selected':''}>${esc(t.name)}${t.valid_months?` (${t.valid_months} Mon.)`:''}</option>`).join(''); }

function renderLead(){
  if(!mgr()) return `<div class="panel"><div class="empty"><strong>Nur für die Führung.</strong></div></div>`;
  const tabs=[['catalog','Fristen'],['attend','Übungsbeteiligung'],['avail','Verfügbarkeit']];
  if(!tabs.some(([k])=>k===S.leadTab)) S.leadTab='catalog';
  const fr=D('member_quals').filter(q=>D('qual_types').find(t=>t.id===q.typeId&&t.kind==='frist'));
  const red=fr.filter(q=>fristState(q).k===0).length, yel=fr.filter(q=>fristState(q).k===1).length;
  let html=`<div class="panel"><div class="panel-head"><div><h2>Führung</h2><p class="sub">Nur für Kommandant, Gruppenführer und App-Master sichtbar.</p></div>
    <div class="actions">${red?`<span class="chip busy">${red} abgelaufen</span>`:''}${yel?`<span class="chip open">${yel} bald fällig</span>`:''}</div></div>
    <div class="org-tools"><div class="filters">${tabs.map(([k,n])=>`<button class="filter" data-act="lead-tab" data-key="${k}" aria-pressed="${S.leadTab===k}">${n}</button>`).join('')}</div></div></div>`;
  html += S.leadTab==='attend'?leadAttend() : S.leadTab==='avail'?leadAvail() : leadCatalog();
  return loadingOr(['qual_types','member_quals','duty_attendance','profiles'], html);
}
// Frühere Fristen-Gesamtliste (ersetzt durch den aufklappbaren Katalog)
function leadFristen(){
  const types=qTypes('frist');
  const rows=D('member_quals').filter(q=>types.some(t=>t.id===q.typeId)&&(!S.fristFilter||q.typeId===S.fristFilter))
    .map(q=>({q,t:types.find(t=>t.id===q.typeId),p:D('profiles').find(p=>p.id===q.userId),st:fristState(q)}))
    .sort((a,b)=>(a.st.k-b.st.k)||(a.q.expires||'9').localeCompare(b.q.expires||'9'));
  let html=`<div class="panel"><div class="panel-head"><div><h3>Frist eintragen</h3><p class="sub">Ein neuer Eintrag ersetzt den alten für dieselbe Person und Frist.</p></div></div>
    <form class="inline" data-form="frist" style="margin:14px 20px">
      <label for="fr-user">Person<select id="fr-user">${personOpts()}</select></label>
      <label for="fr-type">Frist<select id="fr-type">${typeOpts('frist')}</select></label>
      <label for="fr-date">Erledigt am<input type="date" id="fr-date" value="${today()}" required></label>
      <label for="fr-exp">Gültig bis<input type="date" id="fr-exp" placeholder="automatisch"></label>
      <label for="fr-note" class="span-all">Notiz<input id="fr-note" maxlength="120" placeholder="optional, z. B. Untersuchung bei Dr. …"></label>
      <div class="form-actions"><button class="btn primary" type="submit">Speichern</button></div>
      <p class="sub span-all" style="margin:0">„Gültig bis“ leer lassen = wird aus der Gültigkeit der Frist berechnet.</p>
      ${errP('frist')}
    </form></div>`;
  html+=`<div class="panel"><div class="panel-head"><div><h3>Fristen-Ampel</h3></div>
    <label for="fr-filter" style="min-width:200px">Filter<select id="fr-filter" data-change="frist-filter"><option value="">Alle Fristen</option>${typeOpts('frist',S.fristFilter)}</select></label></div>
    ${rows.length?rows.map(({q,t,p,st})=>`<div class="row">
      <div class="info"><div style="display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center"><h3 style="font-size:17px">${esc(p?p.name:'?')}</h3><span class="chip ${st.c}">${st.n}</span></div>
        <div class="facts"><span><b>${esc(t.name)}</b></span><span>erledigt ${esc(fmtDate(q.achieved))}</span>${q.expires?`<span>gültig bis <b>${esc(fmtDate(q.expires))}</b></span>`:''}</div>
        ${q.note?`<p class="note">${esc(q.note)}</p>`:''}</div>
      <div class="actions">${t.valid_months?`<button class="btn small" data-act="frist-renew" data-id="${esc(q.id)}">Heute erneuert</button>`:''}${delBtn('member_quals',q.id)}</div>
    </div>`).join(''):'<div class="empty"><strong>Noch keine Fristen eingetragen.</strong>Oben Person und Frist wählen und speichern.</div>'}</div>`;
  return html;
}
// Qualifikationen vorerst ausgeblendet (Daten bleiben erhalten)
function leadQuals(){
  const types=qTypes('lehrgang'), ps=people();
  const has=(u,t)=>D('member_quals').find(q=>q.userId===u&&q.typeId===t);
  const pf=S.qualPrefill||{};
  let html=`<div class="panel"><div class="panel-head"><div><h3>Lehrgang eintragen</h3><p class="sub">Oder in der Tabelle auf <b>+</b> tippen.</p></div></div>
    <form class="inline" data-form="qual" style="margin:14px 20px">
      <label for="ql-user">Person<select id="ql-user">${personOpts(pf.user)}</select></label>
      <label for="ql-type">Lehrgang<select id="ql-type">${typeOpts('lehrgang',pf.type)}</select></label>
      <label for="ql-date">Abgeschlossen am<input type="date" id="ql-date" value="${today()}" required></label>
      <div class="form-actions"><button class="btn primary" type="submit">Speichern</button></div>
      ${errP('qual')}
    </form></div>`;
  html+=`<div class="panel"><div class="panel-head"><div><h3>Qualifikationen</h3><p class="sub">✓ = vorhanden (Jahr). Zweimal auf ✓ tippen entfernt den Eintrag.</p></div></div>
    <div class="qtable-wrap"><table class="qtable"><thead><tr><th>Person</th>${types.map(t=>`<th><span>${esc(t.name)}</span></th>`).join('')}</tr></thead><tbody>
    ${ps.map(p=>`<tr><th>${esc(p.name||p.email)}</th>${types.map(t=>{const q=has(p.id,t.id);const key='mq-'+p.id+'-'+t.id;
      return `<td>${q?`<button class="qcell yes ${S.confirm===key?'confirm':''}" data-act="qual-cell" data-user="${esc(p.id)}" data-type="${esc(t.id)}" data-id="${esc(q.id)}" title="${esc(fmtDate(q.achieved))}">${S.confirm===key?'entfernen?':'✓ '+esc(String(q.achieved).slice(0,4))}</button>`:`<button class="qcell" data-act="qual-cell" data-user="${esc(p.id)}" data-type="${esc(t.id)}" aria-label="${esc(t.name)} für ${esc(p.name||'')} eintragen">+</button>`}</td>`;}).join('')}</tr>`).join('')}
    </tbody><tfoot><tr><th>Anzahl</th>${types.map(t=>`<td><b>${D('member_quals').filter(q=>q.typeId===t.id).length}</b></td>`).join('')}</tr></tfoot></table></div></div>`;
  return html;
}
function leadAttend(){
  const y=String(S.leadYear), g=S.leadGroup, t=today();
  const duties=D('duties').filter(d=>d.group===g&&String(d.date).startsWith(y)&&d.date<=t).sort((a,b)=>b.date.localeCompare(a.date));
  const att=D('duty_attendance');
  const recorded=duties.filter(d=>att.some(a=>a.dutyId===d.id));
  const years=[...new Set([new Date().getFullYear(),...D('duties').map(d=>+String(d.date).slice(0,4))])].sort((a,b)=>b-a);
  let html=`<div class="panel"><div class="panel-head"><div><h3>Übungsbeteiligung ${esc(y)}</h3><p class="sub">Gezählt werden nur Dienste, bei denen die Anwesenheit erfasst wurde (${recorded.length} von ${duties.length}).</p></div>
    <div class="actions">
      <div class="filters">${[['aktive','Aktive'],['jugend','Jugend']].map(([k,n])=>`<button class="filter" data-act="lead-group" data-key="${k}" aria-pressed="${g===k}">${n}</button>`).join('')}</div>
      <label for="lead-year" style="min-width:110px">Jahr<select id="lead-year" data-change="lead-year">${years.map(v=>`<option ${v==S.leadYear?'selected':''}>${v}</option>`).join('')}</select></label>
    </div></div>`;
  const ps=people();
  const stats=ps.map(p=>{const n=recorded.filter(d=>att.some(a=>a.dutyId===d.id&&a.userId===p.id&&a.present)).length;return {p,n,pct:recorded.length?Math.round(n/recorded.length*100):0};}).sort((a,b)=>b.n-a.n||(a.p.name||'').localeCompare(b.p.name||'','de'));
  html+= recorded.length ? stats.map(s=>`<div class="row"><div class="info"><div class="att-line"><b>${esc(s.p.name||s.p.email)}</b><span class="when">${s.n}/${recorded.length} · ${s.pct} %</span></div><div class="bar"><span style="width:${s.pct}%"></span></div></div></div>`).join('')
    : '<div class="empty"><strong>Noch keine Anwesenheit erfasst.</strong>Unten einen vergangenen Dienst wählen und abhaken, wer da war.</div>';
  html+='</div>';
  html+=`<div class="panel"><div class="panel-head"><div><h3>Anwesenheit erfassen</h3><p class="sub">Vorausgefüllt mit den Zusagen. Nur vergangene und heutige Dienste.</p></div></div>`;
  if(!duties.length) html+='<div class="empty">Keine Dienste in diesem Zeitraum.</div>';
  html+=duties.map(d=>{
    const rec=att.filter(a=>a.dutyId===d.id); const pres=rec.filter(a=>a.present).length; const openNow=S.attDuty===d.id;
    let block=`<div class="row dated">${dateBox(d.date)}<div class="info"><h3>${esc(d.topic)}</h3><div class="facts">${rec.length?`<span class="chip done">${pres} anwesend</span>`:`<span class="chip open">noch nicht erfasst</span>`}</div></div>
      <div class="actions"><button class="btn small ${openNow?'':'primary'}" data-act="att-open" data-id="${esc(d.id)}">${openNow?'Schließen':(rec.length?'Bearbeiten':'Erfassen')}</button></div></div>`;
    if(openNow){
      const rs=D('duty_rsvp').filter(r=>r.dutyId===d.id);
      block+=`<form class="formbox" data-form="attendance" data-id="${esc(d.id)}" style="margin:0 20px 16px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
        ${ps.map(p=>{const a=rec.find(x=>x.userId===p.id); const on=a?a.present:rs.some(r=>r.userId===p.id&&r.status==='yes');
          const r=rs.find(x=>x.userId===p.id);
          return `<label class="check"><input type="checkbox" id="att-${esc(p.id)}" ${on?'checked':''}> ${esc(p.name||p.email)}${r?` <span class="chip ${RSVP[r.status].c}" style="margin-left:auto">${RSVP[r.status].i}</span>`:''}</label>`;}).join('')}
        <div class="form-actions span-all"><button class="btn primary" type="submit">Anwesenheit speichern</button><button class="btn ghost" type="button" data-act="att-open" data-id="${esc(d.id)}">Abbrechen</button></div>
      </form>`;
    }
    return block;
  }).join('');
  return html+'</div>';
}
S.catOpen=null; S.catPerson=null;
function fristDetail(t){
  const entries=D('member_quals').filter(q=>q.typeId===t.id).map(q=>({q,p:D('profiles').find(p=>p.id===q.userId),st:fristState(q)}))
    .sort((a,b)=>(a.st.k-b.st.k)||(a.q.expires||'9').localeCompare(b.q.expires||'9'));
  const withEntry=new Set(entries.map(e=>e.q.userId));
  const missing=people().filter(p=>!withEntry.has(p.id));
  const sel=S.catPerson||(missing[0]&&missing[0].id)||'';
  return `<div class="cat-detail">
    <form class="remind-box" data-form="remind" data-id="${esc(t.id)}">
      <label class="check"><input type="checkbox" id="rm-on" ${t.remind_days!=null?'checked':''}> 🔔 Vorab-Erinnerung</label>
      <label for="rm-days" class="rm-days"><input type="number" id="rm-days" min="0" max="365" value="${t.remind_days!=null?t.remind_days:30}"> Tage vor Ablauf</label>
      <label class="check"><input type="checkbox" id="rm-person" ${t.remind_person?'checked':''}> betroffene Person auch erinnern</label>
      <button class="btn small" type="submit">Speichern</button>
      <p class="sub" style="margin:0;flex-basis:100%">Die Führung bekommt dann eine Push-Meldung, wenn die Frist in X Tagen abläuft und wenn sie abgelaufen ist. Ab dieser Zeit wird die Ampel gelb.</p>
    </form>
    <form class="formbox" data-form="frist" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
      <input type="hidden" id="fr-type" value="${esc(t.id)}">
      <label for="fr-user">Person<select id="fr-user">${personOpts(sel)}</select></label>
      <label for="fr-date">Erledigt am<input type="date" id="fr-date" value="${today()}" required></label>
      <label for="fr-exp">Gültig bis<input type="date" id="fr-exp"></label>
      <div class="form-actions"><button class="btn primary" type="submit">Eintragen</button></div>
      <p class="sub span-all" style="margin:0">„Gültig bis“ leer = automatisch ${t.valid_months} Monate ab „Erledigt am“.</p>
      ${errP('frist')}
    </form>
    ${missing.length?`<div class="missing"><h4>Noch ohne Eintrag (${missing.length})</h4><div class="people">${missing.map(p=>`<button class="person-pick ${p.id===sel?'on':''}" data-act="cat-person" data-id="${esc(p.id)}">${esc(p.name||p.email)}</button>`).join('')}</div></div>`:''}
    <div class="cat-list">${entries.length?entries.map(({q,p,st})=>`<div class="cat-entry">
      <div style="min-width:0"><span class="dot ${st.c}" aria-hidden="true"></span><b>${esc(p?p.name:'?')}</b> <span class="chip ${st.c}">${st.n}</span>
        <div class="facts"><span>erledigt ${esc(fmtDate(q.achieved))}</span>${q.expires?`<span>gültig bis <b>${esc(fmtDate(q.expires))}</b></span>`:''}</div></div>
      <div class="actions"><button class="btn small" data-act="frist-renew" data-id="${esc(q.id)}">Heute erneuert</button>${delBtn('member_quals',q.id)}</div>
    </div>`).join(''):'<p class="sub" style="margin:0">Noch niemand eingetragen.</p>'}</div>
  </div>`;
}
function leadCatalog(){
  const types=qTypes('frist');
  const list=types.map(t=>{
    const es=D('member_quals').filter(q=>q.typeId===t.id); const red=es.filter(q=>fristState(q).k===0).length, yel=es.filter(q=>fristState(q).k===1).length;
    const open=S.catOpen===t.id;
    return `<div class="cat-item ${open?'open':''}">
      <div class="row">
        <button class="cat-head" data-act="cat-open" data-id="${esc(t.id)}" aria-expanded="${open}">
          <span class="cat-arrow" aria-hidden="true">${open?'▾':'▸'}</span>
          <span style="min-width:0"><span class="cat-name">${esc(t.name)}</span><span class="note">gültig ${t.valid_months} Monate · ${es.length} ${es.length===1?'Person':'Personen'} · ${t.remind_days!=null?`🔔 ${t.remind_days} Tage vorher`:'keine Erinnerung'}</span></span>
          <span class="cat-chips">${red?`<span class="chip busy">${red}</span>`:''}${yel?`<span class="chip open">${yel}</span>`:''}</span>
        </button>
        <div class="actions">${delBtn('qual_types',t.id)}</div>
      </div>
      ${open?fristDetail(t):''}
    </div>`;}).join('');
  return `<div class="panel"><div class="panel-head"><div><h3>Fristen</h3><p class="sub">Auf eine Frist tippen: Personen mit Ampel sehen, neue eintragen, erneuern.</p></div></div>
    ${list||'<div class="empty">Noch keine Fristen angelegt.</div>'}</div>
    <div class="panel"><div class="panel-head"><div><h3>Neue Frist anlegen</h3><p class="sub">Löschen einer Frist entfernt auch alle zugehörigen Einträge bei den Personen.</p></div></div>
    <form class="inline" data-form="qtype" style="margin:14px 20px">
      <label for="qt-name">Bezeichnung<input id="qt-name" required maxlength="60" placeholder="z. B. Absturzsicherung-Unterweisung"></label>
      <label for="qt-months">Gültigkeit in Monaten<input type="number" id="qt-months" min="1" max="120" required placeholder="z. B. 12"></label>
      <label for="qt-remind">Erinnerung (Tage vorher)<input type="number" id="qt-remind" min="0" max="365" placeholder="leer = keine"></label>
      <div class="form-actions"><button class="btn primary" type="submit">Hinzufügen</button></div>
      ${errP('qtype')}
    </form></div>`;
}

/* ---------- Private Ausgaben ---------- */
const EST={offen:{n:'offen',c:'open'},erstattet:{n:'erstattet',c:'done'},abgelehnt:{n:'abgelehnt',c:'busy'}};
S.receiptUrls={}; S.receiptPending=new Set();
function ensureReceipts(paths){
  const need=paths.filter(p=>p&&!S.receiptUrls[p]&&!S.receiptPending.has(p)); if(!need.length) return;
  need.forEach(p=>S.receiptPending.add(p));
  sb.storage.from('belege').createSignedUrls(need,3600).then(({data})=>{ (data||[]).forEach(x=>{ if(x.signedUrl) S.receiptUrls[x.path]=x.signedUrl; }); need.forEach(p=>{ if(!S.receiptUrls[p]) S.receiptUrls[p]='missing'; S.receiptPending.delete(p); }); if(S.view==='expenses') render(); });
}
function renderExpenses(){
  const tr=isTreasurer();
  const all=[...D('expenses')].sort((a,b)=>(b.spent_on||'').localeCompare(a.spent_on||'')||(b.created_at||'').localeCompare(a.created_at||''));
  const open=all.filter(x=>x.status==='offen'), done=all.filter(x=>x.status!=='offen');
  const sum=open.reduce((a,x)=>a+(+x.amount||0),0);
  ensureReceipts(all.map(x=>x.receipt_path));
  let html=`<div class="panel"><div class="panel-head"><div><h2>Private Ausgaben</h2><p class="sub">${tr?'Du bist <b>Kassier</b>: Du siehst alle eingereichten Auslagen und markierst sie als erstattet.':'Hast du etwas für die Wehr privat bezahlt? Hier einreichen – der Kassier erstattet es. Du siehst nur deine eigenen Einträge.'}</p></div>
    ${open.length?`<span class="chip open">${open.length} offen · ${eur(sum)}</span>`:''}</div>
    <form class="inline" data-form="expense" style="margin:14px 20px">
      <label for="ex-date">Datum<input type="date" id="ex-date" value="${today()}" required></label>
      <label for="ex-amount">Betrag in €<input id="ex-amount" inputmode="decimal" required placeholder="z. B. 23,90" maxlength="10"></label>
      <label for="ex-purpose" class="span-all">Wofür?<input id="ex-purpose" required maxlength="120" placeholder="z. B. Getränke Übungsabend, Batterien Funkgeräte"></label>
      <label for="ex-file" class="span-all">Beleg (Foto)<input type="file" id="ex-file" accept="image/*,application/pdf"></label>
      <div class="form-actions"><button class="btn primary" type="submit" ${S.busy?'disabled':''}>Einreichen</button></div>
      ${errP('expense')}
    </form></div>`;
  const row=x=>{
    const url=S.receiptUrls[x.receipt_path];
    return `<div class="row">
    <div class="info">
      <div style="display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center"><h3>${esc(eur(x.amount))}</h3><span class="chip ${EST[x.status].c}">${EST[x.status].n}</span>${tr?`<span class="cat-dot">${esc(nameOf(x.user_id))}</span>`:''}</div>
      <p class="text" style="margin-top:2px">${esc(x.purpose)}</p>
      <div class="facts"><span>ausgegeben am ${esc(fmtDate(x.spent_on))}</span>${x.paid_at?`<span>${x.status==='erstattet'?'erstattet':'bearbeitet'} am ${esc(new Date(x.paid_at).toLocaleDateString('de-DE'))}${x.paid_by?' von '+esc(nameOf(x.paid_by)):''}</span>`:''}
        ${x.receipt_path?(url&&url!=='missing'?`<a href="${esc(url)}" target="_blank" rel="noopener">📎 Beleg ansehen</a>`:'<span>📎 Beleg</span>'):'<span>ohne Beleg</span>'}</div>
    </div>
    <div class="actions">${tr&&x.status==='offen'?`<button class="btn small primary" data-act="exp-status" data-id="${esc(x.id)}" data-status="erstattet">Erstattet</button><button class="btn small" data-act="exp-status" data-id="${esc(x.id)}" data-status="abgelehnt">Ablehnen</button>`:''}
      ${tr&&x.status!=='offen'?`<button class="btn small ghost" data-act="exp-status" data-id="${esc(x.id)}" data-status="offen">Zurück auf offen</button>`:''}
      ${(tr||(x.user_id===S.me&&x.status==='offen'))?delBtn('expenses',x.id):''}</div>
  </div>`;};
  let byPerson='';
  if(tr&&open.length){
    const m={}; open.forEach(x=>{m[x.user_id]=(m[x.user_id]||0)+(+x.amount||0);});
    byPerson=`<div class="day-head"><span class="when">Offen je Person</span><span>${Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([u,v])=>`${esc(nameOf(u))}: <b>${esc(eur(v))}</b>`).join(' · ')}</span></div>`;
  }
  html+=`<div class="panel"><div class="panel-head"><div><h3>${tr?'Zu erstatten':'Meine offenen Ausgaben'}</h3></div><span class="count">${eur(sum)}</span></div>
    ${byPerson}${open.length?open.map(row).join(''):'<div class="empty"><strong>Nichts offen.</strong></div>'}
    ${done.length?`<div class="day-head"><span class="when">Erledigt (${done.length})</span><button class="btn ghost small" data-act="toggle-past" data-key="expenses">${S.showPast.expenses?'Ausblenden':'Anzeigen'}</button></div>${S.showPast.expenses?done.map(row).join(''):''}`:''}
  </div>`;
  return loadingOr(['expenses'], html);
}

/* ---------- Mitglieder (nur Bearbeiter) ---------- */
function renderMembers(){
  if(!canCmd()) return `<div class="panel"><div class="empty"><strong>Nur für Kommandant und App-Master.</strong></div></div>`;
  const all=[...D('profiles')].sort((a,b)=>(a.name||'').localeCompare(b.name||'','de'));
  const waiting=all.filter(p=>p.role==='pending'), rest=all.filter(p=>p.role!=='pending');
  const master=isMaster();
  const row=p=>{
    const f=p.functions||[];
    return `<div class="row member-row">
    <div class="info"><h3>${esc(p.name||'Ohne Namen')}${p.id===S.me?' <span class="chip free">du</span>':''}</h3>
      <p class="note">${esc(p.email||'')} · seit ${esc(new Date(p.created_at).toLocaleDateString('de-DE'))}</p>
      ${p.role==='pending'?(()=>{const pre=D('role_assign').filter(x=>!x.userId&&x.fn!=='master'&&x.name.trim().toLowerCase()===(p.name||'').trim().toLowerCase()); return pre.length?`<div class="fn-chips"><span class="sub">Vorgemerkt – wird bei Freigabe übernommen:</span>${pre.map(x=>`<span class="fn-chip on">${esc(FN_NAME[x.fn]||x.fn)}</span>`).join('')}</div>`:'';})():''}
      ${p.role!=='pending'?`<div class="fn-chips">${p.role==='admin'?'<span class="fn-chip master">👑 App-Master</span>':''}${Object.entries(FN_NAME).map(([k,n])=>master
        ? `<button class="fn-chip ${f.includes(k)?'on':''}" data-act="fn-toggle" data-id="${esc(p.id)}" data-key="${k}" aria-pressed="${f.includes(k)}">${f.includes(k)?'✓ ':''}${n}</button>`
        : (f.includes(k)?`<span class="fn-chip on">${n}</span>`:'')).join('')}${!master&&!f.length&&p.role!=='admin'?'<span class="sub">Mitglied</span>':''}</div>`:''}
    </div>
    <div class="actions">
      ${p.role==='pending'
        ? `<button class="btn primary small" data-act="set-role" data-id="${esc(p.id)}" data-role="member">Freigeben</button>`
        : `${master&&p.id!==S.me?`<button class="btn small ${p.role==='admin'?'primary':''}" data-act="set-role" data-id="${esc(p.id)}" data-role="${p.role==='admin'?'member':'admin'}" title="App-Master darf alles, auch Rollen vergeben">${p.role==='admin'?'Master entziehen':'Zum Master machen'}</button>`:''}
           ${(p.role!=='admin'||master)&&p.id!==S.me?`<button class="btn ghost small" data-act="set-role" data-id="${esc(p.id)}" data-role="pending">Sperren</button>`:''}`}
      ${p.id!==S.me&&(p.role!=='admin'||master)?delBtn('member',p.id,'Entfernen'):''}
    </div>
  </div>`;};
  return `<div class="panel"><div class="panel-head"><div><h2>Warten auf Freigabe</h2><p class="sub">Neue Registrierungen. Prüfe, ob die Person zur Wehr gehört, bevor du sie freigibst.</p></div></div>
    ${waiting.length?waiting.map(row).join(''):'<div class="empty"><strong>Niemand wartet.</strong>Neue Kameraden registrieren sich über den Link der App und erscheinen dann hier.</div>'}</div>
    <div class="panel"><div class="panel-head"><div><h2>Mitglieder & Rollen</h2><p class="sub">${master?'Funktion antippen zum Vergeben oder Entziehen. Mehrere Funktionen pro Person sind möglich.':'Rollen vergibt der App-Master.'}</p></div><span class="count">${rest.length} Personen</span></div>
    <details class="role-help"><summary>Wer darf was?</summary><div class="role-grid">
      <div><b>Mitglied</b><span>alles lesen, zu-/absagen, reservieren, Eis, Mängel melden, Arbeitsdienste, Auslagen, Kleiderkammer-Bedarf</span></div>
      <div><b>Gruppenführer</b><span>+ Dienstpläne, Neues, Veranstaltungen, Übungsdoku, Führung (Fristen, Beteiligung, Verfügbarkeit), Aufgaben, Wissenstest-Fragen</span></div>
      <div><b>Gerätewart</b><span>+ Mängel bearbeiten, Fahrzeuge/Material, Verantwortliche, Kleiderkammer & Lager, Neues</span></div>
      <div><b>Kassier</b><span>+ alle privaten Ausgaben sehen und erstatten</span></div>
      <div><b>Kommandant</b><span>alles von Gruppenführer und Gerätewart + Organigramm, Mitglieder freigeben und entfernen</span></div>
      <div><b>👑 App-Master</b><span>darf alles, auch Rollen und Master-Rechte vergeben</span></div>
    </div></details>
    ${rest.map(row).join('')}</div>`;
}

/* ---------- Übungsdoku ---------- */
function ensureUrls(paths){
  const need=paths.filter(p=>p && !S.urls[p] && !S.urlPending.has(p));
  if(!need.length) return;
  need.forEach(p=>S.urlPending.add(p));
  sb.storage.from('listen').createSignedUrls(need, 3600).then(({data})=>{
    (data||[]).forEach(x=>{ if(x.signedUrl) S.urls[x.path]=x.signedUrl; });
    need.forEach(p=>{ if(!S.urls[p]) S.urls[p]='missing'; S.urlPending.delete(p); });
    renderDocs();
  });
}
function renderDocs(){
  const docs=D('docs');
  const open=docs.filter(d=>d.status!=='eingepflegt').length;
  $('#doc-count').textContent=`${open} offen · ${docs.length-open} eingepflegt`;
  document.querySelectorAll('#doc-filters .filter').forEach(f=>f.setAttribute('aria-pressed',String(f.dataset.f===S.docFilter)));
  const list=docs.filter(d=>S.docFilter==='alle'||(S.docFilter==='eingepflegt'?d.status==='eingepflegt':d.status!=='eingepflegt'))
    .sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.createdAt||'').localeCompare(a.createdAt||''));
  const el=$('#doc-list');
  if(!S.loaded.docs){ el.innerHTML=`<div class="panel"><div class="empty">Lade Übungen …</div></div>`; return; }
  if(!list.length){
    el.innerHTML=`<div class="panel"><div class="empty"><strong>${S.docFilter==='offen'?'Alles eingepflegt. Sauber!':'Keine Listen in dieser Ansicht.'}</strong>${docs.length?'':(mgr()?'Lade oben das Foto einer Anwesenheitsliste hoch. Sie landet hier, bis sie im FW-Portal eingepflegt ist.':'Sobald Anwesenheitslisten hochgeladen sind, erscheinen sie hier.')}</div></div>`;
    return;
  }
  if(S.view==='doc') ensureUrls(list.map(d=>d.photo_path));
  el.innerHTML=`<div class="cards">${list.map(d=>{
    const isDone=d.status==='eingepflegt'; const url=S.urls[d.photo_path];
    return `<article class="card ${isDone?'':'is-open'}">
      <button class="thumb" data-act="zoom" data-path="${esc(d.photo_path||'')}" aria-label="Liste vergrößern">
        ${url&&url!=='missing'?`<img src="${esc(url)}" alt="Anwesenheitsliste ${esc(d.title)}" loading="lazy">`:`<span class="ph">${url==='missing'||!d.photo_path?'Bild nicht verfügbar':'Lade Bild …'}</span>`}
      </button>
      <div class="card-body">
        <div style="display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;justify-content:space-between">
          <span class="when">${esc(fmtDate(d.date))}</span>
          <span class="chip ${isDone?'done':'open'}">${isDone?'eingepflegt':'muss eingepflegt werden'}</span>
        </div>
        <h3>${esc(d.title)}</h3>
        ${d.note?`<p class="note">${esc(d.note)}</p>`:''}
        <div class="meta">Hochgeladen von ${who(d.by)}${isDone&&d.doneBy?`<br>Eingepflegt von ${who(d.doneBy)}${d.doneAt?' am '+esc(new Date(d.doneAt).toLocaleDateString('de-DE')):''}`:''}</div>
        ${mgr()?`<div class="card-actions">
          <button class="btn ${isDone?'':'primary'}" data-act="toggle-doc" data-id="${esc(d.id)}">${isDone?'Zurück auf offen':'Als eingepflegt markieren'}</button>
          ${delBtn('docs',d.id)}
        </div>`:''}
      </div>
    </article>`;
  }).join('')}</div>`;
}

/* =====================================================================
   v6: Meine Seite · Abwesenheiten · Kalender-Abo · Kleiderkammer · Wissenstest
   ===================================================================== */
const ABS = {urlaub:'Urlaub', schicht:'Schicht / Arbeit', beruflich:'Beruflich unterwegs', krank:'Krank', sonstiges:'Sonstiges'};
const myName = () => (S.profile&&S.profile.name)||'';
const absOn = (date,uid) => D('absences').filter(a=>a.starts<=date && a.ends>=date && (!uid||a.userId===uid));
const fmtSpan = (a,b) => a===b?fmtDay(a):`${fmtDay(a)} – ${fmtDay(b)}`;

/* ---------- Kalender-Abo ---------- */
function myCalToken(){ const r=D('cal_tokens').find(x=>x.userId===S.me); return r&&r.token; }
async function ensureCalToken(){
  if(myCalToken()) return myCalToken();
  const {error}=await sb.from('cal_tokens').insert({user_id:S.me});
  if(error && !/duplicate/i.test(error.message)){ toast(errText(error)); return null; }
  await load('cal_tokens'); return myCalToken();
}
function calUrl(g,scheme='https'){
  const tok=myCalToken(); if(!tok) return '';
  const base=CFG.supabaseUrl.replace(/^https?:\/\//,'')+'/functions/v1/ical';
  return `${scheme}://${base}?t=${tok}&g=${g}`;
}
function calBlock(){
  const tok=myCalToken();
  if(!tok) return `<div class="me-card"><h3>📅 Dienstplan im Handy-Kalender</h3><p class="note">Einmal abonnieren – alle Dienste und Veranstaltungen erscheinen automatisch in deinem Kalender und bleiben aktuell.</p><button class="btn primary" data-act="cal-create">Kalender-Link erstellen</button></div>`;
  const opt=(g,n)=>`<div class="cal-opt"><b>${n}</b><div class="actions"><a class="btn primary small" href="${esc(calUrl(g,'webcal'))}">📅 Abonnieren</a><button class="btn ghost small" data-act="copy" data-v="${esc(calUrl(g))}">Link kopieren</button></div></div>`;
  return `<div class="me-card"><h3>📅 Dienstplan im Handy-Kalender</h3>
    <p class="note">„Abonnieren“ antippen – iPhone und Mac fragen dann, ob der Kalender hinzugefügt werden soll. Bei <b>Google Kalender</b>: „Link kopieren“ und am Computer unter <i>Weitere Kalender → Per URL</i> einfügen. Der Kalender aktualisiert sich selbst.</p>
    ${opt('aktive','Aktive + Veranstaltungen')}${opt('jugend','Jugend + Veranstaltungen')}${opt('alle','Alles (Aktive, Jugend, Veranstaltungen)')}
    <p class="sub" style="margin:8px 0 0">Der Link ist persönlich – bitte nicht weitergeben.</p></div>`;
}

/* ---------- Abwesenheiten ---------- */
function absForm(){
  const t=today();
  return `<form class="inline" data-form="absence">
    <label for="ab-from">Von<input type="date" id="ab-from" required value="${t}"></label>
    <label for="ab-to">Bis<input type="date" id="ab-to" required value="${t}"></label>
    <label for="ab-why">Grund<select id="ab-why">${Object.entries(ABS).map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select></label>
    <label for="ab-note">Notiz<input id="ab-note" maxlength="140" placeholder="optional, z. B. nur tagsüber"></label>
    <div class="form-actions"><button class="btn primary" type="submit">Abwesenheit eintragen</button></div>
    ${errP('absence')}</form>`;
}
function absRow(a,withName){
  const t=today(); const now=a.starts<=t&&a.ends>=t;
  return `<div class="row ${a.ends<t?'past':''}"><div class="info">
      <div style="display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center"><h3 style="font-size:16px">${withName?esc(nameOf(a.userId))+' · ':''}${esc(fmtSpan(a.starts,a.ends))}</h3><span class="chip ${now?'busy':'open'}">${now?'jetzt abwesend':esc(ABS[a.reason]||a.reason)}</span></div>
      <p class="note">${esc(ABS[a.reason]||a.reason)}${a.note?' · '+esc(a.note):''}</p></div>
    <div class="actions">${(a.userId===S.me||mgr())?delBtn('absences',a.id,'Entfernen'):''}</div></div>`;
}
function leadAvail(){
  const t=today(); const in14=addDays(t,14);
  const cur=D('absences').filter(a=>a.ends>=t).sort((a,b)=>a.starts.localeCompare(b.starts));
  const todayAbs=absOn(t);
  const days=[...Array(14)].map((_,i)=>addDays(t,i));
  const ppl=people();
  let html=`<div class="panel"><div class="panel-head"><div><h3>Heute verfügbar</h3><p class="sub">${ppl.length-new Set(todayAbs.map(a=>a.userId)).size} von ${ppl.length} Mitgliedern · Abwesenheiten tragen die Kameraden auf „Meine Seite“ selbst ein.</p></div></div>
    <div class="avail-strip">${days.map(d=>{const n=new Set(absOn(d).map(a=>a.userId)).size; const duty=D('duties').some(x=>x.date===d);
      return `<div class="av-day ${n?'has':''}" title="${esc(fmtDayLong(d))}: ${n} abwesend"><span class="wd">${esc(new Date(d+'T00:00').toLocaleDateString('de-DE',{weekday:'short'}).replace('.',''))}</span><span class="d">${new Date(d+'T00:00').getDate()}</span><span class="n">${n?'−'+n:'✓'}</span>${duty?'<span class="dutydot" title="Dienst"></span>':''}</div>`;}).join('')}</div>`;
  html+= cur.length?cur.map(a=>absRow(a,true)).join(''):`<div class="empty"><strong>Niemand hat sich abgemeldet.</strong>Alle sind in den nächsten Wochen verfügbar.</div>`;
  return html+'</div>';
}
function addDays(d,n){ const x=new Date(d+'T00:00'); x.setDate(x.getDate()+n); return `${x.getFullYear()}-${pad(x.getMonth()+1)}-${pad(x.getDate())}`; }

/* ---------- Meine Seite ---------- */
function renderMe(){
  const t=today(), n=nowISO();
  const duties=D('duties').filter(d=>d.date>=t).sort((a,b)=>(a.date+(a.time||'')).localeCompare(b.date+(b.time||''))).slice(0,6);
  const myQ=D('member_quals').filter(q=>q.userId===S.me).map(q=>({q,t:D('qual_types').find(x=>x.id===q.typeId)})).filter(x=>x.t&&x.t.kind==='frist');
  const tasks=(orgPersons().find(([p])=>p.toLowerCase()===myName().toLowerCase())||[null,[]])[1];
  const myRes=D('reservations').filter(r=>r.by===S.me&&r.to>n).sort((a,b)=>a.from.localeCompare(b.from));
  const myEx=D('expenses').filter(x=>x.userId===S.me&&x.status==='offen');
  const myCl=D('clothing_requests').filter(x=>x.userId===S.me&&x.status!=='ausgegeben'&&x.status!=='abgelehnt');
  const myAbs=D('absences').filter(a=>a.userId===S.me&&a.ends>=t).sort((a,b)=>a.starts.localeCompare(b.starts));
  const best=c=>{const r=D('quiz_results').filter(x=>x.userId===S.me&&x.cat===c); return r.length?Math.max(...r.map(x=>Math.round(100*x.score/x.total))):null;};
  const absToday=absOn(t,S.me).length>0;
  let html=`<div class="panel me-head"><div class="panel-head"><div style="display:flex;gap:14px;align-items:center"><span class="av big">${esc(initials(myName()||'?'))}</span><div><h2>Hallo ${esc((myName().split(' ')[0])||'')}!</h2><p class="sub">${esc(roleLabel(S.profile))}${absToday?' · <b>heute abgemeldet</b>':''}</p></div></div>
    <div class="actions"><button class="btn ghost" data-goto="push">🔔 Benachrichtigungen</button></div></div></div>
  <div class="me-grid">`;
  // Dienste
  html+=`<div class="me-card span2"><h3>Meine nächsten Dienste</h3>${duties.length?duties.map(d=>{const my=D('duty_rsvp').find(r=>r.dutyId===d.id&&r.userId===S.me); const ab=absOn(d.date,S.me).length;
      return `<div class="me-duty">${dateBox(d.date)}<div class="info"><b>${esc(d.topic)}</b><span class="sub">${esc(d.group==='jugend'?'Jugend':'Aktive')} · ${esc(d.time||'')} Uhr${d.place?' · '+esc(d.place):''}${ab?' · <span class="chip busy">abgemeldet</span>':''}</span>
        <div class="rsvp-btns sm">${Object.entries(RSVP).map(([k,v])=>`<button class="rsvp-btn ${k}" data-act="rsvp" data-id="${esc(d.id)}" data-status="${k}" aria-pressed="${my&&my.status===k?'true':'false'}">${v.i} ${v.n}</button>`).join('')}</div></div></div>`;}).join(''):'<p class="note">Keine kommenden Dienste.</p>'}</div>`;
  // Abwesenheit
  html+=`<div class="me-card span2"><h3>Abwesenheit melden</h3><p class="note">Urlaub, Schicht oder krank? Nur du und die Führung sehen das.</p>${absForm()}${myAbs.length?`<div class="me-list">${myAbs.map(a=>absRow(a,false)).join('')}</div>`:''}</div>`;
  const myTodos=D('todos').filter(x=>x.assignee===S.me&&!x.done).sort(todoSort);
  if(myTodos.length) html+=`<div class="me-card span2"><h3>Meine Aufgaben (To-do)</h3><div class="todo-wrap flat">${myTodos.map(x=>todoItem(x,true)).join('')}</div></div>`;
  // Fristen
  html+=`<div class="me-card"><h3>Meine Fristen</h3>${myQ.length?myQ.map(({q,t})=>{const s=fristState(q);return `<div class="me-line"><span><span class="dot-st ${s.c}"></span>${esc(t.name)}</span><span class="sub">${q.expires?'bis '+esc(fmtDate(q.expires)):''} · ${esc(s.n)}</span></div>`;}).join(''):'<p class="note">Keine Fristen hinterlegt.</p>'}</div>`;
  // Aufgaben
  html+=`<div class="me-card"><h3>Meine Aufgaben</h3>${tasks.length?`<div class="ptasks">${tasks.map(x=>`<button class="tchip hue${x.hue??'r'}" data-act="org-open" data-id="${esc((x.area||x.n).id)}">${esc(x.n.role)}</button>`).join('')}</div>`:'<p class="note">Im Organigramm ist dir (noch) keine Aufgabe zugeordnet.</p>'}</div>`;
  // Offenes
  html+=`<div class="me-card"><h3>Offen bei mir</h3>
    <div class="me-line"><span>Reservierungen</span><span class="sub">${myRes.length?esc(myRes.map(r=>r.itemName).slice(0,3).join(', ')):'keine'}</span></div>
    <div class="me-line link" data-goto="expenses"><span>Auslagen offen</span><span class="sub">${myEx.length?myEx.length+' · '+eur(myEx.reduce((s,x)=>s+(+x.amount||0),0)):'keine'} ›</span></div>
    <div class="me-line link" data-goto="clothing"><span>Kleiderkammer</span><span class="sub">${myCl.length?myCl.length+' Anfrage(n)':'nichts offen'} ›</span></div>
    <div class="me-line link" data-goto="quiz"><span>Wissenstest-Training</span><span class="sub">${best('wissenstest')!=null?'Bestwert '+best('wissenstest')+' %':'noch nicht geübt'} ›</span></div></div>`;
  html+=calBlock();
  return loadingOr(['duties','absences'], html+'</div>');
}

/* ---------- Kleiderkammer ---------- */
const CLOTH_SIZES=[['jacke','Einsatzjacke'],['hose','Einsatzhose'],['stiefel','Stiefel (Schuhgröße)'],['handschuhe','Handschuhe'],['helm','Helm (Kopfumfang)'],['shirt','T-Shirt / Polo'],['pullover','Pullover / Softshell']];
const CLOTH_ITEMS=['Einsatzjacke','Einsatzhose','Stiefel','Handschuhe','Helm','Flammschutzhaube','T-Shirt','Poloshirt','Pullover / Softshell','Dienstkleidung / Uniform','Mütze / Cap','Sonstiges'];
const CLOTH_MAP={'Einsatzjacke':'jacke','Einsatzhose':'hose','Stiefel':'stiefel','Handschuhe':'handschuhe','Helm':'helm','T-Shirt':'shirt','Poloshirt':'shirt','Pullover / Softshell':'pullover'};
const CST={offen:{n:'offen',c:'open'},bestellt:{n:'bestellt',c:'ice'},ausgegeben:{n:'ausgegeben',c:'done'},abgelehnt:{n:'abgelehnt',c:'busy'}};
const mySizes=()=>((D('clothing_sizes').find(x=>x.userId===S.me)||{}).sizes)||{};
function clothRow(x,admin){
  const st=CST[x.status]||CST.offen;
  return `<div class="row"><div class="info"><div style="display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center"><h3 style="font-size:16px">${+x.qty||1}× ${esc(x.item)}${x.size?' · Gr. '+esc(x.size):''}</h3><span class="chip ${st.c}">${st.n}</span></div>
    <p class="note">${admin?esc(nameOf(x.userId))+' · ':''}${esc(fmtDay(String(x.createdAt||'').slice(0,10)))}${x.note?' · '+esc(x.note):''}</p></div>
    <div class="actions">${admin?`${x.status==='offen'?`<button class="btn small" data-act="cloth-st" data-id="${esc(x.id)}" data-status="bestellt">Bestellt</button>`:''}<button class="btn small primary" data-act="cloth-st" data-id="${esc(x.id)}" data-status="ausgegeben">Ausgegeben</button><button class="btn ghost small" data-act="cloth-st" data-id="${esc(x.id)}" data-status="abgelehnt">Ablehnen</button>`:''}${(x.userId===S.me&&x.status==='offen')||canGear()?delBtn('clothing_requests',x.id,'Löschen'):''}</div></div>`;
}

/* ---------- Wissenstest & Leistungsabzeichen ---------- */
const QCAT={wissenstest:'Wissenstest',leistungsabzeichen:'Leistungsabzeichen'};
S.quiz=null;
function shuffle(a){ a=[...a]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function startQuiz(cat){
  const qs=shuffle(D('quiz_questions').filter(q=>q.cat===cat)).slice(0,10);
  if(!qs.length){ toast('Für diesen Bereich gibt es noch keine Fragen.'); return; }
  S.quiz={cat,ids:qs.map(q=>q.id),i:0,picked:null,score:0,order:qs.map(q=>shuffle(q.options.map((_,k)=>k)))};
}
function renderQuiz(){
  let html=`<div class="panel"><div class="panel-head"><div><h2>Wissenstest & Leistungsabzeichen</h2><p class="sub">Üben auf dem Handy – 10 zufällige Fragen pro Runde.</p></div>
    ${mgr()?`<div class="actions"><button class="btn ${S.quizAdmin?'':'ghost'}" data-act="quiz-admin">${S.quizAdmin?'Fertig':'✎ Fragen verwalten'}</button></div>`:''}</div>`;
  if(S.quizAdmin&&mgr()) return loadingOr(['quiz_questions'], html+quizAdmin()+'</div>');
  const Q=S.quiz;
  if(Q && Q.i<Q.ids.length){
    const q=D('quiz_questions').find(x=>x.id===Q.ids[Q.i]); if(!q){ S.quiz=null; return renderQuiz(); }
    const ord=Q.order[Q.i], done=Q.picked!=null;
    html+=`<div class="quiz"><div class="quiz-top"><span class="chip ice">${esc(QCAT[Q.cat])}</span><span class="count">Frage ${Q.i+1} von ${Q.ids.length} · ${Q.score} richtig</span></div>
      <div class="quiz-bar"><span style="width:${Math.round(100*Q.i/Q.ids.length)}%"></span></div>
      <h3 class="quiz-q">${esc(q.question)}</h3>
      <div class="quiz-opts">${ord.map(k=>{const cls=!done?'':(k===q.correct?'right':(k===Q.picked?'wrong':'dim'));return `<button class="quiz-opt ${cls}" data-act="quiz-pick" data-id="${k}" ${done?'disabled':''}>${esc(q.options[k])}</button>`;}).join('')}</div>
      ${done?`<div class="quiz-exp ${Q.picked===q.correct?'ok':'no'}"><b>${Q.picked===q.correct?'Richtig! 🎉':'Leider falsch.'}</b> ${esc(q.explanation||'')}</div>
        <div class="form-actions"><button class="btn primary" data-act="quiz-next">${Q.i+1<Q.ids.length?'Nächste Frage →':'Auswertung'}</button></div>`:''}
      <button class="linkbtn" data-act="quiz-stop" style="margin-top:14px">Runde abbrechen</button></div>`;
    return html+'</div>';
  }
  if(Q && Q.i>=Q.ids.length){
    const pct=Math.round(100*Q.score/Q.ids.length);
    html+=`<div class="quiz quiz-end"><div class="quiz-score ${pct>=80?'ok':pct>=50?'mid':'no'}">${pct} %</div><h3>${Q.score} von ${Q.ids.length} richtig</h3>
      <p class="note">${pct===100?'Perfekt – du bist bereit! 💪':pct>=80?'Sehr gut, fast alles sitzt.':pct>=50?'Solide – noch eine Runde?':'Dranbleiben, Übung macht den Meister!'}</p>
      <div class="form-actions" style="justify-content:center"><button class="btn primary" data-act="quiz-start" data-id="${Q.cat}">Nochmal üben</button><button class="btn ghost" data-act="quiz-stop">Zur Auswahl</button></div></div>`;
    return html+'</div>';
  }
  const cnt=c=>D('quiz_questions').filter(q=>q.cat===c).length;
  const mine=c=>D('quiz_results').filter(r=>r.userId===S.me&&r.cat===c);
  html+=`<div class="quiz-pick">${Object.entries(QCAT).map(([c,n])=>{const r=mine(c); const best=r.length?Math.max(...r.map(x=>Math.round(100*x.score/x.total))):null;
    return `<button class="quiz-card" data-act="quiz-start" data-id="${c}"><span class="qc-ico">${c==='wissenstest'?'🧠':'🏅'}</span><span class="qc-name">${n}</span><span class="sub">${cnt(c)} Fragen${best!=null?` · dein Bestwert ${best} %`:''}</span><span class="btn primary small">Los geht’s</span></button>`;}).join('')}</div>
    <p class="sub" style="padding:0 20px 18px">Fragen ohne Gewähr – Gruppenführer, Kommandant und App-Master können Fragen ergänzen und korrigieren.</p>`;
  if(mgr()){
    const res=D('quiz_results'); const by={};
    res.forEach(r=>{const k=r.userId+'|'+r.cat; const p=Math.round(100*r.score/r.total); if(!by[k]||p>by[k].p) by[k]={p,r,n:(by[k]?by[k].n:0)}; by[k].n=(by[k].n||0)+1;});
    const rows=Object.values(by).sort((a,b)=>nameOf(a.r.userId).localeCompare(nameOf(b.r.userId),'de'));
    html+=`<div class="day-head"><span class="when">Übungsstand der Mannschaft</span><span class="count">nur Führung</span></div>`+
      (rows.length?rows.map(x=>`<div class="me-line" style="padding:10px 20px"><span>${esc(nameOf(x.r.userId))} · ${esc(QCAT[x.r.cat]||x.r.cat)}</span><span class="sub">Bestwert <b>${x.p} %</b> · ${x.n} Runde(n)</span></div>`).join(''):`<div class="empty" style="padding:16px 20px">Noch hat niemand geübt.</div>`);
  }
  return loadingOr(['quiz_questions'], html+'</div>');
}
function quizAdmin(){
  const qs=[...D('quiz_questions')].sort((a,b)=>a.cat.localeCompare(b.cat)||(a.createdAt||'').localeCompare(b.createdAt||''));
  return `<form class="inline" data-form="quiz-q" style="margin:14px 20px">
      <label for="qq-cat">Bereich<select id="qq-cat">${Object.entries(QCAT).map(([k,n])=>`<option value="${k}">${n}</option>`).join('')}</select></label>
      <label for="qq-q" class="span-all">Frage<input id="qq-q" required maxlength="200"></label>
      ${[0,1,2,3].map(i=>`<label for="qq-o${i}">Antwort ${String.fromCharCode(65+i)}${i<2?'':' (optional)'}<input id="qq-o${i}" maxlength="120" ${i<2?'required':''}></label>`).join('')}
      <label for="qq-ok">Richtig ist<select id="qq-ok">${[0,1,2,3].map(i=>`<option value="${i}">Antwort ${String.fromCharCode(65+i)}</option>`).join('')}</select></label>
      <label for="qq-exp" class="span-all">Erklärung<input id="qq-exp" maxlength="240" placeholder="wird nach dem Antworten angezeigt"></label>
      <div class="form-actions"><button class="btn primary" type="submit">Frage hinzufügen</button></div>${errP('quiz')}</form>
    ${qs.map(q=>`<div class="row"><div class="info"><span class="chip ice">${esc(QCAT[q.cat])}</span><h3 style="font-size:15px;margin-top:6px">${esc(q.question)}</h3><p class="note">✓ ${esc(q.options[q.correct]||'')}</p></div><div class="actions">${delBtn('quiz_questions',q.id)}</div></div>`).join('')}`;
}
async function quizPick(k){
  const Q=S.quiz; if(!Q||Q.picked!=null) return;
  const q=D('quiz_questions').find(x=>x.id===Q.ids[Q.i]); Q.picked=k; if(q&&k===q.correct) Q.score++;
  render();
}
async function quizNext(){
  const Q=S.quiz; if(!Q) return; Q.i++; Q.picked=null;
  if(Q.i>=Q.ids.length) await run('quiz_results', sb.from('quiz_results').insert({cat:Q.cat,score:Q.score,total:Q.ids.length}));
  render(); window.scrollTo({top:0,behavior:'smooth'});
}

/* ---------- Kleiderkammer v2: Anfragen · Ausgegeben · Lager · Größen ---------- */
const stockOf=(item,size)=>D('clothing_stock').find(s=>s.item===item&&(s.size||'')===(size||''));
function renderClothing(){
  const sz=mySizes(); const mine=D('clothing_requests').filter(x=>x.userId===S.me).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  const myGear=D('clothing_issued').filter(x=>x.userId===S.me&&!x.returned_on).sort((a,b)=>a.item.localeCompare(b.item,'de'));
  let html=`<div class="panel"><div class="panel-head"><div><h2>Kleiderkammer</h2><p class="sub">Größen eintragen, Bedarf melden und sehen, welche Ausrüstung du hast.</p></div></div>
    <div class="me-grid" style="padding:16px 20px 20px">
    <div class="me-card"><h3>Meine Größen</h3><form class="inline sizes" data-form="sizes">${CLOTH_SIZES.map(([k,n])=>`<label for="sz-${k}">${n}<input id="sz-${k}" maxlength="12" value="${esc(sz[k]||'')}" placeholder="–"></label>`).join('')}
      <div class="form-actions"><button class="btn primary" type="submit">Größen speichern</button></div></form></div>
    <div class="me-card"><h3>Ich brauche …</h3><form class="inline" data-form="cloth-req">
      <label for="cr-item">Was<select id="cr-item">${CLOTH_ITEMS.map(i=>`<option>${esc(i)}</option>`).join('')}</select></label>
      <label for="cr-size">Größe<input id="cr-size" maxlength="20" value="${esc(sz.jacke||'')}" placeholder="z. B. 52 oder L"></label>
      <label for="cr-qty">Anzahl<input id="cr-qty" type="number" min="1" max="20" value="1"></label>
      <label for="cr-note">Hinweis<input id="cr-note" maxlength="140" placeholder="z. B. alte Jacke gerissen"></label>
      <div class="form-actions"><button class="btn primary" type="submit">Bedarf melden</button></div>${errP('cloth')}</form></div>
    <div class="me-card span2"><h3>Meine Ausrüstung</h3>${myGear.length?myGear.map(g=>gearLine(g,false)).join(''):'<p class="note">Noch keine Ausgabe eingetragen.</p>'}</div>
    </div>`;
  if(mine.length) html+=`<div class="day-head"><span class="when">Meine Anfragen</span></div>`+mine.map(x=>clothRow(x,false)).join('');
  html+='</div>';
  if(canGear()) html+=clothAdmin();
  return loadingOr(['clothing_requests','clothing_sizes','clothing_issued','clothing_stock'], html);
}
function gearLine(g,admin){
  const due=g.replace_by?daysUntil(g.replace_by):null;
  const chip=due==null?'':due<0?`<span class="chip busy">Austausch überfällig</span>`:due<=30?`<span class="chip open">Austausch in ${due} Tg.</span>`:`<span class="chip done">bis ${esc(fmtDate(g.replace_by))}</span>`;
  return `<div class="gear ${g.returned_on?'past':''}"><div class="info"><b>${esc(g.item)}${g.size?' · Gr. '+esc(g.size):''}</b>${chip}
      <span class="sub">${admin?esc(nameOf(g.userId))+' · ':''}ausgegeben ${esc(fmtDate(g.issued_on))}${g.inv_no?' · Inv.-Nr. '+esc(g.inv_no):''}${g.note?' · '+esc(g.note):''}${g.returned_on?' · zurück am '+esc(fmtDate(g.returned_on)):''}</span></div>
    ${admin?`<div class="actions">${g.returned_on?'':`<button class="btn small" data-act="gear-return" data-id="${esc(g.id)}">Zurückgegeben</button>`}${delBtn('clothing_issued',g.id,'Löschen')}</div>`:''}</div>`;
}
function clothAdmin(){
  const tabs=[['req','Anfragen'],['issued','Ausgegeben'],['stock','Lager'],['sizes','Größen']];
  const tab=S.clothTab||'req';
  const openReq=D('clothing_requests').filter(x=>x.status==='offen'||x.status==='bestellt');
  let html=`<div class="panel" style="margin-top:14px"><div class="panel-head"><div><h2>Verwaltung</h2><p class="sub">Für Gerätewart, Kommandant und App-Master.</p></div></div>
    <div class="org-tools"><div class="filters">${tabs.map(([k,n])=>`<button class="filter" data-act="cloth-tab" data-id="${k}" aria-pressed="${tab===k}">${n}${k==='req'&&openReq.length?` (${openReq.length})`:''}</button>`).join('')}</div></div>`;
  if(tab==='req'){
    const sum={}; openReq.filter(x=>x.status==='offen').forEach(x=>{const k=x.item+'|'+(x.size||''); sum[k]=(sum[k]||0)+(+x.qty||1);});
    html+=`<div class="day-head"><span class="when">Bestellliste (offen)</span>${Object.keys(sum).length?`<button class="btn ghost small" data-act="copy" data-v="${esc('Bestellung Kleiderkammer FF Nonnenhorn:\n'+Object.entries(sum).map(([k,q])=>{const [i,s]=k.split('|');const st=stockOf(i,s);const need=Math.max(0,q-(st?+st.qty:0));return need?`${need}× ${i}${s?' Gr. '+s:''}`:'';}).filter(Boolean).join('\n'))}">Bestellliste kopieren</button>`:''}</div>`+
      (Object.keys(sum).length?`<div class="order-list">${Object.entries(sum).sort().map(([k,q])=>{const [i,s]=k.split('|');const st=stockOf(i,s);const have=st?+st.qty:0;
        return `<span class="order-item"><b>${q}×</b> ${esc(i)}${s?' · Gr. '+esc(s):''}${have?` <span class="chip done">${Math.min(have,q)} im Lager</span>`:''}</span>`;}).join('')}</div>`:`<div class="empty" style="padding:16px 20px">Nichts zu bestellen.</div>`)+
      (openReq.length?openReq.map(x=>clothRow(x,true)).join(''):'');
  } else if(tab==='issued'){
    const f=S.gearPerson||'';
    const list=D('clothing_issued').filter(g=>(!f||g.userId===f)&&(S.showPast.gearRet||!g.returned_on)).sort((a,b)=>nameOf(a.userId).localeCompare(nameOf(b.userId),'de')||a.item.localeCompare(b.item,'de'));
    html+=`<form class="inline" data-form="gear" style="margin:14px 20px">
        <label for="gr-user">Person<select id="gr-user">${personOpts(f)}</select></label>
        <label for="gr-item">Was<select id="gr-item">${CLOTH_ITEMS.map(i=>`<option>${esc(i)}</option>`).join('')}</select></label>
        <label for="gr-size">Größe<input id="gr-size" maxlength="20"></label>
        <label for="gr-inv">Inventar-Nr.<input id="gr-inv" maxlength="40" placeholder="optional"></label>
        <label for="gr-date">Ausgegeben am<input id="gr-date" type="date" value="${today()}"></label>
        <label for="gr-repl">Austausch fällig am<input id="gr-repl" type="date" title="z. B. Helm laut Hersteller"></label>
        <label for="gr-note" class="span-all">Notiz<input id="gr-note" maxlength="140" placeholder="optional"></label>
        <label class="span-all check"><input type="checkbox" id="gr-stock" checked> vom Lagerbestand abziehen</label>
        <div class="form-actions"><button class="btn primary" type="submit">Ausgabe eintragen</button></div>${errP('gear')}</form>
      <div class="org-tools"><select id="gear-filter" aria-label="Nach Person filtern"><option value="">Alle Personen</option>${personOpts(f)}</select>
        <label class="check"><input type="checkbox" data-act="toggle-past" data-key="gearRet" ${S.showPast.gearRet?'checked':''}> auch Zurückgegebenes</label></div>
      ${list.length?`<div class="gear-list">${list.map(g=>gearLine(g,true)).join('')}</div>`:`<div class="empty" style="padding:16px 20px">Noch nichts ausgegeben.</div>`}`;
  } else if(tab==='stock'){
    const st=[...D('clothing_stock')].sort((a,b)=>a.item.localeCompare(b.item,'de')||String(a.size).localeCompare(String(b.size),'de',{numeric:true}));
    html+=`<form class="inline" data-form="stock" style="margin:14px 20px">
        <label for="st-item">Was<select id="st-item">${CLOTH_ITEMS.map(i=>`<option>${esc(i)}</option>`).join('')}</select></label>
        <label for="st-size">Größe<input id="st-size" maxlength="20"></label>
        <label for="st-qty">Anzahl dazu<input id="st-qty" type="number" min="1" max="999" value="1"></label>
        <div class="form-actions"><button class="btn primary" type="submit">Zum Lager hinzufügen</button></div>${errP('stock')}</form>
      ${st.length?st.map(s=>`<div class="row"><div class="info"><h3 style="font-size:16px">${esc(s.item)}${s.size?' · Gr. '+esc(s.size):''}</h3></div>
        <div class="actions stock-ctl"><button class="btn ghost small" data-act="stock-step" data-id="${esc(s.id)}" data-v="-1" aria-label="weniger">−</button><b class="${+s.qty?'':'zero'}">${+s.qty}</b><button class="btn ghost small" data-act="stock-step" data-id="${esc(s.id)}" data-v="1" aria-label="mehr">+</button>${delBtn('clothing_stock',s.id,'Entfernen')}</div></div>`).join(''):`<div class="empty" style="padding:16px 20px">Noch kein Lagerbestand erfasst.</div>`}`;
  } else {
    html+=`<div class="qtable-wrap" style="padding:14px 20px"><table class="qtable"><thead><tr><th>Name</th>${CLOTH_SIZES.map(([,n])=>`<th>${esc(n.split(' ')[0])}</th>`).join('')}</tr></thead><tbody>${people().map(p=>{const s=((D('clothing_sizes').find(x=>x.userId===p.id)||{}).sizes)||{};return `<tr><th>${esc(p.name||'')}</th>${CLOTH_SIZES.map(([k])=>`<td>${esc(s[k]||'–')}</td>`).join('')}</tr>`;}).join('')}</tbody></table></div>`;
  }
  return html+'</div>';
}
async function clothIssueFromRequest(x){
  const st=stockOf(x.item,x.size);
  if(st && +st.qty>0) await sb.from('clothing_stock').update({qty:Math.max(0,+st.qty-(+x.qty||1)),updated_at:new Date().toISOString()}).eq('id',st.id);
  const rows=[...Array(Math.max(1,+x.qty||1))].map(()=>({user_id:x.userId,item:x.item,size:x.size||'',issued_on:today()}));
  await sb.from('clothing_issued').insert(rows);
  await Promise.all([load('clothing_stock'),load('clothing_issued')]);
}

/* ---------- Aufgabenlisten (To-Do) ---------- */
const todoWho=t=>t.assignee?nameOf(t.assignee):(t.assignee_txt||'');
const canTick=t=>mgr()||t.assignee===S.me;
function dueChip(t){
  if(!t.due||t.done) return t.due?`<span class="sub">bis ${esc(fmtDay(t.due))}</span>`:'';
  const n=daysUntil(t.due);
  return `<span class="chip ${n<0?'busy':n<=2?'open':'free'}">${n<0?`${-n} Tg. überfällig`:n===0?'heute fällig':n===1?'morgen fällig':'bis '+esc(fmtDay(t.due))}</span>`;
}
function todoItem(t,showList){
  const lst=showList?D('todo_lists').find(l=>l.id===t.list_id):null;
  return `<div class="todo ${t.done?'done':''}">
    <button class="tick" data-act="todo-toggle" data-id="${esc(t.id)}" aria-pressed="${!!t.done}" ${canTick(t)?'':'disabled'} aria-label="${t.done?'Wieder öffnen':'Erledigt'}">${t.done?'✓':''}</button>
    <div class="info"><span class="tt">${esc(t.title)}</span>
      <span class="meta">${todoWho(t)?`<span class="who-chip">👤 ${esc(todoWho(t))}</span>`:''}${dueChip(t)}${lst?`<span class="sub">${esc(lst.title)}</span>`:''}${t.done&&t.done_by?`<span class="sub">erledigt von ${esc(nameOf(t.done_by))}</span>`:''}</span>
      ${t.note?`<span class="note">${esc(t.note)}</span>`:''}</div>
    ${mgr()?`<div class="actions">${delBtn('todos',t.id,'×')}</div>`:''}
  </div>`;
}
function listText(l){
  const ts=D('todos').filter(t=>t.list_id===l.id).sort(todoSort);
  return `${l.title}${l.meet_on?' ('+fmtDate(l.meet_on)+')':''}\n`+ts.map(t=>`${t.done?'✅':'⬜'} ${t.title}${todoWho(t)?' – '+todoWho(t):''}${t.due&&!t.done?' – bis '+fmtDate(t.due):''}`).join('\n');
}
const todoSort=(a,b)=>(a.done-b.done)||((a.due||'9999')).localeCompare(b.due||'9999')||(a.sort-b.sort)||(a.createdAt||'').localeCompare(b.createdAt||'');
function renderTodo(){
  const lists=D('todo_lists').filter(l=>S.showPast.todoArch||!l.archived).sort((a,b)=>(a.archived-b.archived)||((b.meet_on||b.createdAt||'')).localeCompare(a.meet_on||a.createdAt||''));
  const myOpen=D('todos').filter(t=>t.assignee===S.me&&!t.done).sort(todoSort);
  let html=`<div class="panel"><div class="panel-head"><div><h2>Aufgaben</h2><p class="sub">To-do-Listen, z. B. für die Gruppenführer-Besprechung. Wer zuständig ist, bekommt eine Push-Nachricht und eine Erinnerung am Tag vor der Frist.</p></div>
    ${mgr()?`<div class="actions"><button class="btn primary" data-act="open-form" data-form="todo-list">+ Neue Liste</button></div>`:''}</div>`;
  if(S.openForm==='todo-list'&&mgr()) html+=`<form class="inline" data-form="todo-list" style="margin:14px 20px">
      <label for="tl-title" class="span-all">Titel<input id="tl-title" required maxlength="80" placeholder="z. B. Gruppenführer-Besprechung"></label>
      <label for="tl-date">Besprechung am<input id="tl-date" type="date"></label>
      <label for="tl-vis">Sichtbar für<select id="tl-vis"><option value="fuehrung">nur Führung (+ Zuständige)</option><option value="alle">alle Mitglieder</option></select></label>
      <div class="form-actions"><button class="btn primary" type="submit">Liste anlegen</button><button class="btn ghost" type="button" data-act="close-form">Abbrechen</button></div>${errP('todo-list')}</form>`;
  if(myOpen.length) html+=`<div class="day-head"><span class="when">Für mich offen (${myOpen.length})</span></div><div class="todo-wrap">${myOpen.map(t=>todoItem(t,true)).join('')}</div>`;
  html+='</div>';
  if(!lists.length) html+=`<div class="panel" style="margin-top:14px"><div class="empty"><strong>Noch keine Aufgabenliste.</strong>${mgr()?'Leg oben mit „+ Neue Liste“ die erste an, z. B. für die nächste Gruppenführer-Besprechung.':'Sobald dir eine Aufgabe zugewiesen wird, steht sie hier.'}</div></div>`;
  html+=lists.map(l=>{
    const ts=D('todos').filter(t=>t.list_id===l.id).sort(todoSort); const done=ts.filter(t=>t.done).length;
    const showDone=S.showPast['tdone-'+l.id]; const vis=ts.filter(t=>!t.done||showDone);
    return `<div class="panel todo-list ${l.archived?'arch':''}" style="margin-top:14px"><div class="panel-head"><div>
        <h3 class="tl-title">${esc(l.title)}</h3>
        <p class="sub">${l.meet_on?'📅 '+esc(fmtDayLong(l.meet_on))+' · ':''}${l.visibility==='alle'?'für alle sichtbar':'nur Führung'}${l.archived?' · archiviert':''}</p>
        <div class="tl-prog"><span style="width:${ts.length?Math.round(100*done/ts.length):0}%"></span></div><span class="sub">${done} von ${ts.length} erledigt</span></div>
      <div class="actions"><button class="btn ghost small" data-act="copy" data-v="${esc(listText(l))}" title="Als Text für WhatsApp kopieren">📋 Teilen</button>${mgr()?`<button class="btn ghost small" data-act="todo-arch" data-id="${esc(l.id)}">${l.archived?'Zurückholen':'Archivieren'}</button>${delBtn('todo_lists',l.id,'Liste löschen')}`:''}</div></div>
      ${mgr()&&!l.archived?`<form class="inline todo-add" data-form="todo" data-id="${esc(l.id)}">
        <label for="td-t-${esc(l.id)}" class="span-all">Neue Aufgabe<input id="td-t-${esc(l.id)}" required maxlength="160" placeholder="z. B. Angebot für neue Helme einholen"></label>
        <label for="td-w-${esc(l.id)}">Zuständig<select id="td-w-${esc(l.id)}"><option value="">– niemand –</option>${personOpts()}<option value="__txt">Andere Person …</option></select></label>
        <label for="td-x-${esc(l.id)}">Name (ohne App)<input id="td-x-${esc(l.id)}" maxlength="60" placeholder="nur bei „Andere Person“"></label>
        <label for="td-d-${esc(l.id)}">Fällig bis<input id="td-d-${esc(l.id)}" type="date"></label>
        <label for="td-n-${esc(l.id)}">Notiz<input id="td-n-${esc(l.id)}" maxlength="400" placeholder="optional"></label>
        <div class="form-actions"><button class="btn primary" type="submit">Hinzufügen</button></div>${errP('todo-'+l.id)}</form>`:''}
      <div class="todo-wrap">${vis.length?vis.map(t=>todoItem(t,false)).join(''):`<div class="empty" style="padding:14px 20px">${ts.length?'Alles erledigt 🎉':'Noch keine Aufgaben.'}</div>`}</div>
      ${done?`<div class="day-head"><button class="linkbtn" data-act="toggle-past" data-key="tdone-${esc(l.id)}">${showDone?'Erledigte ausblenden':`${done} erledigte anzeigen`}</button></div>`:''}
    </div>`;
  }).join('');
  if(mgr()&&D('todo_lists').some(l=>l.archived)) html+=`<p style="text-align:center;margin:14px 0"><button class="linkbtn" data-act="toggle-past" data-key="todoArch">${S.showPast.todoArch?'Archiv ausblenden':'Archivierte Listen anzeigen'}</button></p>`;
  return loadingOr(['todo_lists','todos'], html);
}

/* ---------- Zuständigkeiten: Rollen + Reservierungs-Verantwortliche ---------- */
const ASSIGN_FNS=[['master','👑 App-Master','darf alles, auch Rollen vergeben – nur für bereits freigeschaltete Mitglieder'],['kommandant','Kommandant','alles von Gruppenführer und Gerätewart + Organigramm & Mitglieder'],['gruppenfuehrer','Gruppenführer','Dienstpläne, Neues, Veranstaltungen, Übungsdoku, Führung, Aufgaben'],['geraetewart','Gerätewart','Mängel, Fahrzeuge & Material, Kleiderkammer & Lager'],['kassier','Kassier','private Ausgaben sehen und erstatten']];
const RES_AREAS=()=>[...CATS.map(c=>[c.k,c.n]),['eis','Crushed-Eis']];
function memberDatalist(){ return `<datalist id="dl-members">${people().map(p=>`<option value="${esc(p.name||'')}">`).join('')}</datalist>`; }
function renderAssign(){
  const master=isMaster(), gear=canGear();
  let html=`<div class="panel"><div class="panel-head"><div><h2>Zuständigkeiten</h2><p class="sub">Pro Bereich beliebig viele Namen eintragen. Bei bereits registrierten Kameraden wirkt es sofort, bei allen anderen automatisch, sobald sie sich mit genau diesem Namen registrieren und freigegeben werden.</p></div></div></div>${memberDatalist()}`;
  // Rollen
  html+=`<h4 class="group-label">Rollen in der App ${master?'':'<span class="sub">(ändern nur App-Master)</span>'}</h4><div class="assign-grid">`+
    ASSIGN_FNS.map(([k,n,d])=>{
      const rows=D('role_assign').filter(a=>a.fn===k).sort((a,b)=>a.name.localeCompare(b.name,'de'));
      return `<div class="assign-card"><h3>${esc(n)}</h3><p class="sub">${esc(d)}</p>
        <div class="assign-names">${rows.length?rows.map(a=>`<span class="aname ${a.userId?'':'wait'}" title="${a.userId?'registriert – Rechte aktiv':'noch nicht registriert – wird bei Freigabe übernommen'}">${a.userId?'✓':'⏳'} ${esc(a.name)}${master?`<button data-act="assign-del" data-id="${esc(a.id)}" aria-label="${esc(a.name)} entfernen">×</button>`:''}</span>`).join(''):'<span class="sub">noch niemand</span>'}</div>
        ${master?`<form class="assign-add" data-form="assign" data-id="${k}"><input id="as-${k}" list="dl-members" maxlength="60" placeholder="Vor- und Nachname" aria-label="Name für ${esc(n)}" autocomplete="off"><button class="btn primary small" type="submit">+ Hinzufügen</button></form>${errP('assign-'+k)}`:''}
      </div>`;}).join('')+`</div>`;
  // Reservierungen
  html+=`<h4 class="group-label">Verantwortliche für Reservierungen ${gear?'':'<span class="sub">(ändern Gerätewart/Kommandant)</span>'}</h4><p class="sub" style="margin:-4px 0 10px">Bekommen bei jeder Reservierung eine Push-Nachricht (wenn sie die App haben). Mit Handynummer erscheint zusätzlich der WhatsApp-Knopf.</p><div class="assign-grid">`+
    RES_AREAS().map(([k,n])=>{
      const rows=D('res_contacts').filter(c=>c.key===k);
      return `<div class="assign-card"><h3>${esc(n)}</h3>
        <div class="assign-names">${rows.length?rows.map(c=>`<span class="aname ${c.user_id?'':'wait'}">${c.user_id?'🔔':'👤'} ${esc(c.user_id?nameOf(c.user_id):c.name)}${c.phone?' · 📱':''}${gear?`<button data-act="rc-del" data-id="${esc(c.id)}" aria-label="entfernen">×</button>`:''}</span>`).join(''):'<span class="sub">noch niemand</span>'}</div>
        ${gear?`<form class="assign-add two" data-form="rc-add" data-id="${k}"><input id="rc-n-${k}" list="dl-members" maxlength="60" placeholder="Name" aria-label="Name" autocomplete="off"><input id="rc-p-${k}" type="tel" maxlength="30" placeholder="WhatsApp-Nr. (optional)" aria-label="Handynummer"><button class="btn primary small" type="submit">+ Hinzufügen</button></form>${errP('rc-'+k)}`:''}
      </div>`;}).join('')+`</div>`;
  return loadingOr(['role_assign','res_contacts','profiles'], html);
}
/* ---------- Gesamt-Render ---------- */
function render(){
  if(!isMember()) return;
  const v=S.view;
  $('#view-home').hidden = v!=='home';
  $('#view-doc').hidden = v!=='doc';
  $('#view-page').hidden = !['news','duty-aktive','duty-jugend','events','org','who','members','me','quiz','clothing','todo','assign','defects','push','lead','expenses'].includes(v);
  const waiting=D('profiles').filter(p=>p.role==='pending').length;
  $('#me-name').textContent=S.profile.name||'';
  $('#me-role').textContent=roleLabel(S.profile);
  renderTiles();
  if(v==='home'){
    const body=$('#res-body'); const snap=snapshotForm(body);
    body.innerHTML = S.openCat==='eis' ? renderIce() : S.openCat ? renderCat() : '';
    $('#upcoming').innerHTML = renderUpcoming();
    restoreForm(body,snap);
  } else if(v!=='doc'){
    const page=$('#view-page'); const snap=snapshotForm(page);
    if(S.skipRestore){ snap.vals={}; snap.focus=null; }
    page.innerHTML = `<div class="backbar"><button class="btn ghost" data-goto="home">← Übersicht</button></div>` + (v==='news'?renderNews() : v==='events'?renderEvents() : v==='org'?renderOrg('areas') : v==='who'?renderOrg('people') : v==='members'?renderMembers() : v==='defects'?renderDefects() : v==='push'?renderPush() : v==='lead'?renderLead() : v==='expenses'?renderExpenses() : v==='me'?renderMe() : v==='quiz'?renderQuiz() : v==='clothing'?renderClothing() : v==='todo'?renderTodo() : v==='assign'?renderAssign() : renderDuty(v));
    restoreForm(page,snap); S.skipRestore=false;
  }
  renderDocs();
  $('#doc-submit').disabled = S.busy;
  $('#doc-form').hidden = !mgr();
  $('#doc-lock').hidden = mgr();
}
function go(view){
  if((view==='members'&&!canCmd())||(view==='lead'&&!canLead())) view='home';
  if(view!==S.view) S.orgQ='';
  S.view=view; S.openForm=null; S.editOrg=null; S.confirm=null; S.errs={};
  try{ localStorage.setItem('fhq-view',view); }catch(_){}
  if(location.hash!=='#'+view) history.replaceState(null,'','#'+view);
  render(); window.scrollTo({top:0});
}

/* ---------- Klicks ---------- */
const DEL_MSG={items:'Eintrag gelöscht',reservations:'Reservierung storniert',docs:'Liste gelöscht',news:'Beitrag gelöscht',duties:'Dienst gelöscht',events:'Veranstaltung gelöscht',shifts:'Arbeitsdienst gelöscht',ice:'Eis-Anmeldung storniert',org:'Funktion entfernt',defects:'Mangel gelöscht',member_quals:'Eintrag entfernt',expenses:'Ausgabe gelöscht',qual_types:'Aus dem Katalog entfernt',absences:'Abwesenheit entfernt',clothing_requests:'Anfrage gelöscht',quiz_questions:'Frage gelöscht',clothing_issued:'Eintrag gelöscht',clothing_stock:'Aus dem Lager entfernt',todos:'Aufgabe gelöscht',todo_lists:'Liste gelöscht'};

document.addEventListener('click', async e=>{
  const gt=e.target.closest('[data-goto]'); if(gt){ go(gt.dataset.goto); return; }
  const tile=e.target.closest('.tile[data-cat]'); if(tile){
    S.openCat = S.openCat===tile.dataset.cat?null:tile.dataset.cat; S.formFor=null; S.openForm=null; S.confirm=null; S.errs={}; S.lastRes=null; S.contactEdit=null; render();
    if(S.openCat) $('#res-body').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    return; }
  const f=e.target.closest('#doc-filters .filter'); if(f){ S.docFilter=f.dataset.f; renderDocs(); return; }
  const seg=e.target.closest('#auth-seg button'); if(seg){ setAuthMode(seg.dataset.mode); return; }
  const b=e.target.closest('[data-act]'); if(!b) return;
  const id=b.dataset.id, act=b.dataset.act;
  if(act==='logout'){ await sb.auth.signOut(); location.hash=''; return; }
  if(act==='close-cat'){ S.openCat=null; S.lastRes=null; S.contactEdit=null; render(); }
  else if(act==='open-form'){ S.openForm=b.dataset.form; S.errs={}; S.skipRestore=true; render(); }
  else if(act==='close-form'){ S.openForm=null; S.formFor=null; S.editOrg=null; S.errs={}; render(); }
  else if(act==='reserve'){ S.formFor=id; S.errs={}; render(); document.getElementById('rf-why-'+id)?.focus(); }
  else if(act==='contact-edit'){ S.contactEdit=S.contactEdit===id?null:id; S.errs={}; S.skipRestore=true; render(); }
  else if(act==='contact-cancel'){ S.contactEdit=null; render(); }
  else if(act==='rc-del'){ await run('res_contacts', sb.from('res_contacts').delete().eq('id',id), 'Entfernt'); }
  else if(act==='assign-del'){ const {error}=await sb.rpc('assign_remove',{aid:id}); if(error) toast(error.message.replace(/^.*?:\s*/,'')); else { toast('Entfernt'); await Promise.all([load('role_assign'),load('profiles')]); route(); } }
  else if(act==='res-done-close'){ S.lastRes=null; render(); }
  else if(act==='toggle-past'){ S.showPast[b.dataset.key]=!S.showPast[b.dataset.key]; render(); }
  else if(act==='ask'){ S.confirm=b.dataset.key; render(); }
  else if(act==='cancel-confirm'){ S.confirm=null; render(); }
  else if(act==='del'){
    S.confirm=null; const col=b.dataset.col;
    if(col==='member'){
      const {error}=await sb.rpc('remove_member',{target:id});
      if(error) toast(errText(error)); else { toast('Mitglied entfernt'); await load('profiles'); render(); }
      return;
    }
    if(col==='docs'){ const d=D('docs').find(x=>x.id===id); if(d&&d.photo_path) await sb.storage.from('listen').remove([d.photo_path]); }
    if(col==='expenses'){ const x=D('expenses').find(y=>y.id===id); if(x&&x.receipt_path) await sb.storage.from('belege').remove([x.receipt_path]); }
    await del(col,id,DEL_MSG[col]);
  }
  else if(act==='toggle-doc'){
    const d=D('docs').find(x=>x.id===id); if(!d) return; const done=d.status!=='eingepflegt';
    await upd('docs',id,done?{status:'eingepflegt',done_by:S.me,done_at:new Date().toISOString()}:{status:'offen',done_by:null,done_at:null}, done?'Als eingepflegt markiert':'Wieder auf offen gesetzt');
  }
  else if(act==='ice-done'){
    const x=D('ice').find(y=>y.id===id); if(!x) return;
    await upd('ice',id,{done:!x.done,done_by:x.done?null:S.me}, x.done?'Wieder offen':'Als bereitgestellt markiert');
  }
  else if(act==='sign-on'){
    const sh=D('shifts').find(s=>s.id===id); if(!sh) return;
    await ins('signups',{shift_id:id},'Eingetragen für '+sh.task);
  }
  else if(act==='sign-off'){
    const s=D('signups').find(x=>x.shiftId===id && x.by===S.me && !x.name); if(!s) return;
    await del('signups',s.id,'Ausgetragen');
  }
  else if(act==='unsign'){ await del('signups',id,'Ausgetragen'); }
  else if(act==='set-role'){ await setRole(id,b.dataset.role); }
  else if(act==='fn-toggle'){
    const p=D('profiles').find(x=>x.id===id); if(!p) return; const k=b.dataset.key;
    const f=new Set(p.functions||[]); f.has(k)?f.delete(k):f.add(k);
    const {error}=await sb.rpc('set_functions',{target:id,fns:[...f]});
    if(error) toast(errText(error)); else { toast((f.has(k)?'Vergeben: ':'Entzogen: ')+FN_NAME[k]); await load('profiles'); render(); }
  }
  else if(act==='treasurer'){
    const p=D('profiles').find(x=>x.id===id); const on=!(p&&p.treasurer);
    const {error}=await sb.rpc('set_treasurer',{target:id,flag:on});
    if(error) toast(errText(error)); else { toast(on?'Als Kassier festgelegt':'Kassier-Recht entfernt'); await load('profiles'); await load('expenses'); route(); }
  }
  else if(act==='exp-status'){
    const st=b.dataset.status;
    await upd('expenses',id, st==='offen'?{status:'offen',paid_by:null,paid_at:null}:{status:st,paid_by:S.me,paid_at:new Date().toISOString()}, st==='erstattet'?'Als erstattet markiert':st==='abgelehnt'?'Abgelehnt':'Wieder offen');
  }
  else if(act==='rsvp'){ await setRsvp(id,b.dataset.status); }
  else if(act==='defect-status'){
    const st=b.dataset.status;
    await upd('defects',id, st==='erledigt'?{status:st,done_by:S.me,done_at:new Date().toISOString()}:{status:st,done_by:null,done_at:null}, 'Status: '+DST[st].n);
  }
  else if(act==='lead-tab'){ S.leadTab=b.dataset.key; S.confirm=null; S.errs={}; S.skipRestore=true; render(); }
  else if(act==='lead-group'){ S.leadGroup=b.dataset.key; S.attDuty=null; render(); }
  else if(act==='cat-open'){ S.catOpen = S.catOpen===id?null:id; S.catPerson=null; S.errs={}; S.skipRestore=true; render(); }
  else if(act==='cat-person'){ S.catPerson=id; S.skipRestore=true; render(); document.getElementById('fr-date')?.focus(); }
  else if(act==='att-open'){ S.attDuty = S.attDuty===id?null:id; S.skipRestore=true; render(); }
  else if(act==='frist-renew'){
    const q=D('member_quals').find(x=>x.id===id); const t=q&&D('qual_types').find(x=>x.id===q.typeId); if(!q||!t) return;
    await upd('member_quals',id,{achieved:today(),expires:t.valid_months?addMonths(today(),t.valid_months):null},'Erneuert bis '+fmtDate(addMonths(today(),t.valid_months)));
  }
  else if(act==='qual-cell'){
    const key='mq-'+b.dataset.user+'-'+b.dataset.type;
    if(!id){ S.qualPrefill={user:b.dataset.user,type:b.dataset.type}; S.skipRestore=true; render(); document.getElementById('ql-date')?.focus(); window.scrollTo({top:0,behavior:'smooth'}); return; }
    if(S.confirm===key){ S.confirm=null; await del('member_quals',id,'Eintrag entfernt'); } else { S.confirm=key; render(); }
  }
  else if(act==='push-on'){ await enablePush(); }
  else if(act==='push-off'){ await disablePush(); }
  else if(act==='cal-create'){ await ensureCalToken(); render(); }
  else if(act==='cloth-st'){ const x=D('clothing_requests').find(y=>y.id===id); const ok=await upd('clothing_requests',id,{status:b.dataset.status,done_by:S.me},'Status: '+(CST[b.dataset.status]||{}).n); if(ok&&x&&b.dataset.status==='ausgegeben'){ await clothIssueFromRequest(x); toast('Ausgegeben – bei der Person eingetragen'); render(); } }
  else if(act==='cloth-tab'){ S.clothTab=id; S.errs={}; S.skipRestore=true; render(); }
  else if(act==='gear-return'){ await upd('clothing_issued',id,{returned_on:today()},'Als zurückgegeben markiert'); }
  else if(act==='stock-step'){ const st=D('clothing_stock').find(y=>y.id===id); if(st) await upd('clothing_stock',id,{qty:Math.max(0,(+st.qty||0)+(+b.dataset.v)),updated_at:new Date().toISOString()}); }
  else if(act==='todo-toggle'){ const t=D('todos').find(y=>y.id===id); if(t) await run('todos', sb.rpc('toggle_todo',{tid:id,flag:!t.done}), t.done?'Wieder offen':'Erledigt ✓'); }
  else if(act==='todo-arch'){ const l=D('todo_lists').find(y=>y.id===id); if(l) await upd('todo_lists',id,{archived:!l.archived},l.archived?'Liste zurückgeholt':'Liste archiviert'); }
  else if(act==='quiz-start'){ startQuiz(id); render(); window.scrollTo({top:0}); }
  else if(act==='quiz-pick'){ await quizPick(+id); }
  else if(act==='quiz-next'){ await quizNext(); }
  else if(act==='quiz-stop'){ S.quiz=null; render(); }
  else if(act==='quiz-admin'){ S.quizAdmin=!S.quizAdmin; S.quiz=null; render(); }
  else if(act==='push-pref'){ await setPushPref(b.dataset.key, b.getAttribute('aria-checked')!=='true'); }
  else if(act==='edit-org'){ S.editOrg=id; S.orgParent=null; S.errs={}; S.skipRestore=true; render(); const f=document.getElementById('org-role'); if(f){ f.focus({preventScroll:true}); f.closest('form').scrollIntoView({block:'center'}); } }
  else if(act==='org-add-under'){ S.editOrg='new'; S.orgParent=id; S.errs={}; S.skipRestore=true; render(); const f=document.getElementById('org-role'); if(f){ f.focus({preventScroll:true}); f.closest('form').scrollIntoView({block:'center'}); } }
  else if(act==='org-edit-mode'){ S.orgEdit=!S.orgEdit; S.editOrg=null; render(); }
  else if(act==='org-toggle'){ if(S.orgAll){ S.orgAll=false; S.orgOpen=new Set(orgAreas().map(a=>a.id)); } S.orgOpen.has(id)?S.orgOpen.delete(id):S.orgOpen.add(id); render(); }
  else if(act==='org-open'){ S.orgQ=''; go('org'); requestAnimationFrame(()=>document.getElementById('org-'+id)?.scrollIntoView({behavior:'smooth',block:'start'})); }
  else if(act==='org-all'){ S.orgAll=!S.orgAll; if(!S.orgAll) S.orgOpen.clear(); render(); }
  else if(act==='org-tab'){ S.orgTab=id; S.orgQ=''; render(); }
  else if(act==='org-person'){ go('who'); S.orgQ=b.dataset.v; render(); }
  else if(act==='copy'){
    const v=b.dataset.v;
    try{ await navigator.clipboard.writeText(v); toast('Kopiert: '+v); }
    catch(_){ toast('Kopieren nicht möglich – bitte Text markieren'); }
  }
  else if(act==='zoom'){ const u=S.urls[b.dataset.path]; if(u&&u!=='missing'){ $('#lightbox-img').src=u; $('#lightbox').hidden=false; } }
});
document.addEventListener('change', e=>{
  const c=e.target.closest('[data-change]'); if(!c) return;
  if(c.dataset.change==='frist-filter'){ S.fristFilter=c.value; render(); }
  if(c.dataset.change==='lead-year'){ S.leadYear=+c.value; S.attDuty=null; render(); }
});
document.addEventListener('change', async e=>{
  const sel=e.target.closest('[data-act-change="role"]'); if(sel) await setRole(sel.dataset.id, sel.value);
});
async function setRole(id,role){
  const {error}=await sb.rpc('set_role',{target:id,new_role:role});
  if(error) toast(/Master|Kommandant|Mindestens/.test(error.message)?error.message:errText(error));
  else toast('Rolle geändert: '+ROLE_NAME[role]);
  await load('profiles'); route();
}
$('#lightbox').addEventListener('click',()=>{$('#lightbox').hidden=true});
document.addEventListener('keydown',e=>{ if(e.key==='Escape') $('#lightbox').hidden=true; });
document.addEventListener('change',e=>{ if(e.target.id==='gear-filter'){ S.gearPerson=e.target.value; render(); return; } if(e.target.id==='cr-item'){ const k=CLOTH_MAP[e.target.value]; const f=document.getElementById('cr-size'); if(f) f.value=k?(mySizes()[k]||''):''; } });
document.addEventListener('input',e=>{ if(e.target.id==='org-q'){ S.orgQ=e.target.value; render(); } });
window.addEventListener('hashchange',()=>{ const v=location.hash.slice(1); if(VIEWS.includes(v) && v!==S.view && isMember()) go(v); });

/* ---------- Formulare ---------- */
function fail(k,msg){ S.errs[k]=msg; render(); }
async function addRow(t,row,msg,errKey){
  const ok=await ins(t,row,msg);
  if(ok){ S.openForm=null; if(errKey) S.errs[errKey]=null; render(); }
  return ok;
}
document.addEventListener('submit', async e=>{
  const form=e.target; const kind=form.dataset.form; const fid=form.dataset.id;
  if(form.id==='auth-form') return submitAuth(e);
  if(form.id==='doc-form') return submitDoc(e,form);
  if(!kind) return;
  e.preventDefault();
  if(kind==='add-item'){
    const name=val('add-name'), note=val('add-note');
    if(!name) return fail('add-item','Bitte eine Bezeichnung eintragen.');
    addRow('items',{cat:S.openCat,name,note},'„'+name+'“ angelegt','add-item');
  }
  else if(kind==='reserve'){
    const it=D('items').find(i=>i.id===fid); if(!it) return;
    const from=val('rf-from-'+fid), to=val('rf-to-'+fid), purpose=val('rf-why-'+fid), key='r-'+fid;
    if(!from||!to||!purpose) return fail(key,'Bitte Von, Bis und Zweck ausfüllen.');
    if(to<=from) return fail(key,'„Bis“ muss nach „Von“ liegen.');
    await load('reservations');
    const clash=D('reservations').find(r=>r.itemId===fid && r.from<to && from<r.to);
    if(clash) return fail(key,`Schon belegt: ${fmtRange(clash.from,clash.to)} von ${nameOf(clash.by)} (${clash.purpose}). Bitte anderen Zeitraum wählen.`);
    const ok=await ins('reservations',{item_id:fid,item_name:it.name,cat:it.cat,starts:from,ends:to,purpose},'Reserviert: '+it.name);
    if(ok){ S.formFor=null; S.errs[key]=null;
      S.lastRes={scope:it.cat,itemId:it.id,cat:it.cat,title:'Reserviert: '+it.name,
        text:`Hallo, ich habe ${it.name} reserviert: ${fmtRange(from,to)} Uhr – ${purpose}. Gruß ${nameOf(S.me)} (über Florian HQ)`};
      render(); }
  }
  else if(kind==='assign'){
    const nm=val('as-'+fid); if(nm.length<2) return fail('assign-'+fid,'Bitte Vor- und Nachnamen eintragen.');
    const {error}=await sb.rpc('assign_add',{f:fid,nm});
    if(error) return fail('assign-'+fid, error.message.replace(/^.*?:\s*/,''));
    S.errs['assign-'+fid]=null; toast(nm+' eingetragen'); await Promise.all([load('role_assign'),load('profiles')]);
    const e=document.getElementById('as-'+fid); if(e) e.value=''; route();
  }
  else if(kind==='rc-add'){
    const nm=val('rc-n-'+fid), phone=val('rc-p-'+fid);
    if(!nm&&!phone) return fail('rc-'+fid,'Bitte einen Namen oder eine Nummer eintragen.');
    if(phone && !waNumber(phone)) return fail('rc-'+fid,'Die Nummer sieht unvollständig aus.');
    const p=people().find(x=>(x.name||'').trim().toLowerCase()===nm.trim().toLowerCase());
    const ok=await ins('res_contacts',{key:fid,user_id:p?p.id:null,name:p?'':nm,phone},(nm||'Nummer')+' hinzugefügt');
    if(ok){ S.errs['rc-'+fid]=null; ['rc-n-','rc-p-'].forEach(k=>{const e=document.getElementById(k+fid); if(e) e.value='';}); }
  }
  else if(kind==='ice'){
    const date=val('ice-date'), time=val('ice-time'), bags=parseInt(val('ice-bags'),10), purpose=val('ice-why');
    if(!date||!time||!purpose||!(bags>0)) return fail('ice','Bitte Datum, Uhrzeit, Menge und Zweck angeben.');
    const ok=await ins('ice',{date,time,bags,purpose},`${bags} ${bags===1?'Sack':'Säcke'} Eis angemeldet`);
    if(ok){ S.errs.ice=null; const w=document.getElementById('ice-why'); if(w) w.value='';
      S.lastRes={scope:'eis',itemId:null,cat:'eis',title:`${bags} ${bags===1?'Sack':'Säcke'} Eis angemeldet`,
        text:`Hallo, ich brauche ${bags} ${bags===1?'Sack':'Säcke'} Crushed-Eis am ${fmtDay(date)} ab ${time} Uhr – ${purpose}. Gruß ${nameOf(S.me)} (über Florian HQ)`};
      render(); }
  }
  else if(kind==='news'){
    const title=val('news-title'), text=val('news-text');
    if(!title||!text) return fail('news','Bitte Überschrift und Text ausfüllen.');
    addRow('news',{title,text},'Neuigkeit veröffentlicht','news');
  }
  else if(kind==='duty'){
    const g=form.dataset.group, fk='duty-'+g;
    const date=val(fk+'-date'), time=val(fk+'-time'), topic=val(fk+'-topic');
    if(!date||!time||!topic) return fail('duty','Bitte Datum, Beginn und Thema ausfüllen.');
    addRow('duties',{grp:g,date,time,topic,place:val(fk+'-place'),lead:val(fk+'-lead'),note:val(fk+'-note')},'Dienst eingetragen','duty');
  }
  else if(kind==='event'){
    const title=val('ev-title'), date=val('ev-date');
    if(!title||!date) return fail('event','Bitte Name und Datum ausfüllen.');
    addRow('events',{title,date,time:val('ev-time'),place:val('ev-place'),note:val('ev-note')},'Veranstaltung angelegt','event');
  }
  else if(kind==='shift'){
    const fk='shift-'+fid; const task=val(fk+'-task'), start=val(fk+'-start'), end=val(fk+'-end'), need=parseInt(val(fk+'-need'),10);
    if(!task||!start||!end||!(need>0)) return fail('shift','Bitte Aufgabe, Zeiten und Anzahl angeben.');
    if(end<=start) return fail('shift','„Bis“ muss nach „Von“ liegen.');
    addRow('shifts',{event_id:fid,task,start,end,need},'Arbeitsdienst angelegt','shift');
  }
  else if(kind==='addname'){
    const name=val('an-'+fid); const sh=D('shifts').find(s=>s.id===fid); if(!name||!sh) return;
    const ok=await ins('signups',{shift_id:fid,name},name+' eingetragen');
    if(ok){ const el=document.getElementById('an-'+fid); if(el) el.value=''; }
  }
  else if(kind==='frist'){
    const user_id=val('fr-user'), type_id=val('fr-type'), achieved=val('fr-date'); const t=D('qual_types').find(x=>x.id===type_id);
    if(!user_id||!type_id||!achieved) return fail('frist','Bitte Person, Frist und Datum angeben.');
    const expires=val('fr-exp')||(t&&t.valid_months?addMonths(achieved,t.valid_months):null);
    const ok=await run('member_quals', sb.from('member_quals').upsert({user_id,type_id,achieved,expires,note:val('fr-note')},{onConflict:'user_id,type_id'}), 'Frist gespeichert'+(expires?' – gültig bis '+fmtDate(expires):''));
    if(ok){ S.errs.frist=null; S.catPerson=null; S.skipRestore=true; render(); }
  }
  else if(kind==='qual'){
    const user_id=val('ql-user'), type_id=val('ql-type'), achieved=val('ql-date');
    if(!user_id||!type_id||!achieved) return fail('qual','Bitte Person, Lehrgang und Datum angeben.');
    const ok=await run('member_quals', sb.from('member_quals').upsert({user_id,type_id,achieved,expires:null},{onConflict:'user_id,type_id'}), 'Lehrgang eingetragen');
    if(ok){ S.qualPrefill=null; S.errs.qual=null; render(); }
  }
  else if(kind==='remind'){
    const on=document.getElementById('rm-on').checked, d=parseInt(val('rm-days'),10);
    if(on && !(d>=0)) return toast('Bitte die Anzahl Tage angeben.');
    await upd('qual_types',fid,{remind_days:on?d:null,remind_person:document.getElementById('rm-person').checked}, on?`Erinnerung ${d} Tage vorher gespeichert`:'Erinnerung ausgeschaltet');
  }
  else if(kind==='qtype'){
    const name=val('qt-name'), k='frist', m=parseInt(val('qt-months'),10);
    if(!name) return fail('qtype','Bitte eine Bezeichnung eingeben.');
    if(k==='frist'&&!(m>0)) return fail('qtype','Bei Fristen bitte die Gültigkeit in Monaten angeben.');
    const rd=parseInt(val('qt-remind'),10);
    const ok=await ins('qual_types',{name,kind:k,valid_months:k==='frist'?m:null,remind_days:rd>=0?rd:null,sort:100},'„'+name+'“ hinzugefügt');
    if(ok){ S.errs.qtype=null; render(); }
  }
  else if(kind==='attendance'){
    const rows=people().map(p=>({duty_id:fid,user_id:p.id,present:!!(document.getElementById('att-'+p.id)||{}).checked}));
    const ok=await run('duty_attendance', sb.from('duty_attendance').upsert(rows,{onConflict:'duty_id,user_id'}), rows.filter(r=>r.present).length+' anwesend gespeichert');
    if(ok){ S.attDuty=null; render(); }
  }
  else if(kind==='absence'){
    const starts=val('ab-from'), ends=val('ab-to'), reason=val('ab-why'), note=val('ab-note');
    if(!starts||!ends) return fail('absence','Bitte Von und Bis angeben.');
    if(ends<starts) return fail('absence','„Bis“ darf nicht vor „Von“ liegen.');
    const ok=await ins('absences',{starts,ends,reason,note},'Abwesenheit eingetragen');
    if(ok){ S.errs.absence=null; const n=document.getElementById('ab-note'); if(n) n.value=''; render(); }
  }
  else if(kind==='sizes'){
    const sizes={}; CLOTH_SIZES.forEach(([k])=>{ const v=val('sz-'+k); if(v) sizes[k]=v; });
    await run('clothing_sizes', sb.from('clothing_sizes').upsert({user_id:S.me,sizes,updated_at:new Date().toISOString()}), 'Größen gespeichert');
  }
  else if(kind==='cloth-req'){
    const item=val('cr-item'), size=val('cr-size'), qty=parseInt(val('cr-qty'),10)||1, note=val('cr-note');
    if(item==='Sonstiges'&&!note) return fail('cloth','Bitte unter „Hinweis“ schreiben, was du brauchst.');
    const ok=await ins('clothing_requests',{item,size,qty,note},'Bedarf gemeldet');
    if(ok){ S.errs.cloth=null; render(); }
  }
  else if(kind==='gear'){
    const user_id=val('gr-user'), item=val('gr-item'), size=val('gr-size');
    if(!user_id) return fail('gear','Bitte eine Person wählen.');
    const row={user_id,item,size,inv_no:val('gr-inv'),issued_on:val('gr-date')||today(),replace_by:val('gr-repl')||null,note:val('gr-note')};
    const ok=await ins('clothing_issued',row,item+' ausgegeben an '+nameOf(user_id));
    if(ok && document.getElementById('gr-stock')?.checked){ const st=stockOf(item,size); if(st&&+st.qty>0) await upd('clothing_stock',st.id,{qty:+st.qty-1,updated_at:new Date().toISOString()}); }
    if(ok){ S.errs.gear=null; ['gr-size','gr-inv','gr-note','gr-repl'].forEach(i=>{const e=document.getElementById(i); if(e) e.value='';}); }
  }
  else if(kind==='stock'){
    const item=val('st-item'), size=val('st-size'), qty=parseInt(val('st-qty'),10)||0;
    if(qty<1) return fail('stock','Bitte eine Anzahl angeben.');
    const st=stockOf(item,size);
    const ok= st ? await upd('clothing_stock',st.id,{qty:+st.qty+qty,updated_at:new Date().toISOString()},`Lager: ${item} jetzt ${+st.qty+qty}`) : await ins('clothing_stock',{item,size,qty},`${qty}× ${item} ins Lager`);
    if(ok){ S.errs.stock=null; }
  }
  else if(kind==='todo-list'){
    const title=val('tl-title'); if(!title) return fail('todo-list','Bitte einen Titel eingeben.');
    addRow('todo_lists',{title,meet_on:val('tl-date')||null,visibility:val('tl-vis')},'Liste angelegt','todo-list');
  }
  else if(kind==='todo'){
    const lid=fid, title=val('td-t-'+lid); let who=val('td-w-'+lid); const txt=val('td-x-'+lid);
    if(!title) return fail('todo-'+lid,'Bitte die Aufgabe beschreiben.');
    if(who==='__txt'&&!txt) return fail('todo-'+lid,'Bitte den Namen der Person eintragen.');
    const row={list_id:lid,title,assignee:who&&who!=='__txt'?who:null,assignee_txt:who==='__txt'?txt:'',due:val('td-d-'+lid)||null,note:val('td-n-'+lid)};
    const ok=await ins('todos',row,'Aufgabe hinzugefügt');
    if(ok){ S.errs['todo-'+lid]=null; ['td-t-','td-x-','td-n-','td-d-'].forEach(k=>{const e=document.getElementById(k+lid); if(e) e.value='';}); document.getElementById('td-t-'+lid)?.focus(); }
  }
  else if(kind==='quiz-q'){
    const opts=[0,1,2,3].map(i=>val('qq-o'+i)); const okIdx=+val('qq-ok');
    const options=opts.filter(Boolean); const question=val('qq-q');
    if(!question||options.length<2) return fail('quiz','Bitte Frage und mindestens zwei Antworten eintragen.');
    if(!opts[okIdx]) return fail('quiz','Die als richtig markierte Antwort ist leer.');
    const correct=options.indexOf(opts[okIdx]);
    const ok=await ins('quiz_questions',{cat:val('qq-cat'),question,options,correct,explanation:val('qq-exp')},'Frage hinzugefügt');
    if(ok){ S.errs.quiz=null; S.skipRestore=true; render(); }
  }
  else if(kind==='expense'){
    const spent_on=val('ex-date'), purpose=val('ex-purpose');
    const amount=parseFloat(val('ex-amount').replace(/\./g,'').replace(',','.'));
    if(!spent_on||!purpose) return fail('expense','Bitte Datum und Zweck angeben.');
    if(!(amount>0)) return fail('expense','Bitte einen gültigen Betrag eingeben, z. B. 23,90.');
    const file=(document.getElementById('ex-file')||{}).files?.[0];
    if(file&&file.size>20*1024*1024) return fail('expense','Der Beleg ist zu groß (max. 20 MB).');
    S.busy=true;
    try{
      let receipt_path=null;
      if(file){
        const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,5)||'jpg';
        receipt_path=`${S.me}/${Date.now()}.${ext}`;
        const {error}=await sb.storage.from('belege').upload(receipt_path,file,{contentType:file.type||'image/jpeg'});
        if(error) throw error;
      }
      const ok=await ins('expenses',{spent_on,amount:Math.round(amount*100)/100,purpose,receipt_path},`${eur(amount)} eingereicht – der Kassier wird informiert`);
      if(ok){ S.errs.expense=null; S.skipRestore=true; }
    }catch(e){ console.warn(e); fail('expense','Der Beleg ließ sich nicht hochladen. Bitte nochmal versuchen.'); }
    finally{ S.busy=false; render(); }
  }
  else if(kind==='defect'){
    const itemId=val('df-item'), it=D('items').find(i=>i.id===itemId);
    const itemName=it?`${catName(it.cat)}: ${it.name}`:val('df-other');
    const title=val('df-title');
    if(!itemName) return fail('defect','Bitte angeben, was betroffen ist.');
    if(!title) return fail('defect','Bitte kurz beschreiben, was kaputt ist.');
    const ok=await ins('defects',{item_id:it?it.id:null,item_name:itemName,title,description:val('df-desc'),urgency:val('df-urg')||'normal'},'Mangel gemeldet – danke!');
    if(ok){ S.errs.defect=null; ['df-title','df-desc','df-other'].forEach(i=>{const e=document.getElementById(i); if(e) e.value='';}); render(); }
  }
  else if(kind==='org'){
    const role=val('org-role'); if(!role) return fail('org','Bitte eine Funktion eintragen.');
    const row={role,name:val('org-name'),area:val('org-area'),phone:val('org-phone'),email:val('org-mail'),parent_id:val('org-parent')||null,sort:parseInt(val('org-order'),10)||0};
    const ed=S.editOrg&&S.editOrg!=='new'?S.editOrg:null;
    const ok = ed ? await upd('org',ed,row,'Gespeichert') : await ins('org',row,'„'+role+'“ hinzugefügt');
    if(ok){ S.editOrg=null; S.errs.org=null; render(); }
  }
});

async function submitDoc(e,form){
  e.preventDefault();
  const title=$('#doc-title').value.trim(), date=$('#doc-date').value, file=$('#doc-file').files[0], note=$('#doc-note').value.trim();
  const err=$('#doc-err'); err.hidden=true;
  if(!title||!date||!file){ err.textContent='Bitte Übung, Datum und Foto angeben.'; err.hidden=false; return; }
  if(file.size>20*1024*1024){ err.textContent='Das Foto ist zu groß (max. 20 MB).'; err.hidden=false; return; }
  S.busy=true; $('#doc-submit').disabled=true; $('#doc-submit').textContent='Lädt hoch …';
  try{
    const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,5)||'jpg';
    const path=`${S.me}/${Date.now()}.${ext}`;
    const {error:upErr}=await sb.storage.from('listen').upload(path,file,{contentType:file.type||'image/jpeg'});
    if(upErr) throw upErr;
    const ok=await ins('docs',{title,date,note,photo_path:path},'Liste hochgeladen – steht auf „muss eingepflegt werden“');
    if(ok){ form.reset(); $('#doc-date').value=today(); S.docFilter='offen'; }
  }catch(ex){
    err.textContent='Das Foto ließ sich nicht hochladen. Bitte nochmal versuchen.'; err.hidden=false; console.warn(ex);
  }finally{ S.busy=false; $('#doc-submit').textContent='Hochladen'; render(); }
}

/* ---------- Anmeldung ---------- */
let authMode='login';
function setAuthMode(m){
  authMode=m;
  document.querySelectorAll('#auth-seg button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===m)));
  $('#auth-seg').hidden = m==='reset' || m==='newpass';
  $('#auth-name-wrap').hidden = m!=='signup';
  $('#auth-email-wrap').hidden = m==='newpass';
  $('#auth-pass-wrap').hidden = m==='reset';
  $('#auth-forgot').textContent = m==='reset' ? 'Zurück zur Anmeldung' : 'Passwort vergessen?';
  $('#auth-forgot').hidden = m==='newpass' || m==='signup';
  $('#auth-pass').autocomplete = m==='login'?'current-password':'new-password';
  $('#auth-submit').textContent = {login:'Anmelden',signup:'Konto anlegen',reset:'Link zum Zurücksetzen senden',newpass:'Neues Passwort speichern'}[m];
  $('#auth-err').hidden=true; $('#auth-ok').hidden=true;
}
$('#auth-forgot').addEventListener('click',()=>setAuthMode(authMode==='reset'?'login':'reset'));
async function submitAuth(e){
  e.preventDefault();
  const email=val('auth-email'), pass=$('#auth-pass').value, name=val('auth-name');
  const err=$('#auth-err'), ok=$('#auth-ok'); err.hidden=true; ok.hidden=true;
  const show=(el,msg)=>{ el.textContent=msg; el.hidden=false; };
  const btn=$('#auth-submit'); btn.disabled=true;
  try{
    if(authMode==='login'){
      const {error}=await sb.auth.signInWithPassword({email,password:pass});
      if(error) show(err, /confirm/i.test(error.message)?'Bitte bestätige zuerst deine E-Mail-Adresse (Link im Postfach).':'E-Mail oder Passwort stimmt nicht.');
    } else if(authMode==='signup'){
      if(!name) return show(err,'Bitte gib deinen Namen an, damit dich die Kameraden erkennen.');
      if(pass.length<6) return show(err,'Das Passwort braucht mindestens 6 Zeichen.');
      const {data,error}=await sb.auth.signUp({email,password:pass,options:{data:{name},emailRedirectTo:location.origin+location.pathname}});
      if(error) show(err, /registered/i.test(error.message)?'Diese E-Mail ist schon registriert. Bitte anmelden.':'Registrierung fehlgeschlagen: '+error.message);
      else if(!data.session) show(ok,'Fast geschafft: Wir haben dir eine E-Mail geschickt. Bestätige den Link darin und melde dich dann an.');
    } else if(authMode==='reset'){
      const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
      if(error) show(err,'Das hat nicht geklappt: '+error.message); else show(ok,'Wenn die Adresse registriert ist, kommt gleich eine E-Mail mit einem Link.');
    } else if(authMode==='newpass'){
      if(pass.length<6) return show(err,'Das Passwort braucht mindestens 6 Zeichen.');
      const {error}=await sb.auth.updateUser({password:pass});
      if(error) show(err,'Speichern fehlgeschlagen: '+error.message); else { toast('Neues Passwort gespeichert'); setAuthMode('login'); await route(); }
    }
  } finally { btn.disabled=false; }
}

/* ---------- Ablauf: wer sieht was ---------- */
let started=false;
async function route(){
  const {data:{session}}=await sb.auth.getSession();
  const show=id=>{ ['gate-auth','gate-pending','app'].forEach(x=>{ document.getElementById(x).hidden = x!==id; }); };
  if(!session || authMode==='newpass'){ S.me=null; S.profile=null; started=false; show('gate-auth'); return; }
  S.me=session.user.id;
  if(!S.profile || S.profile.id!==S.me){
    let {data}=await sb.from('profiles').select('*').eq('id',S.me).maybeSingle();
    if(!data){ await new Promise(r=>setTimeout(r,800)); ({data}=await sb.from('profiles').select('*').eq('id',S.me).maybeSingle()); }
    S.profile=data?norm(data):{id:S.me,role:'pending',name:''};
  }
  subscribe();
  if(!isMember()){
    show('gate-pending');
    $('#pending-text').textContent=`Hallo ${S.profile.name||''}! Dein Konto wartet auf Freigabe durch den Kommandanten oder App-Master. Sobald du freigeschaltet bist, geht es hier automatisch weiter.`;
    return;
  }
  show('app');
  if(!started){
    started=true;
    await Promise.all(TABLES.map(load));
    const h=location.hash.slice(1);
    let v=VIEWS.includes(h)?h:null;
    if(!v){ try{ v=localStorage.getItem('fhq-view'); }catch(_){} }
    S.view=VIEWS.includes(v)?v:'home';
    if((S.view==='members'&&!canCmd())||(S.view==='lead'&&!canLead())) S.view='home';
  }
  render();
}

/* ---------- Start ---------- */
$('#doc-date').value=today();
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').then(()=>refreshPushState().then(()=>{ if(isMember()) render(); })).catch(()=>{});
if(!sb){
  document.body.innerHTML='<div class="gate"><div class="gate-card"><div class="gate-form"><h2>Noch nicht verbunden</h2><p class="sub">Trag in <b>config.js</b> die Project URL und den anon-Schlüssel deines Supabase-Projekts ein. Die Anleitung steht in der README.</p></div></div></div>';
} else {
  sb.auth.onAuthStateChange((event)=>{
    if(event==='PASSWORD_RECOVERY'){ setAuthMode('newpass'); document.getElementById('gate-auth').hidden=false; document.getElementById('app').hidden=true; document.getElementById('gate-pending').hidden=true; return; }
    if(event==='SIGNED_IN'||event==='SIGNED_OUT'){ if(event==='SIGNED_OUT'){ S.profile=null; sb.removeAllChannels(); channel=null; TABLES.forEach(t=>{ S.data[t]=[]; S.loaded[t]=false; }); } setTimeout(route,0); }
  });
  route();
}
