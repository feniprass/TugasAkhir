'use strict';

const DAY_NAMES  = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const TARGET_AIR = 8;
const TARGET_NUT = 5;

const BULAN_NM = ['Januari','Februari','Maret','April','Mei','Juni',
                  'Juli','Agustus','September','Oktober','November','Desember'];

const KAT_MAP = {
  pokok : { label:'Makanan Pokok', icon:'🍚' },
  lauk  : { label:'Lauk Pauk',     icon:'🍗' },
  sayur : { label:'Sayuran',       icon:'🥦' },
  buah  : { label:'Buah-buahan',   icon:'🍓' },
  susu  : { label:'Susu',          icon:'🥛' },
};

// ── Baca data ──
function getWaterData() {
  try { return JSON.parse(localStorage.getItem('waterData')) || []; } catch { return []; }
}
function getBowelData() {
  try { return JSON.parse(localStorage.getItem('bowelData')) || []; } catch { return []; }
}
function getFoodHistory() {
  try { return JSON.parse(localStorage.getItem('foodHistory')) || {}; } catch { return {}; }
}

// ── Helper ──
const avg     = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
const fmt     = n   => Number(n).toFixed(1);
const setText = (id, v) => { const el=document.getElementById(id); if(el) el.textContent=v; };

function getCupsForDay(waterArr, hari) {
  const f = waterArr.find(d => d.hari === hari);
  return f ? (f.cups || 0) : 0;
}
function getFrekForDay(bowelArr, hari) {
  const f = bowelArr.find(d => d.hari === hari);
  return f ? (f.frek || 0) : 0;
}
function getTipeForDay(bowelArr, hari) {
  const f = bowelArr.find(d => d.hari === hari);
  return f ? (f.tipe || '') : '';
}
function getNutForDay(historyObj, hari) {
  const items = historyObj[hari] || [];
  return new Set(items.map(i => i.cat)).size;
}

// ── Warna ──
function colorBar(c, t) {
  const r = t > 0 ? c/t : 0;
  return r >= .85 ? 'green' : r >= .5 ? 'orange' : 'red';
}
function badgeClass(s) {
  return s >= 85 ? 'badge-green' : s >= 65 ? 'badge-orange' : 'badge-red';
}
function getBadge(s) {
  if (s >= 85) return { text:'Sangat Baik', bg:'#4CAF50', color:'#fff' };
  if (s >= 70) return { text:'Baik',        bg:'#66BB6A', color:'#fff' };
  if (s >= 55) return { text:'Cukup',       bg:'#FFA726', color:'#fff' };
  return         { text:'Perlu Perhatian', bg:'#EF5350', color:'#fff' };
}

// ── Skor per kelompok hari ──
function skorMinggu(hariList, waterArr, bowelArr, historyObj) {
  const airVals = hariList.map(h => getCupsForDay(waterArr, h));
  const babVals = hariList.map(h => getFrekForDay(bowelArr, h));
  const nutVals = hariList.map(h => getNutForDay(historyObj, h));

  const airAvg = avg(airVals);
  const nutAvg = avg(nutVals);
  const babAvg = avg(babVals);

  const airSkor = Math.round(Math.min(airAvg/TARGET_AIR*100, 100));
  const nutSkor = Math.round(Math.min(nutAvg/TARGET_NUT*100, 100));

  let babBase = 0;
  babVals.forEach(v => {
    if (v === 0) babBase += 0;
    else if (v >= 1 && v <= 3) babBase += 100;
    else babBase += 60;
  });
  babBase /= hariList.length || 1;

  // Tekstur — pakai nama Indonesia (Keras/Normal/Lembek)
  const texCount = { Normal:0, Keras:0, Lembek:0 };
  hariList.forEach(h => {
    const tipe = getTipeForDay(bowelArr, h);
    if (texCount[tipe] !== undefined) texCount[tipe]++;
  });
  const totTex  = Object.values(texCount).reduce((a,b)=>a+b,0) || 1;
  const normPct = texCount.Normal / totTex;
  const babSkor = Math.round(babBase*0.7 + normPct*100*0.3);

  const total = Math.round(airSkor*0.30 + nutSkor*0.30 + babSkor*0.40);
  return { airAvg, nutAvg, babAvg, airSkor, nutSkor, babSkor, total };
}

// ── Hitung semua data ──
function hitungData() {
  const waterArr   = getWaterData();
  const bowelArr   = getBowelData();
  const historyObj = getFoodHistory();
  const allDays    = [...DAY_NAMES];

  const weeks = [
    [allDays[0], allDays[1]],
    [allDays[2], allDays[3]],
    [allDays[4], allDays[5]],
    [allDays[6]],
  ];

  const mingguScores = weeks.map(w => skorMinggu(w, waterArr, bowelArr, historyObj));
  const totalSkor    = Math.round(avg(mingguScores.map(s => s.total)));

  const airVals = allDays.map(h => getCupsForDay(waterArr, h));
  const babVals = allDays.map(h => getFrekForDay(bowelArr, h));
  const nutVals = allDays.map(h => getNutForDay(historyObj, h));

  const avgAir     = avg(airVals);
  const avgNutrisi = avg(nutVals);
  const avgBab     = avg(babVals);

  const hariAktif = allDays.filter(h =>
    getCupsForDay(waterArr, h) > 0 ||
    getFrekForDay(bowelArr, h) > 0 ||
    getNutForDay(historyObj, h) > 0
  ).length;

  // Tekstur BAB — nama Indonesia
  const texCount = { Normal:0, Keras:0, Lembek:0 };
  bowelArr.forEach(d => {
    if (texCount[d.tipe] !== undefined) texCount[d.tipe]++;
  });

  // Rekap kategori makanan — hitung berapa HARI kategori muncul (bukan total item)
  const foodCategories = Object.entries(KAT_MAP).map(([key, meta]) => {
    const hariAda = allDays.filter(h => {
      const items = historyObj[h] || [];
      return items.some(i => i.cat === key);
    }).length;
    return { key, name: meta.label, icon: meta.icon, hari: hariAda };
  });

  const now       = new Date();
  const totalHari = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const maxItem   = totalHari;

  return {
    totalSkor, mingguScores, weeks,
    avgAir, avgNutrisi, avgBab,
    hariAktif, texCount, foodCategories, maxItem,
    totalHari,
    waterArr, bowelArr, historyObj, allDays
  };
}

// ── Render Tren Mingguan ──
function renderTren(data) {
  const rowsEl  = document.getElementById('week-rows');
  const chartEl = document.getElementById('bar-chart');
  if (!rowsEl || !chartEl) return;
  rowsEl.innerHTML = chartEl.innerHTML = '';

  const maxSkor    = Math.max(...data.mingguScores.map(s => s.total), 1);
  const weekLabels = ['Mg 1','Mg 2','Mg 3','Mg 4'];

  data.mingguScores.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'week-row';
    row.innerHTML = `
      <span class="wk-label">${weekLabels[i]}</span>
      <span class="wk-val">${fmt(s.airAvg)}</span>
      <span class="wk-val">${fmt(s.nutAvg)}</span>
      <span class="wk-val">${fmt(s.babAvg)}</span>
      <span class="wk-badge ${badgeClass(s.total)}">${s.total}</span>`;
    rowsEl.appendChild(row);

    const clr = s.total >= 70 ? 'green' : s.total >= 55 ? 'orange' : 'red';
    const ht  = Math.round((s.total / maxSkor) * 58);
    const col = document.createElement('div');
    col.className = 'chart-col';
    col.innerHTML = `
      <div class="chart-bar ${clr}" style="height:${ht}px"></div>
      <span class="chart-wk-lbl">${weekLabels[i]}</span>`;
    chartEl.appendChild(col);
  });
}

// ── Render Kategori Makanan (hitung hari, dari total hari bulan ini) ──
function renderFood(data) {
  const list = document.getElementById('food-list');
  if (!list) return;
  list.innerHTML = '';

  const now        = new Date();
  const totalHari  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const threshold1 = Math.round(totalHari * 0.4);
  const threshold2 = Math.round(totalHari * 0.75);

  data.foodCategories.forEach(({ name, icon, hari }) => {
    const pct = Math.round((hari / totalHari) * 100);
    const cls = hari === 0 ? 'red' : hari < threshold1 ? 'red' : hari < threshold2 ? 'orange' : 'green';
    list.innerHTML += `
      <div class="food-row">
        <span class="food-ico">${icon}</span>
        <span class="food-name">${name}</span>
        <div class="bar-wrap"><div class="bar ${cls}" style="width:${pct}%"></div></div>
        <span class="food-cnt">${hari}/${totalHari} hari</span>
      </div>`;
  });
}

// ── Render Tekstur BAB ──
function renderTexture(texCount) {
  const list = document.getElementById('texture-list');
  if (!list) return;
  list.innerHTML = '';

  const tot = Object.values(texCount).reduce((a,b) => a+b, 0) || 1;
  const entries = [
    { name:'Normal', key:'Normal', dot:'#4CAF50', bar:'green'  },
    { name:'Keras',  key:'Keras',  dot:'#F44336', bar:'red'    },
    { name:'Lembek', key:'Lembek', dot:'#FF9800', bar:'orange' },
  ];

  entries.forEach(({ name, key, dot, bar }) => {
    const count = texCount[key] || 0;
    const pct   = count > 0 ? Math.max((count/tot)*100, 5) : 0;
    list.innerHTML += `
      <div class="texture-row">
        <span class="tex-name">${name}</span>
        <span class="tex-dot" style="background:${dot}"></span>
        <div class="tex-bar-wrap"><div class="tex-bar bar ${bar}" style="width:${pct}%"></div></div>
        <span class="tex-count">${count}x</span>
      </div>`;
  });
}

// ── Render Hasil Diagnosis (berdasarkan data nyata) ──
function renderDiagnosis(d) {
  const list = document.getElementById('diagnosis-list');
  if (!list) return;
  const items  = [];
  const totTex = Object.values(d.texCount).reduce((a,b) => a+b, 0) || 1;

  // 1. Hidrasi
  const ap = d.avgAir / TARGET_AIR;
  if (ap >= .9)
    items.push({ ico:'💧', title:'Hidrasi Optimal',
      desc:`Rata-rata ${fmt(d.avgAir)} gelas/hari — target tercapai! Pertahankan.`,
      tag:'Baik', cls:'tag-baik' });
  else if (ap >= .625)
    items.push({ ico:'💧', title:'Hidrasi Kurang Optimal',
      desc:`Rata-rata ${fmt(d.avgAir)} gelas/hari. Masih kurang ${fmt(TARGET_AIR - d.avgAir)} gelas dari target.`,
      tag:'Cukup', cls:'tag-cukup' });
  else
    items.push({ ico:'💧', title:'Dehidrasi Ringan',
      desc:`Rata-rata ${fmt(d.avgAir)} gelas/hari — jauh dari target 8 gelas. Segera tingkatkan konsumsi air.`,
      tag:'Perlu Perhatian', cls:'tag-buruk' });

  // 2. Nutrisi (berdasarkan rata-rata kategori unik per hari)
  const np = d.avgNutrisi / TARGET_NUT;
  if (np >= .85)
    items.push({ ico:'🥗', title:'Nutrisi Seimbang',
      desc:`Rata-rata ${fmt(d.avgNutrisi)} dari 5 kategori/hari terpenuhi. Variasi makan sangat baik!`,
      tag:'Baik', cls:'tag-baik' });
  else if (np >= .6)
    items.push({ ico:'🥗', title:'Nutrisi Cukup',
      desc:`Rata-rata ${fmt(d.avgNutrisi)} kategori/hari. Perbanyak variasi — terutama sayur dan buah.`,
      tag:'Cukup', cls:'tag-cukup' });
  else
    items.push({ ico:'🥗', title:'Nutrisi Kurang',
      desc:`Rata-rata hanya ${fmt(d.avgNutrisi)} kategori/hari. Pola makan perlu diperbaiki segera.`,
      tag:'Perlu Perhatian', cls:'tag-buruk' });

  // 3. Sayuran (berdasarkan jumlah hari)
  const sayur = d.foodCategories.find(c => c.key === 'sayur');
  const sayurHari = sayur ? sayur.hari : 0;
  if (sayurHari >= 6)
    items.push({ ico:'🥦', title:'Konsumsi Sayuran Sangat Baik',
      desc:`Sayuran dikonsumsi ${sayurHari}/7 hari minggu ini. Serat terpenuhi dengan baik!`,
      tag:'Baik', cls:'tag-baik' });
  else if (sayurHari >= 3)
    items.push({ ico:'🥦', title:'Konsumsi Sayuran Cukup',
      desc:`Sayuran dikonsumsi ${sayurHari}/7 hari minggu ini. Tingkatkan agar ada sayuran setiap hari.`,
      tag:'Cukup', cls:'tag-cukup' });
  else
    items.push({ ico:'🥦', title:'Konsumsi Sayuran Sangat Rendah',
      desc:`Sayuran hanya ${sayurHari}/7 hari minggu ini. Sayuran penting untuk serat dan kelancaran BAB.`,
      tag:'Perlu Perhatian', cls:'tag-buruk' });

  // 4. Frekuensi BAB
  if (d.avgBab >= 1 && d.avgBab <= 2)
    items.push({ ico:'💩', title:'Frekuensi BAB Normal',
      desc:`Rata-rata ${fmt(d.avgBab)}x/hari — dalam batas ideal (1–2x/hari).`,
      tag:'Baik', cls:'tag-baik' });
  else if (d.avgBab < 1)
    items.push({ ico:'💩', title:'BAB Terlalu Jarang',
      desc:`Rata-rata ${fmt(d.avgBab)}x/hari. Di bawah normal — perbanyak serat dan minum air.`,
      tag:'Perlu Perhatian', cls:'tag-buruk' });
  else
    items.push({ ico:'💩', title:'BAB Terlalu Sering',
      desc:`Rata-rata ${fmt(d.avgBab)}x/hari — melebihi normal. Perhatikan kebersihan makanan.`,
      tag:'Cukup', cls:'tag-cukup' });

  // 5. Tekstur BAB
  const nf = (d.texCount.Normal || 0) / totTex;
  const kf = (d.texCount.Keras  || 0) / totTex;
  const lf = (d.texCount.Lembek || 0) / totTex;

  if (nf >= .75)
    items.push({ ico:'✅', title:'Tekstur BAB Normal',
      desc:`${Math.round(nf*100)}% BAB bertekstur normal. Kesehatan usus sangat baik!`,
      tag:'Baik', cls:'tag-baik' });
  else if (kf > .3)
    items.push({ ico:'⚠️', title:'BAB Keras Mendominasi',
      desc:`${Math.round(kf*100)}% BAB keras — tanda kurang serat atau kurang minum air.`,
      tag:'Perlu Perhatian', cls:'tag-buruk' });
  else if (lf > .3)
    items.push({ ico:'⚠️', title:'BAB Lembek Sering Terjadi',
      desc:`${Math.round(lf*100)}% BAB lembek — perhatikan kebersihan makanan dan hindari pedas.`,
      tag:'Cukup', cls:'tag-cukup' });
  else
    items.push({ ico:'⚠️', title:'Tekstur BAB Tidak Konsisten',
      desc:`Hanya ${Math.round(nf*100)}% BAB normal. Jaga pola makan dan hidrasi secara rutin.`,
      tag:'Cukup', cls:'tag-cukup' });

  // 6. Darah pada BAB
  const adaDarah = d.bowelArr.some(b => b.darah === 'Berdarah');
  if (adaDarah)
    items.push({ ico:'🚨', title:'Terdeteksi Darah pada BAB',
      desc:'Ada catatan BAB berdarah minggu ini. Segera periksakan ke dokter untuk penanganan lebih lanjut.',
      tag:'Perlu Perhatian', cls:'tag-buruk' });

  // 7. Konsistensi pencatatan
  const akp = d.hariAktif / d.totalHari;
  if (akp >= .85)
    items.push({ ico:'📅', title:'Pencatatan Sangat Konsisten',
      desc:`${d.hariAktif}/${d.totalHari} hari aktif dicatat. Pertahankan kebiasaan ini!`,
      tag:'Baik', cls:'tag-baik' });
  else if (akp >= .5)
    items.push({ ico:'📅', title:'Pencatatan Kurang Konsisten',
      desc:`${d.hariAktif}/${d.totalHari} hari tercatat. Catat setiap hari agar analisis lebih akurat.`,
      tag:'Info', cls:'tag-info' });
  else
    items.push({ ico:'📅', title:'Data Tidak Lengkap',
      desc:`Hanya ${d.hariAktif}/${d.totalHari} hari tercatat. Hasil analisis mungkin kurang akurat.`,
      tag:'Info', cls:'tag-info' });

  list.innerHTML = items.map(it => `
    <div class="diagnosis-item">
      <span class="diag-icon">${it.ico}</span>
      <div>
        <p class="diag-title">${it.title}</p>
        <p class="diag-desc">${it.desc}</p>
        <span class="diag-tag ${it.cls}">${it.tag}</span>
      </div>
    </div>`).join('');
}

// ── Render Tips Kesehatan (berdasarkan data nyata) ──
function renderTips(d) {
  const el = document.getElementById('saran-list');
  if (!el) return;

  const totTex = Object.values(d.texCount).reduce((a,b) => a+b, 0) || 1;
  const tips   = [];

  // Air
  if (d.avgAir < TARGET_AIR * 0.625)
    tips.push('💧 Konsumsi air masih sangat kurang. Targetkan minimal 8 gelas/hari — mulai dengan 1 gelas tiap bangun tidur.');
  else if (d.avgAir < TARGET_AIR * 0.9)
    tips.push(`💧 Tambah ${Math.ceil(TARGET_AIR - d.avgAir)} gelas air/hari lagi untuk mencapai target 8 gelas.`);

  // Sayuran
  const sayur = d.foodCategories.find(c => c.key === 'sayur');
  if (sayur && sayur.hari < 3)
    tips.push('🥦 Sayuran sangat jarang dikonsumsi. Tambahkan minimal 1 porsi sayuran di setiap makan siang dan malam.');
  else if (sayur && sayur.hari < 6)
    tips.push(`🥦 Sayuran dikonsumsi ${sayur.hari}/7 hari — perbanyak agar ada sayuran setiap hari.`);

  // Buah
  const buah = d.foodCategories.find(c => c.key === 'buah');
  if (buah && buah.hari < 3)
    tips.push('🍓 Buah-buahan sangat jarang dikonsumsi. Jadikan buah sebagai camilan harian pengganti makanan manis.');
  else if (buah && buah.hari < 6)
    tips.push(`🍓 Buah dikonsumsi ${buah.hari}/7 hari — idealnya konsumsi buah setiap hari.`);

  // BAB jarang
  if (d.avgBab < 0.8)
    tips.push('💩 Frekuensi BAB masih rendah. Perbanyak serat dari sayur, buah, dan biji-bijian, serta cukupi minum air.');

  // BAB terlalu sering
  if (d.avgBab > 3)
    tips.push('⚠️ BAB terlalu sering. Perhatikan kebersihan makanan dan hindari makanan yang tidak higienis.');

  // BAB keras
  if ((d.texCount.Keras || 0) / totTex > .3)
    tips.push('🚽 BAB keras sering terjadi — tanda kurang cairan dan serat. Perbanyak minum air dan konsumsi sayuran.');

  // BAB lembek
  if ((d.texCount.Lembek || 0) / totTex > .3)
    tips.push('⚠️ BAB lembek cukup sering. Hindari makanan pedas, berminyak, dan pastikan kebersihan makanan terjaga.');

  // Darah
  if (d.bowelArr.some(b => b.darah === 'Berdarah'))
    tips.push('🚨 Ada BAB berdarah yang tercatat. Segera periksakan ke fasilitas kesehatan terdekat.');

  // Nutrisi
  if (d.avgNutrisi < TARGET_NUT * 0.6)
    tips.push('🥗 Variasi makanan masih kurang. Usahakan setiap hari ada makanan pokok, lauk, sayur, buah, dan susu.');

  // Pencatatan
  if (d.hariAktif < d.totalHari * 0.5)
    tips.push('📅 Banyak hari yang tidak tercatat. Catat secara rutin agar bisa memantau kesehatan dengan lebih baik.');

  if (tips.length === 0)
    tips.push('✅ Semua indikator kesehatan minggu ini dalam kondisi baik. Pertahankan pola makan dan gaya hidup sehat!');

  el.innerHTML = tips.map(s => `<div class="note-item">${s}</div>`).join('');
}

// ── Init ──
function init() {
  const now = new Date();
  setText('bulan-label', `${BULAN_NM[now.getMonth()]} ${now.getFullYear()}`);

  const data  = hitungData();
  const badge = getBadge(data.totalSkor);

  setText('total-score', data.totalSkor);
  const badgeEl = document.getElementById('score-badge');
  if (badgeEl) {
    badgeEl.textContent      = badge.text;
    badgeEl.style.background = badge.bg;
    badgeEl.style.color      = badge.color;
  }

  setText('avg-air',     `${fmt(data.avgAir)} gelas/hari`);
  setText('avg-nutrisi', `${fmt(data.avgNutrisi)} kategori/hari`);
  setText('avg-bab',     `${fmt(data.avgBab)}x/hari`);
  setText('hari-aktif',  `${data.hariAktif} hari`);

  const airSk = Math.round(Math.min(data.avgAir/TARGET_AIR*100, 100));
  const nutSk = Math.round(Math.min(data.avgNutrisi/TARGET_NUT*100, 100));

  let babBas = 0;
  data.allDays.forEach(h => {
    const v = getFrekForDay(data.bowelArr, h);
    if (v===0) babBas+=0; else if (v>=1&&v<=3) babBas+=100; else babBas+=60;
  });
  babBas = Math.round(babBas / (data.allDays.length || 1));

  setText('score-air',       airSk);
  setText('score-nutrisi',   nutSk);
  setText('score-bab',       babBas);
  setText('pct-aktif',       `${Math.round(data.hariAktif/data.totalHari*100)}%`);
  setText('note-total-hari', `dari ${data.totalHari} hari dalam seminggu`);

  renderTren(data);
  renderFood(data);
  renderTexture(data.texCount);
  renderDiagnosis(data);
  renderTips(data);

  // Ganti judul "Saran Dokter Virtual" → "Tips Kesehatan"
  document.querySelectorAll('.note-card h3').forEach(el => {
    if (el.textContent.includes('Saran Dokter Virtual')) el.textContent = 'Tips Kesehatan';
  });

  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') e.preventDefault();
      document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
    });
  });
  document.getElementById('profileBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'profil.html';
  });
}

document.addEventListener('DOMContentLoaded', init);