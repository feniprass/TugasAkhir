document.addEventListener("DOMContentLoaded", () => {

    const today = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"][new Date().getDay()];
    (function setGreeting() {
        var el = document.getElementById('greetingText');
        if (!el) return;
        if (window.__greetName) {
            el.textContent = 'Halo, ' + window.__greetName + '!';
        }
    })();

    // Update Checkbox
    function setCheckbox(index, teks, tercapai) {
        const items = document.querySelectorAll(".checkbox-item");
        const textEls = document.querySelectorAll(".checkbox-text");

        if (textEls[index]) textEls[index].textContent = teks;

        if (items[index]) {
            const checkmark = items[index].querySelector(".checkmark");
            if (tercapai) {
                items[index].classList.add("checked");
                if (checkmark) checkmark.textContent = "✓";
            } else {
                items[index].classList.remove("checked");
                if (checkmark) checkmark.textContent = "";
            }
        }
    }


    function loadFoodHistory() {
        try {
            return JSON.parse(localStorage.getItem("foodHistory") || "{}");
        } catch {
            return {};
        }
    }

    // Air
    function updateAirCard() {
        try {
            const waterData  = JSON.parse(localStorage.getItem("waterData") || "[]");
            const todayWater = waterData.find(d => d.hari === today);
            const cups       = todayWater ? todayWater.cups : 0;
            const liters     = (cups * 0.25).toFixed(1);

            const cardValue = document.querySelector(".card-air .card-value");
            const cardBtn   = document.querySelector(".card-air .card-btn");

            if (cardValue) cardValue.textContent = liters + " liter/hari";

            if (cardBtn) {
                if (cups >= 8)      { cardBtn.textContent = "Tercapai"; cardBtn.style.background = "#4CAF50"; }
                else if (cups >= 5) { cardBtn.textContent = "Cukup";    cardBtn.style.background = "#D4A04C"; }
                else if (cups >= 1) { cardBtn.textContent = "Kurang";   cardBtn.style.background = "#E8894D"; }
                else                { cardBtn.textContent = "Belum";    cardBtn.style.background = "#aaa"; }
            }
            setCheckbox(0, liters + " Liter konsumsi air", cups >= 8);

        } catch (e) { console.error("Error air:", e); }
    }

    // BAB
    function updateBABCard() {
        try {
            const babData  = JSON.parse(localStorage.getItem("bowelData") || "[]");
            const todayBAB = babData.find(d => d.hari === today);
            const frek     = todayBAB ? todayBAB.frek : 0;
            const tipe     = todayBAB ? todayBAB.tipe : "-";

            const cardValue = document.querySelector(".card-bab .card-value");
            const cardBtn   = document.querySelector(".card-bab .card-btn");

            if (cardValue) {
                cardValue.textContent = frek > 0
                    ? frek + " kali hari ini"
                    : "Belum BAB hari ini";
            }

            if (cardBtn) {
                if (frek === 0)     { cardBtn.textContent = "Belum";  cardBtn.style.background = "#aaa"; }
                else if (frek <= 2) { cardBtn.textContent = "Normal"; cardBtn.style.background = "#4CAF50"; }
                else                { cardBtn.textContent = "Sering"; cardBtn.style.background = "#E8894D"; }
            }
            setCheckbox(1, frek + "x pup (" + tipe + ")", frek >= 1);

        } catch (e) { console.error("Error BAB:", e); }
    }

    // Food
    function updateFoodChecklist() {
        try {
            const history    = loadFoodHistory();
            const todayData  = history[today] || [];
            const totalMakan = todayData.length;

            setCheckbox(2, totalMakan + "x makan", totalMakan >= 3);

        } catch (e) { console.error("Error food:", e); }
    }

    function getFoodStats() {
        const history   = loadFoodHistory();
        const todayData = history[today] || [];

        const stats = { pokok: 0, lauk: 0, sayur: 0, buah: 0, susu: 0 };

        todayData.forEach(item => {
            if (stats[item.cat] !== undefined) {
                stats[item.cat]++;
            }
        });

        return stats;
    }

    // Chart
    function renderChart() {
        const ctx = document.getElementById('statsChart');
        if (!ctx) return;

        // Hancurkan chart lama 
        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();

        const stats = getFoodStats();
        const total = stats.pokok + stats.lauk + stats.sayur + stats.buah + stats.susu;

        // Kalau belum ada data → chart abu-abu semua
        const data   = total > 0
            ? [stats.pokok, stats.lauk, stats.sayur, stats.buah, stats.susu]
            : [1, 1, 1, 1, 1]; // placeholder biar donut tetap bulat

        const colors = total > 0
            ? ['#5A3417', '#F5C563', '#E8894D', '#8B5A3C', '#666666']
            : ['#E0E0E0', '#E0E0E0', '#E0E0E0', '#E0E0E0', '#E0E0E0'];

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Karbohidrat', 'Protein', 'Sayuran', 'Buah-buahan', 'Susu'],
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        filter: () => total > 0
                    }
                },
                cutout: '65%'
            }
        });
    }

    // Note Harian
    function updateNoteHarian() {
        const artikelList = [
            {
                judul: "💧 Pentingnya Hidrasi",
                isi: "Minum 8 gelas air sehari membantu melancarkan pencernaan, mencegah sembelit, dan menjaga kesehatan usus."
            },
            {
                judul: "🥦 Manfaat Serat",
                isi: "Serat dari sayur dan buah membantu pergerakan usus, menurunkan kolesterol, dan menjaga kadar gula darah tetap stabil."
            },
            {
                judul: "💩 BAB yang Sehat",
                isi: "BAB normal terjadi 1–2 kali sehari dengan tekstur lunak dan mudah dikeluarkan. Kurang dari itu bisa jadi tanda sembelit."
            },
            {
                judul: "🍚 Karbohidrat & Pencernaan",
                isi: "Pilih karbohidrat kompleks seperti nasi merah atau oat yang kaya serat dan dicerna lebih lambat, baik untuk usus."
            },
            {
                judul: "🍗 Protein untuk Usus",
                isi: "Protein dari ikan, tahu, dan tempe lebih mudah dicerna dibanding daging merah dan lebih ramah untuk kesehatan usus."
            },
            {
                judul: "🍎 Buah & Kesehatan Usus",
                isi: "Pepaya, pisang, dan apel mengandung enzim dan serat alami yang membantu pencernaan dan menjaga bakteri baik di usus."
            },
            {
                judul: "🥛 Probiotik & Usus",
                isi: "Yogurt dan susu fermentasi mengandung probiotik yang menjaga keseimbangan bakteri baik di usus dan meningkatkan imunitas."
            },
        ];

        const hariIndex = new Date().getDay();
        const artikel   = artikelList[hariIndex];

        const noteTitle = document.querySelector(".note-title");
        const noteText  = document.querySelector(".note-text");

        if (noteTitle) noteTitle.textContent = artikel.judul;
        if (noteText)  noteText.textContent  = artikel.isi;
    }

    // Init
    updateAirCard();
    updateBABCard();
    updateFoodChecklist();
    renderChart();
    updateNoteHarian();

    // Navigasi
    document.getElementById('PemantauAirBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'watertracker.html';
    });

    document.getElementById('PemantauBABBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'babtracker.html';
    });

    document.getElementById('PemantauMakananBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'foodtracker.html';
    });

    document.getElementById('NotifikasiBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'notifikasi.html';
    });

    document.getElementById('AnalisisBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'analisis.html';
    });

    document.getElementById('notifBtn')?.addEventListener('click', () => {
        window.location.href = 'notifikasi.html';
    });

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'login.html';
    });

    document.getElementById('DiagnosisBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'diagnosis.html';
    });
    document.getElementById('profileBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'profil.html';
    });


});