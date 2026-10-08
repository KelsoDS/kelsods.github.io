const defaultObservations = [
  { day: "MON 5 OCT", time: "2AM", text: "5 PEOPLE WALKING NORTH TO SOUTH YELLING AND SINGING LOUD" },
  { day: "TUE 6 OCT", time: "10PM", text: "1 PERSON WALKING SOUTH TO NORTH STOPPED TO TIE SHOES" },
  { day: "WED 7 OCT", time: "8PM", text: "WALKING WITH LOUD MUSIC WEARING A RED HOODIE A SHORT AND SLIPPERS" },
  { day: "THU 8 OCT", time: "1AM", text: "2 PEOPLE IN A HEATED ARGUMENT DRUNK WALKING IN THE MIDDLE OF THE ROAD" }
];

let observations = JSON.parse(localStorage.getItem("street_observations")) || defaultObservations;
let selectedObservationIndex = null;

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

  // 2. TYPOGRAPHY RENDER & MODAL CONTROLS
  const container = document.getElementById("log-display");
  const toggleStyleBtn = document.getElementById("toggle-style");
  const toggleDriftBtn = document.getElementById("toggle-drift");
  const toggleModalBtn = document.getElementById("toggle-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const modal = document.getElementById("observation-modal");
  const form = document.getElementById("add-log-form");

  // Delete Modal Elementen
  const toggleDeleteModalBtn = document.getElementById("toggle-delete-modal");
  const closeDeleteModalBtn = document.getElementById("close-delete-modal");
  const deleteModal = document.getElementById("delete-modal");
  const deleteList = document.getElementById("delete-list");

  // Info Modal Elementen
  const infoModal = document.getElementById("info-modal");
  const infoTime = document.getElementById("info-time");
  const infoText = document.getElementById("info-text");
  const closeInfoModalBtn = document.getElementById("close-info-modal");
  const deleteCurrentInfoBtn = document.getElementById("delete-current-info");

  if (container) {
    function renderLogs() {
      container.innerHTML = "";

      const totalRows = observations.length;
      
      if (totalRows === 0) {
        container.innerHTML = `<div style="font-family: monospace; color: #555; text-align: center; margin-top: 20vh;">GEEN OBSERVATIES MEER BESCHIKBAAR. VOEG NIEUWE OBSERVATIES TOE VIA "+ ADD OBS".</div>`;
        return;
      }

      // Dynamische schaling op basis van aantal rijen
      const baseFontSize = Math.max(1, Math.min(6, (70 / totalRows) / 2));

      observations.forEach((item, index) => {
        const fullText = `${item.day} ${item.time} ${item.text}`;
        const words = fullText.split(" ");

        const row = document.createElement("div");
        row.className = "log-row";

        words.forEach(word => {
          const span = document.createElement("span");
          span.className = "log-word";
          span.style.setProperty("--dynamic-font-size", `${baseFontSize}vh`);
          span.textContent = word;

          // Bij klikken op een woord: sla de index op en toon de info modal
          span.addEventListener("click", () => {
            if (infoModal) {
              selectedObservationIndex = index;
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

    // Functie voor het vullen van de Delete Lijst in de Modal
    function renderDeleteList() {
      if (!deleteList) return;
      deleteList.innerHTML = "";

      if (observations.length === 0) {
        deleteList.innerHTML = `<div style="font-family: monospace; color: #666;">Geen items om te verwijderen.</div>`;
        return;
      }

      observations.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "delete-item";

        div.innerHTML = `
          <div class="delete-item-info">
            <strong>${item.day} ${item.time}:</strong> ${item.text}
          </div>
          <button class="btn-delete-action" data-index="${index}">VERWIJDER</button>
        `;

        deleteList.appendChild(div);
      });

      // Event Listeners voor knoppen in de delete-modal lijst
      document.querySelectorAll(".btn-delete-action").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = parseInt(e.target.getAttribute("data-index"));
          deleteObservation(idx);
          renderDeleteList();
        });
      });
    }

    // Centrale functie om een observatie te verwijderen
    function deleteObservation(index) {
      if (index !== null && index >= 0 && index < observations.length) {
        observations.splice(index, 1);
        localStorage.setItem("street_observations", JSON.stringify(observations));
        renderLogs();
      }
    }

    // Verwijderknop IN de Info Modal
    if (deleteCurrentInfoBtn) {
      deleteCurrentInfoBtn.addEventListener("click", () => {
        if (selectedObservationIndex !== null) {
          deleteObservation(selectedObservationIndex);
          selectedObservationIndex = null;
          if (infoModal) infoModal.classList.add("hidden");
        }
      });
    }

    // Toggle Modus Knoppen
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

    // Add Modal Controls
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

    // Delete Modal Controls
    if (toggleDeleteModalBtn && deleteModal) {
      toggleDeleteModalBtn.addEventListener("click", () => {
        renderDeleteList();
        deleteModal.classList.remove("hidden");
      });
    }

    if (closeDeleteModalBtn && deleteModal) {
      closeDeleteModalBtn.addEventListener("click", () => {
        deleteModal.classList.add("hidden");
      });
    }

    // Info Modal Controls
    if (closeInfoModalBtn && infoModal) {
      closeInfoModalBtn.addEventListener("click", () => {
        infoModal.classList.add("hidden");
        selectedObservationIndex = null;
      });
    }

    // Formulier Indienen (Add Observation)
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

    window.addEventListener("resize", renderLogs);

    renderLogs();
  }
});
