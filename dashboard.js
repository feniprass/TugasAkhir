document.addEventListener("DOMContentLoaded", () => {

    const today = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"][new Date().getDay()];

    // =========================
    // LOAD DATA
    // =========================
    function loadFoodHistory() {
        try {
            return JSON.parse(localStorage.getItem("foodHistory") || "{}");
        } catch {
            return {};
        }
    }

    // =========================
    // AIR
    // =========================
    function updateAirCard() {
        try {
            const waterData = JSON.parse(localStorage.getItem("waterData") || "[]");
            const todayWater = waterData.find(d => d.hari === today);
            const cups = todayWater ? todayWater.cups : 0;
            const liters = (cups * 0.25).toFixed(1);

            const cardValue = document.querySelector(".card-air .card-value");
            const cardBtn   = document.querySelector(".card-air .card-btn");

            if (cardValue) cardValue.textContent = liters + " liter/hari";

            if (cardBtn) {
                if (cups >= 8)       { cardBtn.textContent = "Tercapai"; cardBtn.style.background = "#4CAF50"; }
                else if (cups >= 5)  { cardBtn.textContent = "Cukup";    cardBtn.style.background = "#D4A04C"; }
                else if (cups >= 1)  { cardBtn.textContent = "Kurang";   cardBtn.style.background = "#E8894D"; }
                else                 { cardBtn.textContent = "Belum";    cardBtn.style.background = "#aaa"; }
            }

            const airChecklist = document.querySelectorAll(".checkbox-text")[0];
            if (airChecklist) airChecklist.textContent = liters + " Liter konsumsi air";

        } catch (e) { console.error("Error air:", e); }
    }

    // =========================
    // BAB
    // =========================
    function updateBABCard() {
        try {
            const babData = JSON.parse(localStorage.getItem("bowelData") || "[]");
            const todayBAB = babData.find(d => d.hari === today);
            const frek  = todayBAB ? todayBAB.frek : 0;
            const tipe  = todayBAB ? todayBAB.tipe : "-";

            const cardValue = document.querySelector(".card-bab .card-value");
            const cardBtn   = document.querySelector(".card-bab .card-btn");

            if (cardValue) {
                cardValue.textContent = frek > 0
                    ? frek + " kali hari ini"
                    : "Belum BAB hari ini";
            }

            if (cardBtn) {
                if (frek === 0)      { cardBtn.textContent = "Belum";  cardBtn.style.background = "#aaa"; }
                else if (frek <= 2)  { cardBtn.textContent = "Normal"; cardBtn.style.background = "#4CAF50"; }
                else                 { cardBtn.textContent = "Sering"; cardBtn.style.background = "#E8894D"; }
            }

            const babChecklist = document.querySelectorAll(".checkbox-text")[1];
            if (babChecklist) babChecklist.textContent = frek + "x pup (" + tipe + ")";

        } catch (e) { console.error("Error BAB:", e); }
    }

    // =========================
    // FOOD
    // =========================
    function updateFoodChecklist() {
        try {
            const history = loadFoodHistory();
            const todayData = history[today] || [];
            const totalMakan = todayData.length;

            const makanChecklist = document.querySelectorAll(".checkbox-text")[2];
            if (makanChecklist) {
                makanChecklist.textContent = totalMakan + "x makan";
            }

        } catch (e) {
            console.error("Error food:", e);
        }
    }

    function getFoodStats() {
        const history = loadFoodHistory();
        const todayData = history[today] || [];

        const stats = {
            pokok: 0,
            lauk: 0,
            sayur: 0,
            buah: 0,
            susu: 0
        };

        todayData.forEach(item => {
            if (stats[item.cat] !== undefined) {
                stats[item.cat]++;
            }
        });

        return stats;
    }

    // =========================
    // CHART
    // =========================
    function renderChart() {
        const ctx = document.getElementById('statsChart');
        if (!ctx) return;

        const stats = getFoodStats();

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Karbohidrat', 'Protein', 'Sayuran', 'Buah-buahan', 'Susu'],
                datasets: [{
                    data: [
                        stats.pokok,
                        stats.lauk,
                        stats.sayur,
                        stats.buah,
                        stats.susu
                    ],
                    backgroundColor: ['#5A3417', '#F5C563', '#E8894D', '#8B5A3C', '#666666'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                cutout: '65%'
            }
        });
    }

    // =========================
    // INIT
    // =========================
    updateAirCard();
    updateBABCard();
    updateFoodChecklist();
    renderChart();

    // =========================
    // NAVIGASI
    // =========================
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

});