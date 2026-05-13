// =========================================
//  BABuddy - Water Tracker
// =========================================

const DAY_NAMES = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const TARGET_CUPS = 8;
const LITER_PER_CUP = 0.25;

// =========================================
//  RESET OTOMATIS SETIAP MINGGU BARU
// =========================================
function checkWeeklyReset() {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const lastReset = localStorage.getItem("waterWeekStart");
    const lastResetTime = lastReset ? parseInt(lastReset) : 0;

    if (startOfWeek.getTime() > lastResetTime) {
      // Simpan data minggu lalu ke waterHistory sebelum reset
      const oldData = JSON.parse(localStorage.getItem("waterData") || "[]");
      if (oldData.length > 0 && lastResetTime > 0) {
        saveToHistory(oldData, lastResetTime);
      }
      localStorage.setItem("waterData", JSON.stringify([]));
      localStorage.setItem("waterWeekStart", startOfWeek.getTime().toString());
    }
  } catch {}
}

function saveToHistory(data, weekStartTime) {
  try {
    const hist = JSON.parse(localStorage.getItem("waterHistory") || "[]");
    const weekStart = new Date(weekStartTime);
    const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    const label = weekStart.getDate() + " " + MONTHS[weekStart.getMonth()] + " " + weekStart.getFullYear();
    hist.push({ weekLabel: label, weekStart: weekStartTime, data });
    if (hist.length > 4) hist.shift();
    localStorage.setItem("waterHistory", JSON.stringify(hist));
  } catch {}
}

// ── Data ──
function loadData() {
  try {
    const s = localStorage.getItem("waterData");
    if (!s) return [];
    const parsed = JSON.parse(s);
    const englishDays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    if (parsed.some(d => englishDays.includes(d.hari))) {
      localStorage.removeItem("waterData");
      return [];
    }
    return parsed;
  } catch { return []; }
}

function saveData() {
  try { localStorage.setItem("waterData", JSON.stringify(waterData)); } catch {}
}

let waterData = [];

function today() { return DAY_NAMES[new Date().getDay()]; }

// ── Render log ──
function renderLog() {
  const list = document.getElementById("waterLogList");
  if (!list) return;
  list.innerHTML = "";
  const t = today();

  DAY_NAMES.forEach(hari => {
    const found   = waterData.find(d => d.hari === hari);
    const cups    = found ? found.cups : 0;
    const isToday = hari === t;

    const div = document.createElement("div");
    div.className = "log-item";
    div.style.fontWeight = isToday ? "700" : "400";
    div.innerHTML = `
      <span class="log-day" style="color:${isToday ? '#C08F3A' : '#D4A04C'}">
        ${hari}${isToday ? ' <span style="background:#D4A04C;color:#fff;font-size:10px;padding:2px 7px;border-radius:20px;margin-left:6px;">hari ini</span>' : ''}
      </span>
      <span class="log-cups">${cups > 0 ? cups + ' gelas' : '-'}</span>
    `;
    list.appendChild(div);
  });

  updateCard();
}

// ── Update card ──
function updateCard() {
  const t     = today();
  const found = waterData.find(d => d.hari === t);
  const cups  = found ? found.cups : 0;
  const liters = (cups * LITER_PER_CUP).toFixed(1);
  const pct    = Math.min((cups / TARGET_CUPS) * 100, 100);

  const fill = document.getElementById("progressFill");
  if (fill) fill.style.width = pct + "%";

  const amount = document.getElementById("waterAmount");
  if (amount) amount.textContent = liters + " liter/hari";

  const status = document.getElementById("waterStatusText");
  if (!status) return;
  if (cups >= TARGET_CUPS) status.textContent = "Tercapai - " + cups + " gelas";
  else if (cups >= 5)      status.textContent = "Cukup - " + cups + " gelas";
  else if (cups >= 1)      status.textContent = "Kurang - " + cups + " gelas";
  else                     status.textContent = "Belum ada data";
}

// ── Modal ──
function openModal(id)  { document.getElementById(id)?.classList.add("active"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("active"); }

// ── Tambah ──
function handleTambah() {
  const t = today();
  const displayEl = document.getElementById("inputHariDisplay");
  if (displayEl) displayEl.value = t;
  const hariEl = document.getElementById("inputHari");
  if (hariEl) hariEl.value = t;
  const found  = waterData.find(d => d.hari === t);
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
  renderLog();
  closeModal("modalTambah");
  showToast("✅ " + hari + " tersimpan: " + cups + " gelas");
}

// ── Hapus ──
function handleHapus() {
  const t   = today();
  const idx = waterData.findIndex(d => d.hari === t);
  if (idx !== -1) {
    waterData.splice(idx, 1);
    saveData();
    renderLog();
    showToast("🗑️ Data " + t + " dihapus.");
  } else {
    showToast("⚠️ Tidak ada data untuk " + t);
  }
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
  checkWeeklyReset();
  waterData = loadData();
  renderLog();

  document.querySelectorAll(".modal-overlay").forEach(o => {
    o.addEventListener("click", function(e) {
      if (e.target === this) this.classList.remove("active");
    });
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