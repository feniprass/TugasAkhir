// =========================================
//  BABuddy - Water Tracker
// =========================================

const DAY_NAMES = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const TARGET_CUPS = 8;
const LITER_PER_CUP = 0.25;

// ── Data (localStorage supaya tidak hilang) ──
function loadData() {
  try {
    const s = localStorage.getItem("waterData");
    if (!s) return [];
    const parsed = JSON.parse(s);
    // Hapus kalau masih ada data bahasa Inggris (data lama sebelum diubah ke Indonesia)
    const englishDays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    if (parsed.some(d => englishDays.includes(d.hari))) {
      localStorage.removeItem("waterData");
      return [];
    }
    return parsed;
  } catch { return []; }
}

function saveData() {
  try {
    localStorage.setItem("waterData", JSON.stringify(waterData));
  } catch {}
}

function defaultData() {
  return []; // kosong — hanya terisi saat user input
}

let waterData = loadData();

function today() { return DAY_NAMES[new Date().getDay()]; }

// ── Render log list ──
function renderLog(data) {
  const list = document.getElementById("waterLogList");
  if (!list) return;
  list.innerHTML = "";
  const t = today();

  data.forEach(row => {
    const isToday = row.hari === t;
    const div = document.createElement("div");
    div.className = "log-item";
    div.style.fontWeight = isToday ? "700" : "400";
    div.innerHTML = `
      <span class="log-day" style="color:${isToday ? '#C08F3A' : '#D4A04C'}">
        ${row.hari}${isToday ? ' <span style="background:#D4A04C;color:#fff;font-size:10px;padding:2px 7px;border-radius:20px;margin-left:6px;">hari ini</span>' : ''}
      </span>
      <span class="log-cups">${row.cups} gelas</span>
    `;
    list.appendChild(div);
  });

  updateCard();
}

// ── Update card ──
function updateCard() {
  const t = today();
  const found = waterData.find(d => d.hari === t);
  const cups = found ? found.cups : 0;
  const liters = (cups * LITER_PER_CUP).toFixed(1);
  const pct = Math.min((cups / TARGET_CUPS) * 100, 100);

  const fill = document.getElementById("progressFill");
  if (fill) fill.style.width = pct + "%";

  const label = document.getElementById("progressLabel");
  if (label) label.textContent = cups + " / " + TARGET_CUPS + " gelas";

  const amount = document.getElementById("waterAmount");
  if (amount) amount.textContent = liters + " liter/hari";

  const status = document.getElementById("waterStatusText");
  if (!status) return;
  if (cups >= TARGET_CUPS)  status.textContent = "Tercapai - " + cups + " gelas";
  else if (cups >= 5)       status.textContent = "Cukup - " + cups + " gelas";
  else if (cups >= 1)       status.textContent = "Kurang - " + cups + " gelas";
  else                      status.textContent = "Belum ada data";
}

// ── Modal ──
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("active");
}

// ── Tombol + Tambah ──
function handleTambah() {
  const t = today();

  // Tampilkan hari ini di input readonly
  const displayEl = document.getElementById("inputHariDisplay");
  if (displayEl) displayEl.value = t;

  // Set hidden select ke hari ini
  const hariEl = document.getElementById("inputHari");
  if (hariEl) hariEl.value = t;

  // Pre-fill cups hari ini kalau sudah ada
  const found = waterData.find(d => d.hari === t);
  const cupsEl = document.getElementById("inputCups");
  if (cupsEl) cupsEl.value = found ? found.cups : 1;

  openModal("modalTambah");
}

// ── Simpan ──
function simpanAir() {
  const hariEl = document.getElementById("inputHari");
  const cupsEl = document.getElementById("inputCups");
  if (!hariEl || !cupsEl) return;

  const hari = hariEl.value;
  const cups = parseInt(cupsEl.value) || 0;

  const idx = waterData.findIndex(d => d.hari === hari);
  if (idx !== -1) waterData[idx].cups = cups;
  else waterData.push({ hari, cups });

  saveData();
  renderLog(waterData);
  closeModal("modalTambah");
  showToast("✅ " + hari + " tersimpan: " + cups + " gelas");
}

// ── Hapus hari ini ──
function handleHapus() {
  const t = today();
  const idx = waterData.findIndex(d => d.hari === t);
  if (idx !== -1) {
    waterData.splice(idx, 1);
    saveData();
    renderLog(waterData);
    showToast("🗑️ Data " + t + " dihapus.");
  } else {
    showToast("⚠️ Tidak ada data untuk " + t);
  }
}

// ── Search ──
function handleSearch() {
  const q = (document.getElementById("searchInput")?.value || "").trim().toLowerCase();
  renderLog(q ? waterData.filter(d => d.hari.toLowerCase().includes(q)) : waterData);
}

// ── Toast ──
function showToast(msg) {
  let t = document.getElementById("wt-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "wt-toast";
    t.style.cssText = "position:fixed;bottom:30px;right:30px;background:#333;color:#fff;" +
      "padding:12px 20px;border-radius:20px;font-size:13px;font-weight:700;" +
      "z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.2);opacity:0;transition:opacity .3s;";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.style.opacity = "0"; }, 2500);
}

// ── Init ──
document.addEventListener("DOMContentLoaded", () => {

  renderLog(waterData);

  // Tutup modal kalau klik overlay
  document.querySelectorAll(".modal-overlay").forEach(o => {
    o.addEventListener("click", function(e) {
      if (e.target === this) this.classList.remove("active");
    });
  });

  // Search live
  const si = document.getElementById("searchInput");
  if (si) si.addEventListener("input", handleSearch);

  // Sidebar navigasi
  document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("click", function(e) {
      const href = this.getAttribute("href");
      if (!href || href === "#") e.preventDefault();
      document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
      this.classList.add("active");
    });
  });

});