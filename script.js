// Initial dataset based on prompt image and user concept
const initialObservations = [
    {
        id: '1',
        day: 'MON',
        date: '5 OCT',
        time: '2AM',
        people: '5 PEOPLE WALKING NORTH TO SOUTH',
        details: 'YELLING AND SINGING LOUD',
        sizeClass: 'dynamic-text-lg'
    },
    {
        id: '2',
        day: 'TUE',
        date: '6 OCT',
        time: '10PM',
        people: '1 PERSON WALKING SOUTH TO NORTH',
        details: 'STOPPED TO TIE SHOE',
        sizeClass: 'dynamic-text-md'
    },
    {
        id: '3',
        day: 'WED',
        date: '7 OCT',
        time: '8PM',
        people: 'WALKING WITH LOUD MUSIC',
        details: 'WEARING A RED HOODIE, A SHORT AND SLIPPERS',
        sizeClass: 'dynamic-text-md'
    },
    {
        id: '4',
        day: 'THU',
        date: '8 OCT',
        time: '1AM',
        people: '2 PEOPLE IN A HEATED ARGUMENT',
        details: 'DRUNK WALKING IN THE MIDDLE OF THE ROAD',
        sizeClass: 'dynamic-text-lg'
    }
];

let observations = [...initialObservations];
let isSolidMode = false;
let isDriftMode = false;
let isBeamerMode = false;

// DOM elements
const observationGrid = document.getElementById('observationGrid');
const searchInput = document.getElementById('searchInput');
const logCount = document.getElementById('logCount');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const canvasContainer = document.getElementById('canvasContainer');

function renderObservations(filteredData = observations) {
    observationGrid.innerHTML = '';
    logCount.textContent = filteredData.length;

    if (filteredData.length === 0) {
        observationGrid.innerHTML = `
            <div class="py-20 text-center font-mono text-gray-600 uppercase tracking-widest text-lg">
                No street observations found matching search query
            </div>
        `;
        return;
    }

    filteredData.forEach((item) => {
        const lineElement = document.createElement('div');
        lineElement.className = `log-line ${item.sizeClass} text-outline cursor-pointer`;
        lineElement.dataset.id = item.id;

        // Split string into words to allow word-by-word hover interaction
        const fullText = `${item.day} ${item.date} ${item.time} ${item.people} ${item.details}`;
        const words = fullText.split(' ');

        const wordsHTML = words.map(word => `<span class="inline-block transition-transform duration-150 hover:text-white hover:scale-105 px-1">${word}</span>`).join(' ');

        lineElement.innerHTML = wordsHTML;

        // Click event to view entry details
        lineElement.addEventListener('click', () => {
            lineElement.classList.add('glitch-flash');
            setTimeout(() => lineElement.classList.remove('glitch-flash'), 400);

            openDetailModal(item);
        });

        observationGrid.appendChild(lineElement);
    });
}

function openDetailModal(item) {
    document.getElementById('detailTimestamp').textContent = `${item.day} ${item.date} @ ${item.time}`;
    document.getElementById('detailContent').textContent = `${item.people} ${item.details}`;
    document.getElementById('detailScaleLabel').textContent = item.sizeClass.toUpperCase();
    document.getElementById('detailModal').classList.remove('hidden');
}

document.getElementById('closeDetailModalBtn').addEventListener('click', () => {
    document.getElementById('detailModal').classList.add('hidden');
});

searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query === '') {
        renderObservations(observations);
        resetFilterBtn.classList.add('hidden');
    } else {
        const filtered = observations.filter(item => {
            const text = `${item.day} ${item.date} ${item.time} ${item.people} ${item.details}`.toLowerCase();
            return text.includes(query);
        });
        renderObservations(filtered);
        resetFilterBtn.classList.remove('hidden');
    }
});

resetFilterBtn.addEventListener('click', () => {
    searchInput.value = '';
    renderObservations(observations);
    resetFilterBtn.classList.add('hidden');
});

const toggleOutlineBtn = document.getElementById('toggleOutlineBtn');
const modeLabel = document.getElementById('modeLabel');

toggleOutlineBtn.addEventListener('click', () => {
    isSolidMode = !isSolidMode;
    if (isSolidMode) {
        document.body.classList.add('mode-solid');
        modeLabel.textContent = 'SOLID BOLD';
        modeLabel.className = 'text-green-400';
    } else {
        document.body.classList.remove('mode-solid');
        modeLabel.textContent = 'OUTLINE';
        modeLabel.className = 'text-red-500';
    }
});

const toggleDriftBtn = document.getElementById('toggleDriftBtn');
const driftLabel = document.getElementById('driftLabel');

toggleDriftBtn.addEventListener('click', () => {
    isDriftMode = !isDriftMode;
    if (isDriftMode) {
        canvasContainer.classList.add('animated-drift');
        driftLabel.textContent = 'ACTIVE';
        driftLabel.className = 'text-green-400';
    } else {
        canvasContainer.classList.remove('animated-drift');
        driftLabel.textContent = 'OFF';
        driftLabel.className = 'text-gray-500';
    }
});

const toggleBeamerBtn = document.getElementById('toggleBeamerBtn');
const beamerLabel = document.getElementById('beamerLabel');

toggleBeamerBtn.addEventListener('click', () => {
    isBeamerMode = !isBeamerMode;
    if (isBeamerMode) {
        document.body.classList.add('beamer-mode');
        beamerLabel.textContent = 'NORMAL VIEW';
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
    } else {
        document.body.classList.remove('beamer-mode');
        beamerLabel.textContent = 'BEAMER MODE';
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
    }
});

const addModal = document.getElementById('addModal');
const openAddModalBtn = document.getElementById('openAddModalBtn');
const closeAddModalBtn = document.getElementById('closeAddModalBtn');
const cancelAddModalBtn = document.getElementById('cancelAddModalBtn');
const addLogForm = document.getElementById('addLogForm');

function openModal() { addModal.classList.remove('hidden'); }
function closeModal() { addModal.classList.add('hidden'); }

openAddModalBtn.addEventListener('click', openModal);
closeAddModalBtn.addEventListener('click', closeModal);
cancelAddModalBtn.addEventListener('click', closeModal);

addLogForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newEntry = {
        id: Date.now().toString(),
        day: document.getElementById('inputDay').value.toUpperCase(),
        date: '',
        time: document.getElementById('inputTime').value.toUpperCase(),
        people: document.getElementById('inputPeople').value.toUpperCase(),
        details: document.getElementById('inputDetails').value.toUpperCase(),
        sizeClass: document.getElementById('inputScale').value
    };

    observations.unshift(newEntry);
    renderObservations(observations);
    addLogForm.reset();
    closeModal();
});

function updateClock() {
    const now = new Date();
    const timeString = now.toUTCString().split(' ')[4] + ' UTC';
    document.getElementById('currentTime').textContent = timeString;
}
setInterval(updateClock, 1000);
updateClock();

// Initial Initialization
window.addEventListener('DOMContentLoaded', () => {
    renderObservations();
});
