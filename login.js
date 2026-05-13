// ==================== LOGIN JAVASCRIPT ====================

function iconEye() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#8B4513" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>`;
}

function iconEyeOff() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#8B4513" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.186-3.411M6.53 6.53A9.97 9.97 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.97 9.97 0 01-4.418 5.468M3 3l18 18" />
    </svg>`;
}

const togglePassword = document.getElementById('togglePassword');
const passwordInput  = document.getElementById('password');
const eyeIcon        = document.getElementById('eyeIcon');

eyeIcon.innerHTML = iconEye();

togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    eyeIcon.innerHTML = type === 'password' ? iconEye() : iconEyeOff();
});

function showError(inputId, msg) {
    const input = document.getElementById(inputId);
    let errEl = document.getElementById('err-' + inputId);
    if (!errEl) {
        errEl = document.createElement('span');
        errEl.id = 'err-' + inputId;
        errEl.style.cssText = 'color:#e87d5c;font-size:12px;margin-top:4px;display:block;';
        input.parentNode.appendChild(errEl);
    }
    errEl.textContent = msg;
    input.style.borderColor = '#ff6b6b';
}

function clearError(inputId) {
    const input = document.getElementById(inputId);
    const errEl = document.getElementById('err-' + inputId);
    if (errEl) errEl.textContent = '';
    if (input) input.style.borderColor = '#d4a76a';
}

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    let valid = true;
    clearError('email');
    clearError('password');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showError('email', 'Masukkan alamat email yang valid.');
        valid = false;
    }
    if (!password) {
        showError('password', 'Masukkan kata sandi.');
        valid = false;
    }

    if (!valid) return;

    // Cek akun yang sudah terdaftar
    const accounts = JSON.parse(localStorage.getItem('bbAccounts') || '[]');
    const akun     = accounts.find(a => a.email === email);

    if (!akun) {
        showError('email', 'Email belum terdaftar. Silakan daftar terlebih dahulu.');
        return;
    }

    if (akun.password !== password) {
        showError('password', 'Kata sandi salah.');
        return;
    }

    // Login berhasil — simpan sesi dengan nama depan dari akun
    localStorage.setItem('userName', akun.namaDepan);
    localStorage.setItem('userEmail', akun.email);

    window.location.href = 'dashboard.html';
});

document.querySelector('.forgot-password').addEventListener('click', e => e.preventDefault());

document.getElementById('daftarLink').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = 'register.html';
});

window.addEventListener('load', () => document.getElementById('email').focus());

passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') loginForm.dispatchEvent(new Event('submit'));
});