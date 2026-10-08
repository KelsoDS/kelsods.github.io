const defaultObservations = [
  { day: "MON 5 OCT", time: "2AM", text: "5 PEOPLE WALKING NORTH TO SOUTH YELLING AND SINGING LOUD" },
  { day: "TUE 6 OCT", time: "10PM", text: "1 PERSON WALKING SOUTH TO NORTH STOPPED TO TIE SHOES" },
  { day: "WED 7 OCT", time: "8PM", text: "WALKING WITH LOUD MUSIC WEARING A RED HOODIE AND SLIPPERS" },
  { day: "THU 8 OCT", time: "1AM", text: "2 PEOPLE IN A HEATED ARGUMENT DRUNK WALKING IN THE MIDDLE OF ROAD" }
];

// Load dataset
let observations = JSON.parse(localStorage.getItem("street_observations_v4")) || defaultObservations;
let selectedObservationIndex = null;

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const navDrawer = document.getElementById("nav-drawer");
  const closeDrawer = document.getElementById("close-drawer");
  const drawerOverlay = document.getElementById("drawer-overlay");

  function openMenu() {
    if (navDrawer) navDrawer.classList.add("open");
    if (drawerOverlay) drawerOverlay.classList.add("active");
  }

  function closeMenu() {
    if (navDrawer) navDrawer.classList.remove("open");
    if (drawerOverlay) drawerOverlay.classList.remove("active");
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      openMenu();
    });
  }

  if (closeDrawer) closeDrawer.addEventListener("click", closeMenu);
  if (drawerOverlay) drawerOverlay.addEventListener("click", closeMenu);

  const container = document.getElementById("log-display");
  const drawerLogCount = document.getElementById("drawer-log-count");

  const toggleStyleBtn = document.getElementById("toggle-style");
  const toggleDriftBtn = document.getElementById("toggle-drift");

  const toggleAddModalBtn = document.getElementById("toggle-modal");
  const closeAddModalBtn = document.getElementById("close-modal");
  const addModal = document.getElementById("observation-modal");
  const addForm = document.getElementById("add-log-form");

  const infoModal = document.getElementById("info-modal");
  const infoTime = document.getElementById("info-time");
  const infoText = document.getElementById("info-text");
  const closeInfoModalBtn = document.getElementById("close-info-modal");
  const deleteCurrentInfoBtn = document.getElementById("delete-current-info");

  function renderLogs() {
    if (!container) return;
    container.innerHTML = "";

    if (drawerLogCount) {
      drawerLogCount.textContent = observations.length;
    }

    const totalRows = observations.length;

    if (totalRows === 0) {
      container.innerHTML = `
        <div style="font-family: monospace; color: #555; text-align: center; margin: auto; font-size: 0.9rem; letter-spacing: 1px;">
          GEEN OBSERVATIES BESCHIKBAAR.<br>KLIK OP "+ ADD OBS" OM EEN NIEUWE OBSERVATIE TOE TE VOEGEN.
        </div>`;
      return;
    }

    // Calculate dynamic base font-size based on screen height and number of entries
    const baseFontSize = Math.max(1.2, Math.min(6.5, (70 / totalRows) / 2));

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

        // Clicking any word shows the info modal with delete button
        span.addEventListener("click", () => {
          selectedObservationIndex = index;
          if (infoTime) infoTime.textContent = `${item.day} — ${item.time}`;
          if (infoText) infoText.textContent = item.text;
          if (infoModal) infoModal.classList.remove("hidden");
        });

        row.appendChild(span);
      });

      container.appendChild(row);
    });
  }

  function deleteObservation(index) {
    if (index !== null && index >= 0 && index < observations.length) {
      observations.splice(index, 1);
      localStorage.setItem("street_observations_v4", JSON.stringify(observations));
      renderLogs();
    }
  }

  if (deleteCurrentInfoBtn) {
    deleteCurrentInfoBtn.addEventListener("click", () => {
      if (selectedObservationIndex !== null) {
        deleteObservation(selectedObservationIndex);
        selectedObservationIndex = null;
        if (infoModal) infoModal.classList.add("hidden");
      }
    });
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

  if (toggleAddModalBtn && addModal) {
    toggleAddModalBtn.addEventListener("click", () => {
      addModal.classList.remove("hidden");
    });
  }

  if (closeAddModalBtn && addModal) {
    closeAddModalBtn.addEventListener("click", () => {
      addModal.classList.add("hidden");
    });
  }

  if (closeInfoModalBtn && infoModal) {
    closeInfoModalBtn.addEventListener("click", () => {
      infoModal.classList.add("hidden");
      selectedObservationIndex = null;
    });
  }

  if (addForm) {
    addForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const day = document.getElementById("input-day").value.trim().toUpperCase();
      const time = document.getElementById("input-time").value.trim().toUpperCase();
      const text = document.getElementById("input-text").value.trim().toUpperCase();

      if (day && time && text) {
        observations.push({ day, time, text });
        localStorage.setItem("street_observations_v4", JSON.stringify(observations));

        renderLogs();
        addForm.reset();
        if (addModal) addModal.classList.add("hidden");
      }
    });
  }

  // Auto recalculate layout on window resize
  window.addEventListener("resize", renderLogs);

  // Initial draw
  renderLogs();
});
