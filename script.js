// Initiele Observatiedata
const observations = [
  { day: "MON 5 OCT", time: "2AM", text: "5 PEOPLE WALKING NORTH TO SOUTH YELLING AND SINGING LOUD" },
  { day: "TUE 6 OCT", time: "10PM", text: "1 PERSON WALKING SOUTH TO NORTH STOPPED TO TIE SHOES" },
  { day: "WED 7 OCT", time: "8PM", text: "WALKING WITH LOUD MUSIC WEARING A RED HOODIE A SHORT AND SLIPPERS" },
  { day: "THU 8 OCT", time: "1AM", text: "2 PEOPLE IN A HEATED ARGUMENT DRUNK WALKING IN THE MIDDLE OF THE ROAD" }
];

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("log-display");
  const toggleStyleBtn = document.getElementById("toggle-style");
  const toggleDriftBtn = document.getElementById("toggle-drift");
  const toggleModalBtn = document.getElementById("toggle-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const modal = document.getElementById("observation-modal");
  const form = document.getElementById("add-log-form");

  // Functie om de observaties op het scherm te tekenen
  function renderLogs() {
    container.innerHTML = ""; // Maak leeg

    observations.forEach(item => {
      // Voeg dag & tijd samen met de observatietekst
      const fullText = `${item.day} ${item.time} ${item.text}`;
      const words = fullText.split(" ");

      const row = document.createElement("div");
      row.className = "log-row";

      words.forEach(word => {
        const span = document.createElement("span");
        span.className = "log-word";
        span.textContent = word;
        row.appendChild(span);
      });

      container.appendChild(row);
    });
  }

  // Toggle Contour / Gevulde letters
  toggleStyleBtn.addEventListener("click", () => {
    document.body.classList.toggle("solid-style");
  });

  // Toggle Projectie Beweging
  toggleDriftBtn.addEventListener("click", () => {
    document.body.classList.toggle("drift-mode");
  });

  // Modal Openen & Sluiten
  toggleModalBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  closeModalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Nieuwe observatie opslaan
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const day = document.getElementById("input-day").value;
    const time = document.getElementById("input-time").value;
    const text = document.getElementById("input-text").value;

    observations.push({ day, time, text });
    renderLogs();

    form.reset();
    modal.classList.add("hidden");
  });

  // Eerste keer laden
  renderLogs();
});
