document.getElementById('btn-masuk').addEventListener('click', function() {
    window.location.href = 'login.html';
    console.log('Tombol Masuk diklik - redirect ke login.html');
});

document.getElementById('masuk-link').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = 'login.html';
    console.log('Link Masuk diklik - redirect ke login.html');
});

document.getElementById('btn-daftar').addEventListener('click', function() {
    window.location.href = 'register.html';
    console.log('Tombol Daftar diklik - redirect ke register.html');
});

document.getElementById('signup-link').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = 'register.html';
    console.log('Link Sign Up diklik - redirect ke register.html');
});

window.addEventListener('resize', function() {
    console.log('Window width: ' + window.innerWidth + 'px');
});

window.addEventListener('load', function() {
    console.log('Halaman BABuddy berhasil dimuat');
    console.log('Device width: ' + window.innerWidth + 'px');
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});