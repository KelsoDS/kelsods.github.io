const defaultObservations = [
  { day: "MON 5 OCT", time: "2AM", text: "5 PEOPLE WALKING NORTH TO SOUTH YELLING AND SINGING LOUD" },
  { day: "TUE 6 OCT", time: "10PM", text: "1 PERSON WALKING SOUTH TO NORTH STOPPED TO TIE SHOES" },
  { day: "WED 7 OCT", time: "8PM", text: "WALKING WITH LOUD MUSIC WEARING A RED HOODIE A SHORT AND SLIPPERS" },
  { day: "THU 8 OCT", time: "1AM", text: "2 PEOPLE IN A HEATED ARGUMENT DRUNK WALKING IN THE MIDDLE OF THE ROAD" }
];

let observations = JSON.parse(localStorage.getItem("street_observations")) || defaultObservations;

document.addEventListener("DOMContentLoaded", () => {

  // 1. HAMBURGER MENU CONTROLS
  const menuToggle = document.getElementById("menu-toggle");
  const navDrawer = document.getElementById("nav-drawer");
  const closeDrawer = document.getElementById("close-drawer");

  if (navDrawer) {
    navDrawer.classList.remove("open");
  }

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

  // 2. TYPOGRAPHY CANVAS WITH AUTO-SCALING TO FIT SCREEN EXACTLY
  const container = document.getElementById("log-display");
  const toggleStyleBtn = document.getElementById("toggle-style");
  const toggleDriftBtn = document.getElementById("toggle-drift");
  const toggleModalBtn = document.getElementById("toggle-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const modal = document.getElementById("observation-modal");
  const form = document.getElementById("add-log-form");

  const infoModal = document.getElementById("info-modal");
  const infoTime = document.getElementById("info-time");
  const infoText = document.getElementById("info-text");
  const closeInfoModalBtn = document.getElementById("close-info-modal");

  if (container) {
    function fitTextToScreen() {
      // Start met een grote lettergrootte (px)
      let fontSize = 90; 
      container.style.fontSize = `${fontSize}px`;

      const maxHeight = container.clientHeight;
      const maxWidth = container.clientWidth;

      // Verklein de lettergrootte stapsgewijs zolang de tekst de hoogte of breedte overschrijdt
      while ((container.scrollHeight > maxHeight || container.scrollWidth > maxWidth) && fontSize > 8) {
        fontSize -= 1;
        container.style.fontSize = `${fontSize}px`;
      }
    }

    function renderLogs() {
      container.innerHTML = "";

      observations.forEach(item => {
        const fullText = `${item.day} ${item.time} ${item.text}`;
        const words = fullText.split(" ");

        words.forEach(word => {
          const span = document.createElement("span");
          span.className = "log-word";
          span.textContent = word;

          span.addEventListener("click", () => {
            if (infoModal) {
              infoTime.textContent = `${item.day} — ${item.time}`;
              infoText.textContent = item.text;
              infoModal.classList.remove("hidden");
            }
          });

          container.appendChild(span);
        });
      });

      // Schaal de tekst direct na het renderen zodat het op het scherm past
      fitTextToScreen();
    }

    if (toggleStyleBtn) {
      toggleStyleBtn.addEventListener("click", () => {
        document.body.classList.toggle("solid-style");
        toggleStyleBtn.classList.toggle("active-mode");
      });
    }

    if (toggleDriftBtn) {
      toggleDriftBtn.addEventListener("click", () => {
        document.body.classList.toggle("drift-mode");
        toggleDriftBtn.classList.toggle("active-mode");
      });
    }

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

    if (closeInfoModalBtn && infoModal) {
      closeInfoModalBtn.addEventListener("click", () => {
        infoModal.classList.add("hidden");
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const day = document.getElementById("input-day").value;
        const time = document.getElementById("input-time").value;
        const text = document.getElementById("input-text").value;

        observations.push({ day, time, text });
        localStorage.setItem("street_observations", JSON.stringify(observations));

        renderLogs();
        form.reset();
        modal.classList.add("hidden");
      });
    }

    // Herbereken de schaal bij schermformaat-wijzigingen
    window.addEventListener("resize", fitTextToScreen);

    renderLogs();
  }
});
