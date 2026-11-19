document.addEventListener("DOMContentLoaded", function () {

  // ==========================================
  // 1. UNIFORM HAMBURGER MENU & DRAWER (BEIDE PAGINA'S)
  // ==========================================
  const menuToggle = document.getElementById("menu-toggle");
  const navDrawer = document.getElementById("nav-drawer");
  const closeDrawer = document.getElementById("close-drawer");
  const drawerOverlay = document.getElementById("drawer-overlay");

  function openMenu() {
    if (navDrawer) navDrawer.classList.add("open");
    if (drawerOverlay) drawerOverlay.classList.add("open");
  }

  function closeMenu() {
    if (navDrawer) navDrawer.classList.remove("open");
    if (drawerOverlay) drawerOverlay.classList.remove("open");
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (navDrawer && navDrawer.classList.contains("open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (closeDrawer) {
    closeDrawer.addEventListener("click", function (e) {
      e.stopPropagation();
      closeMenu();
    });
  }

  if (drawerOverlay) {
    drawerOverlay.addEventListener("click", closeMenu);
  }

  // Helper voor niet-blokkerende meldingen
  function showNotice(message) {
    const noticeModal = document.getElementById("notice-modal");
    const noticeMessage = document.getElementById("notice-message");
    const closeNoticeBtn = document.getElementById("close-notice-btn");

    if (noticeModal && noticeMessage) {
      noticeMessage.textContent = message;
      noticeModal.classList.remove("hidden");
      if (closeNoticeBtn) {
        closeNoticeBtn.onclick = function () {
          noticeModal.classList.add("hidden");
        };
      }
    } else {
      console.warn(message);
    }
  }


  // ==========================================
  // 2. TYPOGRAPHY LOG LOGICA (ALLEEN INDEX.HTML)
  // ==========================================
  const typoContainer = document.getElementById("typography-container");

  if (typoContainer) {
    const defaultObservations = [
      { day: "MON 5 OCT", time: "2AM", text: "MAN STANDING STILL IN THE RAIN WITHOUT UMBRELLA" },
      { day: "TUE 6 OCT", time: "11PM", text: "NEON SIGN FLICKERING ABOVE EMPTY TRAM STOP" },
      { day: "THU 8 OCT", time: "4PM", text: "PIGEON RIDING THE METRO FOR THREE STOPS" },
      { day: "FRI 9 OCT", time: "1AM", text: "TWO STRANGERS SHARING HEADPHONES ON BENCH" },
      { day: "SAT 10 OCT", time: "6PM", text: "SHOPPING CART FLOATING IN THE CANAL" },
      { day: "SUN 11 OCT", time: "9AM", text: "CHALK MESSAGE WASHING AWAY ON PAVEMENT" }
    ];

    let observations = [];
    try {
      const saved = JSON.parse(localStorage.getItem("street_observations_v4"));
      observations = Array.isArray(saved) && saved.length > 0 ? saved : defaultObservations;
    } catch (e) {
      observations = defaultObservations;
    }

    let selectedLogIndex = null;

    // Datum omzetten naar "THU 19 NOV"
    function formatDateString(dateStr) {
      const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const [year, month, day] = dateStr.split("-").map(Number);
      const dateObj = new Date(year, month - 1, day);
      return `${days[dateObj.getDay()]} ${day} ${months[dateObj.getMonth()]}`;
    }

    // Tijd omzetten naar "2PM" of "2:30PM"
    function formatTimeString(timeStr) {
      let [hours, minutes] = timeStr.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      if (minutes === 0) {
        return `${hours}${period}`;
      }
      const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${hours}:${paddedMinutes}${period}`;
    }

    // Dynamische schaalberekening zodat alles op 1 scherm past
    function renderLogs() {
      typoContainer.innerHTML = "";

      const rowsData = [];
      observations.forEach((obs, obsIndex) => {
        const tokens = [obs.day, obs.time, ...obs.text.split(/\s+/)];
        // Verdeel tokens in rijen van max ~5 woorden voor strakke edge-to-edge uitlijning
        const chunkSize = 5;
        for (let i = 0; i < tokens.length; i += chunkSize) {
          rowsData.push({
            words: tokens.slice(i, i + chunkSize),
            obsIndex: obsIndex,
            isFirstRow: i === 0
          });
        }
      });

      const totalRows = Math.max(1, rowsData.length);
      // Beschikbare hoogte (100vh minus 60px topbar) verdelen over alle rijen
      const availableVh = 88;
      const dynamicFontVh = Math.max(1.2, Math.min(6.5, (availableVh / totalRows) * 0.78));
      const metaFontVh = Math.max(0.7, dynamicFontVh * 0.42);

      rowsData.forEach((rowObj) => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "log-row";

        rowObj.words.forEach((word, wordIdx) => {
          const span = document.createElement("span");
          span.className = "log-word";
          span.textContent = word;

          // Datum en tijd krijgen pixel-font styling
          if (rowObj.isFirstRow && (wordIdx === 0 || wordIdx === 1)) {
            span.classList.add("meta-tag");
            span.style.fontSize = metaFontVh + "vh";
          } else {
            span.style.fontSize = dynamicFontVh + "vh";
          }

          span.addEventListener("click", () => {
            openDetailModal(rowObj.obsIndex);
          });

          rowDiv.appendChild(span);
        });

        typoContainer.appendChild(rowDiv);
      });
    }

    // Detail Modal
    const detailModal = document.getElementById("detail-modal");
    const detailMeta = document.getElementById("detail-meta");
    const detailText = document.getElementById("detail-text");
    const closeDetailModalBtn = document.getElementById("close-detail-modal");
    const deleteLogBtn = document.getElementById("delete-log-btn");

    function openDetailModal(index) {
      selectedLogIndex = index;
      const obs = observations[index];
      if (!obs) return;
      detailMeta.textContent = `${obs.day} — ${obs.time}`;
      detailText.textContent = obs.text;
      detailModal.classList.remove("hidden");
    }

    if (closeDetailModalBtn) {
      closeDetailModalBtn.addEventListener("click", () => {
        detailModal.classList.add("hidden");
        selectedLogIndex = null;
      });
    }

    if (deleteLogBtn) {
      deleteLogBtn.addEventListener("click", () => {
        if (selectedLogIndex !== null) {
          observations.splice(selectedLogIndex, 1);
          localStorage.setItem("street_observations_v4", JSON.stringify(observations));
          selectedLogIndex = null;
          detailModal.classList.add("hidden");
          renderLogs();
        }
      });
    }

    // Add Observation Modal (Kalender & Klok standaard op huidige tijd)
    const openAddModalBtn = document.getElementById("open-add-modal");
    const addModal = document.getElementById("observation-modal");
    const closeAddModalBtn = document.getElementById("close-modal");
    const addForm = document.getElementById("add-log-form");

    if (openAddModalBtn && addModal) {
      openAddModalBtn.addEventListener("click", () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");

        document.getElementById("input-day").value = `${year}-${month}-${day}`;
        document.getElementById("input-time").value = `${hours}:${minutes}`;
        addModal.classList.remove("hidden");
      });
    }

    if (closeAddModalBtn && addModal) {
      closeAddModalBtn.addEventListener("click", () => {
        addModal.classList.add("hidden");
      });
    }

    if (addForm) {
      addForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const rawDate = document.getElementById("input-day").value;
        const rawTime = document.getElementById("input-time").value;
        const text = document.getElementById("input-text").value.trim().toUpperCase();

        if (rawDate && rawTime && text) {
          const day = formatDateString(rawDate);
          const time = formatTimeString(rawTime);

          observations.push({ day, time, text });
          localStorage.setItem("street_observations_v4", JSON.stringify(observations));

          renderLogs();
          addForm.reset();
          if (addModal) addModal.classList.add("hidden");
        }
      });
    }

    // Style & Drift toggles
    const toggleStyleBtn = document.getElementById("toggle-style");
    const toggleDriftBtn = document.getElementById("toggle-drift");

    if (toggleStyleBtn) {
      toggleStyleBtn.addEventListener("click", () => {
        typoContainer.classList.toggle("outline-mode");
      });
    }

    if (toggleDriftBtn) {
      toggleDriftBtn.addEventListener("click", () => {
        const isActive = typoContainer.classList.toggle("drift-active");
        toggleDriftBtn.textContent = isActive ? "DRIFT: ON" : "DRIFT: OFF";
      });
    }

    renderLogs();
  }


  // ==========================================
  // 3. FOTOGALERIJ LOGICA (ALLEEN PHOTOS.HTML)
  // ==========================================
  const galleryGrid = document.getElementById("gallery-grid");

  if (galleryGrid) {
    const fileInput = document.getElementById("file-input");
    const triggerUploadBtn = document.getElementById("trigger-upload-btn");
    const photoModal = document.getElementById("photo-modal");
    const modalImg = document.getElementById("modal-img");
    const closePhotoModalBtn = document.getElementById("close-photo-modal");
    const deletePhotoBtn = document.getElementById("delete-photo-btn");

    const defaultPhotos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    let localPhotos = [];
    try {
      localPhotos = JSON.parse(localStorage.getItem("street_observation_photos")) || [];
    } catch (e) {
      localPhotos = [];
    }

    let photos = defaultPhotos.concat(localPhotos);
    let selectedPhotoIndex = null;

    function renderGallery() {
      galleryGrid.innerHTML = "";

      photos.forEach(function (photoItem, index) {
        const itemDiv = document.createElement("div");
        itemDiv.className = "gallery-item";

        const img = document.createElement("img");
        img.alt = "Observation " + (index + 1);

        if (index < defaultPhotos.length) {
          const num = photoItem;
          const attempts = [
            "./beeld/Artboard " + num + ".jpg",
            "./beeld/Artboard%20" + num + ".jpg",
            "beeld/Artboard " + num + ".jpg",
            "beeld/artboard " + num + ".jpg",
            "./beeld/Artboard " + num + ".JPG"
          ];

          let attemptIndex = 0;
          img.src = attempts[attemptIndex];

          img.onerror = function () {
            attemptIndex++;
            if (attemptIndex < attempts.length) {
              this.src = attempts[attemptIndex];
            } else {
              itemDiv.style.display = "none";
            }
          };
        } else {
          img.src = photoItem;
        }

        itemDiv.appendChild(img);

        itemDiv.onclick = function () {
          selectedPhotoIndex = index;
          modalImg.src = img.src;
          photoModal.classList.remove("hidden");
        };

        galleryGrid.appendChild(itemDiv);
      });
    }

    function compressImage(file, maxWidth = 1200, quality = 0.7) {
      return new Promise(function (resolve) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const img = new Image();
          img.onload = function () {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", quality));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (triggerUploadBtn && fileInput) {
      triggerUploadBtn.onclick = function () {
        fileInput.click();
      };

      fileInput.onchange = async function (e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newPhotos = [];
        for (let file of Array.from(files)) {
          try {
            const compressed = await compressImage(file);
            newPhotos.push(compressed);
          } catch (err) {
            console.error(err);
          }
        }

        try {
          localPhotos = localPhotos.concat(newPhotos);
          localStorage.setItem("street_observation_photos", JSON.stringify(localPhotos));
          photos = defaultPhotos.concat(localPhotos);
          renderGallery();
        } catch (error) {
          showNotice("Browsergeheugen vol! Verwijder enkele geüploade foto's.");
        }
        fileInput.value = "";
      };
    }

    if (deletePhotoBtn) {
      deletePhotoBtn.onclick = function () {
        if (selectedPhotoIndex !== null) {
          const localIndex = selectedPhotoIndex - defaultPhotos.length;
          if (localIndex >= 0) {
            localPhotos.splice(localIndex, 1);
            localStorage.setItem("street_observation_photos", JSON.stringify(localPhotos));
            photos = defaultPhotos.concat(localPhotos);
          } else {
            showNotice("Vaste foto's uit de map 'beeld' kunnen niet via de browser worden verwijderd.");
          }
          selectedPhotoIndex = null;
          photoModal.classList.add("hidden");
          renderGallery();
        }
      };
    }

    if (closePhotoModalBtn) {
      closePhotoModalBtn.onclick = function () {
        photoModal.classList.add("hidden");
        selectedPhotoIndex = null;
      };
    }

    renderGallery();
  }
});
