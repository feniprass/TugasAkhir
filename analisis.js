const DAY_NAMES  = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const DAY_SHORT  = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
const TARGET_CUPS = 8;
const ML_PER_CUP  = 250; // 1 gelas = 250 ml
const TARGET_ML   = TARGET_CUPS * ML_PER_CUP; // 2000 ml

function getWaterData() {
  try { return JSON.parse(localStorage.getItem("waterData") || "[]"); } catch { return []; }
}
function getBabData() {
  try { return JSON.parse(localStorage.getItem("bowelData") || "[]"); } catch { return []; }
}
function getFoodHistory() {
  try { return JSON.parse(localStorage.getItem("foodHistory") || "{}"); } catch { return {}; }
}

function getWeekLabel() {
  const now   = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const fmt = d => d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  return fmt(start) + " – " + fmt(end);
}

// ── Render Air (satuan ml) ──
function renderAir(waterData) {
  const bars = document.getElementById("airBars");
  if (!bars) return;
  bars.innerHTML = "";
  let totalCups = 0;
  DAY_NAMES.forEach((day, i) => {
    const found = waterData.find(d => d.hari === day);
    const cups  = found ? found.cups : 0;
    const liter = (cups * ML_PER_CUP / 1000).toFixed(1); // tampilkan dalam liter
    totalCups += cups;
    const col = document.createElement("div");
    col.className = "day-col";
    col.innerHTML = `
      <div class="day-label">${DAY_SHORT[i]}</div>
      <div class="day-val ${cups >= TARGET_CUPS ? "highlight" : ""}">${liter}</div>`;
    bars.appendChild(col);
  });
  const avgMl = Math.round((totalCups * ML_PER_CUP) / 7);
  document.getElementById("airSub").textContent = avgMl + "/2000 ml";
  document.getElementById("airScore").textContent = Math.min(Math.round((totalCups / (TARGET_CUPS * 7)) * 100), 100);
}

// ── Render Nutrisi ──
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
      <div class="day-val ${n === 5 ? "highlight" : ""}">${n}</div>`;
    bars.appendChild(col);
  });
  const avg = (totalKat / 7).toFixed(1);
  document.getElementById("nutrisiSub").textContent = avg + "/5 kategori";
  document.getElementById("nutrisiScore").textContent = Math.min(Math.round((totalKat / (5 * 7)) * 100), 100);
}

// ── Render BAB ──
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
      <div class="day-val ${frek >= 1 && frek <= 2 ? "highlight" : ""}">${frek}</div>`;
    bars.appendChild(col);
  });
  const avg = (total / 7).toFixed(1);
  document.getElementById("babSub").textContent = avg + "x/hari";
  document.getElementById("babScore").textContent = Math.min(Math.round((total / (2 * 7)) * 100), 100);
}

// ── Render Kategori Makanan ──
function renderKategori(foodHistory) {
  const list = document.getElementById("katList");
  if (!list) return;
  list.innerHTML = "";

  const katInfo = [
    { key: "pokok", label: "Makanan Pokok", icon: "icon/icon_nasi.png",  cls: "fill-pokok" },
    { key: "lauk",  label: "Lauk Pauk",     icon: "icon/icon_ayam.png",  cls: "fill-lauk"  },
    { key: "susu",  label: "Susu",          icon: "icon/icon_susu.png",  cls: "fill-susu"  },
    { key: "buah",  label: "Buah-buahan",   icon: "icon/icon_buah.png",  cls: "fill-buah"  },
    { key: "sayur", label: "Sayuran",       icon: "icon/icon_sayur.png", cls: "fill-sayur" },
  ];

  const hariCounts = {};
  katInfo.forEach(k => { hariCounts[k.key] = 0; });
  DAY_NAMES.forEach(day => {
    const items = foodHistory[day] || [];
    const cats  = new Set(items.map(it => it.cat));
    katInfo.forEach(k => { if (cats.has(k.key)) hariCounts[k.key]++; });
  });

  katInfo.forEach(k => {
    const hari = hariCounts[k.key];
    const pct  = Math.round((hari / 7) * 100);
    const item = document.createElement("div");
    item.className = "kat-item";
    item.innerHTML = `
      <div class="kat-icon"><img src="${k.icon}" style="width:20px;height:20px;object-fit:contain;"></div>
      <div class="kat-info">
        <div class="kat-name">${k.label}</div>
        <div class="kat-bar-track">
          <div class="kat-bar-fill ${k.cls}" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="kat-count">${hari} hari</div>`;
    list.appendChild(item);
  });
}

// Render Tekstur BAB 
function renderTekstur(babData) {
  const list = document.getElementById("teksturList");
  if (!list) return;
  list.innerHTML = "";

  const tipe = { Keras: 0, Normal: 0, Lembek: 0 };
  babData.forEach(d => {
    if (d.tipe === "Keras")       tipe.Keras++;
    else if (d.tipe === "Normal") tipe.Normal++;
    else if (d.tipe === "Lembek") tipe.Lembek++;
  });

  const total = Math.max(babData.length, 1);
  [
    { label: "Keras",  cls: "fill-keras",  count: tipe.Keras  },
    { label: "Normal", cls: "fill-normal", count: tipe.Normal },
    { label: "Lembek", cls: "fill-lembek", count: tipe.Lembek },
  ].forEach(t => {
    const pct = Math.round((t.count / total) * 100);
    const div = document.createElement("div");
    div.className = "tekstur-item";
    div.innerHTML = `
      <div class="tekstur-label">${t.label}</div>
      <div class="tekstur-bar-track">
        <div class="tekstur-bar-fill ${t.cls}" style="width:${pct}%"></div>
      </div>
      <div class="tekstur-count">${t.count}</div>`;
    list.appendChild(div);
  });
}

// Hitung Skor
function hitungSkor(waterData, babData, foodHistory) {
  let airTotal = 0;
  waterData.forEach(d => { airTotal += d.cups; });
  const airSkor     = Math.min(Math.round((airTotal / (TARGET_CUPS * 7)) * 33), 33);

  let katTotal = 0;
  DAY_NAMES.forEach(day => {
    const items = foodHistory[day] || [];
    katTotal += new Set(items.map(it => it.cat)).size;
  });
  const nutrisiSkor = Math.min(Math.round((katTotal / (5 * 7)) * 34), 34);

  let babNormal = 0;
  babData.forEach(d => {
    if (d.frek >= 1 && d.frek <= 2 && d.darah !== "Berdarah") babNormal++;
  });
  const babSkor = Math.min(Math.round((babNormal / 7) * 33), 33);

  const total = airSkor + nutrisiSkor + babSkor;
  let badge = "Buruk", color = "#E53935";
  if (total >= 80)      { badge = "Sangat Baik"; color = "#27760d"; }
  else if (total >= 60) { badge = "Baik";        color = "#2BBECB"; }
  else if (total >= 40) { badge = "Cukup";       color = "#F5A623"; }

  return { total, badge, color };
}

//Render Tips (satuan ml)
function renderTips(skor, waterData, babData, foodHistory) {
  const tipsEl = document.getElementById("tipsText");
  if (!tipsEl) return;

  // Darah — prioritas tertinggi
  const hasBlood = babData.some(d => d.darah === "Berdarah");
  if (hasBlood) {
    tipsEl.textContent = "🚨 Terdeteksi darah pada BAB minggu ini. Segera periksakan ke fasilitas kesehatan terdekat.";
    return;
  }

  const tipsList = [];

  // Air (dalam ml)
  const totalCups = waterData.reduce((s, d) => s + d.cups, 0);
  const avgMl     = Math.round((totalCups * ML_PER_CUP) / 7);
  if (avgMl < TARGET_ML * 0.625)
    tipsList.push(`💧 Rata-rata hanya ${avgMl} ml/hari — jauh dari target 2000 ml. Perbanyak minum air.`);
  else if (avgMl < TARGET_ML * 0.9)
    tipsList.push(`💧 Rata-rata ${avgMl} ml/hari. Tambah ${TARGET_ML - avgMl} ml lagi untuk mencapai target 2000 ml/hari.`);

  // Nutrisi
  let katTotal = 0;
  let sayurHari = 0, buahHari = 0;
  DAY_NAMES.forEach(day => {
    const items = foodHistory[day] || [];
    const cats  = new Set(items.map(it => it.cat));
    katTotal += cats.size;
    if (cats.has('sayur')) sayurHari++;
    if (cats.has('buah'))  buahHari++;
  });
  const avgKat = katTotal / 7;
  if (avgKat < 3)
    tipsList.push(`🥗 Rata-rata hanya ${avgKat.toFixed(1)} kategori makanan/hari. Variasi makan perlu ditingkatkan.`);
  if (sayurHari < 4)
    tipsList.push(`🥦 Sayuran hanya dikonsumsi ${sayurHari} hari minggu ini. Targetkan ada sayuran setiap makan.`);
  if (buahHari < 4)
    tipsList.push(`🍓 Buah dikonsumsi hanya ${buahHari} hari minggu ini. Jadikan buah sebagai camilan harian.`);

  // BAB
  const totalBab = babData.reduce((s, d) => s + d.frek, 0);
  const avgBab   = totalBab / 7;
  if (avgBab < 0.8)
    tipsList.push(`💩 Rata-rata BAB ${avgBab.toFixed(1)}x/hari — terlalu jarang. Perbanyak serat dan minum air.`);
  else if (avgBab > 3)
    tipsList.push(`⚠️ Rata-rata BAB ${avgBab.toFixed(1)}x/hari — terlalu sering. Perhatikan kebersihan makanan.`);

  // Tekstur
  const texKeras  = babData.filter(d => d.tipe === "Keras").length;
  const texLembek = babData.filter(d => d.tipe === "Lembek").length;
  const totTex    = Math.max(babData.length, 1);
  if (texKeras / totTex > 0.3)
    tipsList.push(`🚽 ${Math.round(texKeras/totTex*100)}% BAB keras minggu ini — perbanyak cairan dan makanan berserat.`);
  if (texLembek / totTex > 0.3)
    tipsList.push(`⚠️ ${Math.round(texLembek/totTex*100)}% BAB lembek — hindari makanan pedas dan berminyak.`);

  tipsEl.textContent = tipsList.length === 0
    ? "✅ Semua indikator kesehatan minggu ini baik! Pertahankan pola makan dan hidrasi."
    : tipsList[0];
}

// Init
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

  renderTips(skor, waterData, babData, foodHistory);

  document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("click", function(e) {
      const href = this.getAttribute("href");
      if (!href || href === "#") e.preventDefault();
      document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
      this.classList.add("active");
    });
  });

  document.getElementById('profileBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'profil.html';
  });
});