const form = document.getElementById('produs-form');
const tbody = document.querySelector('#tabela-produse tbody');
const totalDiv = document.getElementById('total');

let produse = [];
let editIndex = -1;

form.addEventListener('submit', function (e) {
    e.preventDefault();

    const nume = document.getElementById('numeProdus').value.trim();
    const pret = parseFloat(document.getElementById('pret').value);
    const unitate = document.getElementById('unitate').value;
    let cantitateRaw = document.getElementById('cantitate').value.trim();
    let cantitate = parseFloat(cantitateRaw.replace(',', '.'));

    if (!nume || pret <= 0 || cantitate <= 0) {
        alert('Te rog completează toate câmpurile corect!');
        return;
    }

    const cost = pret * cantitate;
    const produs = { nume, pret, unitate, cantitate, cost };

    if (editIndex === -1) {
        produse.push(produs);
    } else {
        produse[editIndex] = produs;
        editIndex = -1;
        form.querySelector('button').textContent = 'Adaugă produs';
    }

    afiseazaProduse();
    actualizeazaTotal();
    actualizeazaGrafic();
    salveazaDate();

    form.reset();
    document.getElementById('numeProdus').focus();
});

function afiseazaProduse() {
    tbody.innerHTML = '';
    produse.forEach((p, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${p.nume}</td>
        <td>${p.pret.toFixed(2)}</td>
        <td>${p.unitate}</td>
        <td>${p.cantitate}</td>
        <td>${p.cost.toFixed(2)}</td>
        <td><button data-index="${index}" class="btn-sterge">Șterge</button></td>
      `;
        tbody.appendChild(tr);

        // Click pe rând = editare
        tr.addEventListener('click', (e) => {
            // Dacă s-a apăsat butonul Șterge, nu facem editare
            if (e.target.classList.contains('btn-sterge')) return;

            const p = produse[index];
            document.getElementById('numeProdus').value = p.nume;
            document.getElementById('pret').value = p.pret;
            document.getElementById('unitate').value = p.unitate;
            document.getElementById('cantitate').value = p.cantitate;
            editIndex = index;
            form.querySelector('button').textContent = 'Modifică produs';
        });
    });

    // Adăugăm eveniment pentru toate butoanele șterge
    document.querySelectorAll('.btn-sterge').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation(); // să nu activeze editarea rândului
            const idx = this.getAttribute('data-index');
            produse.splice(idx, 1);
            afiseazaProduse();
            actualizeazaTotal();
            actualizeazaGrafic();
            salveazaDate();

            // Dacă eram în modul editare și ștergem produsul editat, resetăm formularul
            if (editIndex == idx) {
                editIndex = -1;
                form.reset();
                form.querySelector('button').textContent = 'Adaugă produs';
            }
        });
    });
}

function actualizeazaTotal() {
    const suma = produse.reduce((acc, p) => acc + p.cost, 0);
    totalDiv.textContent = `Total: ${suma.toFixed(2)} lei`;
}

// Chart.js - grafic bare produse
let chart;
function actualizeazaGrafic() {
    const labels = produse.map(p => p.nume);
    const data = produse.map(p => p.cost);

    // Array de culori - poți adăuga mai multe culori dacă vrei
    const culori = [
        'rgba(255, 99, 132, 0.7)',    // roșu
        'rgba(54, 162, 235, 0.7)',    // albastru
        'rgba(255, 206, 86, 0.7)',    // galben
        'rgba(75, 192, 192, 0.7)',    // verde deschis
        'rgba(153, 102, 255, 0.7)',   // mov
        'rgba(255, 159, 64, 0.7)',    // portocaliu
        'rgba(199, 199, 199, 0.7)',   // gri
        'rgba(255, 99, 255, 0.7)',    // roz
    ];

    // Construim array culori pentru bare, repetând culorile dacă e nevoie
    const backgroundColors = data.map((_, index) => culori[index % culori.length]);
    const borderColors = backgroundColors.map(c => c.replace('0.7', '1'));



    const ctx = document.getElementById('grafic').getContext('2d');

    if (chart) chart.destroy();

    const shadowPlugin = {
        id: 'shadowPlugin',
        beforeDraw: (chart) => {
            const ctx = chart.ctx;
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'; // 🔹 culoare umbră
            ctx.shadowBlur = 10; // 🔹 cât de difuză e umbra
            ctx.shadowOffsetX = 3; // 🔹 deplasare pe orizontală
            ctx.shadowOffsetY = 3; // 🔹 deplasare pe verticală
        },
        afterDraw: (chart) => {
            chart.ctx.restore();
        }
    };


    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cost produs (lei)',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
                borderRadius: 8 // 🔹 rotunjire colțuri
            }]

        },
        options: {
            plugins: {
                legend: {
                    display: false // 🔹 Ascunde legenda
                },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    formatter: (value) => value.toFixed(2) + ' lei',
                    font: {
                        weight: 'bold',
                        size: 14 // 🔹 dimensiune mai mare
                    },
                    color: (context) => {
                        return context.dataset.backgroundColor[context.dataIndex];
                    },
                    textStrokeColor: '#fff',  // 🔹 contur alb
                    textStrokeWidth: 3        // grosimea conturului
                }


            },
            scales: {
                y: { beginAtZero: true }
            },
            animation: {
                duration: 1200, // 🔹 timp în milisecunde (1.2 secunde)
                easing: 'easeOutBounce' // 🔹 efect de „săritură” la final
            }

        },
        plugins: [ChartDataLabels, shadowPlugin] // 🔹 Activăm pluginul
    });


}


function salveazaDate() {
    localStorage.setItem('listaProduse', JSON.stringify(produse));
}

function incarcaDate() {
    const dateSalvate = localStorage.getItem('listaProduse');
    if (dateSalvate) {
        produse = JSON.parse(dateSalvate);
        afiseazaProduse();
        actualizeazaTotal();
        actualizeazaGrafic();
    }
}

incarcaDate();
