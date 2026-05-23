const DAY_NAMES = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const TARGET_FREK = 2;

function checkWeeklyReset() {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const lastReset = localStorage.getItem("babWeekStart");
    const lastResetTime = lastReset ? parseInt(lastReset) : 0;

    if (startOfWeek.getTime() > lastResetTime) {
      const oldData = JSON.parse(localStorage.getItem("bowelData") || "[]");
      if (oldData.length > 0 && lastResetTime > 0) {
        saveBabToHistory(oldData, lastResetTime);
      }
      localStorage.setItem("bowelData", JSON.stringify([]));
      localStorage.setItem("babWeekStart", startOfWeek.getTime().toString());
    }
  } catch {}
}

function saveBabToHistory(data, weekStartTime) {
  try {
    const hist = JSON.parse(localStorage.getItem("babHistory") || "[]");
    const weekStart = new Date(weekStartTime);
    const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    const label = weekStart.getDate() + " " + MONTHS[weekStart.getMonth()] + " " + weekStart.getFullYear();
    hist.push({ weekLabel: label, weekStart: weekStartTime, data });
    if (hist.length > 4) hist.shift();
    localStorage.setItem("babHistory", JSON.stringify(hist));
  } catch {}
}

function loadData() {
  try {
    const s = localStorage.getItem("bowelData");
    if (!s) return [];
    return JSON.parse(s);
  } catch { return []; }
}

function saveData(data) {
  try { localStorage.setItem("bowelData", JSON.stringify(data)); } catch {}
}

let bowelData = [];

function getTodayName() { return DAY_NAMES[new Date().getDay()]; }

// ----- RENDER LOG LIST -----
function renderLogList() {
  const list = document.getElementById("bowelLogList");
  if (!list) return;
  list.innerHTML = "";
  const today = getTodayName();

  DAY_NAMES.forEach(hari => {
    const row = bowelData.find(d => d.hari === hari);
    const isToday = hari === today;
    const item = document.createElement("div");
    item.className = "log-item" + (isToday ? " log-today" : "");

    if (row) {
      const tipeClass  = row.tipe === "Normal" ? "type-normal" : row.tipe === "Lembek" ? "type-soft" : "type-hard";
      const darahClass = row.darah === "Berdarah" ? "blood-yes" : "";
      item.innerHTML = `
        <span class="log-day" style="color:${isToday ? '#C08F3A' : '#D4A04C'}">
          ${hari}${isToday ? " <span class='today-badge'>hari ini</span>" : ""}
        </span>
        <span class="log-frek">${row.frek}x</span>
        <span class="log-tipe ${tipeClass}">${row.tipe}</span>
        <span class="log-darah ${darahClass}">${row.darah}</span>
      `;
    } else {
      item.innerHTML = `
        <span class="log-day" style="color:${isToday ? '#C08F3A' : '#D4A04C'}">
          ${hari}${isToday ? " <span class='today-badge'>hari ini</span>" : ""}
        </span>
        <span class="log-frek" style="color:#ccc">-</span>
        <span class="log-tipe" style="color:#ccc">-</span>
        <span class="log-darah" style="color:#ccc">-</span>
      `;
    }
    list.appendChild(item);
  });

  updateCard();
}

// ----- UPDATE CARD -----
function updateCard() {
  const today = getTodayName();
  const todayData = bowelData.find(d => d.hari === today);
  const frek = todayData ? todayData.frek : 0;
  const tipe = todayData ? todayData.tipe : "-";
  const pct  = Math.min((frek / TARGET_FREK) * 100, 100);

  const fillEl = document.getElementById("statusFill");
  if (fillEl) fillEl.style.width = pct + "%";

  const amountEl = document.getElementById("babAmountText");
  if (amountEl) amountEl.textContent = frek > 0 ? `${tipe} - ${frek}x sehari` : "Belum ada data hari ini";

  const statusEl = document.getElementById("statusText");
  if (!statusEl) return;
  if (frek === 0)               statusEl.textContent = "Belum BAB";
  else if (frek <= TARGET_FREK) statusEl.textContent = `Normal - ${frek}x sehari`;
  else                          statusEl.textContent = `Sering - ${frek}x sehari`;
}

// =========================================
//  MODAL TAMBAH
// =========================================
function handleTambah() {
  const today = getTodayName();
  const displayEl = document.getElementById("inputHariDisplay");
  if (displayEl) displayEl.value = today;
  const hariEl = document.getElementById("inputHari");
  if (hariEl) hariEl.value = today;

  const existing = bowelData.find(d => d.hari === today);
  if (existing) {
    const frekEl  = document.getElementById("inputFrek");
    const tipeEl  = document.getElementById("inputTipe");
    const darahEl = document.getElementById("inputDarah");
    if (frekEl)  frekEl.value  = existing.frek;
    if (tipeEl)  tipeEl.value  = existing.tipe;
    if (darahEl) darahEl.value = existing.darah;
  } else {
    const frekEl = document.getElementById("inputFrek");
    if (frekEl) frekEl.value = 1;
  }
  openModal("modalTambah");
}

function simpanCatatan() {
  const hari  = document.getElementById("inputHari").value;
  const frek  = parseInt(document.getElementById("inputFrek").value) || 0;
  const tipe  = document.getElementById("inputTipe").value;
  const darah = document.getElementById("inputDarah").value;

  const idx = bowelData.findIndex(d => d.hari === hari);
  if (idx !== -1) bowelData[idx] = { hari, frek, tipe, darah };
  else bowelData.push({ hari, frek, tipe, darah });

  saveData(bowelData);
  renderLogList();
  closeModal("modalTambah");
  showToast(`✅ Data ${hari} berhasil disimpan!`);
}

// =========================================
//  MODAL HAPUS
// =========================================
function handleHapus() {
  const select = document.getElementById("hapusHari");
  if (!select) return;
  select.innerHTML = "";

  if (bowelData.length === 0) {
    showToast("⚠️ Tidak ada data untuk dihapus.");
    return;
  }

  bowelData.forEach(row => {
    const opt = document.createElement("option");
    opt.value = row.hari;
    opt.textContent = row.hari;
    select.appendChild(opt);
  });

  const today = getTodayName();
  const todayExists = bowelData.find(d => d.hari === today);
  if (todayExists) select.value = today;
  openModal("modalHapus");
}

function konfirmasiHapus() {
  const select = document.getElementById("hapusHari");
  if (!select) return;
  const hari = select.value;
  const idx  = bowelData.findIndex(d => d.hari === hari);
  if (idx !== -1) {
    bowelData.splice(idx, 1);
    saveData(bowelData);
    renderLogList();
    closeModal("modalHapus");
    showToast(`🗑️ Data ${hari} berhasil dihapus.`);
  }
}

// ----- DETAIL -----
function handleDetail() {
  const content = document.getElementById("detailContent");
  if (!content) return;
  content.innerHTML = "";
  if (bowelData.length === 0) {
    content.innerHTML = "<p>Belum ada data.</p>";
  } else {
    bowelData.forEach(row => {
      const p = document.createElement("p");
      p.innerHTML = `<span>${row.hari}</span> — ${row.frek}x, ${row.tipe}, ${row.darah}`;
      content.appendChild(p);
    });
  }
  openModal("modalDetail");
}

function openModal(id)  { document.getElementById(id)?.classList.add("active"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("active"); }

function showToast(msg) {
  let t = document.getElementById("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.style.cssText = `position:fixed;bottom:30px;right:30px;background:#333;color:#fff;
      padding:12px 20px;border-radius:20px;font-size:13px;font-weight:700;
      z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.2);opacity:0;transition:opacity .3s;`;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = "0"; }, 2500);
}

// =========================================
//  DOMContentLoaded
// =========================================
document.addEventListener("DOMContentLoaded", () => {

  checkWeeklyReset();
  bowelData = loadData();

  const style = document.createElement("style");
  style.textContent = `
    .today-badge {
      background: #D4A04C; color: #fff; font-size: 10px; font-weight: 700;
      padding: 2px 7px; border-radius: 20px; margin-left: 6px; vertical-align: middle;
    }
    .log-today { background-color: rgba(212, 160, 76, 0.08); border-radius: 8px; }
  `;
  document.head.appendChild(style);

  renderLogList();

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