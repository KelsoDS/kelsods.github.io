// Initial Dataset
const defaultObservations = [
  { day: "MON 5 OCT", time: "2AM", text: "5 PEOPLE WALKING NORTH TO SOUTH YELLING AND SINGING LOUD" },
  { day: "TUE 6 OCT", time: "10PM", text: "1 PERSON WALKING SOUTH TO NORTH STOPPED TO TIE SHOES" },
  { day: "WED 7 OCT", time: "8PM", text: "WALKING WITH LOUD MUSIC WEARING A RED HOODIE AND SLIPPERS" },
  { day: "THU 8 OCT", time: "1AM", text: "2 PEOPLE IN A HEATED ARGUMENT DRUNK IN THE MIDDLE OF ROAD" }
];

// Load from LocalStorage or Default
let observations = JSON.parse(localStorage.getItem("street_observations_v3")) || defaultObservations;

// DOM References
const menuToggle = document.getElementById("menu-toggle");
const navDrawer = document.getElementById("nav-drawer");
const closeDrawer = document.getElementById("close-drawer");
const drawerOverlay = document.getElementById("drawer-overlay");

const viewTypo = document.getElementById("view-typography");
const viewPhotos = document.getElementById("view-photos");
const viewTypoBtn = document.getElementById("view-typo-btn");
const viewPhotosBtn = document.getElementById("view-photos-btn");
const navTypo = document.getElementById("nav-typo");
const navPhotos = document.getElementById("nav-photos");

const toggleStyleBtn = document.getElementById("toggle-style");
const toggleDriftBtn = document.getElementById("toggle-drift");

const openAddModalBtn = document.getElementById("open-add-modal");
const closeAddModalBtn = document.getElementById("close-add-modal");
const addModal = document.getElementById("add-modal");
const addLogForm = document.getElementById("add-log-form");

const detailModal = document.getElementById("detail-modal");
const closeDetailModalBtn = document.getElementById("close-detail-modal");
const detailTimestamp = document.getElementById("detail-timestamp");
const detailText = document.getElementById("detail-text");

const drawerLogCount = document.getElementById("drawer-log-count");

// Drawer Menu Logic
function openMenu() {
  navDrawer.classList.add("open");
  drawerOverlay.classList.add("active");
}

function closeMenu() {
  navDrawer.classList.remove("open");
  drawerOverlay.classList.remove("active");
}

menuToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  openMenu();
});

closeDrawer.addEventListener("click", closeMenu);
drawerOverlay.addEventListener("click", closeMenu);

// View Switching Logic
function switchView(view) {
  closeMenu();
  if (view === 'typo') {
    viewTypo.classList.remove("hidden");
    viewPhotos.classList.add("hidden");

    viewTypoBtn.className = "px-3 py-1 font-mono text-xs font-bold rounded bg-white text-black transition-all";
    viewPhotosBtn.className = "px-3 py-1 font-mono text-xs font-bold text-neutral-400 hover:text-white transition-all";

    navTypo.className = "text-red-500 font-bold hover:text-red-400 transition-colors flex items-center gap-2";
    navPhotos.className = "text-neutral-400 hover:text-white transition-colors flex items-center gap-2";

    renderTypographyCanvas();
  } else {
    viewTypo.classList.add("hidden");
    viewPhotos.classList.remove("hidden");

    viewPhotosBtn.className = "px-3 py-1 font-mono text-xs font-bold rounded bg-white text-black transition-all";
    viewTypoBtn.className = "px-3 py-1 font-mono text-xs font-bold text-neutral-400 hover:text-white transition-all";

    navPhotos.className = "text-red-500 font-bold hover:text-red-400 transition-colors flex items-center gap-2";
    navTypo.className = "text-neutral-400 hover:text-white transition-colors flex items-center gap-2";

    renderPhotoGallery();
  }
}

viewTypoBtn.addEventListener("click", () => switchView('typo'));
viewPhotosBtn.addEventListener("click", () => switchView('photos'));
navTypo.addEventListener("click", () => switchView('typo'));
navPhotos.addEventListener("click", () => switchView('photos'));

// Toggle Modes
toggleStyleBtn.addEventListener("click", () => {
  document.body.classList.toggle("solid-style");
  toggleStyleBtn.classList.toggle("bg-white");
  toggleStyleBtn.classList.toggle("text-black");
});

toggleDriftBtn.addEventListener("click", () => {
  document.body.classList.toggle("drift-mode");
  toggleDriftBtn.classList.toggle("bg-white");
  toggleDriftBtn.classList.toggle("text-black");
});

function renderTypographyCanvas() {
  viewTypo.innerHTML = "";
  drawerLogCount.textContent = observations.length;

  if (observations.length === 0) {
    viewTypo.innerHTML = `<div class="m-auto font-mono text-neutral-600">NO OBSERVATIONS LOGGED</div>`;
    return;
  }

  // Collect all words into a single continuous stream
  const allWords = [];
  observations.forEach(item => {
    const words = `${item.day} ${item.time} ${item.text}`.split(" ");
    words.forEach(w => {
      allWords.push({ word: w, item: item });
    });
  });

  // Compute font size so all words fit exactly inside viewport dimensions
  const totalWords = allWords.length;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight - 60;
  
  // Dynamic calculation: estimates optimal font size to fill the viewport
  const area = screenWidth * screenHeight;
  const estimatedFontSize = Math.sqrt(area / (totalWords * 2.2));
  const finalFontSizePx = Math.max(16, Math.min(estimatedFontSize, screenHeight * 0.18));

  allWords.forEach(({ word, item }) => {
    const span = document.createElement("span");
    span.className = "log-word";
    span.style.fontSize = `${finalFontSizePx}px`;
    span.style.setProperty("--word-font-size", `${finalFontSizePx}px`);
    span.textContent = word;

    // Click on any word shows detailed log modal
    span.addEventListener("click", () => {
      detailTimestamp.textContent = `${item.day} — ${item.time}`;
      detailText.textContent = item.text;
      detailModal.classList.remove("hidden");
    });

    viewTypo.appendChild(span);
  });
}

// Auto-recalculate font size on window resize
window.addEventListener("resize", () => {
  if (!viewTypo.classList.contains("hidden")) {
    renderTypographyCanvas();
  }
});

function renderPhotoGallery() {
  const grid = document.getElementById("photo-grid");
  grid.innerHTML = "";

  observations.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "group relative bg-neutral-900 border border-neutral-800 rounded overflow-hidden aspect-[4/5] cursor-pointer hover:border-red-500 transition-all";
    
    card.innerHTML = `
      <img src="https://picsum.photos/600/750?random=${index + 12}" alt="Street Observation" class="w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 transition-all duration-500">
      <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 flex flex-col justify-end">
        <span class="font-mono text-[10px] text-red-500 font-bold uppercase tracking-wider">${item.day} — ${item.time}</span>
        <p class="font-sans font-bold text-sm text-white line-clamp-2 uppercase leading-snug mt-1">${item.text}</p>
      </div>
    `;

    card.addEventListener("click", () => {
      detailTimestamp.textContent = `${item.day} — ${item.time}`;
      detailText.textContent = item.text;
      detailModal.classList.remove("hidden");
    });

    grid.appendChild(card);
  });
}

// Modal Handling
openAddModalBtn.addEventListener("click", () => addModal.classList.remove("hidden"));
closeAddModalBtn.addEventListener("click", () => addModal.classList.add("hidden"));

addLogForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const day = document.getElementById("input-day").value.toUpperCase();
  const time = document.getElementById("input-time").value.toUpperCase();
  const text = document.getElementById("input-text").value.toUpperCase();

  observations.push({ day, time, text });
  localStorage.setItem("street_observations_v3", JSON.stringify(observations));

  addLogForm.reset();
  addModal.classList.add("hidden");

  renderTypographyCanvas();
});

closeDetailModalBtn.addEventListener("click", () => detailModal.classList.add("hidden"));
detailModal.addEventListener("click", (e) => {
  if (e.target === detailModal) detailModal.classList.add("hidden");
});

window.addEventListener("DOMContentLoaded", () => {
  renderTypographyCanvas();
});
