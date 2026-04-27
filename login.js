
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

// Form Login Submit
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Validasi
    if (!email || !password) {
        alert('Mohon isi semua field!');
        return;
    }
    
    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Format email tidak valid!');
        return;
    }
    
  // Simulasi login berhasil
   console.log('Login attempt:', { email, password });
   alert('Login berhasil! Selamat datang di BABuddy 🎉');

   // Redirect ke dashboard
   window.location.href = 'dashboard.html';
});

// Facebook Login
document.getElementById('facebookLogin').addEventListener('click', function() {
    console.log('Facebook login clicked');
    alert('Login dengan Facebook akan segera tersedia');
});

// Google Login
document.getElementById('googleLogin').addEventListener('click', function() {
    console.log('Google login clicked');
    alert('Login dengan Google akan segera tersedia');
});

// Apple Login
document.getElementById('appleLogin').addEventListener('click', function() {
    console.log('Apple login clicked');
    alert('Login dengan Apple akan segera tersedia');
});

// Forgot Password
document.querySelector('.forgot-password').addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Forgot password clicked');
    alert('Fitur lupa kata sandi akan segera tersedia');
});

// Link ke halaman Daftar
document.getElementById('daftarLink').addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Daftar link clicked');
    alert('Halaman pendaftaran akan segera tersedia');
    // window.location.href = 'register.html';
});

// Auto focus pada input pertama saat halaman dimuat
window.addEventListener('load', function() {
    document.getElementById('email').focus();
    console.log('Login page loaded successfully');
});

// Enter key pada password langsung submit
passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
});