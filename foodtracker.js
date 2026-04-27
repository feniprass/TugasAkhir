// =========================================
//  BABuddy - Food Tracker Script
//  Dengan fitur Edit & Hapus
// =========================================

const DAY_NAMES = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

const CATEGORIES = {
  pokok: { label: "Makanan Pokok", hint: "Contoh: Nasi, Mie, Kentang" },
  lauk:  { label: "Lauk Pauk",     hint: "Contoh: Tempe, Tahu, Ayam, Ikan, Telur" },
  susu:  { label: "Susu",          hint: "Contoh: Yogurt, Keju, Susu" },
  buah:  { label: "Buah-buahan",   hint: "Contoh: Mangga, Jeruk, Apel" },
  sayur: { label: "Sayuran",       hint: "Contoh: Bayam, Kangkung, Wortel" },
};

// ── localStorage food hari ini ──
function loadData() {
  try {
    const s = localStorage.getItem("foodData");
    return s ? JSON.parse(s) : { pokok: [], lauk: [], susu: [], buah: [], sayur: [] };
  } catch { return { pokok: [], lauk: [], susu: [], buah: [], sayur: [] }; }
}
function saveData() {
  try { localStorage.setItem("foodData", JSON.stringify(foodData)); } catch {}
}

// ── localStorage history ──
function loadHistory() {
  try {
    const s = localStorage.getItem("foodHistory");
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}
function saveHistory(data) {
  try { localStorage.setItem("foodHistory", JSON.stringify(data)); } catch {}
}

let foodData = loadData();
let currentCategory = null;
let editIndex = null;      // index item yang sedang diedit di card
let editDay = null;        // hari yang sedang diedit di history
let editHistoryIndex = null;

// =========================================
//  RENDER CARD
// =========================================
function renderAll() {
  Object.keys(CATEGORIES).forEach(cat => renderCard(cat));
}

function renderCard(cat) {
  const body = document.getElementById("body-" + cat);
  if (!body) return;

  const items = foodData[cat] || [];
  body.innerHTML = "";

  if (items.length === 0) {
    body.innerHTML = `<div class="empty-state">Belum ada makanan</div>`;
    return;
  }

  const label = document.createElement("div");
  label.className = "consumed-label";
  label.textContent = "Sudah dikonsumsi:";
  body.appendChild(label);

  items.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "food-item";
    div.innerHTML = `
      <div class="food-item-info">
        <span class="food-item-name">${item.nama}</span>
        <span class="food-item-time">${item.waktu}</span>
      </div>
      <div class="food-item-actions">
        <button class="btn-edit-sm" onclick="editItem('${cat}', ${idx})">✏️</button>
        <button class="btn-del-sm"  onclick="hapusItem('${cat}', ${idx})">🗑️</button>
      </div>
    `;
    body.appendChild(div);
  });
}

// =========================================
//  RENDER HISTORY
// =========================================
function renderHistory() {
  const list = document.getElementById("historyList");
  if (!list) return;
  list.innerHTML = "";

  const today = DAY_NAMES[new Date().getDay()];
  const historyData = loadHistory();

  DAY_NAMES.forEach(day => {
    const items = historyData[day] || [];
    const isToday = day === today;

    const row = document.createElement("div");
    row.className = "history-item";

    const dayEl = document.createElement("div");
    dayEl.className = "history-day" + (isToday ? " today" : "");
    dayEl.innerHTML = day + (isToday ? " <span class='today-badge'>hari ini</span>" : "");

    const foodsEl = document.createElement("div");
    foodsEl.className = "history-foods";

    if (items.length === 0) {
      foodsEl.innerHTML = `<span class="history-empty">Belum ada data</span>`;
    } else {
      items.forEach((item, idx) => {
        const wrap = document.createElement("div");
        wrap.className = "history-tag-wrap";
        wrap.innerHTML = `
          <span class="history-tag tag-${item.cat}">${item.nama} (${item.waktu})</span>
          <button class="btn-tag-edit" onclick="editHistoryItem('${day}', ${idx})">✏️</button>
          <button class="btn-tag-del"  onclick="hapusHistoryItem('${day}', ${idx})">✕</button>
        `;
        foodsEl.appendChild(wrap);
      });
    }

    row.appendChild(dayEl);
    row.appendChild(foodsEl);
    list.appendChild(row);
  });
}

// =========================================
//  TAMBAH
// =========================================
function openModal(cat) {
  currentCategory = cat;
  editIndex = null;

  const catInfo = CATEGORIES[cat];
  document.getElementById("modalTitle").textContent = "Tambah " + catInfo.label;
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

  if (!foodData[currentCategory]) foodData[currentCategory] = [];

  if (editIndex !== null) {
    // MODE EDIT — update item yang ada
    foodData[currentCategory][editIndex] = { nama, waktu };
    showToast("✅ " + nama + " berhasil diupdate!");
  } else {
    // MODE TAMBAH — tambah item baru
    foodData[currentCategory].push({ nama, waktu });
    // Simpan ke history hari ini
    const today = DAY_NAMES[new Date().getDay()];
    const hist = loadHistory();
    if (!hist[today]) hist[today] = [];
    hist[today].push({ cat: currentCategory, nama, waktu });
    saveHistory(hist);
    showToast("✅ " + nama + " berhasil ditambahkan!");
  }

  saveData();
  renderCard(currentCategory);
  renderHistory();
  closeModal();
}

// =========================================
//  EDIT ITEM DI CARD
// =========================================
function editItem(cat, idx) {
  currentCategory = cat;
  editIndex = idx;

  const item = foodData[cat][idx];
  document.getElementById("modalTitle").textContent = "Edit " + CATEGORIES[cat].label;
  document.getElementById("inputNama").value  = item.nama;
  document.getElementById("inputWaktu").value = item.waktu;

  document.getElementById("modalTambah").classList.add("active");
  setTimeout(() => document.getElementById("inputNama").focus(), 100);
}

// =========================================
//  HAPUS ITEM DI CARD
// =========================================
function hapusItem(cat, idx) {
  const nama = foodData[cat][idx].nama;
  foodData[cat].splice(idx, 1);
  saveData();
  renderCard(cat);
  showToast("🗑️ " + nama + " dihapus.");
}

// =========================================
//  EDIT ITEM DI HISTORY
// =========================================
function editHistoryItem(day, idx) {
  editDay = day;
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
  showToast("🗑️ " + nama + " dihapus dari history.");
}

// =========================================
//  TUTUP MODAL
// =========================================
function closeModal() {
  document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
  currentCategory = null;
  editIndex = null;
  editDay = null;
  editHistoryIndex = null;
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
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.style.opacity = "0"; }, 2500);
}

// ── DOMContentLoaded ──
document.addEventListener("DOMContentLoaded", () => {

  renderAll();
  renderHistory();

  document.querySelectorAll(".modal-overlay").forEach(o => {
    o.addEventListener("click", function(e) {
      if (e.target === this) closeModal();
    });
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