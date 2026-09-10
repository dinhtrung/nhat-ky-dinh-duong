'use strict';
/* =====================================================================
   Nhật Ký Dinh Dưỡng — PWA tĩnh, không build step
   Hằng số đặt ở đầu file để tránh TDZ (bài học từ app thuốc lá).
   Ba khoá localStorage: meal_log (bữa ăn theo ngày) · meal_config (hồ sơ +
   mục tiêu + macro) · meal_foods (món tự khai báo + yêu thích).
   ===================================================================== */

const APP_VERSION = 'v1.2.0';
const KEY_LOG = 'meal_log';
const KEY_CONFIG = 'meal_config';
const KEY_FOODS = 'meal_foods';
const KEY_LIB_CACHE = 'meal_library_cache';
const DATA_URL = 'data/foods.json';

const KEEP_DAYS = 31;            // dọn dữ liệu cũ hơn 31 ngày
const KCAL_STEP = 10;            // làm tròn mục tiêu kcal
const QUICK_PICK_LIMIT = 8;
const QUICK_PICK_DAYS = 30;
const PORTION_CHOICES = [0.5, 1, 1.5, 2];
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const MEALS = [
  { id: 'breakfast', label: 'Sáng', emoji: '🌅' },
  { id: 'lunch', label: 'Trưa', emoji: '🍚' },
  { id: 'afternoon', label: 'Chiều', emoji: '🍵' },
  { id: 'dinner', label: 'Tối', emoji: '🌙' },
  { id: 'snack', label: 'Ăn vặt', emoji: '🍿' },
];
const MEAL_IDS = MEALS.map((m) => m.id);
const MEAL_LABEL = {};
MEALS.forEach((m) => { MEAL_LABEL[m.id] = m.label; });
const MEAL_EMOJI = {};
MEALS.forEach((m) => { MEAL_EMOJI[m.id] = m.emoji; });

const GROUPS = [
  { id: 'main', label: 'Món chính' },
  { id: 'side', label: 'Món phụ' },
  { id: 'soup', label: 'Canh · rau' },
  { id: 'fruit', label: 'Trái cây' },
  { id: 'drink', label: 'Đồ uống' },
  { id: 'snack', label: 'Ăn vặt' },
];
const GROUP_IDS = GROUPS.map((g) => g.id);
const GROUP_LABEL = {};
GROUPS.forEach((g) => { GROUP_LABEL[g.id] = g.label; });

const ACTIVITY_LEVELS = [
  { id: 'sed', label: 'Ít vận động (ngồi nhiều)', short: 'Ít vận động', factor: 1.2 },
  { id: 'light', label: 'Vận động nhẹ (1–3 buổi/tuần)', short: 'Vận động nhẹ', factor: 1.375 },
  { id: 'moderate', label: 'Vận động vừa (3–5 buổi/tuần)', short: 'Vận động vừa', factor: 1.55 },
  { id: 'high', label: 'Vận động nhiều (6–7 buổi/tuần)', short: 'Vận động nhiều', factor: 1.725 },
];
const ACTIVITY_BY_ID = {};
ACTIVITY_LEVELS.forEach((a) => { ACTIVITY_BY_ID[a.id] = a; });

const GOALS = [
  { id: 'lose', label: 'Giảm cân', adj: -0.15, note: '−15%' },
  { id: 'keep', label: 'Giữ cân', adj: 0, note: '0%' },
  { id: 'gain', label: 'Tăng cân', adj: 0.1, note: '+10%' },
];
const GOAL_BY_ID = {};
GOALS.forEach((g) => { GOAL_BY_ID[g.id] = g; });

const MACRO_PRESETS = [
  { id: 'lose', label: 'Giảm cân 30/35/35', protein: 30, carb: 35, fat: 35 },
  { id: 'keep', label: 'Giữ dáng 25/45/30', protein: 25, carb: 45, fat: 30 },
  { id: 'muscle', label: 'Tăng cơ 30/45/25', protein: 30, carb: 45, fat: 25 },
];
const DEFAULT_MACRO = { protein: 25, carb: 45, fat: 30 };

/* Icon SVG (stroke=currentColor) — nút thao tác phụ dùng icon, không dùng chữ */
const IC = {
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M13.5 6.5l4 4"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 7V5h4v2M6.5 7l.9 12.1a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4L17.5 7"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.6l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.8l5.9-.9L12 3.6Z"/></svg>',
  starOn: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.6l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.8l5.9-.9L12 3.6Z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5h3l1.5-2h7L17 8.5h3v10.5H4z"/><circle cx="12" cy="13.5" r="3.4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7"/></svg>',
  square: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="5" y="5" width="14" height="14" rx="3"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="M7.5 11 12 15.5 16.5 11"/><path d="M5 19h14"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V5"/><path d="M7.5 9.5 12 5l4.5 4.5"/><path d="M5 19h14"/></svg>',
};

/* Hằng số OCR hoá đơn — xem openspec/changes/add-bill-ocr/design.md (D1/D2/D3) */
const OCR = {
  libPath: 'vendor/tesseract/tesseract.min.js',
  workerPath: 'vendor/tesseract/worker.min.js',
  corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.1.2/',
  langPath: 'https://tessdata.projectnaptha.com/4.0.0',
  lang: 'vie',
  maxEdge: 1600,     // cạnh dài tối đa đưa vào OCR
  maxRows: 40,       // số dòng món tối đa giữ lại
  matchMin: 0.45,    // ngưỡng tự gán món; dưới ngưỡng → để người dùng chọn
};

/* Giải thích 3 macro (chạm vào Đạm/Carb/Béo để xem) */
const MACRO_INFO = {
  protein: {
    label: 'Đạm',
    full: 'Đạm (protein)',
    kcalPerGram: 4,
    role: 'Xây và sửa cơ, giữ cơ khi giảm cân, giúp no lâu và ổn định đường huyết.',
    sources: ['Thịt bò/gà/heo nạc, cá, tôm, trứng', 'Đậu phụ, đậu đỗ, sữa chua, sữa tươi', 'Hạt: hạnh nhân, điều, đậu phộng'],
    verdictTone: 'ok',
    verdict: 'Không nên hạn chế — phần lớn người Việt ăn thiếu đạm.',
    tip: 'Người tập đều: 1,2–1,6 g cho mỗi kg cân nặng (bạn ~cân nặng × 1,4 g). Ít vận động: 1 g/kg là đủ. Đang giảm cân càng cần đủ đạm để không mất cơ. (Bệnh thận thì theo chỉ định bác sĩ.)',
  },
  carb: {
    label: 'Carb',
    full: 'Carb (tinh bột & đường)',
    kcalPerGram: 4,
    role: 'Nguồn năng lượng chính cho não và cơ — đặc biệt quan trọng khi chạy/đạp xe.',
    sources: ['Cơm, bún, phở, bánh mì, xôi, bánh cuốn', 'Khoai lang, yến mạch, ngô, gạo lứt', 'Trái cây, sữa, đường, nước ngọt, bia'],
    verdictTone: 'watch',
    verdict: 'Kiểm soát — không cần cắt hẳn, nhưng nên chọn loại tốt.',
    tip: 'Ưu tiên carb chậm (gạo lứt, khoai, yến mạch) và hạn chế uống calo (nước ngọt, trà sữa, bia). Nếu vượt mục tiêu liên tục: bớt nửa bát cơm/bún trước, đừng cắt trái cây.',
  },
  fat: {
    label: 'Béo',
    full: 'Béo (chất béo)',
    kcalPerGram: 9,
    role: 'Hấp thu vitamin A/D/E/K, sản xuất hormone, dự trữ năng lượng; omega-3 tốt cho tim mạch.',
    sources: ['Dầu ăn, bơ, phô mai, mỡ, nước cốt dừa', 'Đồ chiên rán, bánh kem, snack, bim bim', 'Hạt, cá béo (cá hồi, cá thu), trứng'],
    verdictTone: 'watch',
    verdict: 'Nên để ý, nhưng đừng cắt về 0.',
    tip: '1 g béo = 9 kcal, gấp đôi đạm và carb — nên chỉ cần ~20–25% năng lượng. Cách giảm dễ nhất: bớt đồ chiên rán (chuyển sang hấp/luộc/nướng), hạt ăn một nắm nhỏ (~150 kcal).',
  },
};
const MACRO_ORDER = ['protein', 'carb', 'fat'];
const MACRO_COLOR = { protein: 'var(--protein)', carb: 'var(--carb)', fat: 'var(--fat)' };

/* =========================== State =========================== */
const ST = {
  tab: 'today',
  dateKey: todayKey(),
  log: {},            // { 'YYYY-MM-DD': [entry, ...] }
  config: {},         // { profile:{...}, goal:'keep', macro:{...}, macroMode:'keep'|'custom' }
  customFoods: [],    // món tự khai báo
  favorites: [],      // foodId[]
  library: [],        // món dựng sẵn (data/foods.json)
  libLoaded: false,
  libError: false,    // fetch thất bại + chưa có cache (ví dụ mở bằng file://)
  query: '',
  pickGroup: 'all',
  modal: null,
  draft: null,        // state tạm của sheet đang mở
  formErrors: {},     // lỗi theo trường (form hồ sơ)
  formMsg: '',        // lỗi tổng (form hồ sơ / macro / món)
  lastAdded: null,    // { key, id, foodId, meal } — để đổi nhóm bữa vừa thêm nhanh
  bill: null,         // state tạm của luồng chụp hoá đơn (không lưu localStorage)
  billPendingRow: null, // dòng đang chờ món tự khai báo mới
  lpFired: false,
  toastTimer: null,
};

/* =========================== Tiện ích =========================== */
function $(id) { return document.getElementById(id); }

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function pad2(n) { return String(n).padStart(2, '0'); }
function fmtInt(n) { return new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)); }
function fmt1(n) {
  const v = Math.round((n || 0) * 10) / 10;
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(v);
}
function round1(n) { return Math.round((n || 0) * 10) / 10; }
function round2(n) { return Math.round((n || 0) * 100) / 100; }
function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
function uid() { return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function dateKeyOf(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function todayKey() { return dateKeyOf(new Date()); }
function keyToDate(key) {
  const p = String(key).split('-').map(Number);
  return new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
}
function shiftKey(key, days) {
  const d = keyToDate(key);
  d.setDate(d.getDate() + days);
  return dateKeyOf(d);
}
const WEEKDAY_VN = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
function fmtDateVN(key) { const p = String(key).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
function weekdayVN(key) { return WEEKDAY_VN[keyToDate(key).getDay()]; }
function dayLabel(key) {
  const t = todayKey();
  if (key === t) return 'Hôm nay · ' + weekdayVN(key);
  if (key === shiftKey(t, -1)) return 'Hôm qua · ' + weekdayVN(key);
  if (key === shiftKey(t, 1)) return 'Ngày mai · ' + weekdayVN(key);
  return weekdayVN(key);
}
function isToday(key) { return key === todayKey(); }
function isFutureKey(key) { return key > todayKey(); }

function nowHHMM() { const d = new Date(); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
function hhmmToMin(t) { const m = HHMM.exec(t || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : 0; }
function minToHHMM(v) { const m = clamp(Math.round(v), 0, 1439); return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60); }
function roundTo5(t) { return minToHHMM(Math.round(hhmmToMin(t) / 5) * 5); }
/* Làm tròn XUỐNG mốc 5 phút — dùng cho thời gian mặc định để không bao giờ vượt quá hiện tại */
function floorTo5(t) { return minToHHMM(Math.floor(hhmmToMin(t) / 5) * 5); }
function localISO() {
  const d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + 'T' +
    pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
}

/* Nhóm bữa suy ra từ giờ hiện tại (quick pick 1 chạm) */
function inferMeal(t) {
  const h = hhmmToMin(t) / 60;
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 17) return 'afternoon';
  if (h < 22) return 'dinner';
  return 'snack';
}

/* Bỏ dấu để tìm kiếm */
function norm(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

/* =========================== Storage =========================== */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const val = JSON.parse(raw);
    return val == null ? fallback : val;
  } catch (e) { return fallback; }
}
function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch (e) {
    showToast('Không lưu được dữ liệu (bộ nhớ trình duyệt đầy?)');
    return false;
  }
}

function loadState() {
  const log = readJSON(KEY_LOG, {});
  ST.log = (log && typeof log === 'object' && !Array.isArray(log)) ? log : {};
  const cfg = readJSON(KEY_CONFIG, {});
  ST.config = (cfg && typeof cfg === 'object' && !Array.isArray(cfg)) ? cfg : {};
  const foods = readJSON(KEY_FOODS, {});
  /* chuẩn hoá lại món tự khai báo: dữ liệu trong localStorage không lưu trường tìm kiếm `hay` */
  ST.customFoods = (Array.isArray(foods.custom) ? foods.custom : []).map(normalizeFood).filter(Boolean);
  ST.favorites = Array.isArray(foods.favorites) ? foods.favorites : [];
}

function saveLog() { writeJSON(KEY_LOG, ST.log); }
function saveConfig() { writeJSON(KEY_CONFIG, ST.config); }
function saveFoods() { writeJSON(KEY_FOODS, { custom: ST.customFoods, favorites: ST.favorites }); }

/* Tự dọn mục bữa ăn cũ hơn 31 ngày — chỉ ghi khi thực sự có xoá */
function cleanupOldData() {
  const cutoff = shiftKey(todayKey(), -(KEEP_DAYS - 1));
  let changed = false;
  Object.keys(ST.log).forEach((k) => {
    if (!ISO_DAY.test(k) || k < cutoff) { delete ST.log[k]; changed = true; }
  });
  if (changed) saveLog();
  return changed;
}

/* =========================== Thư viện món =========================== */
function normalizeFood(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name || '').trim();
  if (!name) return null;
  const id = String(raw.id || norm(name).replace(/[^a-z0-9]+/g, '-')).trim();
  const group = GROUP_IDS.indexOf(raw.group) >= 0 ? raw.group : 'main';
  return {
    id: id,
    name: name,
    group: group,
    unit: String(raw.unit || '1 phần').trim(),
    refGrams: Number(raw.refGrams) > 0 ? Math.round(Number(raw.refGrams)) : 0,
    kcal: Math.max(0, Math.round(Number(raw.kcal) || 0)),
    protein: Math.max(0, round1(Number(raw.protein) || 0)),
    carb: Math.max(0, round1(Number(raw.carb) || 0)),
    fat: Math.max(0, round1(Number(raw.fat) || 0)),
    aliases: Array.isArray(raw.aliases) ? raw.aliases.map((a) => String(a)) : [],
    custom: !!raw.custom,
    hay: norm(name + ' ' + (Array.isArray(raw.aliases) ? raw.aliases.join(' ') : '')),
  };
}

async function loadLibrary() {
  let list = null;
  try {
    const res = await fetch(DATA_URL, { cache: 'no-cache' });
    if (res && res.ok) {
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data && Array.isArray(data.foods) ? data.foods : null);
      if (arr) list = arr;
    }
  } catch (e) { /* offline lần đầu → dùng cache localStorage */ }
  if (!list) {
    const cached = readJSON(KEY_LIB_CACHE, null);
    if (cached && Array.isArray(cached.foods)) list = cached.foods;
  }
  if (!list) { ST.libLoaded = true; ST.libError = true; return false; }
  ST.library = list.map(normalizeFood).filter(Boolean);
  ST.libLoaded = true;
  ST.libError = false;
  writeJSON(KEY_LIB_CACHE, { version: 1, foods: list });
  return true;
}

function allFoods() { return ST.library.concat(ST.customFoods); }
function foodById(id) {
  if (!id) return null;
  for (let i = 0; i < ST.customFoods.length; i++) if (ST.customFoods[i].id === id) return ST.customFoods[i];
  for (let i = 0; i < ST.library.length; i++) if (ST.library[i].id === id) return ST.library[i];
  return null;
}
function isFav(id) { return ST.favorites.indexOf(id) >= 0; }
function toggleFav(id) {
  const i = ST.favorites.indexOf(id);
  if (i >= 0) ST.favorites.splice(i, 1); else ST.favorites.push(id);
  saveFoods();
  render();
  if (ST.modal && ST.modal.kind === 'pick') renderPickerBody();
  showToast(i >= 0 ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích');
}

function searchFoods(q, group) {
  const nq = norm(q);
  return allFoods().filter((f) => {
    if (group === 'fav' && !isFav(f.id)) return false;
    if (group && group !== 'all' && group !== 'fav' && f.group !== group) return false;
    if (!nq) return true;
    return f.hay.indexOf(nq) >= 0;
  }).sort((a, b) => {
    const ga = GROUP_IDS.indexOf(a.group), gb = GROUP_IDS.indexOf(b.group);
    if (ga !== gb) return ga - gb;
    return a.name.localeCompare(b.name, 'vi');
  });
}

/* Tần suất chọn trong 30 ngày gần nhất → quick pick (không lưu bảng đếm riêng) */
function getQuickPicks(limit) {
  const lim = limit || QUICK_PICK_LIMIT;
  const today = todayKey();
  const from = shiftKey(today, -(QUICK_PICK_DAYS - 1));
  const stat = {};
  Object.keys(ST.log).forEach((k) => {
    if (k < from || k > today) return;
    const list = ST.log[k];
    if (!Array.isArray(list)) return;
    list.forEach((en) => {
      if (!en || !en.foodId) return;
      if (!stat[en.foodId]) stat[en.foodId] = { count: 0, last: '' };
      stat[en.foodId].count += 1;
      const stamp = k + ' ' + (en.time || '00:00');
      if (stamp > stat[en.foodId].last) stat[en.foodId].last = stamp;
    });
  });
  const out = [];
  const used = {};
  ST.favorites.forEach((id) => {
    const f = foodById(id);
    if (f && !used[id]) { used[id] = 1; out.push({ food: f, fav: true, count: (stat[id] && stat[id].count) || 0 }); }
  });
  const rest = Object.keys(stat)
    .filter((id) => !used[id] && foodById(id))
    .map((id) => ({ food: foodById(id), fav: false, count: stat[id].count, last: stat[id].last }));
  rest.sort((a, b) => (b.count - a.count) || String(b.last).localeCompare(String(a.last)));
  rest.forEach((r) => out.push(r));
  return out.slice(0, lim);
}

/* =========================== Dinh dưỡng =========================== */
function hasProfile() {
  const p = ST.config.profile;
  return !!(p && Number(p.age) > 0 && Number(p.height) > 0 && Number(p.weight) > 0);
}
function calcBMR(p) {
  const base = 10 * Number(p.weight) + 6.25 * Number(p.height) - 5 * Number(p.age);
  return p.gender === 'female' ? base - 161 : base + 5;
}
function calcTDEE(p) {
  const f = (ACTIVITY_BY_ID[p.activity] || ACTIVITY_BY_ID.sed).factor;
  return calcBMR(p) * f;
}
function roundKcalStep(x) { return Math.round(x / KCAL_STEP) * KCAL_STEP; }
function macroOfConfig() {
  const m = ST.config.macro;
  if (!m || ![m.protein, m.carb, m.fat].every((v) => isFinite(Number(v)) && Number(v) >= 0)) return DEFAULT_MACRO;
  return { protein: Number(m.protein), carb: Number(m.carb), fat: Number(m.fat) };
}
function computeTargets() {
  if (!hasProfile()) return null;
  const p = ST.config.profile;
  const goalId = GOAL_BY_ID[ST.config.goal] ? ST.config.goal : 'keep';
  const adj = GOAL_BY_ID[goalId].adj;
  const tdee = calcTDEE(p);
  const kcal = roundKcalStep(tdee * (1 + adj));
  const m = macroOfConfig();
  return {
    kcal: kcal,
    protein: Math.round(kcal * m.protein / 100 / 4),
    carb: Math.round(kcal * m.carb / 100 / 4),
    fat: Math.round(kcal * m.fat / 100 / 9),
    macro: m,
    goalId: goalId,
    activity: ACTIVITY_BY_ID[p.activity] || ACTIVITY_BY_ID.sed,
    tdee: tdee,
  };
}
function formulaText(t) {
  if (!t) return '';
  return 'Mifflin-St Jeor (' + Math.round(calcBMR(ST.config.profile)) + ' kcal) × ' + t.activity.factor +
    ' (' + t.activity.short.toLowerCase() + ') = ' + fmtInt(Math.round(t.tdee)) + ' kcal, ' +
    (t.goalId === 'keep' ? 'giữ cân (0%)' : (t.goalId === 'lose' ? 'giảm cân (−15%)' : 'tăng cân (+10%)')) +
    ' → mục tiêu ' + fmtInt(t.kcal) + ' kcal';
}

/* =========================== Nhật ký bữa ăn =========================== */
function getDayEntries(key) {
  const list = Array.isArray(ST.log[key]) ? ST.log[key].slice() : [];
  return list.sort((a, b) => {
    const ta = a.time || '99:99', tb = b.time || '99:99';
    if (ta !== tb) return ta < tb ? -1 : 1;
    return String(a.id).localeCompare(String(b.id));
  });
}
function dayTotals(key) {
  const t = { kcal: 0, protein: 0, carb: 0, fat: 0 };
  getDayEntries(key).forEach((en) => {
    t.kcal += Number(en.kcal) || 0;
    t.protein += Number(en.protein) || 0;
    t.carb += Number(en.carb) || 0;
    t.fat += Number(en.fat) || 0;
  });
  t.protein = round1(t.protein); t.carb = round1(t.carb); t.fat = round1(t.fat);
  t.kcal = Math.round(t.kcal);
  return t;
}
function mealTotals(key, mealId) {
  const t = { kcal: 0 };
  getDayEntries(key).forEach((en) => { if (en.meal === mealId) t.kcal += Number(en.kcal) || 0; });
  t.kcal = Math.round(t.kcal);
  return t;
}

function makeEntry(food, qty, meal, time, dateKey) {
  const per = { kcal: Number(food.kcal) || 0, protein: Number(food.protein) || 0, carb: Number(food.carb) || 0, fat: Number(food.fat) || 0 };
  return {
    id: uid(),
    meal: MEAL_IDS.indexOf(meal) >= 0 ? meal : 'breakfast',
    foodId: food.custom ? food.id : food.id,
    name: food.name,
    unit: food.unit || '1 phần',
    refGrams: food.refGrams || 0,
    qty: round2(qty),
    per: per,
    kcal: Math.round(per.kcal * qty),
    protein: round1(per.protein * qty),
    carb: round1(per.carb * qty),
    fat: round1(per.fat * qty),
    time: time,
    dateKey: dateKey,
  };
}
function addEntry(food, qty, meal, time, dateKey) {
  const key = dateKey || ST.dateKey;
  if (!Array.isArray(ST.log[key])) ST.log[key] = [];
  const en = makeEntry(food, qty, meal, time, key);
  ST.log[key].push(en);
  saveLog();
  return en;
}
function findEntry(key, id) {
  const list = Array.isArray(ST.log[key]) ? ST.log[key] : [];
  for (let i = 0; i < list.length; i++) if (list[i].id === id) return { list: list, index: i, entry: list[i] };
  return null;
}
function updateEntryQty(key, id, qty) {
  const hit = findEntry(key, id);
  if (!hit) return;
  const per = hit.entry.per || { kcal: 0, protein: 0, carb: 0, fat: 0 };
  hit.entry.qty = round2(qty);
  hit.entry.kcal = Math.round((Number(per.kcal) || 0) * qty);
  hit.entry.protein = round1((Number(per.protein) || 0) * qty);
  hit.entry.carb = round1((Number(per.carb) || 0) * qty);
  hit.entry.fat = round1((Number(per.fat) || 0) * qty);
  saveLog();
}
function deleteEntry(key, id) {
  const hit = findEntry(key, id);
  if (!hit) return;
  hit.list.splice(hit.index, 1);
  if (!hit.list.length) delete ST.log[key];
  saveLog();
}

/* =========================== Render =========================== */
function render() {
  const chip = $('verChip');
  if (chip) chip.textContent = APP_VERSION;
  const sub = $('headerSub');
  if (sub) sub.textContent = weekdayVN(todayKey()) + ', ' + fmtDateVN(todayKey());
  document.querySelectorAll('.tab').forEach((b) => {
    b.classList.toggle('is-active', b.getAttribute('data-tab') === ST.tab);
  });
  const view = $('view');
  if (!view) return;
  view.innerHTML = ST.tab === 'settings' ? renderSettings() : renderToday();
}

function switchTab(tab) {
  ST.tab = tab === 'settings' ? 'settings' : 'today';
  ST.formMsg = '';
  ST.formErrors = {};
  render();
  window.scrollTo(0, 0);
}

function barHtml(pct, color, over) {
  const w = clamp(pct, 0, 100);
  return '<div class="bar' + (over ? ' is-over' : '') + '"><i style="width:' + w.toFixed(1) + '%;background:' + color + '"></i></div>';
}

function renderToday() {
  const key = ST.dateKey;
  const totals = dayTotals(key);
  const targets = computeTargets();
  const entries = getDayEntries(key);
  const picks = getQuickPicks();

  /* --- Thanh tiến độ --- */
  let progress;
  if (targets) {
    const over = totals.kcal > targets.kcal;
    const left = targets.kcal - totals.kcal;
    const pct = targets.kcal > 0 ? (totals.kcal / targets.kcal) * 100 : 0;
    const macros = [
      { k: 'protein', label: 'Đạm', color: 'var(--protein)', got: totals.protein, goal: targets.protein },
      { k: 'carb', label: 'Carb', color: 'var(--carb)', got: totals.carb, goal: targets.carb },
      { k: 'fat', label: 'Béo', color: 'var(--fat)', got: totals.fat, goal: targets.fat },
    ];
    progress = '<div class="progress-card">' +
      '<div class="kcal-top">' +
        '<div class="kcal-eaten">' + fmtInt(totals.kcal) + '<small>kcal đã ăn</small></div>' +
        '<div class="kcal-right' + (over ? ' is-over' : '') + '">' + (over ? 'Vượt' : 'Còn lại') +
          '<b>' + fmtInt(Math.abs(left)) + ' kcal</b></div>' +
      '</div>' +
      barHtml(pct, 'var(--accent)', over) +
      '<div class="macros">' + macros.map((m) => {
        const mp = m.goal > 0 ? (m.got / m.goal) * 100 : 0;
        return '<div class="macro"><div class="macro-top">' + macroLabelHtml(m.k, m.color) +
          '<span>' + fmt1(m.got) + '/' + fmtInt(m.goal) + 'g</span></div>' +
          barHtml(mp, m.color, m.got > m.goal) +
          '<div class="macro-goal">' + Math.round(mp) + '% mục tiêu</div></div>';
      }).join('') + '</div>' +
      '<div class="tiny muted" style="margin-top:9px">Chạm vào <b>Đạm · Carb · Béo</b> để xem: tác dụng, ăn gì thì tăng, có nên hạn chế không.</div>' +
      '<div class="tiny muted" style="margin-top:10px">Mục tiêu ' + fmtInt(targets.kcal) + ' kcal · ' +
        targets.macro.protein + '/' + targets.macro.carb + '/' + targets.macro.fat + ' (đạm/carb/béo)</div>' +
    '</div>';
  } else {
    progress = '<div class="progress-card">' +
      '<div class="kcal-top">' +
        '<div class="kcal-eaten">' + fmtInt(totals.kcal) + '<small>kcal đã ăn</small></div>' +
      '</div>' +
      '<div class="divider"></div>' +
      '<div class="setup-invite"><span>Chưa thiết lập mục tiêu — nhập hồ sơ cơ thể để biết còn lại bao nhiêu kcal và macro mỗi ngày.</span>' +
        '<button class="btn primary sm" onclick="switchTab(\'settings\')">Thiết lập</button></div>' +
    '</div>';
  }

  /* --- Dải quick pick --- */
  let quick = '';
  if (picks.length) {
    quick = '<div class="quick-wrap"><div class="section-title" style="margin-bottom:6px"><span>Món hay ăn · chạm để ghi</span></div>' +
      '<div class="chip-row">' + picks.map((p) =>
        '<button class="chip' + (p.fav ? ' is-fav' : '') + '" type="button" onclick="quickAdd(\'' + esc(p.food.id) + '\')" title="Ghi 1 khẩu phần vào bữa theo giờ hiện tại">' +
        (p.fav ? '★ ' : '') + '<b>' + esc(p.food.name) + '</b>' +
        '<span class="chip-kcal">' + fmtInt(p.food.kcal) + '</span></button>'
      ).join('') + '</div></div>';
  }

  /* --- Thanh đổi bữa của mục vừa thêm nhanh --- */
  let lastAdded = '';
  if (ST.lastAdded && ST.lastAdded.key === key) {
    const la = findEntry(key, ST.lastAdded.id);
    if (la) {
      lastAdded = '<div class="card" style="margin-top:10px">' +
        '<div class="entry-name">Đã ghi <b>' + esc(la.entry.name) + '</b> vào bữa ' + esc(MEAL_LABEL[la.entry.meal]) + ' ✓</div>' +
        '<div class="tiny muted" style="margin-top:3px">Bấm nhầm bữa? Chọn lại:</div>' +
        '<div class="chip-row" style="margin-top:6px">' + MEALS.map((m) =>
          '<button class="chip' + (m.id === la.entry.meal ? ' is-fav' : '') + '" type="button" onclick="changeMealOfLast(\'' + m.id + '\')">' +
          m.emoji + ' ' + esc(m.label) + '</button>'
        ).join('') + '</div></div>';
    }
  }

  /* --- 5 thẻ bữa --- */
  const mealsHtml = MEALS.map((m) => {
    const list = entries.filter((en) => en.meal === m.id);
    const tot = mealTotals(key, m.id);
    const rows = list.length ? list.map((en) => {
      const sub = fmt1(en.qty) + ' × ' + esc(en.unit) + (en.refGrams ? ' · ' + en.refGrams + 'g' : '');
      return '<div class="entry" onclick="entryTap(\'' + esc(key) + '\',\'' + esc(en.id) + '\')"' +
        ' ontouchstart="lpStart(event,\'' + esc(key) + '\',\'' + esc(en.id) + '\')"' +
        ' ontouchend="lpEnd()" ontouchmove="lpEnd()" ontouchcancel="lpEnd()"' +
        ' oncontextmenu="event.preventDefault();openDeleteEntry(\'' + esc(key) + '\',\'' + esc(en.id) + '\')"' +
        ' title="Chạm để sửa · nhấn giữ để xoá">' +
        '<div class="entry-time">' + esc(en.time || '--:--') + '</div>' +
        '<div class="entry-main"><div class="entry-name">' + esc(en.name) + '</div>' +
        '<div class="entry-sub">' + sub + '</div></div>' +
        '<div class="entry-kcal">' + fmtInt(en.kcal) + '<span> kcal</span></div>' +
      '</div>';
    }).join('') : '<div class="empty-line">Chưa có món nào</div>';
    return '<div class="meal-card"><div class="meal-head">' +
      '<span class="meal-emoji">' + m.emoji + '</span>' +
      '<span class="meal-name">' + esc(m.label) + '</span>' +
      '<span class="meal-kcal">' + fmtInt(tot.kcal) + ' kcal</span>' +
      '<button class="icon-btn accent" type="button" title="Thêm món vào bữa ' + esc(m.label) + '" onclick="openPicker(\'' + m.id + '\')">' + IC.plus + '</button>' +
      '</div><div class="entry-list">' + rows + '</div></div>';
  }).join('');

  const emptyGuide = entries.length ? '' :
    '<div class="card" style="margin-top:10px"><div class="hint"><b style="color:var(--text)">Bắt đầu ghi bữa đầu tiên</b><br>' +
    'Chạm nút ＋ ở một bữa để chọn món từ thư viện, hoặc chạm một chip "Món hay ăn" ở trên. ' +
    'Dữ liệu chỉ nằm trên máy bạn — vào Cài đặt để xuất file sao lưu định kỳ.</div></div>';

  const dateNav = '<div class="date-nav">' +
    '<button class="nav-btn" type="button" title="Ngày trước" onclick="shiftDay(-1)">' + IC.left + '</button>' +
    '<div class="date-label">' + fmtDateVN(key) + '<small>' + esc(dayLabel(key)) + '</small></div>' +
    (isToday(key)
      ? '<span style="width:34px"></span>'
      : '<button class="today-btn" type="button" onclick="goToday()">Hôm nay</button>') +
    '<button class="nav-btn" type="button" title="Ngày sau" ' + (isFutureKey(shiftKey(key, 1)) ? 'disabled style="opacity:.35"' : '') + ' onclick="shiftDay(1)">' + IC.right + '</button>' +
  '</div>';

  return dateNav + '<div class="section" style="margin-top:10px">' + progress + '</div>' +
    quick + lastAdded + '<div class="section">' + mealsHtml + emptyGuide + '</div>';
}

function renderSettings() {
  const p = ST.config.profile || {};
  const draft = ST.formDraft || {};
  const gender = draft.gender || p.gender || 'male';
  const goal = draft.goal || ST.config.goal || 'keep';
  const activity = draft.activity || p.activity || 'sed';
  const targets = computeTargets();
  const errs = ST.formErrors || {};

  const errCls = (k) => (errs[k] ? ' err' : '');
  const errMsg = (k) => (errs[k] ? '<div class="field-msg">' + esc(errs[k]) + '</div>' : '');

  const profileCard = '<div class="card">' +
    '<div class="card-head"><h2>Hồ sơ cơ thể</h2>' +
      '<span class="tiny muted">' + (hasProfile() ? 'Đã thiết lập' : 'Chưa thiết lập') + '</span></div>' +
    (ST.formMsg ? '<div class="err-box">' + esc(ST.formMsg) + '</div>' : '') +
    '<div class="field' + errCls('gender') + '"><label>Giới tính</label><div class="seg">' +
      ['male', 'female'].map((g) => '<button type="button" data-gender="' + g + '" class="' + (gender === g ? 'is-on' : '') + '" onclick="setDraft(\'gender\',\'' + g + '\')">' + (g === 'male' ? 'Nam' : 'Nữ') + '</button>').join('') +
    '</div>' + errMsg('gender') + '</div>' +
    '<div class="grid-2">' +
      '<div class="field' + errCls('age') + '"><label>Tuổi (10–100)</label>' +
        '<input type="number" id="pfAge" inputmode="numeric" min="10" max="100" step="1" value="' + esc(p.age != null ? p.age : '') + '">' + errMsg('age') + '</div>' +
      '<div class="field' + errCls('height') + '"><label>Chiều cao (cm)</label>' +
        '<input type="number" id="pfHeight" inputmode="decimal" min="1" step="0.5" value="' + esc(p.height != null ? p.height : '') + '">' + errMsg('height') + '</div>' +
    '</div>' +
    '<div class="grid-2">' +
      '<div class="field' + errCls('weight') + '"><label>Cân nặng (kg)</label>' +
        '<input type="number" id="pfWeight" inputmode="decimal" min="1" step="0.1" value="' + esc(p.weight != null ? p.weight : '') + '">' + errMsg('weight') + '</div>' +
      '<div class="field' + errCls('activity') + '"><label>Mức vận động</label>' +
        '<select id="pfActivity" onchange="previewTargets()">' + ACTIVITY_LEVELS.map((a) =>
          '<option value="' + a.id + '"' + (activity === a.id ? ' selected' : '') + '>' + esc(a.label) + '</option>').join('') +
        '</select>' + errMsg('activity') + '</div>' +
    '</div>' +
    '<div class="field"><label>Mục tiêu cân nặng</label><div class="seg">' +
      GOALS.map((g) => '<button type="button" data-goal="' + g.id + '" class="' + (goal === g.id ? 'is-on' : '') + '" onclick="setDraft(\'goal\',\'' + g.id + '\')">' + esc(g.label) + ' (' + g.note + ')</button>').join('') +
    '</div></div>' +
    '<div class="btn-row" style="margin-top:6px"><button class="btn primary" type="button" onclick="saveProfile()">Lưu hồ sơ & tính mục tiêu</button></div>' +
    '<div class="tiny muted" style="margin-top:8px">Công thức Mifflin-St Jeor × hệ số vận động, điều chỉnh theo mục tiêu cân nặng, làm tròn 10 kcal.</div>' +
  '</div>';

  const presetId = ST.config.macroMode || 'keep';
  const isCustom = presetId === 'custom';
  const macro = macroOfConfig();
  const targetBox = targets
    ? '<div class="target-box" id="targetBox"><div class="target-kcal">' + fmtInt(targets.kcal) + ' <small>kcal / ngày</small></div>' +
      '<div class="target-macros">' + MACRO_ORDER.map((k) =>
        '<button class="target-macro" type="button" onclick="openMacroInfo(\'' + k + '\')" title="Xem tác dụng · ăn gì thì tăng · có nên hạn chế">' +
        '<b style="color:' + MACRO_COLOR[k] + '">' + fmtInt(targets[k]) + 'g</b><span>' + esc(MACRO_INFO[k].label) + ' ⓘ</span></button>').join('') +
      '</div><div class="tiny muted" style="margin-top:9px">' + esc(formulaText(targets)) + '</div>' +
      '<div class="tiny muted" style="margin-top:6px">Chạm vào từng ô để xem giải thích (tác dụng · ăn gì thì tăng · có nên hạn chế).</div></div>'
    : '<div class="target-box" id="targetBox"><div class="hint">Chưa có mục tiêu — nhập đủ <b>tuổi, chiều cao, cân nặng</b> ở trên rồi bấm "Lưu hồ sơ".</div></div>';

  const macroCard = '<div class="card">' +
    '<div class="card-head"><h2>Mục tiêu năng lượng & macro</h2></div>' +
    targetBox +
    '<div class="divider"></div>' +
    (ST.formMsgMacro ? '<div class="err-box">' + esc(ST.formMsgMacro) + '</div>' : '') +
    '<div class="field"><label>Tỉ lệ macro (Đạm / Carb / Béo)</label><div class="seg">' +
      MACRO_PRESETS.map((mp) => '<button type="button" class="' + (!isCustom && presetId === mp.id ? 'is-on' : '') + '" onclick="setMacroPreset(\'' + mp.id + '\')">' + esc(mp.label) + '</button>').join('') +
      '<button type="button" class="' + (isCustom ? 'is-on' : '') + '" onclick="setMacroPreset(\'custom\')">Tự nhập</button>' +
    '</div></div>' +
    (isCustom
      ? '<div class="grid-3">' +
          '<div class="field"><label>Đạm %</label><input type="number" id="mfP" inputmode="numeric" min="0" max="100" step="1" value="' + macro.protein + '"></div>' +
          '<div class="field"><label>Carb %</label><input type="number" id="mfC" inputmode="numeric" min="0" max="100" step="1" value="' + macro.carb + '"></div>' +
          '<div class="field"><label>Béo %</label><input type="number" id="mfF" inputmode="numeric" min="0" max="100" step="1" value="' + macro.fat + '"></div>' +
        '</div>'
      : '<div class="tiny muted">Đang dùng preset: <b>' + esc((MACRO_PRESETS.filter((x) => x.id === presetId)[0] || MACRO_PRESETS[1]).label) + '</b></div>') +
    '<div class="btn-row" style="margin-top:10px"><button class="btn" type="button" onclick="saveMacro()">Lưu tỉ lệ macro</button></div>' +
    '<div class="tiny muted" style="margin-top:8px">Quy đổi: đạm 4 kcal/g · carb 4 kcal/g · béo 9 kcal/g. Tổng ba tỉ lệ phải bằng 100% (±1).</div>' +
  '</div>';

  const customRows = ST.customFoods.length
    ? ST.customFoods.map((f) =>
        '<div class="food-row"><div class="entry-main">' +
          '<div class="entry-name">' + esc(f.name) + '</div>' +
          '<div class="entry-sub">' + esc(f.unit) + (f.refGrams ? ' · ' + f.refGrams + 'g' : '') + ' · ' + fmtInt(f.kcal) + ' kcal · Đ' + fmt1(f.protein) + ' C' + fmt1(f.carb) + ' B' + fmt1(f.fat) + '</div>' +
        '</div>' +
        '<button class="icon-btn" type="button" title="Sửa món" onclick="openCustomFood(\'' + esc(f.id) + '\')">' + IC.pencil + '</button>' +
        '<button class="icon-btn" type="button" title="Xoá món" onclick="askDeleteFood(\'' + esc(f.id) + '\')">' + IC.trash + '</button>' +
        '</div>').join('')
    : '<div class="empty-line">Chưa có món tự khai báo nào</div>';

  const foodCard = '<div class="card">' +
    '<div class="card-head"><h2>Thư viện món</h2><span class="tiny muted">' + ST.library.length + ' món dựng sẵn · ' + ST.customFoods.length + ' món tự khai báo</span></div>' +
    '<div class="hint">Món dựng sẵn có sẵn dinh dưỡng theo 1 khẩu phần thực tế (1 bát, 1 tô, 1 ổ…). Bạn có thể thêm món riêng — dùng được ngay khi ghi bữa.</div>' +
    (ST.libError ? '<div class="tiny" style="color:var(--over);margin-top:6px">Không tải được thư viện dựng sẵn (cần mở app qua http/https, không dùng file://).</div>' : '') +
    '<div class="divider"></div>' + customRows +
    '<div class="btn-row" style="margin-top:10px">' +
      '<button class="btn sm" type="button" onclick="openCustomFood()">Thêm món tự khai báo</button>' +
      '<button class="btn sm ghost" type="button" onclick="openPicker()">Xem thư viện</button>' +
    '</div>' +
  '</div>';

  const dataCard = '<div class="card">' +
    '<div class="card-head"><h2>Dữ liệu của bạn</h2></div>' +
    '<div class="hint">Dữ liệu nằm trong trình duyệt của máy này. Xuất JSON để sao lưu (nên 1 lần/tuần) rồi gửi vào Telegram của bạn.</div>' +
    '<div class="btn-row" style="margin-top:10px">' +
      '<button class="btn sm" type="button" onclick="exportJSON()">' + IC.download + ' Xuất JSON</button>' +
      '<button class="btn sm" type="button" onclick="pickImportFile()">' + IC.upload + ' Nhập JSON</button>' +
      '<button class="btn sm ghost" type="button" onclick="exportCSV()">Xuất CSV</button>' +
    '</div>' +
    '<div class="tiny muted" style="margin-top:9px">Tự dọn mục bữa ăn cũ hơn ' + KEEP_DAYS + ' ngày khi mở app — hồ sơ và món tự khai báo vẫn giữ nguyên.</div>' +
  '</div>';

  const aboutCard = '<div class="card">' +
    '<div class="card-head"><h2>Về ứng dụng</h2><span class="ver-chip">' + APP_VERSION + '</span></div>' +
    '<div class="tiny muted">Giá trị dinh dưỡng của thư viện là <b>tham khảo</b> (sai số ±15–25% tuỳ cách nấu). Mục tiêu là nhất quán trong ghi chép, không phải đo tuyệt đối. Chỉnh khẩu phần cho từng mục nếu bát/tô của bạn to nhỏ khác.</div>' +
    '<div class="tiny muted" style="margin-top:8px">Không backend, không tài khoản — dữ liệu chỉ rời máy khi bạn tự xuất file.</div>' +
  '</div>';

  return '<div class="section" style="margin-top:4px">' + profileCard + macroCard + '</div>' +
    '<div class="section">' + foodCard + dataCard + aboutCard + '</div>';
}

/* =========================== Sheet / modal =========================== */
function openModal(kind, html, draft) {
  ST.modal = { kind: kind };
  ST.draft = draft || ST.draft;
  const root = $('modalRoot');
  root.innerHTML = '<div class="overlay" onclick="overlayTap(event)">' +
    '<div class="sheet" role="dialog" aria-modal="true" onclick="event.stopPropagation()">' +
    '<div class="sheet-grab"></div>' + html + '</div></div>';
}
function closeModal() {
  ST.modal = null;
  ST.draft = null;
  ST.formMsgFood = '';
  ST.foodDraft = null;
  ST.billPendingRow = null;
  const root = $('modalRoot');
  if (root) root.innerHTML = '';
}
function overlayTap() { closeModal(); }
function isModalOpen() { return !!(ST.modal && $('modalRoot') && $('modalRoot').innerHTML); }

function showToast(msg) {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(ST.toastTimer);
  ST.toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- Sheet chọn món ---------- */
function openPicker(meal, forRowId) {
  ST.query = '';
  ST.pickGroup = 'all';
  const forRow = forRowId || null;
  openModal('pick', '', { meal: meal || inferMeal(nowHHMM()), mode: 'add', forRow: forRow });
  const root = $('modalRoot');
  const sheet = root.querySelector('.sheet');
  sheet.innerHTML = '<div class="sheet-grab"></div>' +
    '<div class="sheet-head"><h2>' + (forRow ? 'Chọn món cho dòng này' : 'Chọn món') + '</h2>' +
      '<button class="icon-btn" type="button" title="Đóng" onclick="closeModal()">' + IC.close + '</button></div>' +
    '<div class="search-box" style="margin-top:10px">' + IC.search +
      '<input id="pickSearch" type="search" placeholder="Tìm món (gõ không dấu cũng được)" autocomplete="off" oninput="onSearchInput(this.value)">' +
    '</div>' +
    (forRow ? '' : '<button class="btn block" style="margin-top:8px" type="button" onclick="openBillCapture()">' + IC.camera + ' Chụp hoá đơn để điền nhanh</button>') +
    '<div class="sheet-body" id="pickerBody"></div>';
  renderPickerBody();
  const inp = $('pickSearch');
  if (inp) inp.focus();
}

function onSearchInput(v) { ST.query = v; renderPickerBody(); }
function setPickGroup(g) { ST.pickGroup = g; renderPickerBody(); }

function renderPickerBody() {
  const body = $('pickerBody');
  if (!body) return;
  const forRow = (ST.draft && ST.draft.forRow) || null;
  const pickCall = (id) => forRow ? 'billAssignFood(\'' + esc(id) + '\')' : 'openPortion(\'' + esc(id) + '\',\'add\')';
  const picks = getQuickPicks(6);
  const filters = [{ id: 'all', label: 'Tất cả' }, { id: 'fav', label: '★ Yêu thích' }]
    .concat(GROUPS.map((g) => ({ id: g.id, label: g.label })));
  const filterRow = '<div class="chip-row" style="margin-top:10px">' + filters.map((f) =>
    '<button class="chip' + (ST.pickGroup === f.id ? ' is-fav' : '') + '" type="button" onclick="setPickGroup(\'' + f.id + '\')">' + esc(f.label) + '</button>'
  ).join('') + '</div>';

  const quickRow = (!ST.query && picks.length)
    ? '<div class="group-label">Món hay ăn</div><div class="chip-row">' + picks.map((p) =>
        '<button class="chip" type="button" onclick="' + pickCall(p.food.id) + '">' + esc(p.food.name) +
        ' <span class="chip-kcal">' + fmtInt(p.food.kcal) + '</span></button>').join('') + '</div>'
    : '';

  const list = searchFoods(ST.query, ST.pickGroup);
  let listHtml;
  if (!list.length) {
    listHtml = ST.libError && !ST.customFoods.length
      ? '<div class="empty-state"><b>Chưa tải được thư viện món</b>' +
        'Thư viện dựng sẵn cần mở app qua http/https (bản Vercel hoặc local server). Bạn vẫn thêm được món tự khai báo để ghi bữa.' +
        '<div style="margin-top:10px"><button class="btn sm" type="button" onclick="openCustomFood(null,true)">Thêm món tự khai báo</button></div></div>'
      : '<div class="empty-state"><b>Không tìm thấy món phù hợp</b>' +
        'Thử từ khoá khác, hoặc thêm món riêng của bạn rồi ghi bữa bằng món đó.' +
        '<div style="margin-top:10px"><button class="btn sm" type="button" onclick="openCustomFood(null,true)">Thêm món tự khai báo</button></div></div>';
  } else {
    let cur = null;
    listHtml = list.map((f) => {
      let head = '';
      if (f.group !== cur) { cur = f.group; head = '<div class="group-label">' + esc(GROUP_LABEL[f.group] || 'Khác') + '</div>'; }
      return head + '<div class="pick-row" onclick="' + pickCall(f.id) + '">' +
        '<div class="entry-main"><div class="entry-name">' + esc(f.name) + '</div>' +
        '<div class="entry-sub">' + esc(f.unit) + (f.refGrams ? ' · ' + f.refGrams + 'g' : '') + ' · Đ' + fmt1(f.protein) + ' C' + fmt1(f.carb) + ' B' + fmt1(f.fat) + (f.custom ? ' · món của bạn' : '') + '</div></div>' +
        '<div class="pick-kcal">' + fmtInt(f.kcal) + '</div>' +
        '<button class="icon-btn' + (isFav(f.id) ? ' accent' : '') + '" type="button" title="' + (isFav(f.id) ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích') + '" onclick="event.stopPropagation();toggleFav(\'' + esc(f.id) + '\')">' +
          (isFav(f.id) ? IC.starOn : IC.star) + '</button>' +
        (f.custom ? '<button class="icon-btn" type="button" title="Sửa món tự khai báo" onclick="event.stopPropagation();openCustomFood(\'' + esc(f.id) + '\',false,true)">' + IC.pencil + '</button>' : '') +
      '</div>';
    }).join('');
  }
  body.innerHTML = filterRow + quickRow + listHtml;
}

/* ---------- Sheet khẩu phần (thêm / sửa mục) ---------- */
function openPortion(foodId, mode, entryId) {
  if (mode === 'edit') {
    const hit = findEntry(ST.dateKey, entryId);
    if (!hit) { showToast('Không tìm thấy mục'); return; }
    const en = hit.entry;
    const per = (en.per && isFinite(Number(en.per.kcal))) ? en.per : {
      kcal: en.qty > 0 ? en.kcal / en.qty : en.kcal, protein: en.qty > 0 ? en.protein / en.qty : en.protein,
      carb: en.qty > 0 ? en.carb / en.qty : en.carb, fat: en.qty > 0 ? en.fat / en.qty : en.fat,
    };
    openModal('portion', '', {
      mode: 'edit', entryId: entryId, foodId: en.foodId, name: en.name, unit: en.unit,
      qty: en.qty, meal: en.meal, time: en.time, per: per,
    });
    renderPortionSheet({ name: en.name, unit: en.unit });
    return;
  }
  const food = foodById(foodId);
  if (!food) { showToast('Không tìm thấy món'); return; }
  const fromPicker = !!(ST.modal && ST.modal.kind === 'pick');
  const meal = (fromPicker && ST.draft && MEAL_IDS.indexOf(ST.draft.meal) >= 0) ? ST.draft.meal : inferMeal(nowHHMM());
  const time = isToday(ST.dateKey) ? floorTo5(nowHHMM()) : '12:00';
  openModal('portion', '', {
    mode: 'add', foodId: food.id, name: food.name, unit: food.unit, qty: 1, meal: meal, time: time,
    per: { kcal: food.kcal, protein: food.protein, carb: food.carb, fat: food.fat },
  });
  renderPortionSheet(food);
}

function renderPortionSheet(food) {
  const d = ST.draft;
  const root = $('modalRoot');
  const sheet = root.querySelector('.sheet');
  const unit = food.unit || '1 phần';
  sheet.innerHTML = '<div class="sheet-grab"></div>' +
    '<div class="sheet-head"><h2>' + esc(food.name) + '</h2>' +
      '<button class="icon-btn" type="button" title="Chụp hoá đơn" onclick="openBillCapture()">' + IC.camera + '</button>' +
      '<button class="icon-btn" type="button" title="Đóng" onclick="closeModal()">' + IC.close + '</button></div>' +
    '<div class="sheet-body">' +
      '<div class="hint" id="ptPreview"></div>' +
      '<div class="divider"></div>' +
      '<div class="field"><label>Khẩu phần (' + esc(unit) + ')</label>' +
        '<div class="seg" id="ptPortion">' + PORTION_CHOICES.map((q) =>
          '<button type="button" class="chip-btn' + (Number(d.qty) === q ? ' is-on' : '') + '" data-qty="' + q + '" onclick="setPortion(' + q + ')">' + fmt1(q) + '</button>').join('') +
        '</div>' +
        '<div class="field" style="margin-top:8px"><input type="number" id="ptQty" inputmode="decimal" min="0.1" step="0.5" value="' + esc(d.qty) + '" oninput="onQtyInput(this.value)"></div>' +
      '</div>' +
      '<div class="field"><label>Nhóm bữa</label><div class="seg" id="ptMeal">' + MEALS.map((m) =>
        '<button type="button" data-meal="' + m.id + '" class="' + (d.meal === m.id ? 'is-on' : '') + '" onclick="setPortionMeal(\'' + m.id + '\')">' + m.emoji + ' ' + esc(m.label) + '</button>').join('') +
      '</div></div>' +
      '<div class="field"><label>Thời gian · ngày ' + fmtDateVN(ST.dateKey) + ' (bước 5 phút)</label>' +
        '<input type="time" id="ptTime" step="300" value="' + esc(d.time || nowHHMM()) + '" onchange="checkPortionTime()">' +
        '<div class="field-msg" id="ptTimeMsg" style="display:none"></div>' +
      '</div>' +
    '</div>' +
    '<div class="sheet-foot">' +
      (d.mode === 'edit' ? '<button class="btn danger" type="button" onclick="openDeleteEntry(\'' + esc(ST.dateKey) + '\',\'' + esc(d.entryId) + '\')">Xoá mục</button>' : '') +
      '<button class="btn" type="button" onclick="closeModal()">Huỷ</button>' +
      '<button class="btn primary" type="button" onclick="savePortion()">' + (d.mode === 'edit' ? 'Lưu' : 'Thêm vào bữa') + '</button>' +
    '</div>';
  updatePortionPreview();
}

function setPortion(q) {
  ST.draft.qty = q;
  const inp = $('ptQty');
  if (inp) inp.value = q;
  document.querySelectorAll('#ptPortion .chip-btn').forEach((b) => {
    b.classList.toggle('is-on', Number(b.getAttribute('data-qty')) === Number(q));
  });
  updatePortionPreview();
}
function onQtyInput(v) {
  const n = parseFloat(String(v).replace(',', '.'));
  ST.draft.qty = isFinite(n) && n > 0 ? round2(n) : 0;
  updatePortionPreview();
}
function setPortionMeal(id) {
  ST.draft.meal = id;
  document.querySelectorAll('#ptMeal button').forEach((b) => {
    b.classList.toggle('is-on', b.getAttribute('data-meal') === id);
  });
}
function updatePortionPreview() {
  const el = $('ptPreview');
  if (!el) return;
  const d = ST.draft;
  const per = d.per || (foodById(d.foodId) || { kcal: 0, protein: 0, carb: 0, fat: 0 });
  const q = Number(d.qty) || 0;
  el.innerHTML = '<b style="color:var(--text);font-size:14px">' + fmtInt((per.kcal || 0) * q) + ' kcal</b>' +
    ' <span class="muted">(1 khẩu phần: ' + fmtInt(per.kcal || 0) + ' kcal)</span><br>' +
    'Đạm ' + fmt1((per.protein || 0) * q) + 'g · Carb ' + fmt1((per.carb || 0) * q) + 'g · Béo ' + fmt1((per.fat || 0) * q) + 'g' +
    (q <= 0 ? '<br><span style="color:var(--over)">Khẩu phần phải lớn hơn 0</span>' : '');
}
function checkPortionTime() {
  const inp = $('ptTime');
  const msg = $('ptTimeMsg');
  if (!inp) return true;
  let t = inp.value;
  if (!HHMM.test(t)) {
    if (msg) { msg.style.display = 'block'; msg.textContent = 'Giờ không hợp lệ'; }
    return false;
  }
  /* luôn hạ về mốc 5 phút thấp hơn để không tự tạo thời gian tương lai */
  t = floorTo5(t);
  inp.value = t;
  if (isToday(ST.dateKey) && hhmmToMin(t) > hhmmToMin(nowHHMM())) {
    if (msg) { msg.style.display = 'block'; msg.textContent = 'Không thể chọn thời gian trong tương lai'; }
    return false;
  }
  if (msg) { msg.style.display = 'none'; msg.textContent = ''; }
  return true;
}
function savePortion() {
  const d = ST.draft;
  if (!d) return;
  const q = Number(d.qty) || 0;
  if (q <= 0) { showToast('Khẩu phần phải lớn hơn 0'); return; }
  const timeInp = $('ptTime');
  if (!checkPortionTime()) { showToast('Thời gian không hợp lệ'); return; }
  const time = floorTo5(timeInp.value);
  if (d.mode === 'edit') {
    const hit = findEntry(ST.dateKey, d.entryId);
    if (!hit) { closeModal(); return; }
    hit.entry.meal = d.meal;
    hit.entry.time = time;
    saveLog();
    updateEntryQty(ST.dateKey, d.entryId, q);
    ST.lastAdded = null;
    closeModal();
    render();
    showToast('Đã cập nhật mục');
  } else {
    const food = foodById(d.foodId);
    if (!food) { closeModal(); return; }
    const en = addEntry(food, q, d.meal, time, ST.dateKey);
    ST.lastAdded = { key: ST.dateKey, id: en.id, foodId: food.id, meal: d.meal };
    closeModal();
    render();
    showToast('Đã ghi ' + food.name + ' vào bữa ' + MEAL_LABEL[en.meal]);
  }
}

/* ---------- Sửa / xoá mục bữa ăn ---------- */
function entryTap(key, id) {
  if (ST.lpFired) { ST.lpFired = false; return; }
  const hit = findEntry(key, id);
  if (!hit) return;
  ST.dateKey = key; /* mục luôn thuộc ngày đang xem — đồng bộ để sửa/xoá đúng ngày */
  openPortion(hit.entry.foodId || ('entry-' + id), 'edit', id);
}

let lpTimer = null;
function lpStart(e, key, id) {
  ST.lpFired = false;
  clearTimeout(lpTimer);
  lpTimer = setTimeout(() => {
    lpTimer = null;
    ST.lpFired = true;
    openDeleteEntry(key, id);
  }, 500);
}
function lpEnd() { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } }

function openDeleteEntry(key, id) {
  const hit = findEntry(key, id);
  if (!hit) return;
  const en = hit.entry;
  ST.draft = { mode: 'delete', key: key, entryId: id };
  openModal('confirm', '', ST.draft);
  const sheet = $('modalRoot').querySelector('.sheet');
  sheet.innerHTML = '<div class="sheet-grab"></div>' +
    '<div class="sheet-head"><h2>Xoá mục này?</h2>' +
      '<button class="icon-btn" type="button" title="Đóng" onclick="closeModal()">' + IC.close + '</button></div>' +
    '<div class="sheet-body"><div class="hint">' + esc(en.name) + ' · ' + fmt1(en.qty) + ' ' + esc(en.unit) + ' · ' +
      fmtInt(en.kcal) + ' kcal (' + esc(MEAL_LABEL[en.meal]) + ' ' + esc(en.time) + ' ngày ' + fmtDateVN(key) + ')</div></div>' +
    '<div class="sheet-foot"><button class="btn" type="button" onclick="closeModal()">Huỷ</button>' +
      '<button class="btn danger" type="button" onclick="doDeleteEntry()">Xoá</button></div>';
}
function doDeleteEntry() {
  const d = ST.draft;
  if (!d) { closeModal(); return; }
  deleteEntry(d.key, d.entryId);
  if (ST.lastAdded && ST.lastAdded.id === d.entryId) ST.lastAdded = null;
  ST.dateKey = d.key;
  closeModal();
  render();
  showToast('Đã xoá mục');
}

/* ---------- Món tự khai báo ---------- */
function openCustomFood(foodId, allowFromPicker, returnToPicker) {
  const existing = foodId ? ST.customFoods.filter((f) => f.id === foodId)[0] : null;
  ST.draft = {
    mode: existing ? 'edit-food' : 'add-food',
    foodId: foodId || null,
    backToPicker: !!returnToPicker,
    keepPicker: !!allowFromPicker,
  };
  openModal('food', '', ST.draft);
  const base = existing || { name: '', group: 'main', unit: '1 bát', refGrams: '', kcal: '', protein: '', carb: '', fat: '' };
  /* giữ giá trị người dùng vừa gõ khi form phải mở lại do lỗi validate */
  const keep = (ST.foodDraft && ST.foodDraft.forId === (foodId || null)) ? ST.foodDraft.values : null;
  const f = keep ? Object.assign({}, base, keep) : base;
  const sheet = $('modalRoot').querySelector('.sheet');
  sheet.innerHTML = '<div class="sheet-grab"></div>' +
    '<div class="sheet-head"><h2>' + (existing ? 'Sửa món tự khai báo' : 'Thêm món tự khai báo') + '</h2>' +
      '<button class="icon-btn" type="button" title="Đóng" onclick="closeModal()">' + IC.close + '</button></div>' +
    '<div class="sheet-body">' +
      (ST.formMsgFood ? '<div class="err-box">' + esc(ST.formMsgFood) + '</div>' : '') +
      '<div class="field"><label>Tên món</label><input id="cfName" type="text" value="' + esc(f.name) + '" placeholder="VD: Cơm gạo lứt nhà nấu"></div>' +
      '<div class="field"><label>Nhóm món</label><select id="cfGroup">' +
        GROUPS.map((g) => '<option value="' + g.id + '"' + (f.group === g.id ? ' selected' : '') + '>' + esc(g.label) + '</option>').join('') +
      '</select></div>' +
      '<div class="grid-2">' +
        '<div class="field"><label>Đơn vị khẩu phần</label><input id="cfUnit" type="text" value="' + esc(f.unit) + '" placeholder="1 bát"></div>' +
        '<div class="field"><label>Khối lượng (g, tuỳ chọn)</label><input id="cfGrams" type="number" inputmode="numeric" min="0" step="1" value="' + esc(f.refGrams) + '"></div>' +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="field"><label>Kcal / khẩu phần</label><input id="cfKcal" type="number" inputmode="numeric" min="0" step="1" value="' + esc(f.kcal) + '"></div>' +
        '<div class="field"><label>Đạm (g)</label><input id="cfP" type="number" inputmode="decimal" min="0" step="0.1" value="' + esc(f.protein) + '"></div>' +
        '<div class="field"><label>Carb (g)</label><input id="cfC" type="number" inputmode="decimal" min="0" step="0.1" value="' + esc(f.carb) + '"></div>' +
        '<div class="field"><label>Béo (g)</label><input id="cfF" type="number" inputmode="decimal" min="0" step="0.1" value="' + esc(f.fat) + '"></div>' +
      '</div>' +
      '<div class="tiny muted">Giá trị tính cho <b>một khẩu phần</b> theo đơn vị bạn nhập (1 bát, 1 tô…). Không cần quy đổi 100g.</div>' +
    '</div>' +
    '<div class="sheet-foot">' +
      (existing ? '<button class="btn danger" type="button" onclick="askDeleteFood(\'' + esc(existing.id) + '\')">Xoá món</button>' : '') +
      '<button class="btn" type="button" onclick="closeModal()">Huỷ</button>' +
      '<button class="btn primary" type="button" onclick="saveCustomFood()">Lưu món</button>' +
    '</div>';
}

function saveCustomFood() {
  ST.formMsgFood = '';
  const name = ($('cfName').value || '').trim();
  const group = GROUP_IDS.indexOf($('cfGroup').value) >= 0 ? $('cfGroup').value : 'main';
  const unit = ($('cfUnit').value || '').trim() || '1 phần';
  const grams = numOrNull($('cfGrams').value);
  const kcal = numOrNull($('cfKcal').value);
  const p = numOrNull($('cfP').value) || 0;
  const c = numOrNull($('cfC').value) || 0;
  const f = numOrNull($('cfF').value) || 0;

  ST.foodDraft = {
    forId: (ST.draft && ST.draft.foodId) || null,
    values: {
      name: $('cfName').value, group: group, unit: $('cfUnit').value, refGrams: $('cfGrams').value,
      kcal: $('cfKcal').value, protein: $('cfP').value, carb: $('cfC').value, fat: $('cfF').value,
    },
  };
  const errs = [];
  if (!name) errs.push('Tên món không được để trống');
  if (kcal == null || kcal < 0) errs.push('Kcal phải là số không âm');
  if (grams != null && grams < 0) errs.push('Khối lượng phải là số không âm');
  if ([p, c, f].some((v) => v < 0)) errs.push('Đạm/carb/béo phải là số không âm');
  if (errs.length) {
    ST.formMsgFood = errs.join(' · ');
    const d = ST.draft;
    openCustomFood(d.foodId);
    return;
  }
  const d = ST.draft;
  const payload = {
    id: d.foodId || ('c-' + norm(name).replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '-' + Math.random().toString(36).slice(2, 5)),
    name: name, group: group, unit: unit, refGrams: grams || 0,
    kcal: Math.round(kcal), protein: round1(p), carb: round1(c), fat: round1(f),
    aliases: [], custom: true,
  };
  const normalized = normalizeFood(payload);
  if (d.foodId) {
    for (let i = 0; i < ST.customFoods.length; i++) if (ST.customFoods[i].id === d.foodId) ST.customFoods[i] = normalized;
  } else {
    ST.customFoods.push(normalized);
  }
  saveFoods();
  const pendingRow = ST.billPendingRow;
  ST.formMsgFood = '';
  ST.foodDraft = null;
  closeModal();
  render();
  if (pendingRow && ST.bill) {
    const row = ST.bill.rows.filter((r) => r.id === pendingRow)[0];
    if (row) {
      row.foodId = normalized.id;
      row.include = true;
      openBillSheet();
      showToast('Đã thêm món "' + name + '" và gán vào dòng hoá đơn');
      return;
    }
  }
  if (ST.modal && ST.modal.kind === 'pick') renderPickerBody();
  showToast(d.foodId ? 'Đã lưu món' : 'Đã thêm món "' + name + '"');
}
function numOrNull(v) {
  const s = String(v == null ? '' : v).replace(',', '.').trim();
  if (!s) return null;
  const n = Number(s);
  return isFinite(n) ? n : null;
}
function askDeleteFood(foodId) {
  const f = foodById(foodId);
  if (!f) return;
  ST.draft = { mode: 'delete-food', foodId: foodId };
  openModal('confirm', '', ST.draft);
  const sheet = $('modalRoot').querySelector('.sheet');
  sheet.innerHTML = '<div class="sheet-grab"></div>' +
    '<div class="sheet-head"><h2>Xoá món tự khai báo?</h2>' +
      '<button class="icon-btn" type="button" title="Đóng" onclick="closeModal()">' + IC.close + '</button></div>' +
    '<div class="sheet-body"><div class="hint">"' + esc(f.name) + '" sẽ biến khỏi thư viện. Các mục bữa ăn đã ghi bằng món này <b>vẫn giữ nguyên tên và dinh dưỡng</b>.</div></div>' +
    '<div class="sheet-foot"><button class="btn" type="button" onclick="closeModal()">Huỷ</button>' +
      '<button class="btn danger" type="button" onclick="doDeleteFood()">Xoá món</button></div>';
}
function doDeleteFood() {
  const d = ST.draft;
  if (!d) { closeModal(); return; }
  const before = ST.customFoods.length;
  ST.customFoods = ST.customFoods.filter((f) => f.id !== d.foodId);
  ST.favorites = ST.favorites.filter((id) => id !== d.foodId);
  saveFoods();
  closeModal();
  render();
  showToast(before !== ST.customFoods.length ? 'Đã xoá món' : 'Không tìm thấy món');
}

/* =========================== Hồ sơ & mục tiêu =========================== */
function setDraft(k, v) {
  ST.formDraft = ST.formDraft || {};
  ST.formDraft[k] = v;
  /* cập nhật class ngay trên DOM — KHÔNG re-render để giữ giá trị người dùng đang gõ */
  const attr = k === 'gender' ? 'data-gender' : (k === 'goal' ? 'data-goal' : null);
  if (attr) {
    document.querySelectorAll('[' + attr + ']').forEach((b) => {
      b.classList.toggle('is-on', b.getAttribute(attr) === v);
    });
    previewTargets();
  }
}
function previewTargets() {
  /* Đọc form hiện tại → tính lại mục tiêu ngay (chưa lưu) */
  const draft = readProfileForm(false);
  const box = $('targetBox');
  if (!box) return;
  if (!draft.ok) {
    box.innerHTML = '<div class="hint">Chưa có mục tiêu — nhập đủ <b>tuổi, chiều cao, cân nặng</b> ở trên rồi bấm "Lưu hồ sơ".</div>';
    return;
  }
  const snapshot = { profile: ST.config.profile, goal: ST.config.goal, macro: ST.config.macro };
  ST.config.profile = draft.profile;
  ST.config.goal = draft.goal;
  const t = computeTargets();
  ST.config.profile = snapshot.profile;
  ST.config.goal = snapshot.goal;
  if (!t) return;
  box.innerHTML = '<div class="target-kcal">' + fmtInt(t.kcal) + ' <small>kcal / ngày</small></div>' +
    '<div class="target-macros">' +
      '<div class="target-macro"><b style="color:var(--protein)">' + fmtInt(t.protein) + 'g</b><span>Đạm</span></div>' +
      '<div class="target-macro"><b style="color:var(--carb)">' + fmtInt(t.carb) + 'g</b><span>Carb</span></div>' +
      '<div class="target-macro"><b style="color:var(--fat)">' + fmtInt(t.fat) + 'g</b><span>Béo</span></div>' +
    '</div><div class="tiny muted" style="margin-top:9px">' + esc(formulaText(t)) + '</div>';
}

function readProfileForm(validate) {
  const gender = ($('pfGenderValue') || {}).value || (ST.formDraft && ST.formDraft.gender) || (ST.config.profile && ST.config.profile.gender) || 'male';
  const goal = (ST.formDraft && ST.formDraft.goal) || ST.config.goal || 'keep';
  const activity = ($('pfActivity') && $('pfActivity').value) || (ST.config.profile && ST.config.profile.activity) || 'sed';
  const age = numOrNull($('pfAge') ? $('pfAge').value : '');
  const height = numOrNull($('pfHeight') ? $('pfHeight').value : '');
  const weight = numOrNull($('pfWeight') ? $('pfWeight').value : '');
  const errs = {};
  if (age == null || age < 10 || age > 100) errs.age = 'Tuổi phải trong khoảng 10–100';
  if (height == null || height <= 0) errs.height = 'Chiều cao phải lớn hơn 0 cm';
  if (weight == null || weight <= 0) errs.weight = 'Cân nặng phải lớn hơn 0 kg';
  if (Object.keys(errs).length) return { ok: false, errs: errs, profile: null, goal: goal };
  return { ok: true, errs: {}, goal: goal, profile: { gender: gender, age: Math.round(age), height: height, weight: weight, activity: activity } };
}

function saveProfile() {
  const r = readProfileForm(true);
  ST.formErrors = r.ok ? {} : r.errs;
  if (!r.ok) {
    ST.formMsg = 'Chưa lưu được — kiểm tra các trường được đánh dấu.';
    render();
    return;
  }
  ST.formMsg = '';
  ST.config.profile = r.profile;
  ST.config.goal = r.goal;
  ST.config.updatedAt = localISO();
  saveConfig();
  render();
  const t = computeTargets();
  showToast(t ? 'Đã lưu hồ sơ · mục tiêu ' + fmtInt(t.kcal) + ' kcal/ngày' : 'Đã lưu hồ sơ');
}

function setMacroPreset(id) {
  if (id === 'custom') {
    ST.config.macroMode = 'custom';
  } else {
    const p = MACRO_PRESETS.filter((x) => x.id === id)[0];
    if (p) {
      ST.config.macroMode = p.id;
      ST.config.macro = { protein: p.protein, carb: p.carb, fat: p.fat };
      saveConfig();
    }
  }
  ST.formMsgMacro = '';
  render();
}
function saveMacro() {
  ST.formMsgMacro = '';
  if (ST.config.macroMode === 'custom') {
    const p = numOrNull($('mfP') ? $('mfP').value : '');
    const c = numOrNull($('mfC') ? $('mfC').value : '');
    const f = numOrNull($('mfF') ? $('mfF').value : '');
    if (p == null || c == null || f == null || p < 0 || c < 0 || f < 0) {
      ST.formMsgMacro = 'Vui lòng nhập đủ ba tỉ lệ macro (số không âm).';
      render();
      return;
    }
    const sum = p + c + f;
    if (Math.abs(sum - 100) > 1) {
      ST.formMsgMacro = 'Tổng ba tỉ lệ phải bằng 100% (hiện tại ' + fmt1(sum) + '%).';
      render();
      return;
    }
    ST.config.macro = { protein: p, carb: c, fat: f };
  } else {
    const p = MACRO_PRESETS.filter((x) => x.id === ST.config.macroMode)[0] || MACRO_PRESETS[1];
    ST.config.macro = { protein: p.protein, carb: p.carb, fat: p.fat };
  }
  ST.config.updatedAt = localISO();
  saveConfig();
  render();
  showToast('Đã lưu tỉ lệ macro');
}

/* =========================== Thao tác tab Hôm nay =========================== */
function shiftDay(delta) {
  const next = shiftKey(ST.dateKey, delta);
  if (isFutureKey(next)) return;
  ST.dateKey = next;
  ST.lastAdded = null;
  render();
}
function goToday() { ST.dateKey = todayKey(); ST.lastAdded = null; render(); }

function quickAdd(foodId) {
  const food = foodById(foodId);
  if (!food) { showToast('Không tìm thấy món'); return; }
  const time = isToday(ST.dateKey) ? floorTo5(nowHHMM()) : '12:00';
  const meal = isToday(ST.dateKey) ? inferMeal(time) : 'lunch';
  const en = addEntry(food, 1, meal, time, ST.dateKey);
  ST.lastAdded = { key: ST.dateKey, id: en.id, foodId: food.id, meal: meal };
  render();
  showToast('Đã ghi ' + food.name + ' (' + fmtInt(en.kcal) + ' kcal) vào bữa ' + MEAL_LABEL[meal]);
}
function changeMealOfLast(mealId) {
  const la = ST.lastAdded;
  if (!la) return;
  const hit = findEntry(la.key, la.id);
  if (!hit) { ST.lastAdded = null; render(); return; }
  hit.entry.meal = mealId;
  la.meal = mealId;
  saveLog();
  render();
  showToast('Đã chuyển sang bữa ' + MEAL_LABEL[mealId]);
}

/* =========================== Xuất / nhập dữ liệu =========================== */
function download(filename, text, mime) {
  try {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch (e) {
    showToast('Không xuất được file trên trình duyệt này');
    return false;
  }
}
function exportJSON() {
  const payload = {
    app: 'nhat-ky-dinh-duong',
    version: 1,
    exportedAt: localISO(),
    log: ST.log,
    config: ST.config,
    foods: ST.customFoods,
    favorites: ST.favorites,
  };
  const ok = download('nhat-ky-dinh-duong-' + todayKey() + '.json', JSON.stringify(payload, null, 2), 'application/json');
  if (ok) showToast('Đã xuất JSON — gửi vào Telegram để sao lưu');
}
function exportCSV() {
  const esc_cell = (v) => {
    const s = String(v == null ? '' : v);
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const rows = [['ngày', 'nhóm bữa', 'tên món', 'khẩu phần', 'kcal', 'đạm', 'carb', 'béo']];
  Object.keys(ST.log).filter((k) => ISO_DAY.test(k)).sort().forEach((k) => {
    const byMeal = {};
    MEALS.forEach((m) => { byMeal[m.id] = []; });
    getDayEntries(k).forEach((en) => { (byMeal[en.meal] || byMeal.breakfast).push(en); });
    MEALS.forEach((m) => {
      byMeal[m.id].forEach((en) => {
        rows.push([
          fmtDateVN(k), MEAL_LABEL[en.meal], en.name, fmt1(en.qty), Math.round(en.kcal),
          fmt1(en.protein), fmt1(en.carb), fmt1(en.fat),
        ]);
      });
    });
  });
  const csv = '\ufeff' + rows.map((r) => r.map(esc_cell).join(',')).join('\n');
  if (download('nhat-ky-dinh-duong-' + todayKey() + '.csv', csv, 'text/csv;charset=utf-8')) {
    showToast('Đã xuất CSV (' + (rows.length - 1) + ' dòng)');
  }
}
function pickImportFile() {
  const inp = $('importFile');
  if (!inp) return;
  inp.value = '';
  inp.click();
}
function onImportFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let parsed = null;
    try { parsed = JSON.parse(String(reader.result)); }
    catch (e) { showToast('File JSON không đọc được'); return; }
    const res = validateImport(parsed);
    if (!res.ok) { showToast('File không hợp lệ: ' + res.error); return; }
    ST.draft = { mode: 'import', payload: res };
    openModal('confirm', '', ST.draft);
    const sheet = $('modalRoot').querySelector('.sheet');
    sheet.innerHTML = '<div class="sheet-grab"></div>' +
      '<div class="sheet-head"><h2>Nhập dữ liệu?</h2>' +
        '<button class="icon-btn" type="button" title="Đóng" onclick="closeModal()">' + IC.close + '</button></div>' +
      '<div class="sheet-body"><div class="hint">File có <b>' + res.days + ' ngày</b> · <b>' + res.entries + ' mục bữa ăn</b> · <b>' +
        res.foods.length + ' món tự khai báo</b>' + (res.hasConfig ? ' · có hồ sơ/mục tiêu' : '') + '.<br><br>' +
        '<b style="color:var(--over)">Thao tác này sẽ THAY THẾ toàn bộ dữ liệu hiện có trên máy.</b> Dữ liệu hiện tại: ' +
        Object.keys(ST.log).length + ' ngày · ' + ST.customFoods.length + ' món tự khai báo.</div></div>' +
      '<div class="sheet-foot"><button class="btn" type="button" onclick="closeModal()">Huỷ</button>' +
        '<button class="btn primary" type="button" onclick="doImport()">Thay thế dữ liệu</button></div>';
  };
  reader.onerror = () => showToast('Không đọc được file');
  reader.readAsText(file);
}
function validateImport(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, error: 'nội dung không phải object JSON' };
  const log = obj.log;
  if (!log || typeof log !== 'object' || Array.isArray(log)) return { ok: false, error: 'thiếu khoá "log" dạng object theo ngày' };
  const cleanLog = {};
  let days = 0, entries = 0;
  const keys = Object.keys(log);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (!ISO_DAY.test(k)) return { ok: false, error: 'ngày "' + k + '" không đúng định dạng YYYY-MM-DD' };
    if (!Array.isArray(log[k])) return { ok: false, error: 'dữ liệu ngày ' + k + ' không phải mảng' };
    const list = [];
    for (let j = 0; j < log[k].length; j++) {
      const en = log[k][j];
      if (!en || typeof en !== 'object' || typeof en.name !== 'string' || !en.name.trim()) {
        return { ok: false, error: 'mục thứ ' + (j + 1) + ' của ngày ' + k + ' thiếu tên món' };
      }
      const kcal = Number(en.kcal), qty = Number(en.qty);
      if (!isFinite(kcal) || kcal < 0) return { ok: false, error: 'mục "' + en.name + '" có kcal không hợp lệ' };
      if (!isFinite(qty) || qty <= 0) return { ok: false, error: 'mục "' + en.name + '" có khẩu phần không hợp lệ' };
      list.push(sanitizeEntry(en, k));
      entries += 1;
    }
    cleanLog[k] = list;
    days += 1;
  }
  const cfg = (obj.config && typeof obj.config === 'object' && !Array.isArray(obj.config)) ? sanitizeConfig(obj.config) : {};
  const foods = Array.isArray(obj.foods) ? obj.foods.map(normalizeFood).filter(Boolean).map((f) => { f.custom = true; return f; }) : [];
  const favs = Array.isArray(obj.favorites) ? obj.favorites.filter((x) => typeof x === 'string') : [];
  return { ok: true, log: cleanLog, config: cfg, foods: foods, favorites: favs, days: days, entries: entries, hasConfig: hasProfileIn(cfg) };
}
function hasProfileIn(cfg) {
  const p = cfg && cfg.profile;
  return !!(p && Number(p.age) > 0 && Number(p.height) > 0 && Number(p.weight) > 0);
}
function sanitizeEntry(en, dayKey) {
  const qty = round2(Number(en.qty));
  const per = (en.per && typeof en.per === 'object') ? {
    kcal: Math.max(0, Number(en.per.kcal) || 0),
    protein: Math.max(0, Number(en.per.protein) || 0),
    carb: Math.max(0, Number(en.per.carb) || 0),
    fat: Math.max(0, Number(en.per.fat) || 0),
  } : {
    kcal: round2(Number(en.kcal) / qty), protein: round2(Number(en.protein) / qty),
    carb: round2(Number(en.carb) / qty), fat: round2(Number(en.fat) / qty),
  };
  const time = HHMM.test(String(en.time)) ? roundTo5(String(en.time)) : '12:00';
  return {
    id: typeof en.id === 'string' && en.id ? en.id : uid(),
    meal: MEAL_IDS.indexOf(en.meal) >= 0 ? en.meal : 'breakfast',
    foodId: typeof en.foodId === 'string' ? en.foodId : null,
    name: String(en.name).trim(),
    unit: String(en.unit || '1 phần'),
    refGrams: Number(en.refGrams) > 0 ? Math.round(Number(en.refGrams)) : 0,
    qty: qty,
    per: per,
    kcal: Math.round(per.kcal * qty),
    protein: round1(per.protein * qty),
    carb: round1(per.carb * qty),
    fat: round1(per.fat * qty),
    time: time,
    dateKey: dayKey,
  };
}
function sanitizeConfig(cfg) {
  const out = {};
  if (cfg.profile && typeof cfg.profile === 'object') {
    const p = cfg.profile;
    out.profile = {
      gender: p.gender === 'female' ? 'female' : 'male',
      age: clamp(Number(p.age) || 0, 0, 120),
      height: Number(p.height) || 0,
      weight: Number(p.weight) || 0,
      activity: ACTIVITY_BY_ID[p.activity] ? p.activity : 'sed',
    };
  }
  if (GOAL_BY_ID[cfg.goal]) out.goal = cfg.goal;
  const m = cfg.macro;
  if (m && [m.protein, m.carb, m.fat].every((v) => isFinite(Number(v)))) {
    out.macro = { protein: Number(m.protein), carb: Number(m.carb), fat: Number(m.fat) };
    out.macroMode = (cfg.macroMode === 'custom' || MACRO_PRESETS.some((x) => x.id === cfg.macroMode)) ? cfg.macroMode : 'custom';
  }
  if (typeof cfg.updatedAt === 'string') out.updatedAt = cfg.updatedAt;
  return out;
}
function doImport() {
  const d = ST.draft;
  if (!d || !d.payload) { closeModal(); return; }
  const p = d.payload;
  ST.log = p.log;
  ST.config = p.config;
  ST.customFoods = p.foods;
  ST.favorites = p.favorites;
  saveLog(); saveConfig(); saveFoods();
  ST.dateKey = todayKey();
  ST.lastAdded = null;
  closeModal();
  render();
  showToast('Đã nhập ' + p.days + ' ngày · ' + p.entries + ' mục');
}

/* ---------- Giải thích macro (chạm vào Đạm/Carb/Béo) ---------- */
function topFoodsByMacro(kind, limit) {
  return allFoods()
    .filter((f) => Number(f[kind]) > 0 && Number(f.kcal) >= 30)
    .map((f) => ({ f: f, per100: (Number(f[kind]) / Number(f.kcal)) * 100 }))
    .sort((a, b) => b.per100 - a.per100 || Number(b.f[kind]) - Number(a.f[kind]))
    .slice(0, limit || 6);
}

function macroLabelHtml(kind, color) {
  const info = MACRO_INFO[kind];
  if (!info) return '';
  return '<button class="macro-label" type="button" style="color:' + (color || MACRO_COLOR[kind]) + '" ' +
    'title="Xem giải thích: tác dụng · ăn gì thì tăng · có nên hạn chế" onclick="openMacroInfo(\'' + kind + '\')">' +
    esc(info.label) + '</button>';
}

function openMacroInfo(kind) {
  if (!MACRO_INFO[kind]) return;
  ST.draft = { kind: kind };
  openModal('macro', '', ST.draft);
  renderMacroSheet();
}

function renderMacroSheet() {
  const kind = ST.draft && ST.draft.kind;
  const info = MACRO_INFO[kind];
  const root = $('modalRoot');
  const sheet = root && root.querySelector('.sheet');
  if (!info || !sheet) return;
  const tops = topFoodsByMacro(kind, 6);
  const targets = computeTargets();
  const goal = targets ? targets[kind] : null;
  sheet.innerHTML = '<div class="sheet-grab"></div>' +
    '<div class="sheet-head"><h2>' + esc(info.full) + '</h2>' +
      '<button class="icon-btn" type="button" title="Đóng" onclick="closeModal()">' + IC.close + '</button></div>' +
    '<div class="sheet-body">' +
      '<div class="target-box" style="display:flex;align-items:center;gap:10px">' +
        '<div class="target-kcal">' + info.kcalPerGram + ' <small>kcal / gram</small></div>' +
        (goal != null
          ? '<div class="tiny muted" style="margin-left:auto;text-align:right">Mục tiêu của bạn<br><b style="color:' + MACRO_COLOR[kind] + ';font-size:15px">' + fmtInt(goal) + 'g/ngày</b></div>'
          : '') +
      '</div>' +
      '<div class="section-title">Tác dụng</div>' +
      '<div class="hint">' + esc(info.role) + '</div>' +
      '<div class="section-title">Ăn gì thì tăng ' + esc(info.label.toLowerCase()) + '</div>' +
      '<div class="hint">' + info.sources.map((s) => '• ' + esc(s)).join('<br>') + '</div>' +
      (tops.length
        ? '<div class="group-label" style="margin-top:10px">Đậm đặc nhất trong thư viện (mỗi khẩu phần)</div>' +
          tops.map((t) => '<div class="pick-row"><div class="entry-main">' +
            '<div class="entry-name">' + esc(t.f.name) + '</div>' +
            '<div class="entry-sub">' + esc(t.f.unit) + ' · ' + fmt1(t.f[kind]) + 'g ' + esc(info.label.toLowerCase()) + ' · ' + fmtInt(t.f.kcal) + ' kcal</div>' +
            '</div><div class="pick-kcal">' + Math.round(t.per100) + 'g/100kcal</div></div>').join('')
        : '') +
      '<div class="section-title">Nên hạn chế hay không?</div>' +
      '<div class="verdict ' + (info.verdictTone === 'ok' ? 'is-ok' : 'is-watch') + '">' + esc(info.verdict) + '</div>' +
      '<div class="hint" style="margin-top:8px">' + esc(info.tip) + '</div>' +
    '</div>' +
    '<div class="sheet-foot"><button class="btn" type="button" onclick="closeModal()">Đóng</button></div>';
}

/* =========================== Chụp hoá đơn (OCR) ===========================
   Nhận diện chạy hoàn toàn trên thiết bị: ảnh và chữ KHÔNG rời khỏi máy.
   Bộ máy (vendor, cùng origin) + lõi wasm/dữ liệu tiếng Việt tải ở lần dùng đầu
   rồi service worker cache lại để các lần sau chạy offline.  */

let ocrLibPromise = null;
let ocrEnginePromise = null;
let ocrWorker = null;

function loadOcrLib() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (!ocrLibPromise) {
    ocrLibPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = OCR.libPath;
      s.onload = () => (window.Tesseract ? resolve(window.Tesseract) : reject(new Error('ocr-lib')));
      s.onerror = () => { ocrLibPromise = null; reject(new Error('ocr-lib')); };
      document.head.appendChild(s);
    });
  }
  return ocrLibPromise;
}

function loadOcrEngine() {
  if (ocrWorker) return Promise.resolve(ocrWorker);
  if (!ocrEnginePromise) {
    ocrEnginePromise = (async () => {
      await loadOcrLib();
      const w = await window.Tesseract.createWorker(OCR.lang, 1, {
        workerPath: OCR.workerPath,
        corePath: OCR.corePath,
        langPath: OCR.langPath,
        logger: (m) => ocrProgressTick(m),
      });
      ocrWorker = w;
      return w;
    })();
    ocrEnginePromise.catch(() => { ocrEnginePromise = null; });
  }
  return ocrEnginePromise;
}

function ocrProgressTick(m) {
  if (!ST.bill || ST.bill.state !== 'ocr' || !m) return;
  const isText = m.status === 'recognizing text';
  const pct = isText ? Math.round((m.progress || 0) * 100) : null;
  if (isText) ST.bill.progress = pct;
  const bar = $('billBar');
  const label = $('billProg');
  if (bar && pct != null) bar.style.width = Math.max(4, pct) + '%';
  if (label) {
    if (pct != null) label.textContent = 'Đang đọc hoá đơn… ' + pct + '%';
    else if (m.status === 'loading language traineddata') label.textContent = 'Đang tải dữ liệu tiếng Việt (lần đầu ~4MB)…';
    else label.textContent = 'Đang chuẩn bị bộ nhận diện…';
  }
}

/* Thu nhỏ 1600px + ảnh xám + giãn tương phản percentile 2–98 (giúp dấu tiếng Việt ổn hơn) */
async function preprocessBillImage(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, OCR.maxEdge / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) hist[(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0]++;
  const total = w * h, lo = total * 0.02, hi = total * 0.98;
  let acc = 0, p2 = 0, p98 = 255;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= lo && !p2) p2 = v;
    if (acc >= hi) { p98 = v; break; }
  }
  const range = Math.max(1, p98 - p2);
  for (let i = 0; i < d.length; i += 4) {
    const g = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    const v = clamp(((g - p2) / range) * 255, 0, 255) | 0;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  if (bmp.close) bmp.close();
  return c;
}

function ocrErrorMessage(err) {
  const msg = String((err && err.message) || err || '');
  if (msg.indexOf('ocr-lib') >= 0 || /failed to fetch|network|Load failed|timeout/i.test(msg)) {
    return 'Không tải được bộ nhận diện. Lần dùng đầu tiên cần mạng (khoảng 7MB) — kiểm tra kết nối rồi thử lại. Các lần sau đã lưu trên máy nên chạy được offline.';
  }
  if (/image|bitmap|decode/i.test(msg)) {
    return 'Không đọc được ảnh này. Thử chọn ảnh khác (JPG/PNG) hoặc chụp lại rõ hơn.';
  }
  return 'Không nhận diện được hoá đơn (' + esc(msg.slice(0, 80)) + '). Bạn vẫn có thể ghi món thủ công.';
}

function openBillCapture() {
  const inp = $('billFile');
  if (!inp) return;
  inp.value = '';
  inp.click();
}

function onBillFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (file.type && !/^image\//.test(file.type)) { showToast('Tệp đã chọn không phải ảnh'); return; }
  startBillOcr(file);
}

async function startBillOcr(file) {
  const b = {
    state: 'prep', rows: [], progress: 0, error: null, conf: 0, ms: 0,
    meal: inferMeal(nowHHMM()),
    time: isToday(ST.dateKey) ? floorTo5(nowHHMM()) : '12:00',
  };
  ST.bill = b;
  openModal('bill', '', null);
  renderBillSheet();
  try {
    const canvas = await preprocessBillImage(file);
    if (ST.bill !== b) return;
    b.state = 'ocr';
    renderBillSheet();
    const worker = await loadOcrEngine();
    if (ST.bill !== b) return;
    const t0 = Date.now();
    const out = await worker.recognize(canvas);
    if (ST.bill !== b) return;
    b.ms = Date.now() - t0;
    b.conf = (out && out.data && out.data.confidence) || 0;
    b.rows = buildBillRows((out && out.data && out.data.text) || '');
    b.state = b.rows.length ? 'review' : 'empty';
  } catch (err) {
    if (ST.bill !== b) return;
    b.state = 'error';
    /* Bộ máy chưa lên được ⇒ lỗi tài nguyên (lần đầu cần mạng), không phải lỗi ảnh */
    b.error = ocrWorker ? ocrErrorMessage(err) : ('Không tải được bộ nhận diện. Lần dùng đầu tiên cần mạng (khoảng 7MB) — kiểm tra kết nối rồi thử lại. Các lần sau đã lưu trên máy nên chạy được offline.');
  }
  renderBillSheet();
}

function billClose() {
  ST.bill = null;
  ST.billPendingRow = null;
  closeModal();
}

function openBillSheet() {
  if (!ST.bill) { closeModal(); return; }
  openModal('bill', '', null);
  renderBillSheet();
}

function billRowsHtml(b) {
  const total = b.rows.reduce((s, r) => {
    if (!r.include || !r.foodId) return s;
    const f = foodById(r.foodId);
    return s + (f ? Math.round(f.kcal * r.qty) : 0);
  }, 0);
  const on = b.rows.filter((r) => r.include).length;
  const unassigned = b.rows.filter((r) => r.include && !r.foodId).length;
  const rowsHtml = b.rows.map((r) => {
    const food = r.foodId ? foodById(r.foodId) : null;
    const kcal = food ? Math.round(food.kcal * r.qty) : 0;
    const alts = (r.candidates || []).filter((c) => c.id !== r.foodId).slice(0, 2);
    return '<div class="pick-row bill-row' + (r.include ? '' : ' is-off') + '">' +
      '<button class="icon-btn' + (r.include ? ' accent' : '') + '" type="button" title="' + (r.include ? 'Bỏ dòng này' : 'Chọn dòng này') + '" onclick="billToggle(\'' + esc(r.id) + '\')">' + (r.include ? IC.check : IC.square) + '</button>' +
      '<div class="entry-main" onclick="billPick(\'' + esc(r.id) + '\')" title="Chọn/đổi món cho dòng này">' +
        (food
          ? '<div class="entry-name">' + esc(food.name) + '</div>'
          : '<div class="entry-name" style="color:var(--warn)">Chưa gán món — chạm để chọn</div>') +
        '<div class="entry-sub">OCR: “' + esc(r.raw) + '”</div>' +
        (alts.length
          ? '<div class="entry-sub">Gợi ý: ' + alts.map((c) => '<button class="mini-chip" type="button" onclick="event.stopPropagation();billUseCandidate(\'' + esc(r.id) + '\',\'' + esc(c.id) + '\')">' + esc(c.name) + '</button>').join(' ') + '</div>'
          : '') +
        (!food
          ? '<div class="entry-sub"><button class="mini-chip" type="button" onclick="event.stopPropagation();billAddCustom(\'' + esc(r.id) + '\')">＋ Thêm món tự khai báo</button></div>'
          : '') +
      '</div>' +
      '<div class="bill-qty">' +
        '<button class="icon-btn" type="button" title="Giảm khẩu phần" onclick="billQty(\'' + esc(r.id) + '\',-0.5)">−</button>' +
        '<span>' + fmt1(r.qty) + '</span>' +
        '<button class="icon-btn" type="button" title="Tăng khẩu phần" onclick="billQty(\'' + esc(r.id) + '\',0.5)">+</button>' +
      '</div>' +
      '<div class="pick-kcal">' + (food ? fmtInt(kcal) : '—') + '</div>' +
    '</div>';
  }).join('');
  return '<div class="hint">Đọc được <b>' + b.rows.length + '</b> dòng món' +
    (b.conf ? ' · độ tin cậy ' + Math.round(b.conf) + '%' : '') +
    ' · đã chọn <b>' + on + '</b> dòng · tổng dự kiến <b>' + fmtInt(total) + ' kcal</b>' +
    (unassigned ? '<br><span style="color:var(--warn)">' + unassigned + ' dòng chưa gán món sẽ không được ghi</span>' : '') + '</div>' +
    '<div class="field" style="margin-top:10px"><label>Nhóm bữa cho cả loạt</label><div class="seg">' +
      MEALS.map((m) => '<button type="button" class="' + (b.meal === m.id ? 'is-on' : '') + '" onclick="billMeal(\'' + m.id + '\')">' + m.emoji + ' ' + esc(m.label) + '</button>').join('') +
    '</div></div>' +
    '<div class="field"><label>Giờ ghi (bước 5 phút · ngày ' + fmtDateVN(ST.dateKey) + ')</label>' +
      '<input type="time" id="billTime" step="300" value="' + esc(b.time) + '" onchange="billSetTime()"></div>' +
    '<div class="divider"></div>' + rowsHtml;
}

function renderBillSheet() {
  const b = ST.bill;
  const root = $('modalRoot');
  const sheet = root && root.querySelector('.sheet');
  if (!b || !sheet) return;
  let body;
  if (b.state === 'prep' || b.state === 'ocr') {
    body = '<div class="hint">Đang đọc hoá đơn — ảnh chỉ được xử lý trên máy bạn, không gửi đi đâu cả.</div>' +
      '<div class="bar" style="margin-top:12px"><i id="billBar" style="width:6%;background:var(--accent)"></i></div>' +
      '<div class="tiny muted" style="margin-top:8px" id="billProg">Đang chuẩn bị…</div>' +
      '<div class="tiny muted" style="margin-top:10px">Lần đầu dùng cần tải bộ nhận diện (~7MB) rồi lưu trên máy; các lần sau chạy offline.</div>';
  } else if (b.state === 'error') {
    body = '<div class="err-box">' + esc(b.error) + '</div>' +
      '<div class="hint">Bạn vẫn ghi món thủ công bình thường.</div>';
  } else if (b.state === 'empty') {
    body = '<div class="empty-state"><b>Không tìm thấy dòng món nào</b>' +
      'Bill viết tay hoặc bill chỉ ghi tổng tiền thì OCR chịu. Thử chụp lại gần hơn / đủ sáng, hoặc thêm món thủ công.</div>';
  } else {
    body = billRowsHtml(b);
  }
  let foot = '';
  if (b.state === 'review') {
    const on = b.rows.filter((r) => r.include && r.foodId).length;
    foot = '<button class="btn" type="button" onclick="billClose()">Huỷ</button>' +
      '<button class="btn primary" type="button" onclick="billConfirm()"' + (on ? '' : ' disabled') + '>Ghi ' + on + ' món</button>';
  } else if (b.state === 'error' || b.state === 'empty') {
    foot = '<button class="btn" type="button" onclick="billClose()">Đóng</button>' +
      '<button class="btn primary" type="button" onclick="openBillCapture()">Chụp lại</button>';
  }
  sheet.innerHTML = '<div class="sheet-grab"></div>' +
    '<div class="sheet-head"><h2>' + (b.state === 'review' ? 'Xem lại hoá đơn' : 'Chụp hoá đơn') + '</h2>' +
      '<button class="icon-btn" type="button" title="Đóng" onclick="billClose()">' + IC.close + '</button></div>' +
    '<div class="sheet-body">' + body + '</div>' +
    (foot ? '<div class="sheet-foot">' + foot + '</div>' : '');
}

function billToggle(id) {
  const r = ST.bill && ST.bill.rows.filter((x) => x.id === id)[0];
  if (!r) return;
  r.include = !r.include;
  renderBillSheet();
}
function billQty(id, delta) {
  const r = ST.bill && ST.bill.rows.filter((x) => x.id === id)[0];
  if (!r) return;
  r.qty = clamp(Math.round((r.qty + delta) * 2) / 2, 0.5, 20);
  renderBillSheet();
}
function billMeal(mealId) {
  if (!ST.bill || MEAL_IDS.indexOf(mealId) < 0) return;
  ST.bill.meal = mealId;
  renderBillSheet();
}
function billSetTime() {
  const inp = $('billTime');
  if (!inp || !ST.bill) return;
  let t = HHMM.test(inp.value) ? floorTo5(inp.value) : floorTo5(nowHHMM());
  if (isToday(ST.dateKey) && hhmmToMin(t) > hhmmToMin(nowHHMM())) {
    t = floorTo5(nowHHMM());
    showToast('Không thể chọn thời gian trong tương lai');
  }
  ST.bill.time = t;
  inp.value = t;
}
function billPick(rowId) {
  const r = ST.bill && ST.bill.rows.filter((x) => x.id === rowId)[0];
  if (!r) return;
  openPicker(null, rowId);
}
function billUseCandidate(rowId, foodId) {
  const r = ST.bill && ST.bill.rows.filter((x) => x.id === rowId)[0];
  if (!r || !foodById(foodId)) return;
  r.foodId = foodId;
  r.include = true;
  renderBillSheet();
}
function billAssignFood(foodId) {
  const rowId = ST.draft && ST.draft.forRow;
  const food = foodById(foodId);
  if (!rowId || !food || !ST.bill) { closeModal(); return; }
  const r = ST.bill.rows.filter((x) => x.id === rowId)[0];
  if (r) { r.foodId = food.id; r.include = true; }
  openBillSheet();
}
function billAddCustom(rowId) {
  const r = ST.bill && ST.bill.rows.filter((x) => x.id === rowId)[0];
  if (!r) return;
  ST.billPendingRow = rowId;
  ST.foodDraft = { forId: null, values: { name: r.name } };
  openCustomFood(null);
}
function billConfirm() {
  const b = ST.bill;
  if (!b) { closeModal(); return; }
  const rows = b.rows.filter((r) => r.include && r.foodId && foodById(r.foodId));
  const skipped = b.rows.filter((r) => r.include && !r.foodId).length;
  if (!rows.length) { showToast('Chưa dòng nào được gán món'); return; }
  let kcal = 0;
  rows.forEach((r) => {
    const en = addEntry(foodById(r.foodId), r.qty, b.meal, b.time, ST.dateKey);
    kcal += en.kcal;
  });
  ST.bill = null;
  ST.lastAdded = null;
  closeModal();
  render();
  showToast('Đã ghi ' + rows.length + ' món · ' + fmtInt(kcal) + ' kcal' +
    (skipped ? ' (bỏ qua ' + skipped + ' dòng chưa gán món)' : ''));
}

/* ---------- Đọc dòng hoá đơn ---------- */
/* Bỏ tiêu đề/footer/tổng tiền: so khớp MỜ theo từ trên chữ đã bỏ dấu, vì OCR hay
   làm hỏng dấu câu ("THANH. TOÁN", "Tôủg cộng") — substring thuần sẽ trượt. */
const BILL_SKIP_WORDS = [
  'tong cong', 'tong', 'vat', 'gtgt', 'thue', 'thanh toan', 'tien mat', 'tien thua',
  'tien khach', 'cam on', 'dia chi', 'dc', 'dien thoai', 'sdt', 'hotline', 'ngay',
  'nhan vien', 'thu ngan', 'quy khach', 'hoa don', 'ma don', 'so phieu', 'khu vuc',
  'in luc', 'nha hang', 'cong ty', 'tnhh', 'chi nhanh', 'ten mon', 'don gia', 'so luong',
  'khach hang', 'phuc vu', 'so ban', 'ban so',
];

function looksLikeSkip(raw) {
  const toks = norm(raw).replace(/[^a-z0-9]+/g, ' ').split(' ').filter((t) => t.length > 0);
  if (!toks.length) return true;
  for (let i = 0; i < BILL_SKIP_WORDS.length; i++) {
    const phrase = BILL_SKIP_WORDS[i].split(' ').filter((t) => t.length > 1 || t === 'dc');
    if (!phrase.length) continue;
    let hit = 0;
    phrase.forEach((pt) => { if (toks.some((t) => tokenSim(pt, t) >= 0.7)) hit += 1; });
    if (hit >= Math.ceil(phrase.length * 0.6)) return true;
  }
  return false;
}

function moneyTokens(s) {
  return (String(s).match(/\d{1,3}(?:[.,]\d{3})+/g) || []).map((x) => Number(x.replace(/[.,]/g, '')));
}

/* Tách "tên món" khỏi cụm số ở cuối dòng */
function splitBillLine(line) {
  const toks = String(line).replace(/\s+/g, ' ').trim().split(' ');
  let cut = toks.length;
  while (cut > 0 && /^[xX*]?[\d.,]+$/.test(toks[cut - 1])) cut--;
  const tail = toks.slice(cut).join(' ');
  const name = toks.slice(0, cut).join(' ').replace(/^(\d{1,3})\s*[.)]\s*/, '').replace(/[\s.\-–:]+$/, '').trim();
  const smalls = (tail.match(/(?:^|\s)[xX]?(\d{1,3}(?:[.,]\d)?)(?=\s|$)/g) || [])
    .map((x) => Number(x.trim().replace(/^[xX]/, '').replace(',', '.')))
    .filter((n) => n > 0);
  return { name: name, money: moneyTokens(tail), smalls: smalls };
}

/* Số khẩu phần: tin tỉ lệ thành tiền ÷ đơn giá hơn cột SL (cột số hay bị OCR làm hỏng) */
function inferQty(p) {
  const n = p.money;
  let qRatio = null;
  if (n.length >= 2) {
    const unit = n[n.length - 2], total = n[n.length - 1];
    if (unit >= 500 && total > 0) {
      const r = total / unit;
      if (r >= 0.5 && r <= 20) {
        const snapped = Math.round(r * 2) / 2;
        if (Math.abs(r - snapped) <= 0.15) qRatio = round1(snapped);
      }
    }
  }
  const small = (p.smalls || []).filter((v) => v >= 0.5 && v <= 20).sort((a, b) => (a % 1 === 0 ? -1 : 1) - (b % 1 === 0 ? -1 : 1))[0] || null;
  const unit = n.length >= 2 ? n[n.length - 2] : 0;
  const total = n.length >= 1 ? n[n.length - 1] : 0;
  const smallOk = small != null && unit > 0 && total > 0 && Math.abs(unit * small - total) <= 0.15 * total;
  if (qRatio != null && smallOk) {
    /* cả hai đều hợp lý → chọn giá trị "tròn" hơn */
    const dR = Math.abs(qRatio - Math.round(qRatio)), dS = Math.abs(small - Math.round(small));
    return clamp(dS < dR ? small : qRatio, 0.5, 20);
  }
  if (qRatio != null) return clamp(qRatio, 0.5, 20);
  if (smallOk || (small != null && !n.length)) return clamp(small, 0.5, 20);
  return 1;
}

function buildBillRows(text) {
  const rows = [];
  String(text || '').split(/\n+/).forEach((line) => {
    const raw = line.replace(/\s+/g, ' ').trim();
    if (raw.length < 3) return;
    if (looksLikeSkip(raw)) return;
    const p = splitBillLine(raw);
    const hasIndex = /^\d{1,3}\s*[.)]/.test(raw);
    if (!p.money.length && !hasIndex) return;
    if (norm(p.name).replace(/[^a-z0-9]/g, '').length < 3) return;
    const cands = matchFood(p.name, 3);
    const best = cands[0] || null;
    rows.push({
      id: 'b' + rows.length + Math.random().toString(36).slice(2, 5),
      raw: raw,
      name: p.name,
      qty: inferQty(p),
      foodId: best && best.score >= OCR.matchMin ? best.id : null,
      candidates: cands,
      include: true,
    });
  });
  return rows.slice(0, OCR.maxRows);
}

/* So khớp chịu lỗi dấu + chịu lỗi 1–2 ký tự mỗi từ (Levenshtein), có guard chống gán bừa */
function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = new Array(n + 1), cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    const t = prev; prev = cur; cur = t;
  }
  return prev[n];
}
function tokenSim(a, b) {
  if (a === b) return 1;
  return 1 - lev(a, b) / Math.max(a.length, b.length);
}
function matchFood(name, limit) {
  const qTok = norm(name).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter((t) => t.length > 1);
  const out = [];
  if (!qTok.length) return out;
  allFoods().forEach((f) => {
    const fTok = norm(f.name).split(' ').filter((t) => t.length > 1);
    if (!fTok.length) return;
    if (fTok.length === 1 && qTok.length >= 2) return; /* không gán món 1 từ cho dòng nhiều từ (Bò né ≠ Bơ) */
    let hit = 0, sim = 0;
    fTok.forEach((ft) => {
      let best = 0;
      qTok.forEach((qt) => { const s = tokenSim(ft, qt); if (s > best) best = s; });
      if (best >= 0.8) { hit += 1; sim += best; }
    });
    const cov = hit / fTok.length;
    if (cov < 0.6) return;
    out.push({
      id: f.id,
      name: f.name,
      score: Math.round(cov * (sim / Math.max(1, hit)) * 1000) / 1000,
      cov: Math.round(cov * 100) / 100,
    });
  });
  out.sort((a, b) => b.score - a.score || a.name.length - b.name.length);
  return out.slice(0, limit || 3);
}

/* =========================== Service worker =========================== */
let swReloaded = false;
function initSW() {
  if (!('serviceWorker' in navigator)) return;
  if (!/^https?:$/.test(location.protocol)) return; /* file:// không có SW */
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (swReloaded) return;
    swReloaded = true;
    location.reload();
  });
  navigator.serviceWorker.register('service-worker.js').catch(() => {});
}

/* =========================== Khởi động =========================== */
async function init() {
  loadState();
  cleanupOldData();
  ST.dateKey = todayKey();
  render();
  initSW();

  const imp = $('importFile');
  if (imp) imp.addEventListener('change', () => onImportFile(imp));

  const bill = $('billFile');
  if (bill) bill.addEventListener('change', () => onBillFile(bill));

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isModalOpen()) closeModal(); });

  await loadLibrary();
  render();
  if (ST.modal && ST.modal.kind === 'pick') renderPickerBody();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
