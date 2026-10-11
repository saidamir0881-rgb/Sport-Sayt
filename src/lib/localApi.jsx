// Backendsiz rejim: barcha ma'lumotlar brauzerning localStorage xotirasida saqlanadi.
// Bu yerda avvalgi Express API'ning kerakli qismi brauzer ichida qayta yozilgan (admin paneldan tashqari).
import { SPORTS, REGIONS, LISTING_SPORTS, LISTING_REGIONS, SCHOLARSHIP_TYPES, LEVELS } from './constants';

const KEY = 'ts_db_v1';
const ALL_SPORTS = 'Barcha sport turlari';
const ALL_REGIONS = 'Butun respublika';
const DAY = 86400000;
const PHONE = /^\+?[0-9]{9,15}$/;

class HttpError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
const fail = (m, s = 400) => { throw new HttpError(m, s); };
const uid = () => Array.from(crypto.getRandomValues(new Uint8Array(12))).map((b) => b.toString(16).padStart(2, '0')).join('');
const nowIso = () => new Date().toISOString();
const isDate = (v) => v && !Number.isNaN(new Date(v).getTime());
const inList = (v, list, msg) => { if (!list.includes(v)) fail(msg); };
const num = (v) => (v === '' || v == null ? undefined : Number(v));

function ageFrom(d) {
  const b = new Date(d);
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a -= 1;
  return a;
}

async function hash(pw, salt) {
  const text = `${salt}:${pw}`;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `s${h}`;
}

/* ---------- Ma'lumotlar bazasi (localStorage) ---------- */
const empty = () => ({ users: [], athletes: [], coaches: [], clubs: [], tryouts: [], scholarships: [], applications: [], achievements: [], notifications: [] });

function seed(db) {
  const iso = (n) => new Date(Date.now() + n * DAY).toISOString();
  const mkUser = (name, key, role) => {
    const u = { _id: uid(), name, email: `${key}@talentsport.demo`, role, salt: '', passHash: '!', isBlocked: false, saved: [], createdAt: nowIso() };
    db.users.push(u);
    return u;
  };
  const o1 = mkUser('Namuna Futbol Akademiyasi', 'club1', 'club');
  const o2 = mkUser('Namuna Kurash Maktabi', 'club2', 'club');
  const c1 = { _id: uid(), owner: o1._id, name: o1.name, logo: '', region: 'Toshkent shahri', sports: ['Futbol'], address: "Namuna ko'cha 1, Toshkent", location: { lat: 41.311, lng: 69.279 }, requirements: '10-16 yosh, asosiy jismoniy tayyorgarlik', description: 'Bu namunaviy (demo) klub.', contact: { phone: '+998900000001', email: 'club1@talentsport.demo', telegram: '' }, status: 'approved', isDemo: true, createdAt: nowIso() };
  const c2 = { _id: uid(), owner: o2._id, name: o2.name, logo: '', region: 'Samarqand', sports: ['Kurash', 'Dzyudo'], address: "Namuna ko'cha 5, Samarqand", location: { lat: 39.654, lng: 66.975 }, requirements: '8-18 yosh', description: 'Bu namunaviy (demo) klub.', contact: { phone: '+998900000002', email: 'club2@talentsport.demo', telegram: '' }, status: 'approved', isDemo: true, createdAt: nowIso() };
  db.clubs.push(c1, c2);
  const t = (o, c, title, sport, region, address, date, deadline, minAge, maxAge, requirements) => ({ _id: uid(), createdBy: o._id, club: c._id, organization: c.name, title, sport, region, address, date: iso(date), deadline: iso(deadline), minAge, maxAge, requirements, description: 'Bu namunaviy (demo) e\'lon.', link: '', status: 'approved', isDemo: true, createdAt: nowIso() });
  db.tryouts.push(
    t(o1, c1, 'Namuna ochiq saralash: yosh futbolchilar', 'Futbol', 'Toshkent shahri', c1.address, 20, 12, 10, 16, 'Sport kiyimi va shaxsiy hujjat'),
    t(o2, c2, 'Namuna kurash saralashi', 'Kurash', 'Samarqand', c2.address, 35, 25, 8, 18, ''),
    t(o1, c1, "Namuna yoz mashg'ulot lageri saralashi", ALL_SPORTS, ALL_REGIONS, 'Toshkent', 50, 40, 12, 17, '')
  );
  const s = (o, title, org, type, sport, region, minAge, maxAge, requirements, deadline) => ({ _id: uid(), createdBy: o._id, organization: org, title, type, sport, region, minAge, maxAge, requirements, description: "Bu namunaviy (demo) e'lon. Haqiqiy imkoniyat emas.", deadline: iso(deadline), link: '', status: 'approved', isDemo: true, createdAt: nowIso() });
  db.scholarships.push(
    s(o1, "Namuna: sport jihozlari uchun yordam", "Namuna Sport Jamg'armasi", 'jihoz', ALL_SPORTS, ALL_REGIONS, 8, 18, 'Sport klubi tavsiyanomasi', 30),
    s(o2, "Namuna: mashg'ulot xarajatlari stipendiyasi", 'Namuna Homiylik Dasturi', 'mashgulot', 'Kurash', 'Samarqand', 10, 18, 'Oxirgi musobaqa natijalari', 45),
    s(o1, 'Namuna: yozgi sport lageri', 'Namuna Lager Tashkiloti', 'lager', 'Futbol', ALL_REGIONS, 10, 16, 'Ota-ona roziligi', 18)
  );
  const yearsAgo = (n) => new Date(Date.now() - n * 365.25 * DAY).toISOString();
  const a1u = mkUser('Namuna Sportchi', 'athlete1', 'athlete');
  const a2u = mkUser('Namuna Futbolchi', 'athlete2', 'athlete');
  const a = (u, first, last, years, sport, region, exp, goals, extra = {}) => ({ _id: uid(), user: u._id, firstName: first, lastName: last, birthDate: yearsAgo(years), sport, region, experienceYears: exp, bio: 'Namunaviy (demo) profil.', avatar: '', goals, phone: '', guardian: {}, media: [], trainingLog: [], certificates: [], competitionResults: [], achievementsCount: 0, isPublic: true, isDemo: true, createdAt: nowIso(), ...extra });
  const p1 = a(a1u, 'Namuna', 'Sportchi', 19, 'Kurash', 'Samarqand', 6, ['club', 'scholarship'], { achievementsCount: 1 });
  const p2 = a(a2u, 'Namuna', 'Futbolchi', 13, 'Futbol', 'Toshkent shahri', 4, ['tryout'], { phone: '+998900000009', guardian: { name: 'Namuna Vakil', phone: '+998900000010', consent: true } });
  db.athletes.push(p1, p2);
  db.achievements.push({ _id: uid(), athlete: p1._id, title: "Namuna: viloyat musobaqasi, 2-o'rin", description: '', date: yearsAgo(1), level: 'viloyat', verified: false, createdAt: nowIso() });
}

function load() {
  let db = null;
  try { const raw = localStorage.getItem(KEY); if (raw) db = JSON.parse(raw); } catch { db = null; }
  if (!db) { db = empty(); seed(db); persist(db); }
  return db;
}
function persist(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {
    throw new HttpError("Brauzer xotirasi to'ldi. Kichikroq rasm tanlang", 507);
  }
}
export function resetLocalData() { localStorage.removeItem(KEY); }

/* ---------- Yordamchilar ---------- */
const need = (c, ...roles) => {
  if (!c.me) fail('Avval tizimga kiring', 401);
  if (roles.length && !roles.includes(c.me.role)) fail("Bu amal uchun ruxsatingiz yo'q", 403);
  return c.me;
};
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });
const withAge = (a) => ({ ...a, age: ageFrom(a.birthDate) });
const toPublic = (a) => {
  const { phone, guardian, birthDate, user, ...rest } = a; // eslint-disable-line no-unused-vars
  const age = ageFrom(birthDate);
  return { ...rest, age, isMinor: age < 18 };
};
const page = (arr, q, def = 12) => {
  const p = Math.max(1, parseInt(q.page, 10) || 1);
  const l = Math.min(50, Math.max(1, parseInt(q.limit, 10) || def));
  return { data: arr.slice((p - 1) * l, p * l), pagination: { page: p, limit: l, total: arr.length, pages: Math.ceil(arr.length / l) } };
};
const newestFirst = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
const notify = (db, userId, { type = 'tizim', title, message, link = '' }) => {
  db.notifications.push({ _id: uid(), user: userId, type, title, message, link, read: false, createdAt: nowIso() });
};
const profileOf = (db, u) => (u.role === 'athlete' ? db.athletes.find((a) => a.user === u._id) : u.role === 'coach' ? db.coaches.find((x) => x.user === u._id) : db.clubs.find((x) => x.owner === u._id)) || null;
const withIds = (arr) => (arr || []).map((x) => ({ ...x, _id: x._id || uid() }));
const textMax = (v, max, msg = 'Matn juda uzun') => { if (v != null && String(v).length > max) fail(msg); return v; };

/* ---------- Autentifikatsiya ---------- */
async function register(c) {
  const d = c.body;
  const { db } = c;
  const name = String(d.name || '').trim();
  if (name.length < 2) fail("Ism kamida 2 ta belgidan iborat bo'lishi kerak");
  if (name.length > 80) fail('Ism juda uzun');
  const email = String(d.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) fail("Email manzili noto'g'ri");
  if (String(d.password || '').length < 8) fail("Parol kamida 8 ta belgidan iborat bo'lishi kerak");
  inList(d.role, ['athlete', 'coach', 'club'], "Rol noto'g'ri");
  inList(d.sport, SPORTS, "Sport turi noto'g'ri");
  inList(d.region, REGIONS, "Hudud noto'g'ri");
  const exp = num(d.experienceYears) ?? 0;
  if (!(exp >= 0 && exp <= 70)) fail("Tajriba noto'g'ri");
  if (db.users.some((u) => u.email === email)) fail("Bu email bilan foydalanuvchi allaqachon ro'yxatdan o'tgan", 409);

  let guardian = {};
  if (d.role === 'athlete') {
    if (name.split(/\s+/).length < 2) fail('Ism va familiyani kiriting');
    if (!isDate(d.birthDate)) fail("Tug'ilgan sanani kiriting");
    const a = ageFrom(d.birthDate);
    if (a < 6 || a > 60) fail("Yosh 6 dan 60 gacha bo'lishi kerak");
    if (a < 18) {
      if (!d.guardianName || !d.guardianPhone || d.guardianConsent !== true) fail("18 yoshgacha bo'lganlar uchun ota-ona yoki qonuniy vakil ma'lumoti va roziligi shart");
      if (!PHONE.test(String(d.guardianPhone).trim())) fail("Telefon raqami noto'g'ri (masalan +998901234567)");
      guardian = { name: String(d.guardianName).trim(), phone: String(d.guardianPhone).trim(), consent: true, consentDate: nowIso() };
    }
  }

  const salt = uid();
  const user = { _id: uid(), name, email, role: d.role, salt, passHash: await hash(d.password, salt), isBlocked: false, saved: [], createdAt: nowIso() };
  db.users.push(user);
  if (d.role === 'athlete') {
    const parts = name.split(/\s+/);
    db.athletes.push({ _id: uid(), user: user._id, firstName: parts[0], lastName: parts.slice(1).join(' '), birthDate: new Date(d.birthDate).toISOString(), sport: d.sport, region: d.region, experienceYears: exp, bio: '', avatar: '', goals: [], phone: '', guardian, media: [], trainingLog: [], certificates: [], competitionResults: [], achievementsCount: 0, isPublic: true, isDemo: false, createdAt: nowIso() });
  } else if (d.role === 'coach') {
    db.coaches.push({ _id: uid(), user: user._id, fullName: name, sport: d.sport, region: d.region, experienceYears: exp, bio: '', avatar: '', certificates: [], status: 'approved', isDemo: false, createdAt: nowIso() });
  } else {
    db.clubs.push({ _id: uid(), owner: user._id, name, logo: '', region: d.region, sports: [d.sport], address: '', location: {}, requirements: '', description: '', contact: { phone: '', email, telegram: '' }, status: 'approved', isDemo: false, createdAt: nowIso() });
  }
  return { success: true, message: "Ro'yxatdan muvaffaqiyatli o'tdingiz", data: { token: user._id, user: publicUser(user) } };
}

async function login(c) {
  const email = String(c.body.email || '').trim().toLowerCase();
  const user = c.db.users.find((u) => u.email === email);
  if (!user || user.passHash === '!' || (await hash(c.body.password || '', user.salt)) !== user.passHash) fail("Email yoki parol noto'g'ri", 401);
  return { success: true, message: 'Tizimga kirdingiz', data: { token: user._id, user: publicUser(user) } };
}

/* ---------- Sportchilar ---------- */
function athletesList(c) {
  const q = c.query;
  let list = c.db.athletes.filter((a) => a.isPublic);
  if (q.sport) list = list.filter((a) => a.sport === q.sport);
  if (q.region) list = list.filter((a) => a.region === q.region);
  const minAge = num(q.minAge); const maxAge = num(q.maxAge); const minExp = num(q.minExperience);
  if (minAge !== undefined) list = list.filter((a) => ageFrom(a.birthDate) >= minAge);
  if (maxAge !== undefined) list = list.filter((a) => ageFrom(a.birthDate) <= maxAge);
  if (minExp !== undefined) list = list.filter((a) => a.experienceYears >= minExp);
  if (q.hasAchievements === 'true') list = list.filter((a) => a.achievementsCount > 0);
  if (q.q) { const s = String(q.q).toLowerCase(); list = list.filter((a) => `${a.firstName} ${a.lastName}`.toLowerCase().includes(s)); }
  list = [...list].sort((a, b) => b.achievementsCount - a.achievementsCount || newestFirst(a, b));
  const r = page(list, q);
  return { success: true, data: r.data.map(toPublic), pagination: r.pagination };
}

function achievementsOf(db, athleteId) {
  return db.achievements.filter((x) => x.athlete === athleteId).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function athleteMe(c) {
  const me = need(c, 'athlete');
  const p = profileOf(c.db, me) || fail('Sportchi profili topilmadi', 404);
  return { success: true, data: { ...withAge(p), achievements: achievementsOf(c.db, p._id) } };
}

function athleteGet(c, id) {
  const a = c.db.athletes.find((x) => x._id === id);
  const privileged = c.me && a && a.user === c.me._id;
  if (!a || (!a.isPublic && !privileged)) fail('Sportchi topilmadi', 404);
  return { success: true, data: { ...(privileged ? withAge(a) : toPublic(a)), achievements: achievementsOf(c.db, a._id) } };
}

function athleteUpdate(c, id) {
  const me = need(c, 'athlete');
  const a = c.db.athletes.find((x) => x._id === id) || fail('Sportchi topilmadi', 404);
  if (a.user !== me._id) fail("Bu profilni tahrirlashga ruxsatingiz yo'q", 403);
  const b = c.body;
  if (b.sport !== undefined) { inList(b.sport, SPORTS, "Sport turi noto'g'ri"); a.sport = b.sport; }
  if (b.region !== undefined) { inList(b.region, REGIONS, "Hudud noto'g'ri"); a.region = b.region; }
  if (b.experienceYears !== undefined) { const e = Number(b.experienceYears); if (!(e >= 0 && e <= 60)) fail("Tajriba noto'g'ri"); a.experienceYears = e; }
  if (b.bio !== undefined) a.bio = textMax(b.bio, 2000);
  if (b.avatar !== undefined) a.avatar = b.avatar;
  if (b.phone !== undefined) { if (b.phone && !PHONE.test(b.phone)) fail("Telefon raqami noto'g'ri (masalan +998901234567)"); a.phone = b.phone; }
  if (b.isPublic !== undefined) a.isPublic = !!b.isPublic;
  if (b.goals !== undefined) a.goals = (b.goals || []).filter((g) => ['club', 'coach', 'scholarship', 'tryout'].includes(g));
  if (b.media !== undefined) a.media = withIds(b.media).map((m) => ({ _id: m._id, type: m.type === 'video' ? 'video' : 'image', url: m.url, caption: m.caption || '' }));
  if (b.trainingLog !== undefined) a.trainingLog = withIds(b.trainingLog).map((x) => { if (!x.title) fail("Mashg'ulot nomi kerak"); return x; });
  if (b.competitionResults !== undefined) a.competitionResults = withIds(b.competitionResults).map((x) => { if (!x.event) fail('Musobaqa nomi kerak'); return x; });
  if (b.certificates !== undefined) a.certificates = withIds(b.certificates).map((x) => { if (!x.title) fail('Sertifikat nomi kerak'); return { _id: x._id, title: x.title, url: x.url || '', verified: false }; });
  return { success: true, message: 'Profil saqlandi', data: withAge(a) };
}

/* ---------- Murabbiylar va klublar ---------- */
function coachesList(c) {
  const q = c.query;
  let list = c.db.coaches.filter((x) => x.status === 'approved');
  if (q.sport) list = list.filter((x) => x.sport === q.sport);
  if (q.region) list = list.filter((x) => x.region === q.region);
  if (q.q) list = list.filter((x) => x.fullName.toLowerCase().includes(String(q.q).toLowerCase()));
  const r = page([...list].sort(newestFirst), q);
  return { success: true, data: r.data.map(({ user, ...rest }) => rest), pagination: r.pagination }; // eslint-disable-line no-unused-vars
}
function coachGet(c, id) {
  const x = c.db.coaches.find((k) => k._id === id) || fail('Murabbiy topilmadi', 404);
  const own = c.me && x.user === c.me._id;
  if (x.status !== 'approved' && !own) fail('Murabbiy topilmadi', 404);
  const { user, ...rest } = x; // eslint-disable-line no-unused-vars
  return { success: true, data: own ? x : rest };
}
function coachUpdate(c) {
  const me = need(c, 'coach');
  const x = profileOf(c.db, me) || fail('Murabbiy profili topilmadi', 404);
  const b = c.body;
  if (b.fullName !== undefined) { if (String(b.fullName).trim().length < 2) fail("To'liq ism kamida 2 ta belgi bo'lsin"); x.fullName = String(b.fullName).trim(); }
  if (b.sport !== undefined) { inList(b.sport, SPORTS, "Sport turi noto'g'ri"); x.sport = b.sport; }
  if (b.region !== undefined) { inList(b.region, REGIONS, "Hudud noto'g'ri"); x.region = b.region; }
  if (b.experienceYears !== undefined) { const e = Number(b.experienceYears); if (!(e >= 0 && e <= 70)) fail("Tajriba noto'g'ri"); x.experienceYears = e; }
  if (b.bio !== undefined) x.bio = textMax(b.bio, 2000);
  if (b.avatar !== undefined) x.avatar = b.avatar;
  if (b.certificates !== undefined) x.certificates = withIds(b.certificates).map((k) => { if (!k.title) fail('Sertifikat nomi kerak'); return { _id: k._id, title: k.title, url: k.url || '' }; });
  return { success: true, message: 'Profil saqlandi', data: x };
}

function clubsList(c) {
  const q = c.query;
  let list = c.db.clubs.filter((x) => x.status === 'approved');
  if (q.sport) list = list.filter((x) => x.sports.includes(q.sport));
  if (q.region) list = list.filter((x) => x.region === q.region);
  if (q.q) list = list.filter((x) => x.name.toLowerCase().includes(String(q.q).toLowerCase()));
  const r = page([...list].sort(newestFirst), q);
  return { success: true, data: r.data.map(({ owner, ...rest }) => rest), pagination: r.pagination }; // eslint-disable-line no-unused-vars
}
function clubGet(c, id) {
  const x = c.db.clubs.find((k) => k._id === id) || fail('Klub topilmadi', 404);
  const own = c.me && x.owner === c.me._id;
  if (x.status !== 'approved' && !own) fail('Klub topilmadi', 404);
  const { owner, ...rest } = x; // eslint-disable-line no-unused-vars
  return { success: true, data: own ? x : rest };
}
function clubUpdate(c, id) {
  const me = need(c, 'club');
  const x = c.db.clubs.find((k) => k._id === id) || fail('Klub topilmadi', 404);
  if (x.owner !== me._id) fail("Bu klubni tahrirlashga ruxsatingiz yo'q", 403);
  const b = c.body;
  if (b.name !== undefined) { if (String(b.name).trim().length < 2) fail("Klub nomi kamida 2 ta belgi bo'lsin"); x.name = String(b.name).trim(); }
  if (b.logo !== undefined) x.logo = b.logo;
  if (b.region !== undefined) { inList(b.region, REGIONS, "Hudud noto'g'ri"); x.region = b.region; }
  if (b.sports !== undefined) { if (!b.sports.length) fail('Kamida bitta sport turini tanlang'); b.sports.forEach((s) => inList(s, SPORTS, "Sport turi noto'g'ri")); x.sports = b.sports; }
  if (b.address !== undefined) x.address = textMax(b.address, 250);
  if (b.requirements !== undefined) x.requirements = textMax(b.requirements, 2000);
  if (b.description !== undefined) x.description = textMax(b.description, 3000);
  if (b.location) {
    const { lat, lng } = b.location;
    if (!(lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)) fail("Koordinatalar noto'g'ri");
    x.location = { lat, lng };
  }
  if (b.contact) x.contact = { phone: b.contact.phone || '', email: b.contact.email || '', telegram: b.contact.telegram || '' };
  return { success: true, message: "Klub ma'lumotlari saqlandi", data: x };
}

/* ---------- Saralash va stipendiya e'lonlari ---------- */
function makeListing(key, label, creators, build) {
  const listFn = (c) => {
    const q = c.query;
    let list = c.db[key].filter((x) => x.status === 'approved' && new Date(x.deadline) >= new Date());
    if (q.sport) list = list.filter((x) => x.sport === q.sport || x.sport === ALL_SPORTS);
    if (q.region) list = list.filter((x) => x.region === q.region || x.region === ALL_REGIONS);
    const age = num(q.age);
    if (age !== undefined) list = list.filter((x) => x.minAge <= age && x.maxAge >= age);
    if (q.q) list = list.filter((x) => x.title.toLowerCase().includes(String(q.q).toLowerCase()));
    const r = page([...list].sort((a, b) => new Date(a.deadline) - new Date(b.deadline)), q);
    return { success: true, data: r.data, pagination: r.pagination };
  };
  const mine = (c) => {
    const me = need(c, ...creators);
    const r = page(c.db[key].filter((x) => x.createdBy === me._id).sort(newestFirst), c.query, 50);
    return { success: true, data: r.data, pagination: r.pagination };
  };
  const getOne = (c, id) => {
    const x = c.db[key].find((k) => k._id === id) || fail(`${label} topilmadi`, 404);
    const own = c.me && x.createdBy === c.me._id;
    if (x.status !== 'approved' && !own) fail(`${label} topilmadi`, 404);
    return { success: true, data: { ...x, expired: new Date(x.deadline) < new Date() } };
  };
  const create = (c) => {
    const me = need(c, ...creators);
    const profile = profileOf(c.db, me);
    const organization = me.role === 'club' ? profile.name : profile.fullName;
    const doc = build(c.body, organization);
    const rec = { _id: uid(), createdBy: me._id, organization, ...doc, status: 'approved', isDemo: false, createdAt: nowIso() };
    if (key === 'tryouts' && me.role === 'club') rec.club = profile._id;
    c.db[key].push(rec);
    return { success: true, message: "E'lon joylandi", data: rec };
  };
  const remove = (c, id) => {
    const me = need(c);
    const x = c.db[key].find((k) => k._id === id) || fail(`${label} topilmadi`, 404);
    if (x.createdBy !== me._id) fail("Bu e'lonni o'chirishga ruxsatingiz yo'q", 403);
    c.db[key] = c.db[key].filter((k) => k._id !== id);
    return { success: true, message: "E'lon o'chirildi" };
  };
  return { listFn, mine, getOne, create, remove };
}

function commonListing(b) {
  const title = String(b.title || '').trim();
  if (title.length < 3) fail("Nomi kamida 3 ta belgi bo'lsin");
  textMax(title, 150);
  inList(b.sport, LISTING_SPORTS, "Sport turi noto'g'ri");
  const region = b.region || ALL_REGIONS;
  inList(region, LISTING_REGIONS, "Hudud noto'g'ri");
  const minAge = num(b.minAge) ?? 0; const maxAge = num(b.maxAge) ?? 99;
  if (!(minAge >= 0 && maxAge <= 99 && minAge >= 0)) fail("Yosh noto'g'ri");
  if (minAge > maxAge) fail("Minimal yosh maksimal yoshdan katta bo'lishi mumkin emas");
  if (!isDate(b.deadline) || new Date(b.deadline) <= new Date()) fail("Ro'yxatdan o'tish muddati kelajakda bo'lishi kerak");
  return { title, sport: b.sport, region, minAge, maxAge, description: textMax(b.description || '', 3000), link: textMax(b.link || '', 300), deadline: new Date(b.deadline).toISOString() };
}
const tryouts = makeListing('tryouts', 'Saralash', ['club', 'coach'], (b) => {
  const base = commonListing(b);
  if (String(b.address || '').trim().length < 3) fail('Manzilni kiriting');
  if (!isDate(b.date) || new Date(b.date) <= new Date()) fail("Tadbir sanasi kelajakda bo'lishi kerak");
  if (new Date(b.deadline) > new Date(b.date)) fail("Ro'yxatdan o'tish muddati tadbir sanasidan oldin bo'lishi kerak");
  return { ...base, address: String(b.address).trim(), date: new Date(b.date).toISOString(), requirements: textMax(b.requirements || '', 2000) };
});
const scholarships = makeListing('scholarships', 'Stipendiya', ['club'], (b) => {
  const base = commonListing(b);
  inList(b.type, SCHOLARSHIP_TYPES.map((t) => t.value), "Yordam turi noto'g'ri");
  if (String(b.requirements || '').trim().length < 3) fail('Talablarni kiriting');
  return { ...base, type: b.type, requirements: textMax(String(b.requirements).trim(), 2000) };
});

/* ---------- Arizalar va takliflar ---------- */
const MODEL = { club: 'Club', tryout: 'Tryout', scholarship: 'Scholarship', coach: 'CoachProfile' };
function findTarget(db, model, id) {
  if (model === 'Club') return db.clubs.find((x) => x._id === id);
  if (model === 'Tryout') return db.tryouts.find((x) => x._id === id);
  if (model === 'Scholarship') return db.scholarships.find((x) => x._id === id);
  return db.coaches.find((x) => x._id === id);
}
const brief = (t) => (t ? { _id: t._id, title: t.title, name: t.name, fullName: t.fullName, organization: t.organization, date: t.date, deadline: t.deadline, sport: t.sport, region: t.region } : null);

function appCreate(c) {
  const me = need(c, 'athlete');
  const { db } = c;
  const ath = profileOf(db, me) || fail('Avval sportchi profilini yarating', 400);
  if (ageFrom(ath.birthDate) < 18 && !ath.guardian?.consent) fail('Ariza yuborish uchun ota-ona yoki qonuniy vakil roziligi kerak', 403);
  const { targetType, targetId, message } = c.body;
  inList(targetType, ['club', 'tryout', 'scholarship'], "Ariza turi noto'g'ri");
  const model = MODEL[targetType];
  const t = findTarget(db, model, targetId);
  if (!t || t.status !== 'approved') fail(targetType === 'club' ? 'Klub topilmadi' : "E'lon topilmadi", 404);
  if (targetType !== 'club' && new Date(t.deadline) < new Date()) fail("Ro'yxatdan o'tish muddati tugagan", 400);
  textMax(message, 1000, 'Xabar juda uzun');
  const ownerId = targetType === 'club' ? t.owner : t.createdBy;
  let app = db.applications.find((a) => a.kind === 'application' && a.athlete === ath._id && a.targetModel === model && a.target === t._id);
  if (app && app.status !== 'withdrawn') fail('Siz allaqachon ariza yuborgansiz', 409);
  if (app) Object.assign(app, { status: 'pending', message: message || '', responseNote: '' });
  else {
    app = { _id: uid(), kind: 'application', athlete: ath._id, sender: me._id, owner: ownerId, targetModel: model, target: t._id, message: message || '', status: 'pending', responseNote: '', createdAt: nowIso() };
    db.applications.push(app);
  }
  notify(db, ownerId, { type: 'ariza', title: 'Yangi ariza', message: `${ath.firstName} ${ath.lastName} "${t.title || t.name}" uchun ariza yubordi`, link: '/profilim?tab=arizalar' });
  return { success: true, message: 'Ariza yuborildi', data: app };
}

function appMine(c) {
  const me = need(c, 'athlete');
  const ath = profileOf(c.db, me) || fail('Sportchi profili topilmadi', 404);
  let list = c.db.applications.filter((a) => a.athlete === ath._id);
  if (['application', 'invitation'].includes(c.query.kind)) list = list.filter((a) => a.kind === c.query.kind);
  const r = page([...list].sort(newestFirst), c.query, 10);
  const data = r.data.map((a) => {
    const s = c.db.users.find((u) => u._id === a.sender);
    return { ...a, target: brief(findTarget(c.db, a.targetModel, a.target)), sender: s ? { name: s.name, role: s.role } : null };
  });
  return { success: true, data, pagination: r.pagination };
}

function appReceived(c) {
  const me = need(c, 'club', 'coach');
  let list = c.db.applications.filter((a) => a.owner === me._id && a.kind === 'application');
  if (['pending', 'accepted', 'rejected', 'withdrawn'].includes(c.query.status)) list = list.filter((a) => a.status === c.query.status);
  const r = page([...list].sort(newestFirst), c.query, 10);
  const data = r.data.map((a) => {
    const p = c.db.athletes.find((x) => x._id === a.athlete);
    const athlete = p ? { _id: p._id, firstName: p.firstName, lastName: p.lastName, sport: p.sport, region: p.region, avatar: p.avatar, experienceYears: p.experienceYears, achievementsCount: p.achievementsCount, age: ageFrom(p.birthDate) } : null;
    return { ...a, athlete, target: brief(findTarget(c.db, a.targetModel, a.target)) };
  });
  return { success: true, data, pagination: r.pagination };
}

function appStatus(c, id) {
  const me = need(c);
  const { db } = c;
  const app = db.applications.find((a) => a._id === id) || fail('Ariza topilmadi', 404);
  const { status, responseNote } = c.body;
  inList(status, ['accepted', 'rejected', 'withdrawn'], "Holat noto'g'ri");
  if (status === 'withdrawn') { if (app.sender !== me._id) fail('Faqat yuboruvchi arizani qaytarib olishi mumkin', 403); } else if (app.owner !== me._id) fail("Bu arizaga javob berishga ruxsatingiz yo'q", 403);
  if (app.status !== 'pending') fail("Arizaning holati allaqachon o'zgargan", 400);
  app.status = status;
  app.responseNote = responseNote || '';
  const labels = { accepted: 'qabul qilindi', rejected: 'rad etildi', withdrawn: 'qaytarib olindi' };
  const word = app.kind === 'invitation' ? 'Taklif' : 'Ariza';
  notify(db, status === 'withdrawn' ? app.owner : app.sender, { type: 'holat', title: `${word} holati yangilandi`, message: `${word} ${labels[status]}${responseNote ? `: ${responseNote}` : ''}`, link: app.kind === 'invitation' ? '/profilim?tab=takliflar' : '/profilim?tab=arizalar' });
  return { success: true, message: `${word} ${labels[status]}`, data: app };
}

function appInvite(c) {
  const me = need(c, 'coach');
  const { db } = c;
  const coach = profileOf(db, me);
  const ath = db.athletes.find((a) => a._id === c.body.athleteId && a.isPublic) || fail('Sportchi topilmadi', 404);
  let model = 'CoachProfile'; let target = coach._id; let title = 'suhbat';
  if (c.body.tryoutId) {
    const t = db.tryouts.find((x) => x._id === c.body.tryoutId && x.createdBy === me._id && x.status === 'approved' && new Date(x.deadline) >= new Date()) || fail("Saralash e'loni topilmadi yoki faol emas", 404);
    model = 'Tryout'; target = t._id; title = `"${t.title}" saralashi`;
  }
  if (db.applications.some((a) => a.kind === 'invitation' && a.athlete === ath._id && a.sender === me._id && a.target === target && a.status === 'pending')) fail('Bu sportchiga taklif allaqachon yuborilgan', 409);
  const inv = { _id: uid(), kind: 'invitation', athlete: ath._id, sender: me._id, owner: ath.user, targetModel: model, target, message: textMax(c.body.message || '', 1000, 'Xabar juda uzun'), status: 'pending', responseNote: '', createdAt: nowIso() };
  db.applications.push(inv);
  notify(db, ath.user, { type: 'taklif', title: 'Yangi taklif', message: `${coach.fullName} sizni ${title}ga taklif qildi`, link: '/profilim?tab=takliflar' });
  return { success: true, message: 'Taklif yuborildi', data: inv };
}

/* ---------- Yutuqlar, bildirishnomalar, saqlanganlar ---------- */
function achCreate(c) {
  const me = need(c, 'athlete');
  const ath = profileOf(c.db, me) || fail('Sportchi profili topilmadi', 404);
  const b = c.body;
  if (String(b.title || '').trim().length < 2) fail('Yutuq nomini kiriting');
  if (!isDate(b.date) || new Date(b.date) > new Date()) fail("Sana noto'g'ri yoki kelajakda");
  const level = b.level || 'maktab';
  inList(level, LEVELS.map((l) => l.value), "Daraja noto'g'ri");
  const rec = { _id: uid(), athlete: ath._id, title: String(b.title).trim(), description: textMax(b.description || '', 1000), date: new Date(b.date).toISOString(), level, verified: false, createdAt: nowIso() };
  c.db.achievements.push(rec);
  ath.achievementsCount += 1;
  return { success: true, message: "Yutuq qo'shildi (tekshirilmagan holatda)", data: rec };
}
function achRemove(c, id) {
  const me = need(c, 'athlete');
  const ach = c.db.achievements.find((x) => x._id === id) || fail('Yutuq topilmadi', 404);
  const ath = c.db.athletes.find((a) => a._id === ach.athlete);
  if (!ath || ath.user !== me._id) fail("Bu yutuqni o'chirishga ruxsatingiz yo'q", 403);
  c.db.achievements = c.db.achievements.filter((x) => x._id !== id);
  ath.achievementsCount = Math.max(0, ath.achievementsCount - 1);
  return { success: true, message: "Yutuq o'chirildi" };
}

function notifList(c) {
  const me = need(c);
  const mineN = c.db.notifications.filter((n) => n.user === me._id).sort(newestFirst);
  const r = page(mineN, c.query, 20);
  return { success: true, data: r.data, pagination: r.pagination, unread: mineN.filter((n) => !n.read).length };
}
function notifRead(c, id) {
  const me = need(c);
  const n = c.db.notifications.find((x) => x._id === id && x.user === me._id) || fail('Bildirishnoma topilmadi', 404);
  n.read = true;
  return { success: true, data: n };
}
function notifReadAll(c) {
  const me = need(c);
  c.db.notifications.forEach((n) => { if (n.user === me._id) n.read = true; });
  return { success: true, message: "Barcha bildirishnomalar o'qilgan deb belgilandi" };
}

function savedList(c) {
  const me = need(c);
  const data = (me.saved || []).map((s) => ({ targetModel: s.targetModel, item: findTarget(c.db, s.targetModel, s.target) })).filter((x) => x.item);
  return { success: true, data };
}
function savedToggle(c) {
  const me = need(c);
  const { targetType, targetId } = c.body;
  inList(targetType, ['tryout', 'scholarship', 'club'], "Obyekt turi noto'g'ri");
  const model = MODEL[targetType];
  const t = findTarget(c.db, model, targetId);
  if (!t || t.status !== 'approved') fail('Obyekt topilmadi', 404);
  const idx = me.saved.findIndex((s) => s.targetModel === model && s.target === targetId);
  if (idx >= 0) me.saved.splice(idx, 1); else me.saved.push({ targetModel: model, target: targetId });
  return { success: true, saved: idx < 0, message: idx < 0 ? 'Saqlandi' : 'Saqlanganlardan olib tashlandi' };
}

/* ---------- Statistika va tavsiyalar ---------- */
function stats(c) {
  const n = new Date();
  const { db } = c;
  const active = (x) => x.status === 'approved' && new Date(x.deadline) >= n;
  const demo = [...db.athletes, ...db.clubs, ...db.tryouts, ...db.scholarships].some((x) => x.isDemo);
  return { success: true, data: { athletes: db.athletes.filter((a) => a.isPublic).length, clubs: db.clubs.filter((x) => x.status === 'approved').length, tryouts: db.tryouts.filter(active).length, scholarships: db.scholarships.filter(active).length, includesDemoData: demo } };
}

function scoreListing(item, ath, type, age) {
  const reasons = []; let score = 0;
  if (!(item.sport === ath.sport || item.sport === ALL_SPORTS)) return null;
  score += item.sport === ath.sport ? 40 : 15;
  reasons.push(item.sport === ath.sport ? `Sport turi mos: ${ath.sport}` : 'Barcha sport turlari uchun ochiq');
  if (item.region === ath.region) { score += 25; reasons.push(`Hududingiz mos: ${ath.region}`); } else if (item.region === ALL_REGIONS) { score += 10; reasons.push("Butun respublika bo'ylab"); } else reasons.push(`Boshqa hudud: ${item.region}`);
  if (age < item.minAge || age > item.maxAge) return null;
  score += 20; reasons.push(`Yoshingiz talabga mos (${item.minAge}-${item.maxAge})`);
  const left = Math.ceil((new Date(item.deadline) - Date.now()) / DAY);
  if (left <= 14) { score += 10; reasons.push(`Muddat yaqin: ${left} kun qoldi`); }
  if (ath.goals.includes(type)) { score += 5; reasons.push('Tanlagan maqsadingizga mos'); }
  return { score, reasons };
}
function recommendations(c) {
  const me = need(c, 'athlete');
  const ath = profileOf(c.db, me) || fail('Sportchi profili topilmadi', 404);
  const age = ageFrom(ath.birthDate);
  const n = new Date();
  const res = [];
  c.db.tryouts.filter((t) => t.status === 'approved' && new Date(t.deadline) >= n).forEach((t) => { const s = scoreListing(t, ath, 'tryout', age); if (s) res.push({ type: 'tryout', item: t, ...s }); });
  c.db.scholarships.filter((t) => t.status === 'approved' && new Date(t.deadline) >= n).forEach((t) => { const s = scoreListing(t, ath, 'scholarship', age); if (s) res.push({ type: 'scholarship', item: t, ...s }); });
  c.db.clubs.filter((k) => k.status === 'approved' && k.sports.includes(ath.sport)).forEach((k) => {
    let score = 40; const reasons = [`Klub ${ath.sport} yo'nalishida ishlaydi`];
    if (k.region === ath.region) { score += 25; reasons.push(`Hududingiz mos: ${ath.region}`); }
    if (ath.goals.includes('club')) { score += 5; reasons.push('Tanlagan maqsadingizga mos'); }
    const { owner, ...item } = k; // eslint-disable-line no-unused-vars
    res.push({ type: 'club', item, score, reasons });
  });
  res.sort((a, b) => b.score - a.score);
  return { success: true, data: res.slice(0, 20), disclaimer: "Tavsiyalar faqat sport turi, hudud, yosh va muddat mosligiga asoslangan. Bu professional sport qobiliyatining bahosi emas." };
}

/* ---------- Rasm yuklash (brauzer xotirasiga, kichraytirilgan holda) ---------- */
async function upload(c) {
  need(c);
  const file = c.formData?.file;
  if (!file) fail('Fayl tanlanmagan');
  if (!file.type.startsWith('image/')) fail("Backendsiz rejimda faqat rasm yuklash mumkin (video qo'llab-quvvatlanmaydi)");
  const src = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error("Faylni o'qib bo'lmadi")); r.readAsDataURL(file); });
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("Rasm formati noto'g'ri")); i.src = src; });
  const scale = Math.min(1, 900 / Math.max(img.width, img.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
  cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
  return { success: true, message: 'Fayl yuklandi', data: { url: cv.toDataURL('image/jpeg', 0.8), type: 'image' } };
}

/* ---------- Marshrutlar ---------- */
const routes = [
  ['POST', /^\/auth\/register$/, register],
  ['POST', /^\/auth\/login$/, login],
  ['GET', /^\/auth\/me$/, (c) => { const me = need(c); return { success: true, data: { user: publicUser(me), profile: profileOf(c.db, me) } }; }],
  ['GET', /^\/athletes$/, athletesList],
  ['GET', /^\/athletes\/me$/, athleteMe],
  ['GET', /^\/athletes\/([^/]+)$/, athleteGet],
  ['PUT', /^\/athletes\/([^/]+)$/, athleteUpdate],
  ['GET', /^\/coaches$/, coachesList],
  ['GET', /^\/coaches\/me$/, (c) => { const me = need(c, 'coach'); return { success: true, data: profileOf(c.db, me) || fail('Murabbiy profili topilmadi', 404) }; }],
  ['PUT', /^\/coaches\/me$/, coachUpdate],
  ['GET', /^\/coaches\/([^/]+)$/, coachGet],
  ['GET', /^\/clubs$/, clubsList],
  ['GET', /^\/clubs\/me$/, (c) => { const me = need(c, 'club'); return { success: true, data: profileOf(c.db, me) || fail('Klub profili topilmadi', 404) }; }],
  ['GET', /^\/clubs\/([^/]+)$/, clubGet],
  ['PUT', /^\/clubs\/([^/]+)$/, clubUpdate],
  ['GET', /^\/tryouts$/, tryouts.listFn],
  ['GET', /^\/tryouts\/mine$/, tryouts.mine],
  ['GET', /^\/tryouts\/([^/]+)$/, tryouts.getOne],
  ['POST', /^\/tryouts$/, tryouts.create],
  ['DELETE', /^\/tryouts\/([^/]+)$/, tryouts.remove],
  ['GET', /^\/scholarships$/, scholarships.listFn],
  ['GET', /^\/scholarships\/mine$/, scholarships.mine],
  ['GET', /^\/scholarships\/([^/]+)$/, scholarships.getOne],
  ['POST', /^\/scholarships$/, scholarships.create],
  ['DELETE', /^\/scholarships\/([^/]+)$/, scholarships.remove],
  ['POST', /^\/applications$/, appCreate],
  ['GET', /^\/applications\/mine$/, appMine],
  ['GET', /^\/applications\/received$/, appReceived],
  ['POST', /^\/applications\/invite$/, appInvite],
  ['PATCH', /^\/applications\/([^/]+)\/status$/, appStatus],
  ['POST', /^\/achievements$/, achCreate],
  ['DELETE', /^\/achievements\/([^/]+)$/, achRemove],
  ['GET', /^\/notifications$/, notifList],
  ['PATCH', /^\/notifications\/read-all$/, notifReadAll],
  ['PATCH', /^\/notifications\/([^/]+)\/read$/, notifRead],
  ['GET', /^\/users\/saved$/, savedList],
  ['POST', /^\/users\/saved$/, savedToggle],
  ['GET', /^\/recommendations$/, recommendations],
  ['GET', /^\/stats$/, stats],
  ['POST', /^\/uploads$/, upload],
];

export async function handle({ path, method, body, query, formData, token }) {
  const db = load();
  const me = token ? db.users.find((u) => u._id === token) || null : null;
  if (token && !me) fail('Sessiya yaroqsiz yoki muddati tugagan. Qayta kiring', 401);
  const ctx = { db, me, body: body || {}, query: query || {}, formData };
  for (const [m, re, fn] of routes) {
    if (m !== method) continue;
    const match = path.match(re);
    if (match) {
      const res = await fn(ctx, ...match.slice(1));
      if (method !== 'GET') persist(db);
      return JSON.parse(JSON.stringify(res));
    }
  }
  return fail('Manzil topilmadi', 404);
}
