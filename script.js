const defaultObservations = [
  { day: "MON 5 OCT", time: "2AM", text: "5 PEOPLE WALKING NORTH TO SOUTH YELLING AND SINGING LOUD" },
  { day: "TUE 6 OCT", time: "10PM", text: "1 PERSON WALKING SOUTH TO NORTH STOPPED TO TIE SHOES" },
  { day: "WED 7 OCT", time: "8PM", text: "WALKING WITH LOUD MUSIC WEARING A RED HOODIE A SHORT AND SLIPPERS" },
  { day: "THU 8 OCT", time: "1AM", text: "2 PEOPLE IN A HEATED ARGUMENT DRUNK WALKING IN THE MIDDLE OF THE ROAD" }
];

let observations = JSON.parse(localStorage.getItem("street_observations")) || defaultObservations;
let selectedObservationIndex = null;
let currentMobileSlide = 0;

document.addEventListener("DOMContentLoaded", () => {

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
  const deleteCurrentInfoBtn = document.getElementById("delete-current-info");

  if (container) {
    function renderLogs() {
      container.innerHTML = "";

      if (observations.length === 0) {
        container.innerHTML = `<div style="font-family: monospace; color: #555; text-align: center; width: 100%; margin-top: 20vh;">NO OBSERVATIONS AVAILABLE. ADD NEW OBSERVATIONS USING "+ ADD OBS".</div>`;
        return;
      }

      const isMobile = window.innerWidth <= 700;

      if (isMobile) {
        observations.forEach((item, index) => {
          const card = document.createElement("div");
          card.className = `observation-card ${index === currentMobileSlide ? "active-slide" : ""}`;

          const fullText = `${item.day} ${item.time} ${item.text}`;
          const words = fullText.split(" ");

          words.forEach((word) => {
            const span = document.createElement("span");
            span.className = "log-word";
            span.textContent = word;

            span.addEventListener("click", () => {
              if (infoModal) {
                selectedObservationIndex = index;
                infoTime.textContent = `${item.day} — ${item.time}`;
                infoText.textContent = item.text;
                infoModal.classList.remove("hidden");
              }
            });

            card.appendChild(span);
          });

          container.appendChild(card);
        });

      } else {
        observations.forEach((item, index) => {
          const fullText = `${item.day} ${item.time} ${item.text}`;
          const words = fullText.split(" ");

          words.forEach((word) => {
            const span = document.createElement("span");
            span.className = "log-word";
            span.textContent = word;

            span.addEventListener("click", () => {
              if (infoModal) {
                selectedObservationIndex = index;
                infoTime.textContent = `${item.day} — ${item.time}`;
                infoText.textContent = item.text;
                infoModal.classList.remove("hidden");
              }
            });

            container.appendChild(span);
          });
        });
      }

      setTimeout(adjustTypographyScale, 50);
    }

    function adjustTypographyScale() {
      const isMobile = window.innerWidth <= 700;

      if (isMobile) {
        const activeCard = container.querySelector(".observation-card.active-slide");
        if (!activeCard) return;
        const words = activeCard.querySelectorAll(".log-word");
        if (!words.length) return;

        const availHeight = container.clientHeight - 10;
        const availWidth = container.clientWidth - 16;
        
        let minFontPx = 10;
        let maxFontPx = 400;
        let optimalPx = minFontPx;

        // Geoptimaliseerde binaire zoekfunctie die zowel op hoogte als op breedte vult
        while (minFontPx <= maxFontPx) {
          const midPx = Math.floor((minFontPx + maxFontPx) / 2);
          words.forEach(word => word.style.fontSize = `${midPx}px`);

          // Check of de tekst zowel binnen de hoogte valt als niet onnodig overlapt
          if (activeCard.scrollHeight <= availHeight && activeCard.scrollWidth <= availWidth * 1.05) {
            optimalPx = midPx;
            minFontPx = midPx + 1;
          } else {
            maxFontPx = midPx - 1;
          }
        }

        words.forEach(word => word.style.fontSize = `${optimalPx}px`);

      } else {
        const words = container.querySelectorAll(".log-word");
        if (!words.length) return;

        const availHeight = container.clientHeight;
        let minFontPx = 10;
        let maxFontPx = 250;
        let optimalPx = minFontPx;

        while (minFontPx <= maxFontPx) {
          const midPx = Math.floor((minFontPx + maxFontPx) / 2);
          words.forEach(word => word.style.fontSize = `${midPx}px`);

          if (container.scrollHeight <= availHeight) {
            optimalPx = midPx;
            minFontPx = midPx + 1;
          } else {
            maxFontPx = midPx - 1;
          }
        }

        words.forEach(word => word.style.fontSize = `${optimalPx}px`);
      }
    }

    // Touch / Swipe detectie voor mobiel (< 701px)
    let touchStartX = 0;
    let touchEndX = 0;

    container.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      if (window.innerWidth > 700) return;
      const swipeThreshold = 40;

      if (touchEndX < touchStartX - swipeThreshold) {
        // Swipe links -> Volgende observatie
        if (currentMobileSlide < observations.length - 1) {
          currentMobileSlide++;
          renderLogs();
        }
      } else if (touchEndX > touchStartX + swipeThreshold) {
        // Swipe rechts -> Vorige observatie
        if (currentMobileSlide > 0) {
          currentMobileSlide--;
          renderLogs();
        }
      }
    }

    // Glitch loop voor willekeurige pixelated woorden met 2 seconden herstel
    setInterval(() => {
      const allWords = container.querySelectorAll(".log-word");
      if (allWords.length === 0) return;

      const normalWords = Array.from(allWords).filter(w => !w.classList.contains("pixelated"));
      if (normalWords.length === 0) return;

      const count = Math.min(Math.floor(Math.random() * 2) + 1, normalWords.length);
      const targetWords = [];

      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * normalWords.length);
        targetWords.push(normalWords[randomIndex]);
        normalWords.splice(randomIndex, 1);
      }

      targetWords.forEach(word => word.classList.add("pixelated"));

      setTimeout(() => {
        targetWords.forEach(word => {
          if (word) word.classList.remove("pixelated");
        });
      }, 2000);

    }, 3500);

    function deleteObservation(index) {
      if (index !== null && index >= 0 && index < observations.length) {
        observations.splice(index, 1);
        if (currentMobileSlide >= observations.length) {
          currentMobileSlide = Math.max(0, observations.length - 1);
        }
        localStorage.setItem("street_observations", JSON.stringify(observations));
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
        selectedObservationIndex = null;
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const day = document.getElementById("input-day").value;
        const time = document.getElementById("input-time").value;
        const text = document.getElementById("input-text").value;

        observations.push({ day, time, text });
        currentMobileSlide = observations.length - 1;
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
