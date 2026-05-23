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

const registerForm = document.getElementById('registerForm');
const agreeTerms   = document.getElementById('agreeTerms');

function showError(inputId, msg) {
    const input = document.getElementById(inputId);
    let errEl = document.getElementById('err-' + inputId);
    if (!errEl) {
        errEl = document.createElement('span');
        errEl.id = 'err-' + inputId;
        errEl.style.cssText = 'color:#e87d5c;font-size:12px;margin-top:4px;display:block;';
        const formGroup = input.closest('.form-group');
        if (formGroup) formGroup.appendChild(errEl);
        else input.parentNode.appendChild(errEl);
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

function showTermsError(msg) {
    let errEl = document.getElementById('err-terms');
    if (!errEl) {
        errEl = document.createElement('span');
        errEl.id = 'err-terms';
        errEl.style.cssText = 'color:#e87d5c;font-size:12px;margin-top:4px;display:block;';
        agreeTerms.closest('.checkbox-group').appendChild(errEl);
    }
    errEl.textContent = msg;
}

registerForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const namaDepan    = document.getElementById('namaDepan').value.trim();
    const namaBelakang = document.getElementById('namaBelakang').value.trim();
    const email        = document.getElementById('email').value.trim();
    const password     = document.getElementById('password').value;

    let valid = true;
    ['namaDepan','namaBelakang','email','password'].forEach(clearError);
    const termsErr = document.getElementById('err-terms');
    if (termsErr) termsErr.textContent = '';

    if (namaDepan.length < 2) { showError('namaDepan', 'Nama depan minimal 2 karakter.'); valid = false; }
    if (namaBelakang.length < 2) { showError('namaBelakang', 'Nama belakang minimal 2 karakter.'); valid = false; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { showError('email', 'Format email tidak valid.'); valid = false; }
    if (password.length < 6) { showError('password', 'Password minimal 6 karakter.'); valid = false; }
    if (!agreeTerms.checked) { showTermsError('Anda harus menyetujui syarat dan ketentuan.'); valid = false; }

    if (!valid) return;

    // Cek apakah email sudah terdaftar
    const accounts = JSON.parse(localStorage.getItem('bbAccounts') || '[]');
    const sudahAda = accounts.find(a => a.email === email);
    if (sudahAda) {
        showError('email', 'Email ini sudah terdaftar. Silakan login.');
        return;
    }

    // Simpan akun baru
    accounts.push({ email, password, namaDepan, namaBelakang });
    localStorage.setItem('bbAccounts', JSON.stringify(accounts));

    // Set sesi login
    localStorage.setItem('userName', namaDepan);
    localStorage.setItem('userEmail', email);

    window.location.href = 'dashboard.html';
});

document.getElementById('termsLink').addEventListener('click', e => e.preventDefault());
document.getElementById('privacyLink').addEventListener('click', e => e.preventDefault());

document.getElementById('email').addEventListener('blur', function() {
    const email = this.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) showError('email', 'Format email tidak valid.');
    else clearError('email');
});

document.getElementById('password').addEventListener('input', function() {
    if (this.value.length > 0 && this.value.length < 6) {
        showError('password', 'Password minimal 6 karakter.');
        this.style.borderColor = '#ff6b6b';
    } else if (this.value.length >= 6) {
        clearError('password');
        this.style.borderColor = '#4caf50';
    } else {
        clearError('password');
        this.style.borderColor = '#d4a76a';
    }
});

window.addEventListener('load', () => document.getElementById('namaDepan').focus());

passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') registerForm.dispatchEvent(new Event('submit'));
});