// Standaard data als er niks in LocalStorage staat
const defaultObservations = [
  { day: "MON 5 OCT", time: "2AM", text: "5 PEOPLE WALKING NORTH TO SOUTH YELLING AND SINGING LOUD" },
  { day: "TUE 6 OCT", time: "10PM", text: "1 PERSON WALKING SOUTH TO NORTH STOPPED TO TIE SHOES" },
  { day: "WED 7 OCT", time: "8PM", text: "WALKING WITH LOUD MUSIC WEARING A RED HOODIE A SHORT AND SLIPPERS" },
  { day: "THU 8 OCT", time: "1AM", text: "2 PEOPLE IN A HEATED ARGUMENT DRUNK WALKING IN THE MIDDLE OF THE ROAD" }
];

// Ophalen uit LocalStorage of standaard instellen
let observations = JSON.parse(localStorage.getItem("street_observations")) || defaultObservations;

document.addEventListener("DOMContentLoaded", () => {

  // 1. HAMBURGER MENU CONTROLS
  const menuToggle = document.getElementById("menu-toggle");
  const navDrawer = document.getElementById("nav-drawer");
  const closeDrawer = document.getElementById("close-drawer");

  if (menuToggle && navDrawer) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      navDrawer.classList.toggle("open");
    });
  }

  if (closeDrawer && navDrawer) {
    closeDrawer.addEventListener("click", () => {
      navDrawer.classList.remove("open");
    });
  }

  document.addEventListener("click", (e) => {
    if (navDrawer && navDrawer.classList.contains("open")) {
      if (!navDrawer.contains(e.target) && !menuToggle.contains(e.target)) {
        navDrawer.classList.remove("open");
      }
    }
  });

  // 2. TYPOGRAPHY CANVAS & DYNAMISCHE SCHALING
  const container = document.getElementById("log-display");
  const toggleStyleBtn = document.getElementById("toggle-style");
  const toggleDriftBtn = document.getElementById("toggle-drift");
  const toggleModalBtn = document.getElementById("toggle-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const modal = document.getElementById("observation-modal");
  const form = document.getElementById("add-log-form");

  // Info Modal Elements
  const infoModal = document.getElementById("info-modal");
  const infoTime = document.getElementById("info-time");
  const infoText = document.getElementById("info-text");
  const closeInfoModalBtn = document.getElementById("close-info-modal");

  if (container) {
    function renderLogs() {
      container.innerHTML = "";

      // Bereken dynamische lettergrootte op basis van het aantal regels
      const totalRows = observations.length;
      // Schaal lettergrootte tussen 1.2rem en 5.5rem op basis van de hoeveelheid regels
      const calculatedFontSize = Math.max(1.2, Math.min(5.5, 45 / totalRows));

      observations.forEach(item => {
        const fullText = `${item.day} ${item.time} ${item.text}`;
        const words = fullText.split(" ");

        const row = document.createElement("div");
        row.className = "log-row";

        words.forEach(word => {
          const span = document.createElement("span");
          span.className = "log-word";
          span.style.setProperty("--dynamic-font-size", `${calculatedFontSize}rem`);
          span.textContent = word;

          // Klik op tekst voor extra informatie
          span.addEventListener("click", () => {
            if (infoModal) {
              infoTime.textContent = `${item.day} — ${item.time}`;
              infoText.textContent = item.text;
              infoModal.classList.remove("hidden");
            }
          });

          row.appendChild(span);
        });

        container.appendChild(row);
      });
    }

    // Toggle Outline vs Solid
    if (toggleStyleBtn) {
      toggleStyleBtn.addEventListener("click", () => {
        document.body.classList.toggle("solid-style");
        toggleStyleBtn.classList.toggle("active-mode");
      });
    }

    // Toggle Animation (Drift)
    if (toggleDriftBtn) {
      toggleDriftBtn.addEventListener("click", () => {
        document.body.classList.toggle("drift-mode");
        toggleDriftBtn.classList.toggle("active-mode");
      });
    }

    // Modal Add Observation
    if (toggleModalBtn && modal) {
      toggleModalBtn.addEventListener("click", () => {
        modal.classList.remove("hidden");
      });
    }

    if (closeModalBtn && modal) {
      closeModalBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
      });
    }

    // Close Info Modal
    if (closeInfoModalBtn && infoModal) {
      closeInfoModalBtn.addEventListener("click", () => {
        infoModal.classList.add("hidden");
      });
    }

    // Form submission & opslaan in LocalStorage
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const day = document.getElementById("input-day").value;
        const time = document.getElementById("input-time").value;
        const text = document.getElementById("input-text").value;

        // Toevoegen aan lijst
        observations.push({ day, time, text });

        // Opslaan in browsergeheugen
        localStorage.setItem("street_observations", JSON.stringify(observations));

        // Opnieuw renderen met verkleinde tekst
        renderLogs();

        form.reset();
        modal.classList.add("hidden");
      });
    }

    renderLogs();
  }

  // 3. LIGHTBOX FOR PHOTOS
  const photoCards = document.querySelectorAll(".photo-card");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const closeLightbox = document.getElementById("close-lightbox");

  if (lightbox) {
    photoCards.forEach(card => {
      card.addEventListener("click", () => {
        const img = card.querySelector("img");
        const date = card.getAttribute("data-date");
        const desc = card.getAttribute("data-desc");

        lightboxImg.src = img.src;
        lightboxCaption.textContent = `${date} — ${desc}`;
        lightbox.classList.remove("hidden");
      });
    });

    if (closeLightbox) {
      closeLightbox.addEventListener("click", () => {
        lightbox.classList.add("hidden");
      });
    }

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        lightbox.classList.add("hidden");
      }
    });
  }
});
