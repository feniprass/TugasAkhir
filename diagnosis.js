'use strict';

const DAY_NAMES  = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const TARGET_AIR = 8;
const TARGET_ML  = 2000;
const ML_PER_CUP = 250;
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

// Baca data
function getWaterData()  { try { return JSON.parse(localStorage.getItem('waterData'))  || []; } catch { return []; } }
function getBowelData()  { try { return JSON.parse(localStorage.getItem('bowelData'))  || []; } catch { return []; } }
function getFoodHistory(){ try { return JSON.parse(localStorage.getItem('foodHistory'))|| {}; } catch { return {}; } }

// ── Helper ──
const avg     = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
const fmt     = n   => Number(n).toFixed(1);
const setText = (id, v) => { const el=document.getElementById(id); if(el) el.textContent=v; };

function fmtMl(ml) {
  if (ml >= 1000) return (ml/1000).toFixed(1) + ' L';
  return ml + ' ml';
}

function getCupsForDay(waterArr, hari) { const f=waterArr.find(d=>d.hari===hari); return f?(f.cups||0):0; }
function getFrekForDay(bowelArr, hari)  { const f=bowelArr.find(d=>d.hari===hari); return f?(f.frek||0):0; }
function getTipeForDay(bowelArr, hari)  { const f=bowelArr.find(d=>d.hari===hari); return f?(f.tipe||''):''; }
function getNutForDay(historyObj, hari) { return new Set((historyObj[hari]||[]).map(i=>i.cat)).size; }

// Warna / Badge
function badgeClass(s) { return s>=85?'badge-green':s>=65?'badge-orange':'badge-red'; }
function getBadge(s) {
  if (s>=85) return {text:'Sangat Baik',      bg:'#4CAF50', color:'#fff'};
  if (s>=70) return {text:'Baik',             bg:'#66BB6A', color:'#fff'};
  if (s>=55) return {text:'Cukup',            bg:'#FFA726', color:'#fff'};
  return           {text:'Perlu Perhatian',   bg:'#EF5350', color:'#fff'};
}

// Skor per kelompok hari (untuk tren mingguan)
function skorMinggu(hariList, waterArr, bowelArr, historyObj) {
  const airVals = hariList.map(h=>getCupsForDay(waterArr,h));
  const babVals = hariList.map(h=>getFrekForDay(bowelArr,h));
  const nutVals = hariList.map(h=>getNutForDay(historyObj,h));

  const airAvg = avg(airVals);
  const nutAvg = avg(nutVals);
  const babAvg = avg(babVals);

  // Air skor: total cups di kelompok ini vs target
  const airTotal = airVals.reduce((a,b)=>a+b,0);
  const airSkor  = Math.min(Math.round((airTotal / (TARGET_AIR * hariList.length)) * 33), 33);

  // Nutrisi skor: total kategori vs target
  const nutTotal = nutVals.reduce((a,b)=>a+b,0);
  const nutSkor  = Math.min(Math.round((nutTotal / (TARGET_NUT * hariList.length)) * 34), 34);

  // BAB skor: hitung hari normal
  let babNormal = 0;
  hariList.forEach(h => {
    const entry = bowelArr.find(d => d.hari === h);
    if (entry && entry.frek >= 1 && entry.frek <= 2 && entry.darah !== 'Berdarah') babNormal++;
  });
  const babSkor = Math.min(Math.round((babNormal / hariList.length) * 33), 33);

  const total = airSkor + nutSkor + babSkor;
  return { airAvg, nutAvg, babAvg, airSkor, nutSkor, babSkor, total };
}

// Hitung semua data
function hitungData() {
  const waterArr   = getWaterData();
  const bowelArr   = getBowelData();
  const historyObj = getFoodHistory();
  const allDays    = [...DAY_NAMES];

  const weeks = [
    [allDays[0],allDays[1]],
    [allDays[2],allDays[3]],
    [allDays[4],allDays[5]],
    [allDays[6]],
  ];

  const mingguScores = weeks.map(w=>skorMinggu(w,waterArr,bowelArr,historyObj));

  let airTotal = 0;
  waterArr.forEach(d => { airTotal += (d.cups || 0); });
  const airSkorTotal = Math.min(Math.round((airTotal / (TARGET_AIR * 7)) * 33), 33);

  let katTotal2 = 0;
  allDays.forEach(h => { katTotal2 += getNutForDay(historyObj, h); });
  const nutSkorTotal = Math.min(Math.round((katTotal2 / (TARGET_NUT * 7)) * 34), 34);

  let babNormalTotal = 0;
  bowelArr.forEach(d => {
    if (d.frek >= 1 && d.frek <= 2 && d.darah !== 'Berdarah') babNormalTotal++;
  });
  const babSkorTotal = Math.min(Math.round((babNormalTotal / 7) * 33), 33);

  const totalSkor = airSkorTotal + nutSkorTotal + babSkorTotal;

  const airVals = allDays.map(h=>getCupsForDay(waterArr,h));
  const babVals = allDays.map(h=>getFrekForDay(bowelArr,h));
  const nutVals = allDays.map(h=>getNutForDay(historyObj,h));

  const avgAir     = avg(airVals);
  const avgMl      = Math.round(avgAir * ML_PER_CUP);
  const avgNutrisi = avg(nutVals);
  const avgBab     = avg(babVals);

  const hariAktif = allDays.filter(h=>
    getCupsForDay(waterArr,h)>0||getFrekForDay(bowelArr,h)>0||getNutForDay(historyObj,h)>0
  ).length;

  const texCount = {Normal:0,Keras:0,Lembek:0};
  bowelArr.forEach(d=>{ if(texCount[d.tipe]!==undefined) texCount[d.tipe]++; });

  const foodCategories = Object.entries(KAT_MAP).map(([key,meta])=>({
    key, name:meta.label, icon:meta.icon,
    hari: allDays.filter(h=>(historyObj[h]||[]).some(i=>i.cat===key)).length
  }));

  const totalHari = 7;

  return {
    totalSkor, mingguScores, weeks,
    avgAir, avgMl, avgNutrisi, avgBab,
    hariAktif, texCount, foodCategories,
    totalHari, waterArr, bowelArr, historyObj, allDays, airVals
  };
}

// Render Tren Mingguan
function renderTren(data) {
  const rowsEl  = document.getElementById('week-rows');
  const chartEl = document.getElementById('bar-chart');
  if (!rowsEl||!chartEl) return;
  rowsEl.innerHTML = chartEl.innerHTML = '';

  const maxSkor    = Math.max(...data.mingguScores.map(s=>s.total),1);
  const weekLabels = ['Mg 1','Mg 2','Mg 3','Mg 4'];

  data.mingguScores.forEach((s,i)=>{
    const airMl = Math.round(s.airAvg * ML_PER_CUP);
    const row = document.createElement('div');
    row.className = 'week-row';
    row.innerHTML = `
      <span class="wk-label">${weekLabels[i]}</span>
      <span class="wk-val">${airMl}ml</span>
      <span class="wk-val">${fmt(s.nutAvg)}</span>
      <span class="wk-val">${fmt(s.babAvg)}</span>
      <span class="wk-badge ${badgeClass(s.total)}">${s.total}</span>`;
    rowsEl.appendChild(row);

    const clr = s.total>=70?'green':s.total>=55?'orange':'red';
    const ht  = Math.round((s.total/maxSkor)*58);
    const col = document.createElement('div');
    col.className = 'chart-col';
    col.innerHTML = `
      <div class="chart-bar ${clr}" style="height:${ht}px"></div>
      <span class="chart-wk-lbl">${weekLabels[i]}</span>`;
    chartEl.appendChild(col);
  });
}

// Render Kategori Makanan
function renderFood(data) {
  const list = document.getElementById('food-list');
  if (!list) return;
  list.innerHTML = '';

  const totalHari = 7;
  const t1 = Math.round(totalHari*0.4);
  const t2 = Math.round(totalHari*0.75);

  data.foodCategories.forEach(({name,icon,hari})=>{
    const pct = Math.round((hari/totalHari)*100);
    const cls = hari===0?'red':hari<t1?'red':hari<t2?'orange':'green';
    list.innerHTML += `
      <div class="food-row">
        <span class="food-ico">${icon}</span>
        <span class="food-name">${name}</span>
        <div class="bar-wrap"><div class="bar ${cls}" style="width:${pct}%"></div></div>
        <span class="food-cnt">${hari}/${totalHari} hari</span>
      </div>`;
  });
}

// Render Tekstur BAB
function renderTexture(texCount) {
  const list = document.getElementById('texture-list');
  if (!list) return;
  list.innerHTML = '';

  const tot = Object.values(texCount).reduce((a,b)=>a+b,0)||1;
  [
    {name:'Normal', key:'Normal', dot:'#4CAF50', bar:'green' },
    {name:'Keras',  key:'Keras',  dot:'#F44336', bar:'red'   },
    {name:'Lembek', key:'Lembek', dot:'#FF9800', bar:'orange'},
  ].forEach(({name,key,dot,bar})=>{
    const count = texCount[key]||0;
    const pct   = count>0?Math.max((count/tot)*100,5):0;
    list.innerHTML += `
      <div class="texture-row">
        <span class="tex-name">${name}</span>
        <span class="tex-dot" style="background:${dot}"></span>
        <div class="tex-bar-wrap"><div class="tex-bar bar ${bar}" style="width:${pct}%"></div></div>
        <span class="tex-count">${count}x</span>
      </div>`;
  });
}

// Render Hasil Diagnosis
function renderDiagnosis(d) {
  const list = document.getElementById('diagnosis-list');
  if (!list) return;
  const items = [];

  // Hitung ulang pakai logika total mingguan
  const totalCups = d.waterArr.reduce((s, r) => s + (r.cups || 0), 0);
  const avgMl     = Math.round((totalCups * ML_PER_CUP) / 7);

  let katTotal = 0, sayurHari = 0;
  d.allDays.forEach(h => {
    const cats = new Set((d.historyObj[h] || []).map(i => i.cat));
    katTotal += cats.size;
    if (cats.has('sayur')) sayurHari++;
  });
  const avgNutrisi = katTotal / 7;

  const totalBab = d.bowelArr.reduce((s, r) => s + (r.frek || 0), 0);
  const avgBab   = totalBab / 7;

  // totTex dari bowelArr.length
  const totTex   = Math.max(d.bowelArr.length, 1);
  const texCount = { Normal: 0, Keras: 0, Lembek: 0 };
  d.bowelArr.forEach(r => { if (texCount[r.tipe] !== undefined) texCount[r.tipe]++; });

  // 1. Hidrasi — threshold: totalCups / (TARGET_AIR * 7)
  const ap = totalCups / (TARGET_AIR * 7);
  if (ap >= .9)
    items.push({ ico:'💧', title:'Hidrasi Optimal',
      desc:`Rata-rata ${fmtMl(avgMl)}/hari — target tercapai! Pertahankan.`,
      tag:'Baik', cls:'tag-baik' });
  else if (ap >= .625)
    items.push({ ico:'💧', title:'Hidrasi Kurang Optimal',
      desc:`Rata-rata ${fmtMl(avgMl)}/hari. Kurang ${fmtMl(TARGET_ML - avgMl)} dari target 2.000 ml/hari.`,
      tag:'Cukup', cls:'tag-cukup' });
  else
    items.push({ ico:'💧', title:'Dehidrasi Ringan',
      desc:`Rata-rata hanya ${fmtMl(avgMl)}/hari — jauh dari target 2.000 ml. Segera perbanyak minum air.`,
      tag:'Perlu Perhatian', cls:'tag-buruk' });

  // 2. Nutrisi — threshold: katTotal / (TARGET_NUT * 7)
  const np = katTotal / (TARGET_NUT * 7);
  if (np >= .85)
    items.push({ ico:'🥗', title:'Nutrisi Seimbang',
      desc:`Rata-rata ${fmt(avgNutrisi)} dari 5 kategori/hari terpenuhi. Variasi makan sangat baik!`,
      tag:'Baik', cls:'tag-baik' });
  else if (np >= .6)
    items.push({ ico:'🥗', title:'Nutrisi Cukup',
      desc:`Rata-rata ${fmt(avgNutrisi)} kategori/hari. Perbanyak variasi — terutama sayur dan buah.`,
      tag:'Cukup', cls:'tag-cukup' });
  else
    items.push({ ico:'🥗', title:'Nutrisi Kurang',
      desc:`Rata-rata hanya ${fmt(avgNutrisi)} kategori/hari. Pola makan perlu diperbaiki segera.`,
      tag:'Perlu Perhatian', cls:'tag-buruk' });

  // 3. Sayuran — dihitung dari loop langsung (sama dengan analisis.js)
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

  // 4. BAB frekuensi — dari totalBab / 7
  if (avgBab >= 1 && avgBab <= 2)
    items.push({ ico:'💩', title:'Frekuensi BAB Normal',
      desc:`Rata-rata ${fmt(avgBab)}x/hari — dalam batas ideal (1–2x/hari).`,
      tag:'Baik', cls:'tag-baik' });
  else if (avgBab < 1)
    items.push({ ico:'💩', title:'BAB Terlalu Jarang',
      desc:`Rata-rata ${fmt(avgBab)}x/hari. Di bawah normal — perbanyak serat dan minum air.`,
      tag:'Perlu Perhatian', cls:'tag-buruk' });
  else
    items.push({ ico:'💩', title:'BAB Terlalu Sering',
      desc:`Rata-rata ${fmt(avgBab)}x/hari — melebihi normal. Perhatikan kebersihan makanan.`,
      tag:'Cukup', cls:'tag-cukup' });

  // 5. Tekstur BAB — totTex dari bowelArr.length
  const nf = texCount.Normal / totTex;
  const kf = texCount.Keras  / totTex;
  const lf = texCount.Lembek / totTex;
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

  // 6. Darah
  if (d.bowelArr.some(b => b.darah === 'Berdarah'))
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

// Render Tips / Rekomendasi Kesehatan
function renderTips(d) {
  const el = document.getElementById('saran-list');
  if (!el) return;

  if (d.bowelArr.some(b => b.darah === 'Berdarah')) {
    el.innerHTML = `<div class="note-item">🚨 Terdeteksi darah pada BAB minggu ini. Segera periksakan ke fasilitas kesehatan terdekat.</div>`;
    return;
  }

  const tips = [];

  // Air — pakai totalCups (sama dengan analisis.js)
  const totalCups = d.waterArr.reduce((s, r) => s + (r.cups || 0), 0);
  const avgMl     = Math.round((totalCups * ML_PER_CUP) / 7);
  if (avgMl < TARGET_ML * 0.625)
    tips.push(`💧 Rata-rata hanya ${avgMl} ml/hari — jauh dari target 2.000 ml. Perbanyak minum air.`);
  else if (avgMl < TARGET_ML * 0.9)
    tips.push(`💧 Rata-rata ${avgMl} ml/hari. Tambah ${TARGET_ML - avgMl} ml lagi untuk mencapai target 2.000 ml/hari.`);

  let katTotal = 0, sayurHari = 0, buahHari = 0;
  d.allDays.forEach(h => {
    const cats = new Set((d.historyObj[h] || []).map(i => i.cat));
    katTotal += cats.size;
    if (cats.has('sayur')) sayurHari++;
    if (cats.has('buah'))  buahHari++;
  });
  const avgKat = katTotal / 7;
  if (avgKat < 3)
    tips.push(`🥗 Rata-rata hanya ${avgKat.toFixed(1)} kategori makanan/hari. Variasi makan perlu ditingkatkan.`);
  if (sayurHari < 4)
    tips.push(`🥦 Sayuran hanya dikonsumsi ${sayurHari} hari minggu ini. Targetkan ada sayuran setiap makan.`);
  if (buahHari < 4)
    tips.push(`🍓 Buah dikonsumsi hanya ${buahHari} hari minggu ini. Jadikan buah sebagai camilan harian.`);

  const totalBab = d.bowelArr.reduce((s, r) => s + (r.frek || 0), 0);
  const avgBab   = totalBab / 7;
  if (avgBab < 0.8)
    tips.push(`💩 Rata-rata BAB ${avgBab.toFixed(1)}x/hari — terlalu jarang. Perbanyak serat dan minum air.`);
  else if (avgBab > 3)
    tips.push(`⚠️ Rata-rata BAB ${avgBab.toFixed(1)}x/hari — terlalu sering. Perhatikan kebersihan makanan.`);

  const totTex    = Math.max(d.bowelArr.length, 1);
  const texKeras  = d.bowelArr.filter(r => r.tipe === 'Keras').length;
  const texLembek = d.bowelArr.filter(r => r.tipe === 'Lembek').length;
  if (texKeras  / totTex > 0.3)
    tips.push(`🚽 ${Math.round(texKeras/totTex*100)}% BAB keras minggu ini — perbanyak cairan dan makanan berserat.`);
  if (texLembek / totTex > 0.3)
    tips.push(`⚠️ ${Math.round(texLembek/totTex*100)}% BAB lembek — hindari makanan pedas dan berminyak.`);

  if (tips.length === 0)
    tips.push('✅ Semua indikator kesehatan minggu ini baik! Pertahankan pola makan dan hidrasi.');

  el.innerHTML = tips.map(s => `<div class="note-item">${s}</div>`).join('');
}

// Init
function init() {
  const now = new Date();
  setText('bulan-label', `${BULAN_NM[now.getMonth()]} ${now.getFullYear()}`);

  const data  = hitungData();
  const badge = getBadge(data.totalSkor);

  setText('total-score', data.totalSkor);
  const badgeEl = document.getElementById('score-badge');
  if (badgeEl) { badgeEl.textContent=badge.text; badgeEl.style.background=badge.bg; badgeEl.style.color=badge.color; }

  setText('avg-air',     `${fmtMl(data.avgMl)}/hari`);
  setText('avg-nutrisi', `${fmt(data.avgNutrisi)} kategori/hari`);
  setText('avg-bab',     `${fmt(data.avgBab)}x/hari`);
  setText('hari-aktif',  `${data.hariAktif} hari`);

  // Skor kartu — pakai logika analisis.js (total mingguan)
  const totalCupsInit = data.waterArr.reduce((s,r)=>s+(r.cups||0),0);
  const airSk  = Math.min(Math.round((totalCupsInit / (TARGET_AIR * 7)) * 100), 100);

  let katTotalInit = 0;
  data.allDays.forEach(h=>{ katTotalInit += getNutForDay(data.historyObj, h); });
  const nutSk  = Math.min(Math.round((katTotalInit / (TARGET_NUT * 7)) * 100), 100);

  let babNormalInit = 0;
  data.bowelArr.forEach(d=>{ if(d.frek>=1&&d.frek<=2&&d.darah!=='Berdarah') babNormalInit++; });
  const babSk = Math.min(Math.round((babNormalInit / 7) * 100), 100);

  setText('score-air',       airSk);
  setText('score-nutrisi',   nutSk);
  setText('score-bab',       babSk);
  setText('pct-aktif',       `${Math.round(data.hariAktif/data.totalHari*100)}%`);
  setText('note-air',        `dari target 2.000 ml/hari`);
  setText('note-total-hari', `dari ${data.totalHari} hari dalam seminggu`);

  renderTren(data);
  renderFood(data);
  renderTexture(data.texCount);
  renderDiagnosis(data);
  renderTips(data);

  document.querySelectorAll('.menu-item').forEach(item=>{
    item.addEventListener('click', function(e){
      const href=this.getAttribute('href');
      if(!href||href==='#') e.preventDefault();
      document.querySelectorAll('.menu-item').forEach(i=>i.classList.remove('active'));
      this.classList.add('active');
    });
  });
  document.getElementById('profileBtn')?.addEventListener('click', e=>{
    e.preventDefault();
    window.location.href='profil.html';
  });
}

document.addEventListener('DOMContentLoaded', init);