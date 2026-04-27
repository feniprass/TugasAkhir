// =========================================
//  BABuddy - Analisis Mingguan Script
// =========================================

const DAY_NAMES  = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const DAY_SHORT  = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const TARGET_CUPS = 8;

// ── Baca data ──
function getWaterData() {
  try { return JSON.parse(localStorage.getItem("waterData") || "[]"); } catch { return []; }
}

function getBabData() {
  try { return JSON.parse(localStorage.getItem("bowelData") || "[]"); } catch { return []; }
}

function getFoodData() {
  try { return JSON.parse(localStorage.getItem("foodData") || "{}"); } catch { return {}; }
}

function getFoodHistory() {
  try { return JSON.parse(localStorage.getItem("foodHistory") || "{}"); } catch { return {}; }
}

// ── Buat week label ──
function getWeekLabel() {
  const now   = new Date();
  const day   = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day); // Minggu
  const end = new Date(start);
  end.setDate(start.getDate() + 6);   // Sabtu

  const fmt = (d) => d.getDate() + " " +
    ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][d.getMonth()] +
    " " + d.getFullYear();

  return fmt(start) + " – " + fmt(end);
}

// =========================================
//  RENDER ASUPAN AIR
// =========================================
function renderAir(waterData) {
  const bars = document.getElementById("airBars");
  if (!bars) return;
  bars.innerHTML = "";

  let total = 0;
  DAY_NAMES.forEach((day, i) => {
    const found = waterData.find(d => d.hari === day);
    const cups  = found ? found.cups : 0;
    total += cups;

    const col = document.createElement("div");
    col.className = "day-col";
    col.innerHTML = `
      <div class="day-label">${DAY_SHORT[i]}</div>
      <div class="day-val ${cups >= TARGET_CUPS ? 'highlight' : ''}">${cups}</div>
    `;
    bars.appendChild(col);
  });

  const avg = (total / 7).toFixed(1);
  document.getElementById("airSub").textContent  = avg + "/8 gelas";
  document.getElementById("airScore").textContent = Math.min(Math.round((total / (TARGET_CUPS * 7)) * 100), 100);
}

// =========================================
//  RENDER NUTRISI (food history per hari)
// =========================================
function renderNutrisi(foodHistory) {
  const bars = document.getElementById("nutrisiBars");
  if (!bars) return;
  bars.innerHTML = "";

  let totalKat = 0;
  DAY_NAMES.forEach((day, i) => {
    const items = foodHistory[day] || [];
    const cats  = new Set(items.map(it => it.cat));
    const n     = cats.size;
    totalKat += n;

    const col = document.createElement("div");
    col.className = "day-col";
    col.innerHTML = `
      <div class="day-label">${DAY_SHORT[i]}</div>
      <div class="day-val ${n === 5 ? 'highlight' : ''}">${n}</div>
    `;
    bars.appendChild(col);
  });

  const avg = (totalKat / 7).toFixed(1);
  document.getElementById("nutrisiSub").textContent  = avg + "/5 kategori";
  document.getElementById("nutrisiScore").textContent = Math.min(Math.round((totalKat / (5 * 7)) * 100), 100);
}

// =========================================
//  RENDER KESEHATAN BAB
// =========================================
function renderBab(babData) {
  const bars = document.getElementById("babBars");
  if (!bars) return;
  bars.innerHTML = "";

  let total = 0;
  DAY_NAMES.forEach((day, i) => {
    const found = babData.find(d => d.hari === day);
    const frek  = found ? found.frek : 0;
    total += frek;

    const col = document.createElement("div");
    col.className = "day-col";
    col.innerHTML = `
      <div class="day-label">${DAY_SHORT[i]}</div>
      <div class="day-val ${frek >= 1 && frek <= 2 ? 'highlight' : ''}">${frek}</div>
    `;
    bars.appendChild(col);
  });

  const avg = (total / 7).toFixed(1);
  document.getElementById("babSub").textContent  = avg + "x/hari";
  document.getElementById("babScore").textContent = Math.min(Math.round((total / (2 * 7)) * 100), 100);
}

// =========================================
//  RENDER KATEGORI MAKANAN
// =========================================
function renderKategori(foodHistory) {
  const list = document.getElementById("katList");
  if (!list) return;
  list.innerHTML = "";

  const katInfo = [
    { key:"pokok", label:"Makanan Pokok", icon:"🍚", cls:"fill-pokok" },
    { key:"lauk",  label:"Lauk Pauk",     icon:"🍗", cls:"fill-lauk"  },
    { key:"sayur", label:"Sayuran",       icon:"🥦", cls:"fill-sayur" },
    { key:"buah",  label:"Buah-buahan",   icon:"🍎", cls:"fill-buah"  },
    { key:"susu",  label:"Susu",          icon:"🥛", cls:"fill-susu"  },
  ];

  katInfo.forEach(k => {
    let count = 0;
    DAY_NAMES.forEach(day => {
      const items = foodHistory[day] || [];
      if (items.some(it => it.cat === k.key)) count++;
    });
    const pct = Math.round((count / 7) * 100);

    const item = document.createElement("div");
    item.className = "kat-item";
    item.innerHTML = `
      <div class="kat-icon">${k.icon}</div>
      <div class="kat-info">
        <div class="kat-name">${k.label}</div>
        <div class="kat-bar-track">
          <div class="kat-bar-fill ${k.cls}" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="kat-count">${count}/7</div>
    `;
    list.appendChild(item);
  });
}

// =========================================
//  RENDER TEKSTUR BAB
// =========================================
function renderTekstur(babData) {
  const list = document.getElementById("teksturList");
  if (!list) return;
  list.innerHTML = "";

  const tipe = { Keras: 0, Normal: 0, Lembek: 0, Cair: 0 };
  // Mapping: Hard→Keras, Normal→Normal, Soft→Lembek
  babData.forEach(d => {
    if (d.tipe === "Hard")   tipe.Keras++;
    else if (d.tipe === "Normal") tipe.Normal++;
    else if (d.tipe === "Soft")   tipe.Lembek++;
  });

  const total = Math.max(babData.length, 1);
  const items = [
    { label:"Keras",  cls:"fill-keras",  count: tipe.Keras  },
    { label:"Normal", cls:"fill-normal", count: tipe.Normal },
    { label:"Lembek", cls:"fill-lembek", count: tipe.Lembek },
    { label:"Cair",   cls:"fill-cair",   count: tipe.Cair   },
  ];

  items.forEach(t => {
    const pct = Math.round((t.count / total) * 100);
    const div = document.createElement("div");
    div.className = "tekstur-item";
    div.innerHTML = `
      <div class="tekstur-label">${t.label}</div>
      <div class="tekstur-bar-track">
        <div class="tekstur-bar-fill ${t.cls}" style="width:${pct}%"></div>
      </div>
      <div class="tekstur-count">${t.count}</div>
    `;
    list.appendChild(div);
  });
}

// =========================================
//  HITUNG SKOR & TIPS
// =========================================
function hitungSkor(waterData, babData, foodHistory) {
  // Air: max 40 poin
  let airTotal = 0;
  waterData.forEach(d => { airTotal += d.cups; });
  const airSkor = Math.min(Math.round((airTotal / (TARGET_CUPS * 7)) * 40), 40);

  // Nutrisi: max 40 poin
  let katTotal = 0;
  DAY_NAMES.forEach(day => {
    const items = foodHistory[day] || [];
    const cats  = new Set(items.map(it => it.cat));
    katTotal += cats.size;
  });
  const nutrisiSkor = Math.min(Math.round((katTotal / (5 * 7)) * 40), 40);

  // BAB: max 20 poin
  let babNormal = 0;
  babData.forEach(d => { if (d.frek >= 1 && d.frek <= 2 && d.darah !== "Blood") babNormal++; });
  const babSkor = Math.min(Math.round((babNormal / 7) * 20), 20);

  const total = airSkor + nutrisiSkor + babSkor;

  let badge = "Buruk";
  let color = "#E53935";
  if (total >= 80)      { badge = "Sangat Baik"; color = "#27760d"; }
  else if (total >= 60) { badge = "Baik";        color = "#2BBECB"; }
  else if (total >= 40) { badge = "Cukup";       color = "#F5A623"; }

  return { total, badge, color };
}

function renderTips(skor, babData) {
  const tips = document.getElementById("tipsText");
  if (!tips) return;

  const hasBlood = babData.some(d => d.darah === "Blood");

  if (hasBlood) {
    tips.textContent = "⚠️ Terdeteksi darah pada BAB minggu ini. Segera konsultasi ke dokter.";
  } else if (skor.total >= 80) {
    tips.textContent = "Kesehatan pencernaan Anda minggu ini sangat baik! Pertahankan pola makan dan hidrasi.";
  } else if (skor.total >= 60) {
    tips.textContent = "Kondisi cukup baik. Tingkatkan konsumsi air dan lengkapi 4 Sehat 5 Sempurna setiap hari.";
  } else if (skor.total >= 40) {
    tips.textContent = "Perlu perhatian lebih. Pastikan minum 8 gelas/hari dan perbanyak serat dari sayur & buah.";
  } else {
    tips.textContent = "Asupan gizi dan hidrasi minggu ini kurang optimal. Mulai catat dan perbaiki pola makan.";
  }
}

// =========================================
//  INIT
// =========================================
document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("weekLabel").textContent = getWeekLabel();

  const waterData   = getWaterData();
  const babData     = getBabData();
  const foodHistory = getFoodHistory();

  renderAir(waterData);
  renderNutrisi(foodHistory);
  renderBab(babData);
  renderKategori(foodHistory);
  renderTekstur(babData);

  const skor = hitungSkor(waterData, babData, foodHistory);
  document.getElementById("skorValue").textContent = skor.total + " / 100";
  document.getElementById("skorBadge").textContent = skor.badge;
  document.getElementById("skorBadge").style.color = skor.color;

  renderTips(skor, babData);

  // Sidebar
  document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("click", function(e) {
      const href = this.getAttribute("href");
      if (!href || href === "#") e.preventDefault();
      document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
      this.classList.add("active");
    });
  });

});