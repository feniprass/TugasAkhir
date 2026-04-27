// =========================================
//  BABuddy - Notifikasi Script
// =========================================

const DAY_NAMES   = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
const TARGET_CUPS = 8;
const TARGET_FREK = 2;

const KATEGORI_INFO = {
  pokok: { label: "Makanan Pokok", icon: "🍚", contoh: "Nasi, Mie, Kentang" },
  lauk:  { label: "Lauk Pauk",     icon: "🍗", contoh: "Ayam, Ikan, Tahu, Tempe" },
  susu:  { label: "Susu",          icon: "🥛", contoh: "Susu, Yogurt, Keju" },
  buah:  { label: "Buah-buahan",   icon: "🍎", contoh: "Apel, Mangga, Jeruk" },
  sayur: { label: "Sayuran",       icon: "🥦", contoh: "Bayam, Wortel, Kangkung" },
};

// ── Ambil hari ini ──
function getToday() {
  return DAY_NAMES[new Date().getDay()];
}

// ── Baca data water ──
function getWaterToday() {
  try {
    const data = JSON.parse(localStorage.getItem("waterData") || "[]");
    const found = data.find(d => d.hari === getToday());
    return found ? found.cups : 0;
  } catch { return 0; }
}

// ── Baca data BAB ──
function getBabToday() {
  try {
    const data = JSON.parse(localStorage.getItem("bowelData") || "[]");
    return data.find(d => d.hari === getToday()) || null;
  } catch { return null; }
}

// ── Baca data food ──
function getFoodToday() {
  try {
    return JSON.parse(localStorage.getItem("foodData") || "{}");
  } catch { return {}; }
}

// ── Hitung sehat ──
function hitungSehat(food) {
  let terpenuhi = 0;
  const status = {};
  Object.keys(KATEGORI_INFO).forEach(key => {
    const ada = food[key] && food[key].length > 0;
    if (ada) terpenuhi++;
    status[key] = { ada, items: food[key] || [] };
  });
  return { terpenuhi, total: 5, status };
}

// =========================================
//  UPDATE CARD 4 SEHAT 5 SEMPURNA
// =========================================
function updateSehatCard(sehat) {
  const pct    = Math.round((sehat.terpenuhi / sehat.total) * 100);
  const kurang = sehat.total - sehat.terpenuhi;

  document.getElementById("sehatSub").textContent =
    `Progress hari ini: ${sehat.terpenuhi}/${sehat.total} kategori terpenuhi`;

  const fill = document.getElementById("sehatFill");
  fill.style.width   = pct + "%";
  fill.textContent   = pct > 20 ? pct + "%" : "";

  const warn     = document.getElementById("sehatWarning");
  const warnText = document.getElementById("sehatWarningText");

  if (kurang === 0) {
    warn.className = "sehat-warning ok";
    warnText.textContent = "Semua kategori terpenuhi! ✓";
  } else {
    warn.className = "sehat-warning";
    warnText.textContent = kurang + " kategori belum terpenuhi";
  }
}

// =========================================
//  MODAL DETAIL (ikon kertas diklik)
// =========================================
function bukaModalSehat(sehat) {
  const list = document.getElementById("sehatDetailList");
  list.innerHTML = "";

  const kurangList = [];

  Object.entries(KATEGORI_INFO).forEach(([key, info]) => {
    const st    = sehat.status[key];
    const isOk  = st.ada;
    const item  = document.createElement("div");
    item.className = "sehat-detail-item";

    let isiText = isOk
      ? st.items.map(i => i.nama).join(", ")
      : `Belum ada — contoh: ${info.contoh}`;

    item.innerHTML = `
      <div class="sehat-detail-icon">${info.icon}</div>
      <div class="sehat-detail-info">
        <div class="sehat-detail-name">${info.label}</div>
        <div class="sehat-detail-status ${isOk ? 'ok' : 'kurang'}">
          ${isOk ? "✓ " + isiText : "✗ " + isiText}
        </div>
      </div>
      <span class="sehat-badge ${isOk ? 'ok' : 'kurang'}">${isOk ? "Terpenuhi" : "Kurang"}</span>
    `;
    list.appendChild(item);

    if (!isOk) kurangList.push(info.label);
  });

  // Tampilkan pengingat kalau ada yang kurang
  const hint = document.getElementById("modalNotifHint");
  if (kurangList.length > 0) {
    hint.className = "modal-notif-hint show";
    hint.innerHTML = `
      💡 <strong>Pengingat:</strong> Anda masih perlu mengonsumsi
      <strong>${kurangList.join(", ")}</strong> hari ini untuk memenuhi
      kebutuhan 4 Sehat 5 Sempurna.
    `;
  } else {
    hint.className = "modal-notif-hint show";
    hint.innerHTML = `🎉 <strong>Luar biasa!</strong> Semua kategori makanan sudah terpenuhi hari ini!`;
    hint.style.background = "#e8f5e9";
    hint.style.color = "#27760d";
  }

  document.getElementById("modalSehat").classList.add("active");
}

function tutupModalSehat() {
  document.getElementById("modalSehat").classList.remove("active");
}

// =========================================
//  GENERATE & RENDER NOTIFIKASI
// =========================================
function renderNotifikasi(cups, bab, sehat) {
  const list = document.getElementById("notifList");
  list.innerHTML = "";

  const notifs = [];

  // ── Notif Air ──
  if (cups === 0) {
    notifs.push({ icon: "⚠️", text: "Anda belum minum air putih hari ini. Segera minum!", level: "warning" });
  } else if (cups < TARGET_CUPS) {
    notifs.push({ icon: "⚠️", text: `Anda kurang minum air putih hari ini. Masih perlu ${TARGET_CUPS - cups} gelas lagi.`, level: "warning" });
  } else {
    notifs.push({ icon: "✅", text: "Konsumsi air hari ini sudah tercapai. Pertahankan!", level: "ok" });
  }

  // ── Notif BAB ──
  if (!bab || bab.frek === 0) {
    notifs.push({ icon: "⚠️", text: "Perbanyak konsumsi serat, anda belum BAB hari ini.", level: "warning" });
  } else if (bab.frek > TARGET_FREK) {
    notifs.push({ icon: "⚠️", text: `BAB anda ${bab.frek}x hari ini, lebih dari normal. Perhatikan pola makan.`, level: "warning" });
  } else {
    notifs.push({ icon: "✅", text: `BAB hari ini normal (${bab.frek}x). Tetap jaga pola makan!`, level: "ok" });
  }

  // ── Notif Darah ──
  if (bab && bab.darah === "Blood") {
    notifs.push({ icon: "🚨", text: "Terdeteksi darah pada BAB hari ini. Segera konsultasi ke dokter!", level: "danger" });
  }

  // ── Notif Makanan ──
  const kurang = Object.entries(KATEGORI_INFO)
    .filter(([key]) => !sehat.status[key].ada)
    .map(([, info]) => info.label);

  if (kurang.length > 0) {
    notifs.push({ icon: "⚠️", text: `Lengkapi gizi: ${kurang.join(", ")} belum dikonsumsi hari ini.`, level: "warning" });
  } else {
    notifs.push({ icon: "✅", text: "4 Sehat 5 Sempurna hari ini sudah terpenuhi semua!", level: "ok" });
  }

  // Render
  notifs.forEach(n => {
    const div = document.createElement("div");
    div.className = `notif-item ${n.level}`;
    div.innerHTML = `
      <div class="notif-icon">${n.icon}</div>
      <div class="notif-text">${n.text}</div>
    `;
    list.appendChild(div);
  });
}

// =========================================
//  INIT
// =========================================
document.addEventListener("DOMContentLoaded", () => {

  const cups  = getWaterToday();
  const bab   = getBabToday();
  const food  = getFoodToday();
  const sehat = hitungSehat(food);

  updateSehatCard(sehat);
  renderNotifikasi(cups, bab, sehat);

  // Tombol ikon kertas
  document.getElementById("btnDetailSehat").addEventListener("click", () => {
    bukaModalSehat(sehat);
  });

  // Tutup modal klik overlay
  document.getElementById("modalSehat").addEventListener("click", function(e) {
    if (e.target === this) tutupModalSehat();
  });

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