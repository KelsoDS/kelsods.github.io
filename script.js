document.addEventListener("DOMContentLoaded", function () {
  // Zet hier je eigen gedeelde JSON-URL (bijv. van jsonblob.com: "https://jsonblob.com/api/jsonBlob/<JOUW_ID>")
  const SHARED_JSON_URL = "https://jsonblob.com/01a21823-6b27-7e33-a245-27685c90d656";

  // 1. Menu & Drawer
  const menuToggle = document.getElementById("menu-toggle");
  const navDrawer = document.getElementById("nav-drawer");
  const closeDrawer = document.getElementById("close-drawer");
  const drawerOverlay = document.getElementById("drawer-overlay");

  function setMenuOpen(isOpen) {
    if (navDrawer) navDrawer.classList.toggle("open", isOpen);
    if (drawerOverlay) drawerOverlay.classList.toggle("open", isOpen);
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      const currentlyOpen = navDrawer && navDrawer.classList.contains("open");
      setMenuOpen(!currentlyOpen);
    });
  }

  if (closeDrawer) {
    closeDrawer.addEventListener("click", function (e) {
      e.stopPropagation();
      setMenuOpen(false);
    });
  }

  if (drawerOverlay) {
    drawerOverlay.addEventListener("click", function () {
      setMenuOpen(false);
    });
  }

  const isMobileView = () => window.innerWidth < 900;

  function enableSwipe(element, onSwipeLeft, onSwipeRight) {
    if (!element) return;
    let startX = 0;
    let startY = 0;
    let tracking = false;

    element.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, { passive: true });

    element.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) onSwipeLeft();
        else onSwipeRight();
      }
    }, { passive: true });
  }

  // 2. Klik-geluid, stapsgewijze tekst-onthulling & betekenislaag
  let activeSoundTimer = null;
  let activeAudioCtx = null;

  function stopClickAudio() {
    if (activeSoundTimer) {
      clearInterval(activeSoundTimer);
      activeSoundTimer = null;
    }
    if (activeAudioCtx && typeof activeAudioCtx.close === "function") {
      activeAudioCtx.close().catch(function () {});
      activeAudioCtx = null;
    }
  }

  function playObservationMeaning(obs, container, textTarget, cardTextTarget) {
    stopClickAudio();
    if (!obs || !container) return;

    if (textTarget) textTarget.textContent = "";
    if (cardTextTarget) cardTextTarget.textContent = "";

    let statusBar = container.querySelector(".click-status-bar");
    if (!statusBar) {
      statusBar = document.createElement("div");
      statusBar.className = "click-status-bar";
      if (textTarget && textTarget.parentNode) {
        textTarget.parentNode.insertBefore(statusBar, textTarget.nextSibling);
      } else {
        container.appendChild(statusBar);
      }
    }
    statusBar.style.width = "0%";

    let meaningBox = container.querySelector(".click-meaning-layer");
    if (!meaningBox) {
      meaningBox = document.createElement("div");
      meaningBox.className = "click-meaning-layer";
      if (statusBar && statusBar.parentNode) {
        statusBar.parentNode.insertBefore(meaningBox, statusBar.nextSibling);
      } else {
        container.appendChild(meaningBox);
      }
    }
    meaningBox.textContent = "";

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      try {
        activeAudioCtx = new AudioContextClass();
      } catch (_) {
        activeAudioCtx = null;
      }
    }

    const obsText = obs.text || "";
    const words = obsText.split(/\s+/).filter(Boolean);
    const meaningParts = [
      `${obs.day} · ${obs.time} — `,
      "straatgeluid & spoor: ",
      obsText.toLowerCase()
    ];

    const totalSteps = Math.max(words.length, meaningParts.length, 1);
    let step = 0;

    function emitTone(freq, type) {
      if (!activeAudioCtx) return;
      try {
        const osc = activeAudioCtx.createOscillator();
        const gain = activeAudioCtx.createGain();
        osc.type = type || "sine";
        osc.frequency.setValueAtTime(freq, activeAudioCtx.currentTime);
        gain.gain.setValueAtTime(0.035, activeAudioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, activeAudioCtx.currentTime + 0.24);
        osc.connect(gain);
        gain.connect(activeAudioCtx.destination);
        osc.start();
        osc.stop(activeAudioCtx.currentTime + 0.25);
      } catch (_) {}
    }

    activeSoundTimer = setInterval(function () {
      if (step < totalSteps) {
        if (step < words.length) {
          const nextChunk = (step > 0 ? " " : "") + words[step];
          if (textTarget) textTarget.textContent += nextChunk;
          if (cardTextTarget) cardTextTarget.textContent += nextChunk;
        }
        if (step < meaningParts.length) {
          meaningBox.textContent += meaningParts[step];
        }

        const progress = Math.min(100, Math.round(((step + 1) / totalSteps) * 100));
        statusBar.style.width = progress + "%";

        emitTone(185 + step * 55, step % 2 === 0 ? "sine" : "triangle");
        step++;
      } else {
        statusBar.style.width = "100%";
        stopClickAudio();
      }
    }, 320);
  }

  // 3. Typography Log + gedeelde online JSON (zonder token)
  const typoContainer = document.getElementById("typography-container");

  if (typoContainer) {
    const STORAGE_KEY = "street_observations_v4";
    const MODIFIED_KEY = "street_observations_modified_v4";

    let dataDoc = {
      observations: [
        { day: "MON 5 OCT", time: "2AM", text: "MAN STANDING STILL IN THE RAIN WITHOUT UMBRELLA" },
        { day: "TUE 6 OCT", time: "11PM", text: "NEON SIGN FLICKERING ABOVE EMPTY TRAM STOP" }
      ],
      photos: []
    };

    let observations = dataDoc.observations.slice();
    const hasLocalModifications = localStorage.getItem(MODIFIED_KEY) === "1";

    if (hasLocalModifications) {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (Array.isArray(saved)) {
          observations = saved;
          dataDoc.observations = saved;
        }
      } catch (_) {}
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

    function stepObservation(delta) {
      if (!observations.length) return;
      currentObsIndex = (currentObsIndex + delta + observations.length) % observations.length;
      renderObservations();
    }

    if (obsPrevBtn) obsPrevBtn.addEventListener("click", function () { stepObservation(-1); });
    if (obsNextBtn) obsNextBtn.addEventListener("click", function () { stepObservation(1); });
    enableSwipe(
      typoContainer,
      function () { stepObservation(1); },
      function () { stepObservation(-1); }
    );

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

    function persistLocalObservations() {
      dataDoc.observations = observations.slice();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
      localStorage.setItem(MODIFIED_KEY, "1");
    }

    function extractObservations(raw) {
      if (Array.isArray(raw)) return raw;
      if (raw && Array.isArray(raw.observations)) return raw.observations;
      return null;
    }

    async function syncToSharedJson() {
      if (!SHARED_JSON_URL) return false;
      dataDoc.observations = observations.slice();
      const res = await fetch(SHARED_JSON_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(dataDoc)
      });
      if (!res.ok) {
        throw new Error("Kon gedeelde JSON niet bijwerken");
      }
      return true;
    }

    async function loadSharedOrInitialObservations() {
      if (SHARED_JSON_URL) {
        try {
          const res = await fetch(SHARED_JSON_URL + (SHARED_JSON_URL.includes("?") ? "&" : "?") + "t=" + Date.now(), {
            cache: "no-store",
            headers: { "Accept": "application/json" }
          });
          if (res.ok) {
            const remoteData = await res.json();
            if (remoteData && typeof remoteData === "object" && !Array.isArray(remoteData)) {
              dataDoc = Object.assign({ observations: [], photos: [] }, remoteData);
            }
            const remoteList = extractObservations(remoteData);
            if (Array.isArray(remoteList)) {
              observations = remoteList;
              localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
              localStorage.setItem(MODIFIED_KEY, "1");
              currentObsIndex = 0;
              renderObservations();
              return;
            }
          }
        } catch (_) {
          // Valt terug op lokale of repo-data
        }
      }

      if (hasLocalModifications) return;

      try {
        const res = await fetch("./data.json?t=" + Date.now(), { cache: "no-store" });
        if (!res.ok) return;
        const localRepoData = await res.json();
        if (localRepoData && typeof localRepoData === "object" && !Array.isArray(localRepoData)) {
          dataDoc = Object.assign({ observations: [], photos: [] }, localRepoData);
        }
        const repoList = extractObservations(localRepoData);
        if (Array.isArray(repoList) && repoList.length > 0) {
          observations = repoList;
          currentObsIndex = 0;
          renderObservations();
        }
      } catch (_) {}
    }

    const detailModal = document.getElementById("detail-modal");
    const detailMeta = document.getElementById("detail-meta");
    const detailText = document.getElementById("detail-text");
    const closeDetailModalBtn = document.getElementById("close-detail-modal");
    const deleteLogBtn = document.getElementById("delete-log-btn");

    function openDetailModal(index, cardTextEl) {
      selectedLogIndex = index;
      const obs = observations[index];
      if (!obs || !detailModal) return;

      if (detailMeta) detailMeta.textContent = `${obs.day} — ${obs.time}`;
      if (detailText) detailText.textContent = "";
      detailModal.classList.remove("hidden");

      const card = detailModal.querySelector(".modal-card") || detailModal;
      playObservationMeaning(obs, card, detailText, cardTextEl || null);
    }

    if (closeDetailModalBtn) {
      closeDetailModalBtn.addEventListener("click", function () {
        stopClickAudio();
        if (detailModal) detailModal.classList.add("hidden");
        selectedLogIndex = null;
      });
    }

    if (deleteLogBtn) {
      deleteLogBtn.addEventListener("click", async function () {
        if (selectedLogIndex === null) return;
        stopClickAudio();
        observations.splice(selectedLogIndex, 1);
        persistLocalObservations();
        if (currentObsIndex >= observations.length) {
          currentObsIndex = Math.max(0, observations.length - 1);
        }
        selectedLogIndex = null;
        if (detailModal) detailModal.classList.add("hidden");
        renderObservations();

        try {
          await syncToSharedJson();
        } catch (_) {}
      });
    }

    function fitDesktopCards() {
      const count = observations.length;
      if (!count) return;

      const width = typoContainer.clientWidth || window.innerWidth;
      const height = typoContainer.clientHeight || (window.innerHeight - 60);

      let cols = Math.ceil(Math.sqrt(count * (width / Math.max(height, 1))));
      cols = Math.max(1, Math.min(cols, count, 8));
      let rows = Math.max(1, Math.ceil(count / cols));

      function applyLayout(c, r, textPx, metaPx, padPx, gapPx) {
        const idxPx = Math.max(7, Math.round(metaPx * 0.85));
        typoContainer.style.setProperty("--grid-cols", String(c));
        typoContainer.style.setProperty("--grid-rows", String(r));
        typoContainer.style.setProperty("--card-text-size", textPx.toFixed(1) + "px");
        typoContainer.style.setProperty("--card-meta-size", metaPx.toFixed(1) + "px");
        typoContainer.style.setProperty("--card-index-size", idxPx + "px");
        typoContainer.style.setProperty("--card-pad", padPx + "px");
        typoContainer.style.setProperty("--card-gap", gapPx + "px");
      }

      const cellW = width / cols;
      const cellH = height / rows;

      let gapPx = count > 16 ? 6 : 10;
      let padPx = count > 16 ? 8 : 14;
      let textPx = Math.min(44, Math.max(9, Math.min(cellH * 0.34, cellW * 0.085)));
      let metaPx = Math.max(7.5, Math.min(12, textPx * 0.42));

      applyLayout(cols, rows, textPx, metaPx, padPx, gapPx);

      const cards = typoContainer.querySelectorAll(".overview-card");

      function hasAnyOverflow() {
        if (typoContainer.scrollHeight > typoContainer.clientHeight + 1 || typoContainer.scrollWidth > typoContainer.clientWidth + 1) {
          return true;
        }
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i];
          const textEl = card.querySelector(".overview-text");
          if (card.scrollHeight > card.clientHeight + 1 || card.scrollWidth > card.clientWidth + 1) {
            return true;
          }
          if (textEl && (textEl.scrollHeight > textEl.clientHeight + 1 || textEl.scrollWidth > textEl.clientWidth + 1)) {
            return true;
          }
        }
        return false;
      }

      let guard = 0;
      while (hasAnyOverflow() && guard < 80) {
        if (textPx > 8) {
          textPx = Math.max(8, textPx * 0.9);
          metaPx = Math.max(7, textPx * 0.42);
        } else if (padPx > 4) {
          padPx = Math.max(4, padPx - 2);
        } else if (gapPx > 3) {
          gapPx = Math.max(3, gapPx - 2);
        } else if (cols < Math.min(count, 10)) {
          cols++;
          rows = Math.max(1, Math.ceil(count / cols));
          textPx = Math.max(8, textPx * 1.08);
        } else {
          break;
        }
        applyLayout(cols, rows, textPx, metaPx, padPx, gapPx);
        guard++;
      }
    }

    function renderObservations() {
      const keepOutline = typoContainer.classList.contains("outline-mode");
      const keepDrift = typoContainer.classList.contains("drift-active");
      typoContainer.innerHTML = "";

      if (!observations.length) {
        typoContainer.className = "typography-container desktop-overview";
        if (keepOutline) typoContainer.classList.add("outline-mode");
        if (keepDrift) typoContainer.classList.add("drift-active");
        typoContainer.style.setProperty("--grid-cols", "1");
        typoContainer.style.setProperty("--grid-rows", "1");
        typoContainer.innerHTML = `<article class="overview-card"><p class="overview-text"></p></article>`;
        if (obsSwipeCounter) obsSwipeCounter.textContent = "0 / 0";
        return;
      }

      if (isMobileView()) {
        typoContainer.className = "typography-container";
        if (keepOutline) typoContainer.classList.add("outline-mode");
        if (keepDrift) typoContainer.classList.add("drift-active");

        if (currentObsIndex >= observations.length) {
          currentObsIndex = observations.length - 1;
        }

        const obs = observations[currentObsIndex];
        const card = document.createElement("article");
        card.className = "mobile-single-obs";
        card.innerHTML = `
          <div class="mobile-single-meta">${obs.day} · ${obs.time}</div>
          <p class="mobile-single-text"></p>
          <div class="mobile-swipe-hint">← SWIPE VOOR VOLGENDE · TIK VOOR GELUID &amp; OPTIES</div>
        `;
        const mobileTextEl = card.querySelector(".mobile-single-text");
        card.addEventListener("click", function () {
          openDetailModal(currentObsIndex, mobileTextEl);
        });
        typoContainer.appendChild(card);

        if (obsSwipeCounter) {
          obsSwipeCounter.textContent = `${currentObsIndex + 1} / ${observations.length}`;
        }
      } else {
        typoContainer.className = "typography-container desktop-overview";
        if (keepOutline) typoContainer.classList.add("outline-mode");
        if (keepDrift) typoContainer.classList.add("drift-active");

        observations.forEach(function (obs, idx) {
          const card = document.createElement("article");
          card.className = "overview-card";
          card.innerHTML = `
            <div class="overview-meta">${obs.day} · ${obs.time}</div>
            <p class="overview-text"></p>
            <div class="overview-index">#${String(idx + 1).padStart(2, "0")}</div>
          `;
          const cardTextEl = card.querySelector(".overview-text");
          card.addEventListener("click", function () {
            openDetailModal(idx, cardTextEl);
          });
          typoContainer.appendChild(card);
        });

        requestAnimationFrame(fitDesktopCards);
      }
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
        try {
          inputEl.showPicker();
        } catch (_) {
          inputEl.focus();
        }
      } else {
        inputEl.focus();
      }
    }

    if (inputDay) {
      inputDay.addEventListener("click", function () { openNativePicker(inputDay); });
    }
    if (inputTime) {
      inputTime.addEventListener("click", function () { openNativePicker(inputTime); });
    }

    if (openAddModalBtn && addModal) {
      openAddModalBtn.addEventListener("click", function () {
        if (addForm) addForm.reset();
        addModal.classList.remove("hidden");
      });
    }

    if (closeAddModalBtn && addModal) {
      closeAddModalBtn.addEventListener("click", function () {
        addModal.classList.add("hidden");
      });
    }

    if (addForm) {
      addForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const rawDate = inputDay ? inputDay.value : "";
        const rawTime = inputTime ? inputTime.value : "";
        const textEl = document.getElementById("input-text");
        const text = textEl ? textEl.value.trim().toUpperCase() : "";

        if (rawDate && rawTime && text) {
          observations.push({
            day: formatDateString(rawDate),
            time: formatTimeString(rawTime),
            text: text
          });
          persistLocalObservations();
          currentObsIndex = observations.length - 1;
          addForm.reset();
          if (addModal) addModal.classList.add("hidden");
          renderObservations();

          try {
            await syncToSharedJson();
          } catch (_) {}
        }
      });
    }

    const toggleStyleBtn = document.getElementById("toggle-style");
    const toggleDriftBtn = document.getElementById("toggle-drift");

    if (toggleStyleBtn) {
      toggleStyleBtn.addEventListener("click", function () {
        typoContainer.classList.toggle("outline-mode");
      });
    }

    if (toggleDriftBtn) {
      toggleDriftBtn.addEventListener("click", function () {
        const isActive = typoContainer.classList.toggle("drift-active");
        toggleDriftBtn.textContent = isActive ? "DRIFT: ON" : "DRIFT: OFF";
      });
    }

    window.addEventListener("resize", renderObservations);
    renderObservations();
    loadSharedOrInitialObservations();
  }

  // 4. Photo Gallery
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
    } catch (_) {}

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

    function stepPhoto(delta) {
      if (!photos.length) return;
      currentPhotoIndex = (currentPhotoIndex + delta + photos.length) % photos.length;
      renderGallery();
    }

    if (photoPrevBtn) photoPrevBtn.addEventListener("click", function () { stepPhoto(-1); });
    if (photoNextBtn) photoNextBtn.addEventListener("click", function () { stepPhoto(1); });
    enableSwipe(
      galleryGrid,
      function () { stepPhoto(1); },
      function () { stepPhoto(-1); }
    );

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
      itemDiv.addEventListener("click", function () {
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
        photos.forEach(function (photoItem, index) {
          galleryGrid.appendChild(createPhotoElement(photoItem, index));
        });
      }
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
      deletePhotoBtn.onclick = function () {
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
          if (photoModal) photoModal.classList.add("hidden");
          renderGallery();
        }
      };
    }

    if (closePhotoModalBtn) {
      closePhotoModalBtn.onclick = function () {
        if (photoModal) photoModal.classList.add("hidden");
        selectedPhotoIndex = null;
      };
    }

    window.addEventListener("resize", renderGallery);
    renderGallery();
  }
});

// Editie 05: De pagina is één dag (alleen op aparte pagina actief)
(function initEdition05Day() {
  const section = document.getElementById("edition-05-day");
  const track = document.getElementById("day-timeline-track");
  const hourEl = document.getElementById("day-clock-hour");
  const phaseEl = document.getElementById("day-clock-phase");

  if (!section || !track || !hourEl || !phaseEl) return;

  const PX_PER_HOUR = 150;
  const TOTAL_HOURS = 24;
  track.style.height = TOTAL_HOURS * PX_PER_HOUR + "px";

  const streetArtifacts = [
    { hour: 0, xPct: 18, tilt: -3, title: "Verdwaald winkelkarretje", note: "Blijft haken achter een stoeprand" },
    { hour: 2, xPct: 62, tilt: 4, title: "Vergeten paraplu", note: "Binnenstebuiten in de wind" },
    { hour: 4, xPct: 30, tilt: -2, title: "Melkkrat voor bakkerij", note: "Eerste metaalklik op het asfalt" },
    { hour: 6, xPct: 70, tilt: 2, title: "Koffiekop op een paaltje", note: "Laatste slok koud geworden" },
    { hour: 8, xPct: 14, tilt: -1, title: "Losgeslagen krant", note: "Schuift langs schoenpunten" },
    { hour: 10, xPct: 56, tilt: 3, title: "Gele markeringstape", note: "Om een scheur in de stoep" },
    { hour: 12, xPct: 24, tilt: 0, title: "Zonnebril op een bankje", note: "Hard licht, korte schaduwen" },
    { hour: 14, xPct: 68, tilt: -2, title: "Krijttekeningen op tegels", note: "Halverwege uitgeveegd" },
    { hour: 16, xPct: 20, tilt: 2, title: "Verdwaalde ballon", note: "Vast in een lage boomtak" },
    { hour: 18, xPct: 58, tilt: -3, title: "Groene bezorgtas", note: "Even neergezet tegen gevel" },
    { hour: 20, xPct: 16, tilt: 1, title: "Neonschijn op natte klinkers", note: "Eerste reflecties na schemer" },
    { hour: 22, xPct: 64, tilt: -4, title: "Eenzame linkerhandschoen", note: "Bij de nachtbushalte" },
    { hour: 23, xPct: 36, tilt: 2, title: "Knipperende straatlantaarn", note: "Telt de laatste stappen" }
  ];

  for (let h = 0; h < TOTAL_HOURS; h++) {
    const band = document.createElement("div");
    band.className = "day-hour-band";
    band.style.top = h * PX_PER_HOUR + "px";
    track.appendChild(band);
  }

  streetArtifacts.forEach(function (item) {
    const el = document.createElement("article");
    el.className = "day-street-item";
    const hh = String(item.hour).padStart(2, "0") + ":00";
    el.style.top = item.hour * PX_PER_HOUR + 22 + "px";
    el.style.left = item.xPct + "%";
    el.style.transform = `rotate(${item.tilt}deg)`;
    el.innerHTML = `
      <span class="item-hour">${hh}</span>
      <span class="item-title">${item.title}</span>
      <span class="item-note">${item.note}</span>
    `;
    track.appendChild(el);
  });

  function getDayAtmosphere(hourFloat) {
    if (hourFloat < 5 || hourFloat >= 21) {
      return { phase: "NACHT", bg: "#090b10", fg: "#eef1f7", accent: "#7aa2ff" };
    }
    if (hourFloat < 9) {
      return { phase: "OCHTEND", bg: "#f4ede2", fg: "#181818", accent: "#c85a17" };
    }
    if (hourFloat < 17) {
      return { phase: "DAG", bg: "#ffffff", fg: "#111111", accent: "#0057b8" };
    }
    return { phase: "AVOND", bg: "#1f1826", fg: "#f7efe6", accent: "#ff9f43" };
  }

  function updateDayByScroll() {
    const rect = section.getBoundingClientRect();
    const trackHeight = track.offsetHeight || TOTAL_HOURS * PX_PER_HOUR;
    const rawOffset = -rect.top;
    const clampedOffset = Math.max(0, Math.min(trackHeight - 1, rawOffset));
    const hourFloat = Math.min(23.99, clampedOffset / PX_PER_HOUR);

    const wholeHour = Math.floor(hourFloat);
    const minutes = Math.floor((hourFloat - wholeHour) * 60);
    const formattedTime =
      String(wholeHour).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");

    const mood = getDayAtmosphere(hourFloat);
    hourEl.textContent = formattedTime;
    phaseEl.textContent = mood.phase;

    section.style.setProperty("--day-bg", mood.bg);
    section.style.setProperty("--day-fg", mood.fg);
    section.style.setProperty("--day-accent", mood.accent);
  }

  window.addEventListener("scroll", updateDayByScroll, { passive: true });
  window.addEventListener("resize", updateDayByScroll);
  updateDayByScroll();
})();

// Editie 06: De pagina is een kaart (alleen op editie06.html actief)
(function initEdition06Map() {
  const section = document.getElementById("edition-06-map");
  const viewport = document.getElementById("map-viewport");
  const world = document.getElementById("map-world");
  const pinsLayer = document.getElementById("map-pins-layer");
  const routeLine = document.getElementById("map-route-line");
  const readoutEl = document.getElementById("map-coord-readout");
  const inspectorMeta = document.getElementById("map-inspector-meta");
  const inspectorText = document.getElementById("map-inspector-text");

  if (!section || !viewport || !world || !pinsLayer || !routeLine) return;

  const WORLD_W = 1600;
  const WORLD_H = 1100;

  let savedObs = [];
  try {
    const raw = JSON.parse(localStorage.getItem("street_observations_v4"));
    if (Array.isArray(raw)) savedObs = raw;
  } catch (_) {}

  const baseNodes = [
    { day: "MON 5 OCT", time: "2AM", text: "MAN STANDING STILL IN THE RAIN WITHOUT UMBRELLA", x: 240, y: 520, zone: "KADE & REGENKRUISING" },
    { day: "TUE 6 OCT", time: "11PM", text: "NEON SIGN FLICKERING ABOVE EMPTY TRAM STOP", x: 545, y: 517, zone: "TRAMKRUISING" },
    { day: "WED 7 OCT", time: "8AM", text: "WARM BAKERY STEAM CROSSING COLD PAVEMENT", x: 740, y: 260, zone: "BLOK NOORD" },
    { day: "THU 8 OCT", time: "4PM", text: "SHADOWS STRETCHING ACROSS PARK PATH", x: 1180, y: 340, zone: "PARKSTROOK" },
    { day: "FRI 9 OCT", time: "9PM", text: "LATE CYCLIST BELL ECHOING BETWEEN BRICK WALLS", x: 760, y: 760, zone: "BLOK ZUID" }
  ];

  const fallbackCoords = [
    { x: 310, y: 320, zone: "KADE NOORD" },
    { x: 920, y: 240, zone: "NOORDPAS" },
    { x: 1260, y: 680, zone: "OOSTKANT" },
    { x: 520, y: 860, zone: "ZUIDKRUISING" }
  ];

  const nodes = savedObs.length
    ? savedObs.map(function (obs, idx) {
        const match = baseNodes.find(function (b) { return b.text === obs.text; });
        if (match) return match;
        const fb = fallbackCoords[idx % fallbackCoords.length];
        return {
          day: obs.day || "WAARNEMING",
          time: obs.time || "",
          text: obs.text || "",
          x: fb.x + ((idx * 37) % 90),
          y: fb.y + ((idx * 29) % 70),
          zone: fb.zone
        };
      })
    : baseNodes;

  let panX = 0;
  let panY = 0;

  function applyPan() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const minX = Math.min(0, vw - WORLD_W);
    const minY = Math.min(0, vh - WORLD_H);
    panX = Math.max(minX, Math.min(0, panX));
    panY = Math.max(minY, Math.min(0, panY));
    world.style.transform = `translate(${panX}px, ${panY}px)`;

    if (readoutEl) {
      const centerX = Math.abs(panX) + vw / 2;
      const zoneName = centerX < 520 ? "KADE & WATER" : centerX < 980 ? "STADSBLOKKEN & TRAM" : "PARKSTROOK";
      readoutEl.textContent = `SECTIE: ${zoneName}`;
    }
  }

  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  viewport.addEventListener("pointerdown", function (e) {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    panX += e.clientX - lastX;
    panY += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    applyPan();
  });

  window.addEventListener("pointerup", function () {
    dragging = false;
  });

  window.addEventListener("keydown", function (e) {
    if (!section.offsetParent) return;
    const step = 60;
    if (e.key === "ArrowLeft") { panX += step; applyPan(); }
    if (e.key === "ArrowRight") { panX -= step; applyPan(); }
    if (e.key === "ArrowUp") { panY += step; applyPan(); }
    if (e.key === "ArrowDown") { panY -= step; applyPan(); }
  });

  function playPinTone(idx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220 + idx * 45, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.23);
      setTimeout(function () { ctx.close().catch(function () {}); }, 260);
    } catch (_) {}
  }

  pinsLayer.innerHTML = "";
  const points = [];

  nodes.forEach(function (node, idx) {
    points.push(`${node.x},${node.y}`);

    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "map-pin";
    pin.style.left = node.x + "px";
    pin.style.top = node.y + "px";
    pin.textContent = `${String(idx + 1).padStart(2, "0")} · ${node.time}`;

    pin.addEventListener("click", function (e) {
      e.stopPropagation();
      pinsLayer.querySelectorAll(".map-pin").forEach(function (p) { p.classList.remove("active"); });
      pin.classList.add("active");
      if (inspectorMeta) inspectorMeta.textContent = `${node.day} · ${node.time} — ${node.zone}`;
      if (inspectorText) inspectorText.textContent = node.text;
      playPinTone(idx);
    });

    pinsLayer.appendChild(pin);
  });

  routeLine.setAttribute("points", points.join(" "));
  window.addEventListener("resize", applyPan);
  applyPan();
})();
