document.addEventListener("DOMContentLoaded", function () {
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

  // 3. Typography Log + data.json sync
  const typoContainer = document.getElementById("typography-container");

  if (typoContainer) {
    let dataDoc = {
      observations: [
        { day: "MON 5 OCT", time: "2AM", text: "MAN STANDING STILL IN THE RAIN WITHOUT UMBRELLA" },
        { day: "TUE 6 OCT", time: "11PM", text: "NEON SIGN FLICKERING ABOVE EMPTY TRAM STOP" }
      ],
      photos: []
    };

    let observations = dataDoc.observations.slice();
    try {
      const saved = JSON.parse(localStorage.getItem("street_observations_v4"));
      if (Array.isArray(saved) && saved.length > 0) {
        observations = saved;
        dataDoc.observations = saved;
      }
    } catch (_) {}

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

    function buildDataJsonString() {
      dataDoc.observations = observations.slice();
      return JSON.stringify(dataDoc, null, 2);
    }

    function downloadDataJson() {
      const blob = new Blob([buildDataJsonString()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    async function pushDataJsonToGitHub(token) {
      const owner = "KelsoDS";
      const repo = "kelsods.github.io";
      const path = "data.json";
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

      const headers = {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      };

      const getRes = await fetch(`${apiUrl}?ref=main`, { headers });
      if (!getRes.ok) {
        throw new Error("Kan data.json op GitHub niet ophalen (controleer token & repo-rechten).");
      }
      const existingFile = await getRes.json();

      const jsonText = buildDataJsonString();
      const base64Content = btoa(unescape(encodeURIComponent(jsonText)));

      const putRes = await fetch(apiUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: "Update observations in data.json",
          content: base64Content,
          sha: existingFile.sha,
          branch: "main"
        })
      });

      if (!putRes.ok) {
        throw new Error("Opslaan naar data.json op GitHub mislukt.");
      }
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
      deleteLogBtn.addEventListener("click", function () {
        if (selectedLogIndex === null) return;
        stopClickAudio();
        observations.splice(selectedLogIndex, 1);
        dataDoc.observations = observations.slice();
        localStorage.setItem("street_observations_v4", JSON.stringify(observations));
        if (currentObsIndex >= observations.length) {
          currentObsIndex = Math.max(0, observations.length - 1);
        }
        selectedLogIndex = null;
        if (detailModal) detailModal.classList.add("hidden");
        renderObservations();
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

    function loadObservationsFromDataJson() {
      fetch("./data.json?t=" + Date.now(), { cache: "no-store" })
        .then(function (res) {
          if (!res.ok) throw new Error("Geen data.json");
          return res.json();
        })
        .then(function (data) {
          if (data && typeof data === "object" && !Array.isArray(data)) {
            dataDoc = Object.assign({ observations: [], photos: [] }, data);
          }
          const list = Array.isArray(data) ? data : (data && Array.isArray(data.observations) ? data.observations : null);
          if (list && list.length > 0) {
            observations = list;
            currentObsIndex = 0;
            renderObservations();
          }
        })
        .catch(function () {
          // Valt terug op localStorage of standaardlijst
        });
    }

    const openAddModalBtn = document.getElementById("open-add-modal");
    const addModal = document.getElementById("observation-modal");
    const closeAddModalBtn = document.getElementById("close-modal");
    const addForm = document.getElementById("add-log-form");
    const inputDay = document.getElementById("input-day");
    const inputTime = document.getElementById("input-time");

    // Optioneel GitHub token-veld & export-knoppen in het toevoeg-venster
    let syncPanel = null;
    let tokenInput = null;
    let syncStatus = null;

    if (addForm) {
      syncPanel = document.createElement("div");
      syncPanel.style.marginTop = "16px";
      syncPanel.style.paddingTop = "12px";
      syncPanel.style.borderTop = "1px solid #262626";
      syncPanel.innerHTML = `
        <label for="gh-token-input" style="margin-top:0;">GITHUB TOKEN (OPTIONEEL VOOR DIRECTE SYNC NAAR DATA.JSON)</label>
        <input type="password" id="gh-token-input" placeholder="github_pat_..." autocomplete="off" />
        <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
          <button type="button" class="btn" id="copy-data-json-btn">KOPIEER DATA.JSON</button>
          <button type="button" class="btn" id="download-data-json-btn">DOWNLOAD DATA.JSON</button>
        </div>
        <div id="gh-sync-status" style="margin-top:8px; font-size:0.75rem; color:#bbbbbb;"></div>
      `;
      addForm.appendChild(syncPanel);

      tokenInput = document.getElementById("gh-token-input");
      syncStatus = document.getElementById("gh-sync-status");

      const savedToken = localStorage.getItem("street_gh_token") || "";
      if (tokenInput && savedToken) {
        tokenInput.value = savedToken;
      }

      const copyBtn = document.getElementById("copy-data-json-btn");
      const dlBtn = document.getElementById("download-data-json-btn");

      if (copyBtn) {
        copyBtn.addEventListener("click", function () {
          const textToCopy = buildDataJsonString();
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(function () {
              if (syncStatus) syncStatus.textContent = "data.json gekopieerd naar klembord.";
            });
          }
        });
      }

      if (dlBtn) {
        dlBtn.addEventListener("click", function () {
          downloadDataJson();
          if (syncStatus) syncStatus.textContent = "data.json gedownload.";
        });
      }
    }

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
        const savedToken = localStorage.getItem("street_gh_token") || "";
        if (tokenInput && savedToken) tokenInput.value = savedToken;
        if (syncStatus) syncStatus.textContent = "";
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
        const token = tokenInput ? tokenInput.value.trim() : "";

        if (token) {
          localStorage.setItem("street_gh_token", token);
        }

        if (rawDate && rawTime && text) {
          observations.push({
            day: formatDateString(rawDate),
            time: formatTimeString(rawTime),
            text: text
          });
          dataDoc.observations = observations.slice();
          localStorage.setItem("street_observations_v4", JSON.stringify(observations));
          currentObsIndex = observations.length - 1;
          renderObservations();

          if (token) {
            if (syncStatus) syncStatus.textContent = "Bezig met wegschrijven naar data.json op GitHub...";
            try {
              await pushDataJsonToGitHub(token);
              if (syncStatus) syncStatus.textContent = "Opgeslagen in data.json op GitHub!";
              setTimeout(function () {
                if (addModal) addModal.classList.add("hidden");
              }, 700);
              return;
            } catch (err) {
              if (syncStatus) syncStatus.textContent = err.message + " Gebruik Kopieer of Download data.json.";
              return;
            }
          } else {
            downloadDataJson();
            if (addModal) addModal.classList.add("hidden");
          }
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
    loadObservationsFromDataJson();
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
