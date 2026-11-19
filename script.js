document.addEventListener("DOMContentLoaded", function () {
  // 1. Hamburger Menu & Drawer
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
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      navDrawer && navDrawer.classList.contains("open") ? closeMenu() : openMenu();
    });
  }
  if (closeDrawer) closeDrawer.addEventListener("click", closeMenu);
  if (drawerOverlay) drawerOverlay.addEventListener("click", closeMenu);

  const isMobileView = () => window.innerWidth < 900;

  function enableSwipe(element, onSwipeLeft, onSwipeRight) {
    if (!element) return;
    let startX = 0;
    let startY = 0;
    let tracking = false;

    element.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });

    element.addEventListener("touchend", (e) => {
      if (!tracking) return;
      tracking = false;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) onSwipeLeft();
        else onSwipeRight();
      }
    }, { passive: true });
  }

  // ==========================================
  // 2. TYPOGRAPHY LOG (MOBILE: 1 TEKST + SWIPE | DESKTOP: OVERZICHT)
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

    let currentObsIndex = 0;
    let selectedLogIndex = null;

    const swipeBar = document.createElement("div");
    swipeBar.className = "mobile-swipe-bar";
    swipeBar.innerHTML = `
      <button type="button" class="btn" id="obs-prev-btn">← VORIGE</button>
      <span class="swipe-counter" id="obs-swipe-counter">1 / 1</span>
      <button type="button" class="btn" id="obs-next-btn">VOLGENDE →</button>
    `;
    document.body.appendChild(swipeBar);

    const obsPrevBtn = document.getElementById("obs-prev-btn");
    const obsNextBtn = document.getElementById("obs-next-btn");
    const obsSwipeCounter = document.getElementById("obs-swipe-counter");

    function nextObs() {
      if (!observations.length) return;
      currentObsIndex = (currentObsIndex + 1) % observations.length;
      renderLogs();
    }

    function prevObs() {
      if (!observations.length) return;
      currentObsIndex = (currentObsIndex - 1 + observations.length) % observations.length;
      renderLogs();
    }

    if (obsPrevBtn) obsPrevBtn.addEventListener("click", prevObs);
    if (obsNextBtn) obsNextBtn.addEventListener("click", nextObs);
    enableSwipe(typoContainer, nextObs, prevObs);

    function formatDateString(dateStr) {
      const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const [year, month, day] = dateStr.split("-").map(Number);
      const dateObj = new Date(year, month - 1, day);
      return `${days[dateObj.getDay()]} ${day} ${months[dateObj.getMonth()]}`;
    }

    function formatTimeString(timeStr) {
      let [hours, minutes] = timeStr.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      if (minutes === 0) return `${hours}${period}`;
      const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${hours}:${paddedMinutes}${period}`;
    }

    function renderDesktopLogs() {
      const rowsData = [];
      observations.forEach((obs, obsIndex) => {
        const tokens = [obs.day, obs.time, ...obs.text.split(/\s+/).filter(Boolean)];
        const chunkSize = 5;
        for (let i = 0; i < tokens.length; i += chunkSize) {
          rowsData.push({
            words: tokens.slice(i, i + chunkSize),
            obsIndex: obsIndex,
            isFirstRow: i === 0
          });
        }
      });

      if (!rowsData.length) return;

      const availableHeight = typoContainer.clientHeight || (window.innerHeight - 60);
      let fontSizePx = Math.min(48, Math.max(10, (availableHeight / rowsData.length) * 0.78));
      let metaSizePx = Math.max(8, fontSizePx * 0.42);

      function draw(wordPx, tagPx) {
        typoContainer.innerHTML = "";
        rowsData.forEach((rowObj) => {
          const rowDiv = document.createElement("div");
          rowDiv.className = "log-row";

          rowObj.words.forEach((word, wordIdx) => {
            const span = document.createElement("span");
            span.className = "log-word";
            span.textContent = word;

            if (rowObj.isFirstRow && (wordIdx === 0 || wordIdx === 1)) {
              span.classList.add("meta-tag");
              span.style.fontSize = tagPx + "px";
            } else {
              span.style.fontSize = wordPx + "px";
            }

            span.addEventListener("click", () => openDetailModal(rowObj.obsIndex));
            rowDiv.appendChild(span);
          });

          typoContainer.appendChild(rowDiv);
        });
      }

      draw(fontSizePx, metaSizePx);

      let guard = 0;
      while (typoContainer.scrollHeight > typoContainer.clientHeight && fontSizePx > 8 && guard < 40) {
        fontSizePx *= 0.92;
        metaSizePx = Math.max(7, fontSizePx * 0.42);
        draw(fontSizePx, metaSizePx);
        guard++;
      }
    }

    function renderMobileSingleObs() {
      typoContainer.innerHTML = "";
      if (!observations.length) {
        typoContainer.innerHTML = `<div class="mobile-single-obs"><p class="mobile-single-text">GEEN OBSERVATIES</p></div>`;
        if (obsSwipeCounter) obsSwipeCounter.textContent = "0 / 0";
        return;
      }

      if (currentObsIndex >= observations.length) {
        currentObsIndex = observations.length - 1;
      }

      const obs = observations[currentObsIndex];
      const card = document.createElement("article");
      card.className = "mobile-single-obs";
      card.innerHTML = `
        <div class="mobile-single-meta">${obs.day} · ${obs.time}</div>
        <p class="mobile-single-text">${obs.text}</p>
        <div class="mobile-swipe-hint">← SWIPE VOOR VOLGENDE · TIK VOOR OPTIES</div>
      `;
      card.addEventListener("click", () => openDetailModal(currentObsIndex));
      typoContainer.appendChild(card);

      if (obsSwipeCounter) {
        obsSwipeCounter.textContent = `${currentObsIndex + 1} / ${observations.length}`;
      }
    }

    function renderLogs() {
      if (isMobileView()) {
        renderMobileSingleObs();
      } else {
        renderDesktopLogs();
      }
    }

    const detailModal = document.getElementById("detail-modal");
    const detailMeta = document.getElementById("detail-meta");
    const detailText = document.getElementById("detail-text");
    const closeDetailModalBtn = document.getElementById("close-detail-modal");
    const deleteLogBtn = document.getElementById("delete-log-btn");

    function openDetailModal(index) {
      selectedLogIndex = index;
      const obs = observations[index];
      if (!obs || !detailModal) return;
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
          if (currentObsIndex >= observations.length) {
            currentObsIndex = Math.max(0, observations.length - 1);
          }
          selectedLogIndex = null;
          detailModal.classList.add("hidden");
          renderLogs();
        }
      });
    }

    const openAddModalBtn = document.getElementById("open-add-modal");
    const addModal = document.getElementById("observation-modal");
    const closeAddModalBtn = document.getElementById("close-modal");
    const addForm = document.getElementById("add-log-form");
    const inputDay = document.getElementById("input-day");
    const inputTime = document.getElementById("input-time");

    function openNativePicker(inputEl) {
      if (!inputEl) return;
      if (typeof inputEl.showPicker === "function") {
        try { inputEl.showPicker(); } catch (_) { inputEl.focus(); }
      } else {
        inputEl.focus();
      }
    }

    if (inputDay) inputDay.addEventListener("click", () => openNativePicker(inputDay));
    if (inputTime) inputTime.addEventListener("click", () => openNativePicker(inputTime));

    if (openAddModalBtn && addModal) {
      openAddModalBtn.addEventListener("click", () => {
        if (addForm) addForm.reset();
        addModal.classList.remove("hidden");
      });
    }

    if (closeAddModalBtn && addModal) {
      closeAddModalBtn.addEventListener("click", () => addModal.classList.add("hidden"));
    }

    if (addForm) {
      addForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const rawDate = inputDay ? inputDay.value : "";
        const rawTime = inputTime ? inputTime.value : "";
        const text = document.getElementById("input-text").value.trim().toUpperCase();

        if (rawDate && rawTime && text) {
          observations.push({
            day: formatDateString(rawDate),
            time: formatTimeString(rawTime),
            text
          });
          localStorage.setItem("street_observations_v4", JSON.stringify(observations));
          currentObsIndex = observations.length - 1;
          addForm.reset();
          if (addModal) addModal.classList.add("hidden");
          renderLogs();
        }
      });
    }

    const toggleStyleBtn = document.getElementById("toggle-style");
    const toggleDriftBtn = document.getElementById("toggle-drift");

    if (toggleStyleBtn) {
      toggleStyleBtn.addEventListener("click", () => typoContainer.classList.toggle("outline-mode"));
    }

    if (toggleDriftBtn) {
      toggleDriftBtn.addEventListener("click", () => {
        const isActive = typoContainer.classList.toggle("drift-active");
        toggleDriftBtn.textContent = isActive ? "DRIFT: ON" : "DRIFT: OFF";
      });
    }

    window.addEventListener("resize", renderLogs);
    renderLogs();
  }

  // ==========================================
  // 3. PHOTO GALLERY (MOBILE: 1 FOTO + SWIPE | DESKTOP: RASTER)
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
    let currentPhotoIndex = 0;
    let selectedPhotoIndex = null;

    const photoSwipeBar = document.createElement("div");
    photoSwipeBar.className = "mobile-swipe-bar";
    photoSwipeBar.innerHTML = `
      <button type="button" class="btn" id="photo-prev-btn">← VORIGE</button>
      <span class="swipe-counter" id="photo-swipe-counter">1 / 1</span>
      <button type="button" class="btn" id="photo-next-btn">VOLGENDE →</button>
    `;
    document.body.appendChild(photoSwipeBar);

    const photoPrevBtn = document.getElementById("photo-prev-btn");
    const photoNextBtn = document.getElementById("photo-next-btn");
    const photoSwipeCounter = document.getElementById("photo-swipe-counter");

    function nextPhoto() {
      if (!photos.length) return;
      currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
      renderGallery();
    }

    function prevPhoto() {
      if (!photos.length) return;
      currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
      renderGallery();
    }

    if (photoPrevBtn) photoPrevBtn.addEventListener("click", prevPhoto);
    if (photoNextBtn) photoNextBtn.addEventListener("click", nextPhoto);
    enableSwipe(galleryGrid, nextPhoto, prevPhoto);

    function createPhotoElement(photoItem, index) {
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
          "./beeld/Artboard " + num + ".JPG"
        ];
        let attemptIndex = 0;
        img.src = attempts[0];
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
      itemDiv.addEventListener("click", () => {
        selectedPhotoIndex = index;
        if (modalImg && photoModal) {
          modalImg.src = img.src;
          photoModal.classList.remove("hidden");
        }
      });

      return itemDiv;
    }

    function renderGallery() {
      galleryGrid.innerHTML = "";
      if (!photos.length) return;

      if (isMobileView()) {
        if (currentPhotoIndex >= photos.length) {
          currentPhotoIndex = photos.length - 1;
        }
        galleryGrid.appendChild(createPhotoElement(photos[currentPhotoIndex], currentPhotoIndex));
        if (photoSwipeCounter) {
          photoSwipeCounter.textContent = `${currentPhotoIndex + 1} / ${photos.length}`;
        }
      } else {
        photos.forEach((photoItem, index) => {
          galleryGrid.appendChild(createPhotoElement(photoItem, index));
        });
      }
    }

    function compressImage(file, maxWidth = 1200, quality = 0.7) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
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
      triggerUploadBtn.onclick = () => fileInput.click();

      fileInput.onchange = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newPhotos = [];
        for (const file of Array.from(files)) {
          try {
            const compressed = await compressImage(file);
            newPhotos.push(compressed);
          } catch (err) {
            console.error(err);
          }
        }

        localPhotos = localPhotos.concat(newPhotos);
        localStorage.setItem("street_observation_photos", JSON.stringify(localPhotos));
        photos = defaultPhotos.concat(localPhotos);
        currentPhotoIndex = photos.length - 1;
        renderGallery();
        fileInput.value = "";
      };
    }

    if (deletePhotoBtn) {
      deletePhotoBtn.onclick = () => {
        if (selectedPhotoIndex !== null) {
          const localIndex = selectedPhotoIndex - defaultPhotos.length;
          if (localIndex >= 0) {
            localPhotos.splice(localIndex, 1);
            localStorage.setItem("street_observation_photos", JSON.stringify(localPhotos));
            photos = defaultPhotos.concat(localPhotos);
            if (currentPhotoIndex >= photos.length) {
              currentPhotoIndex = Math.max(0, photos.length - 1);
            }
          }
          selectedPhotoIndex = null;
          photoModal.classList.add("hidden");
          renderGallery();
        }
      };
    }

    if (closePhotoModalBtn) {
      closePhotoModalBtn.onclick = () => {
        photoModal.classList.add("hidden");
        selectedPhotoIndex = null;
      };
    }

    window.addEventListener("resize", renderGallery);
    renderGallery();
  }
});
