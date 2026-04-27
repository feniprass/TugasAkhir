// ==================== REGISTER JAVASCRIPT ====================

// Toggle Password Visibility
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eyeIcon');

togglePassword.addEventListener('click', function() {
    // Toggle tipe input
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle icon mata
    eyeIcon.textContent = type === 'password' ? '👁️' : '🙈';
});

// Form Register Submit
const registerForm = document.getElementById('registerForm');
const agreeTerms = document.getElementById('agreeTerms');

registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const namaDepan = document.getElementById('namaDepan').value.trim();
    const namaBelakang = document.getElementById('namaBelakang').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Validasi field kosong
    if (!namaDepan || !namaBelakang || !email || !password) {
        alert('Mohon isi semua field!');
        return;
    }
    
    // Validasi nama (minimal 2 karakter)
    if (namaDepan.length < 2 || namaBelakang.length < 2) {
        alert('Nama harus minimal 2 karakter!');
        return;
    }
    
    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Format email tidak valid!');
        return;
    }
    
    // Validasi password (minimal 6 karakter)
    if (password.length < 6) {
        alert('Password harus minimal 6 karakter!');
        return;
    }
    
    // Validasi checkbox terms
    if (!agreeTerms.checked) {
        alert('Anda harus menyetujui Terms of Service dan Privacy Policy!');
        return;
    }
    
    // Simulasi registrasi berhasil
    console.log('Register attempt:', { 
        namaDepan, 
        namaBelakang, 
        email, 
        password 
    });
    
    alert(`Pendaftaran berhasil! Selamat datang ${namaDepan} ${namaBelakang} 🎉`);
    
    // Redirect ke dashboard setelah registrasi berhasil
    setTimeout(function() {
        window.location.href = 'dashboard.html';
    }, 1000);
});

// Terms of Service Link
document.getElementById('termsLink').addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Terms of Service clicked');
    alert('Terms of Service akan ditampilkan');
});

// Privacy Policy Link
document.getElementById('privacyLink').addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Privacy Policy clicked');
    alert('Privacy Policy akan ditampilkan');
});

// Link ke halaman Masuk
document.getElementById('masukLink').addEventListener('click', function(e) {
    console.log('Masuk link clicked - redirect to login.html');
});

// Real-time validation untuk email
document.getElementById('email').addEventListener('blur', function() {
    const email = this.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        this.style.borderColor = '#ff6b6b';
        alert('Format email tidak valid!');
    } else {
        this.style.borderColor = '#d4a76a';
    }
});

// Real-time validation untuk password
document.getElementById('password').addEventListener('input', function() {
    const password = this.value;
    
    if (password.length > 0 && password.length < 6) {
        this.style.borderColor = '#ff6b6b';
    } else if (password.length >= 6) {
        this.style.borderColor = '#4caf50';
    } else {
        this.style.borderColor = '#d4a76a';
    }
});

// Auto focus pada input pertama saat halaman dimuat
window.addEventListener('load', function() {
    document.getElementById('namaDepan').focus();
    console.log('Register page loaded successfully');
});

// Enter key pada field terakhir langsung submit
passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && agreeTerms.checked) {
        registerForm.dispatchEvent(new Event('submit'));
    }
});