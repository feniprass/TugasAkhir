// =========================================
//  BABuddy - Food Tracker Script
// =========================================

const DAY_NAMES = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

const CATEGORIES = {
  pokok: { label: "Makanan Pokok", hint: "Contoh: Nasi, Mie, Kentang" },
  lauk:  { label: "Lauk Pauk",     hint: "Contoh: Tempe, Tahu, Ayam, Ikan, Telur" },
  susu:  { label: "Susu",          hint: "Contoh: Yogurt, Keju, Susu" },
  buah:  { label: "Buah-buahan",   hint: "Contoh: Mangga, Jeruk, Apel" },
  sayur: { label: "Sayuran",       hint: "Contoh: Bayam, Kangkung, Wortel" },
};

// ── Klasifikasi waktu makan ──
function getSlotMakan(waktu) {
  if (!waktu) return 'malam';
  const jam = parseInt(waktu.split(':')[0], 10);
  if (jam >= 4  && jam <= 10) return 'sarapan';
  if (jam >= 11 && jam <= 14) return 'siang';
  return 'malam';
}

const SLOT_LABEL = {
  sarapan : '🌅 Sarapan',
  siang   : '☀️ Makan Siang',
  malam   : '🌙 Makan Malam',
};

// =========================================
//  RESET OTOMATIS SETIAP MINGGU BARU
// =========================================
function checkWeeklyReset() {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0,0,0,0);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const lastReset = localStorage.getItem("foodWeekStart");
    if (startOfWeek.getTime() > parseInt(lastReset||"0")) {
      localStorage.setItem("foodHistory",  JSON.stringify({}));
      localStorage.setItem("foodWeekStart", startOfWeek.getTime().toString());
    }
  } catch {}
}

// ── localStorage ──
function loadHistory() {
  try { return JSON.parse(localStorage.getItem("foodHistory")||"{}"); } catch { return {}; }
}
function saveHistory(data) {
  try { localStorage.setItem("foodHistory", JSON.stringify(data)); } catch {}
}

let currentCategory  = null;
let editDay          = null;
let editHistoryIndex = null;

// =========================================
//  RENDER CARD — selalu tampilkan kosong
// =========================================
function renderAll() {
  Object.keys(CATEGORIES).forEach(cat => {
    const body = document.getElementById("body-" + cat);
    if (body) body.innerHTML = `<div class="empty-state">Tekan + Tambah untuk mencatat</div>`;
  });
}

// =========================================
//  RENDER HISTORY — klasifikasi 3 slot makan
// =========================================
function renderHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;
  list.innerHTML = "";

  const today       = DAY_NAMES[new Date().getDay()];
  const historyData = loadHistory();

  DAY_NAMES.forEach(day => {
    const items   = historyData[day] || [];
    const isToday = day === today;

    const row = document.createElement("div");
    row.className = "history-item";

    // Label hari
    const dayEl = document.createElement("div");
    dayEl.className = "history-day" + (isToday ? " today" : "");
    dayEl.innerHTML = day + (isToday ? " <span class='today-badge'>hari ini</span>" : "");

    // Kolom kanan: 3 slot
    const rightEl = document.createElement("div");
    rightEl.className = "history-right";

    // Kelompokkan item per slot
    const slots = { sarapan:[], siang:[], malam:[] };
    items.forEach((item, idx) => {
      slots[getSlotMakan(item.waktu)].push({ ...item, idx });
    });

    ['sarapan','siang','malam'].forEach(slot => {
      const slotEl = document.createElement("div");
      slotEl.className = "meal-slot";
      slotEl.innerHTML = `<div class="meal-slot-label">${SLOT_LABEL[slot]}</div>`;

      const foodsEl = document.createElement("div");
      foodsEl.className = "meal-slot-foods";

      if (slots[slot].length === 0) {
        foodsEl.innerHTML = `<span class="history-empty">–</span>`;
      } else {
        slots[slot].forEach(item => {
          const wrap = document.createElement("div");
          wrap.className = "history-tag-wrap";
          wrap.innerHTML = `
            <span class="history-tag tag-${item.cat}">${item.nama} (${item.waktu})</span>
            <button class="btn-tag-edit" onclick="editHistoryItem('${day}',${item.idx})">✏️</button>
            <button class="btn-tag-del"  onclick="hapusHistoryItem('${day}',${item.idx})">✕</button>`;
          foodsEl.appendChild(wrap);
        });
      }

      slotEl.appendChild(foodsEl);
      rightEl.appendChild(slotEl);
    });

    row.appendChild(dayEl);
    row.appendChild(rightEl);
    list.appendChild(row);
  });
}

// =========================================
//  TAMBAH — langsung ke riwayat
// =========================================
function openModal(cat) {
  currentCategory = cat;
  document.getElementById("modalTitle").textContent = "Tambah " + CATEGORIES[cat].label;
  document.getElementById("inputNama").value = "";
  const now = new Date();
  document.getElementById("inputWaktu").value =
    String(now.getHours()).padStart(2,"0") + ":" + String(now.getMinutes()).padStart(2,"0");
  document.getElementById("modalTambah").classList.add("active");
  setTimeout(() => document.getElementById("inputNama").focus(), 100);
}

function simpanMakanan() {
  const nama  = document.getElementById("inputNama").value.trim();
  const waktu = document.getElementById("inputWaktu").value;
  if (!nama) { showToast("⚠️ Nama makanan tidak boleh kosong!"); return; }
  if (!currentCategory) return;

  // Langsung simpan ke foodHistory hari ini
  const today = DAY_NAMES[new Date().getDay()];
  const hist  = loadHistory();
  if (!hist[today]) hist[today] = [];
  hist[today].push({ cat:currentCategory, nama, waktu });
  saveHistory(hist);

  // Card tetap kosong — tidak perlu update foodData
  showToast("✅ " + nama + " masuk ke riwayat " + SLOT_LABEL[getSlotMakan(waktu)] + "!");
  renderHistory();
  closeModal();
}

// =========================================
//  EDIT ITEM DI HISTORY
// =========================================
function editHistoryItem(day, idx) {
  editDay          = day;
  editHistoryIndex = idx;
  const hist = loadHistory();
  const item = hist[day][idx];
  document.getElementById("histEditNama").value  = item.nama;
  document.getElementById("histEditWaktu").value = item.waktu;
  document.getElementById("histEditKat").value   = item.cat;
  document.getElementById("modalEditHistory").classList.add("active");
  setTimeout(() => document.getElementById("histEditNama").focus(), 100);
}

function simpanEditHistory() {
  const nama  = document.getElementById("histEditNama").value.trim();
  const waktu = document.getElementById("histEditWaktu").value;
  const cat   = document.getElementById("histEditKat").value;
  if (!nama) { showToast("⚠️ Nama tidak boleh kosong!"); return; }
  const hist = loadHistory();
  hist[editDay][editHistoryIndex] = { cat, nama, waktu };
  saveHistory(hist);
  renderHistory();
  closeModal();
  showToast("✅ History berhasil diupdate!");
}

// =========================================
//  HAPUS ITEM DI HISTORY
// =========================================
function hapusHistoryItem(day, idx) {
  const hist = loadHistory();
  const nama = hist[day][idx].nama;
  hist[day].splice(idx, 1);
  saveHistory(hist);
  renderHistory();
  showToast("🗑️ " + nama + " dihapus dari riwayat.");
}

// =========================================
//  TUTUP MODAL
// =========================================
function closeModal() {
  document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
  currentCategory = null; editDay = null; editHistoryIndex = null;
}

// ── Toast ──
function showToast(msg) {
  let t = document.getElementById("ft-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "ft-toast";
    t.style.cssText = `position:fixed;bottom:30px;right:30px;background:#333;color:#fff;
      padding:12px 20px;border-radius:20px;font-size:13px;font-weight:700;
      z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.2);opacity:0;transition:opacity .3s;`;
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = "1";
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.style.opacity = "0"; }, 2500);
}

// ── DOMContentLoaded ──
document.addEventListener("DOMContentLoaded", () => {
  checkWeeklyReset();
  renderAll();
  renderHistory();

  document.querySelectorAll(".modal-overlay").forEach(o => {
    o.addEventListener("click", function(e) { if (e.target === this) closeModal(); });
  });
  document.getElementById("inputNama")?.addEventListener("keydown", e => {
    if (e.key === "Enter") simpanMakanan();
  });
  document.getElementById("histEditNama")?.addEventListener("keydown", e => {
    if (e.key === "Enter") simpanEditHistory();
  });
  document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("click", function(e) {
      const href = this.getAttribute("href");
      if (!href || href === "#") e.preventDefault();
      document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
      this.classList.add("active");
    });
  });
});