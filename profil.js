// =========================================
//  BABuddy - Profil Script
// =========================================

const DAY_NAMES = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

// ── Baca akun dari localStorage ──
function getAkun() {
  try {
    const email    = localStorage.getItem('userEmail') || '';
    const accounts = JSON.parse(localStorage.getItem('bbAccounts') || '[]');
    return accounts.find(a => a.email === email) || null;
  } catch { return null; }
}

// ── Baca data statistik ──
function getStatistik() {
  try {
    const waterData   = JSON.parse(localStorage.getItem('waterData')   || '[]');
    const bowelData   = JSON.parse(localStorage.getItem('bowelData')   || '[]');
    const foodHistory = JSON.parse(localStorage.getItem('foodHistory') || '{}');

    let totalAir = 0, totalBab = 0, totalNutrisi = 0, hariAktif = 0;

    DAY_NAMES.forEach(hari => {
      const air = waterData.find(d => d.hari === hari);
      const bab = bowelData.find(d => d.hari === hari);
      const food = foodHistory[hari] || [];
      const cats = new Set(food.map(i => i.cat)).size;

      const cups = air ? air.cups : 0;
      const frek = bab ? bab.frek : 0;

      totalAir     += cups;
      totalBab     += frek;
      totalNutrisi += cats;

      if (cups > 0 || frek > 0 || food.length > 0) hariAktif++;
    });

    return {
      avgAir:     (totalAir / 7).toFixed(1),
      avgBab:     (totalBab / 7).toFixed(1),
      avgNutrisi: (totalNutrisi / 7).toFixed(1),
      hariAktif
    };
  } catch {
    return { avgAir: '—', avgBab: '—', avgNutrisi: '—', hariAktif: '—' };
  }
}

// ── Render halaman profil ──
function renderProfil() {
  const akun = getAkun();
  if (!akun) {
    window.location.href = 'login.html';
    return;
  }

  const namaLengkap = akun.namaDepan + ' ' + akun.namaBelakang;

  // Hero
  document.getElementById('namaLengkap').textContent = namaLengkap;
  document.getElementById('emailProfil').textContent  = akun.email;

  // Avatar — inisial nama depan
  const initial = akun.namaDepan.charAt(0).toUpperCase();
  document.getElementById('avatarInitial').textContent = initial;

  // Info akun
  document.getElementById('infoNamaDepan').textContent   = akun.namaDepan;
  document.getElementById('infoNamaBelakang').textContent = akun.namaBelakang;
  document.getElementById('infoEmail').textContent        = akun.email;

  // Tanggal bergabung (simpan saat register, atau tampilkan hari ini kalau tidak ada)
  const bergabung = akun.bergabung
    ? new Date(akun.bergabung).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })
    : new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
  document.getElementById('infoBergabung').textContent = bergabung;

  // Statistik
  const stat = getStatistik();
  document.getElementById('statAir').textContent      = stat.avgAir;
  document.getElementById('statBab').textContent      = stat.avgBab;
  document.getElementById('statNutrisi').textContent  = stat.avgNutrisi;
  document.getElementById('statHariAktif').textContent = stat.hariAktif;
}

// ── Modal Edit Profil ──
function bukaModalEdit() {
  const akun = getAkun();
  if (!akun) return;
  document.getElementById('editNamaDepan').value   = akun.namaDepan;
  document.getElementById('editNamaBelakang').value = akun.namaBelakang;
  document.getElementById('modalEdit').classList.add('active');
}

function tutupModal() {
  document.getElementById('modalEdit').classList.remove('active');
}

function simpanEditProfil() {
  const namaDepan    = document.getElementById('editNamaDepan').value.trim();
  const namaBelakang = document.getElementById('editNamaBelakang').value.trim();

  if (!namaDepan || !namaBelakang) {
    showToast('⚠️ Nama tidak boleh kosong.');
    return;
  }

  const email    = localStorage.getItem('userEmail') || '';
  const accounts = JSON.parse(localStorage.getItem('bbAccounts') || '[]');
  const idx      = accounts.findIndex(a => a.email === email);

  if (idx !== -1) {
    accounts[idx].namaDepan    = namaDepan;
    accounts[idx].namaBelakang = namaBelakang;
    localStorage.setItem('bbAccounts', JSON.stringify(accounts));
    localStorage.setItem('userName', namaDepan);
  }

  tutupModal();
  renderProfil();
  showToast('✅ Profil berhasil diperbarui!');
}

// ── Ganti Password ──
document.getElementById('btnGantiPass').addEventListener('click', () => {
  const passLama      = document.getElementById('passLama').value;
  const passBaru      = document.getElementById('passBaru').value;
  const passKonfirmasi = document.getElementById('passKonfirmasi').value;
  const msgEl         = document.getElementById('msgPass');

  msgEl.className = 'msg-pass';
  msgEl.textContent = '';

  const email    = localStorage.getItem('userEmail') || '';
  const accounts = JSON.parse(localStorage.getItem('bbAccounts') || '[]');
  const idx      = accounts.findIndex(a => a.email === email);

  if (idx === -1) { msgEl.className = 'msg-pass error'; msgEl.textContent = 'Akun tidak ditemukan.'; return; }

  if (accounts[idx].password !== passLama) {
    msgEl.className = 'msg-pass error';
    msgEl.textContent = 'Kata sandi lama tidak sesuai.';
    return;
  }

  if (passBaru.length < 6) {
    msgEl.className = 'msg-pass error';
    msgEl.textContent = 'Kata sandi baru minimal 6 karakter.';
    return;
  }

  if (passBaru !== passKonfirmasi) {
    msgEl.className = 'msg-pass error';
    msgEl.textContent = 'Konfirmasi kata sandi tidak cocok.';
    return;
  }

  accounts[idx].password = passBaru;
  localStorage.setItem('bbAccounts', JSON.stringify(accounts));

  document.getElementById('passLama').value        = '';
  document.getElementById('passBaru').value        = '';
  document.getElementById('passKonfirmasi').value  = '';

  msgEl.className   = 'msg-pass ok';
  msgEl.textContent = '✓ Kata sandi berhasil diperbarui.';
});

// ── Toast ──
function showToast(msg) {
  let t = document.getElementById('profil-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'profil-toast';
    t.style.cssText = 'position:fixed;bottom:30px;right:30px;background:#333;color:#fff;' +
      'padding:12px 20px;border-radius:20px;font-size:13px;font-weight:700;' +
      'z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.2);opacity:0;transition:opacity .3s;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  renderProfil();

  document.getElementById('btnEdit').addEventListener('click', bukaModalEdit);

  document.getElementById('modalEdit').addEventListener('click', function(e) {
    if (e.target === this) tutupModal();
  });

  document.getElementById('logoutBtn').addEventListener('click', e => {
    e.preventDefault();
    window.location.href = 'login.html';
  });

  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') e.preventDefault();
    });
  });
});