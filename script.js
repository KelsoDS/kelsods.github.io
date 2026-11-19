document.addEventListener("DOMContentLoaded", function () {
  // 1. Menu
  const menuToggle = document.getElementById("menu-toggle");
  const navDrawer = document.getElementById("nav-drawer");
  const closeDrawer = document.getElementById("close-drawer");
  const drawerOverlay = document.getElementById("drawer-overlay");

  function setMenu(open) {
    if (navDrawer) navDrawer.classList.toggle("open", open);
    if (drawerOverlay) drawerOverlay.classList.toggle("open", open);
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setMenu(!(navDrawer && navDrawer.classList.contains("open")));
    });
  }
  if (closeDrawer) {
    closeDrawer.addEventListener("click", function (e) {
      e.stopPropagation();
      setMenu(false);
    });
  }
  if (drawerOverlay) {
    drawerOverlay.addEventListener("click", function () {
      setMenu(false);
    });
  }

  const isMobile = () => window.innerWidth < 900;

  function attachSwipe(el, onLeft, onRight) {
    if (!el) return;
    let startX = 0;
    let startY = 0;
    let active = false;

    el.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      active = true;
    }, { passive: true });

    el.addEventListener("touchend", function (e) {
      if (!active) return;
      active = false;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) onLeft();
        else onRight();
      }
    }, { passive: true });
  }

  // 2. Web Audio + tekstlaag na klik
  let soundTimer = null;
  let audioCtx = null;

  function stopSoundLayer() {
    if (soundTimer) {
      clearInterval(soundTimer);
      soundTimer = null;
    }
    if (audioCtx && typeof audioCtx.close === "function") {
      audioCtx.close().catch(function () {});
      audioCtx = null;
    }
  }

  function playClickMeaning(obs, container) {
    stopSoundLayer();
    if (!obs || !container) return;

    let box = container.querySelector(".click-meaning-layer");
    if (!box) {
      box = document.createElement("div");
      box.className = "click-meaning-layer";
      container.appendChild(box);
    }
    box.textContent = "";

    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      try {
        audioCtx = new Ctx();
      } catch (_) {
        audioCtx = null;
      }
    }

    const chunks = [
      obs.time + " — ",
      "geluid: ",
      obs.text.toLowerCase()
    ];

    let idx = 0;
    soundTimer = setInterval(function () {
      if (idx < chunks.length) {
        box.textContent += chunks[idx];

        if (audioCtx) {
          try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = idx === 1 ? "triangle" : "sine";
            osc.frequency.setValueAtTime(200 + idx * 110, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.035, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.26);
          } catch (_) {}
        }
        idx++;
      } else {
        stopSoundLayer();
      }
    }, 450);
  }

  // 3. Typography Log
  const typoContainer = document.getElementById("typography-container");
  if (typoContainer) {
    const defaultObs = [
      { day: "MON 5 OCT", time: "2AM", text: "MAN STANDING STILL IN THE RAIN WITHOUT UMBRELLA" },
      { day: "TUE 6 OCT", time: "11PM", text: "NEON SIGN FLICKERING ABOVE EMPTY TRAM STOP" },
      { day: "THU 8 OCT", time: "4PM", text: "PIGEON RIDING THE METRO FOR THREE STOPS" },
      { day: "FRI 9 OCT", time: "1AM", text: "TWO STRANGERS SHARING HEADPHONES ON BENCH" },
      { day: "SAT 10 OCT", time: "6PM", text: "SHOPPING CART FLOATING IN THE CANAL" },
      { day: "SUN 11 OCT", time: "9AM", text: "CHALK MESSAGE WASHING AWAY ON PAVEMENT" }
    ];

    let observations = defaultObs.slice();
    try {
      const saved = JSON.parse(localStorage.getItem("street_observations_v4"));
      if (Array.isArray(saved) && saved.length > 0) observations = saved;
    } catch (_) {}

    let currentIdx = 0;
    let selectedIdx = null;

    const pager = document.createElement("div");
    pager.className = "mobile-swipe-bar";
    pager.innerHTML = `
      <button type="button" class="btn" id="obs-prev">← VORIGE</button>
      <span class="swipe-counter" id="obs-count">1 / 1</span>
      <button type="button" class="btn" id="obs-next">VOLGENDE →</button>
    `;
    document.body.appendChild(pager);

    const prevObsBtn = document.getElementById("obs-prev");
    const nextObsBtn = document.getElementById("obs-next");
    const obsCountEl = document.getElementById("obs-count");

    function stepObs(delta) {
      if (!observations.length) return;
      currentIdx = (currentIdx + delta + observations.length) % observations.length;
      renderObs();
    }

    if (prevObsBtn) prevObsBtn.addEventListener("click", function () { stepObs(-1); });
    if (nextObsBtn) nextObsBtn.addEventListener("click", function () { stepObs(1); });
    attachSwipe(typoContainer, function () { stepObs(1); }, function () { stepObs(-1); });

    const detailModal = document.getElementById("detail-modal");
    const detailMeta = document.getElementById("detail-meta");
    const detailText = document.getElementById("detail-text");
    const closeDetailBtn = document.getElementById("close-detail-modal");
    const deleteLogBtn = document.getElementById("delete-log-btn");

    function openDetail(index) {
      selectedIdx = index;
      const obs = observations[index];
      if (!obs || !detailModal) return;
      if (detailMeta) detailMeta.textContent = obs.day + " — " + obs.time;
      if (detailText) detailText.textContent = obs.text;
      detailModal.classList.remove("hidden");
      playClickMeaning(obs, detailModal.querySelector(".modal-card") || detailModal);
    }

    if (closeDetailBtn) {
      closeDetailBtn.addEventListener("click", function () {
        stopSoundLayer();
        if (detailModal) detailModal.classList.add("hidden");
        selectedIdx = null;
      });
    }

    if (deleteLogBtn) {
      deleteLogBtn.addEventListener("click", function () {
        if (selectedIdx === null) return;
        stopSoundLayer();
        observations.splice(selectedIdx, 1);
        localStorage.setItem("street_observations_v4", JSON.stringify(observations));
        if (currentIdx >= observations.length) currentIdx = Math.max(0, observations.length - 1);
        selectedIdx = null;
        if (detailModal) detailModal.classList.add("hidden");
        renderObs();
      });
    }

    function renderObs() {
      const hasOutline = typoContainer.classList.contains("outline-mode");
      const hasDrift = typoContainer.classList.contains("drift-active");
      typoContainer.innerHTML = "";

      if (!observations.length) {
        typoContainer.className = "typography-container";
        if (hasOutline) typoContainer.classList.add("outline-mode");
        if (hasDrift) typoContainer.classList.add("drift-active");
        typoContainer.innerHTML = '<article class="overview-card"><p class="overview-text">GEEN OBSERVATIES</p></article>';
        if (obsCountEl) obsCountEl.textContent = "0 / 0";
        return;
      }

      if (isMobile()) {
        typoContainer.className = "typography-container";
        if (hasOutline) typoContainer.classList.add("outline-mode");
        if (hasDrift) typoContainer.classList.add("drift-active");
        if (currentIdx >= observations.length) currentIdx = observations.length - 1;

        const obs = observations[currentIdx];
        const card = document.createElement("article");
        card.className = "mobile-single-obs";
        card.innerHTML = `
          <div class="mobile-single-meta">${obs.day} · ${obs.time}</div>
          <p class="mobile-single-text">${obs.text}</p>
          <div class="mobile-swipe-hint">← SWIPE · TIK VOOR GELUID</div>
        `;
        card.addEventListener("click", function () { openDetail(currentIdx); });
        typoContainer.appendChild(card);
        if (obsCountEl) obsCountEl.textContent = (currentIdx + 1) + " / " + observations.length;
      } else {
        typoContainer.className = "typography-container desktop-overview";
        if (hasOutline) typoContainer.classList.add("outline-mode");
        if (hasDrift) typoContainer.classList.add("drift-active");

        observations.forEach(function (obs, idx) {
          const card = document.createElement("article");
          card.className = "overview-card";
          card.innerHTML = `
            <div class="overview-meta">${obs.day} · ${obs.time}</div>
            <p class="overview-text">${obs.text}</p>
            <div class="overview-index">#${String(idx + 1).padStart(2, "0")}</div>
          `;
          card.addEventListener("click", function () { openDetail(idx); });
          typoContainer.appendChild(card);
        });
      }
    }

    function fmtDate(val) {
      const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const parts = val.split("-").map(Number);
      const dt = new Date(parts[0], parts[1] - 1, parts[2]);
      return days[dt.getDay()] + " " + parts[2] + " " + months[dt.getMonth()];
    }

    function fmtTime(val) {
      const parts = val.split(":").map(Number);
      let h = parts[0];
      const m = parts[1];
      const ap = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return m === 0 ? h + ap : h + ":" + String(m).padStart(2, "0") + ap;
    }

    const openAddBtn = document.getElementById("open-add-modal");
    const addModal = document.getElementById("observation-modal");
    const closeAddBtn = document.getElementById("close-modal");
    const addForm = document.getElementById("add-log-form");
    const inputDay = document.getElementById("input-day");
    const inputTime = document.getElementById("input-time");

    function openPicker(el) {
      if (!el) return;
      if (typeof el.showPicker === "function") {
        try { el.showPicker(); } catch (_) { el.focus(); }
      } else {
        el.focus();
      }
    }

    if (inputDay) inputDay.addEventListener("click", function () { openPicker(inputDay); });
    if (inputTime) inputTime.addEventListener("click", function () { openPicker(inputTime); });

    if (openAddBtn && addModal) {
      openAddBtn.addEventListener("click", function () {
        if (addForm) addForm.reset();
        addModal.classList.remove("hidden");
      });
    }
    if (closeAddBtn && addModal) {
      closeAddBtn.addEventListener("click", function () { addModal.classList.add("hidden"); });
    }

    if (addForm) {
      addForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const d = inputDay ? inputDay.value : "";
        const t = inputTime ? inputTime.value : "";
        const txtEl = document.getElementById("input-text");
        const txt = txtEl ? txtEl.value.trim().toUpperCase() : "";
        if (!d || !t || !txt) return;

        observations.push({ day: fmtDate(d), time: fmtTime(t), text: txt });
        localStorage.setItem("street_observations_v4", JSON.stringify(observations));
        currentIdx = observations.length - 1;
        addForm.reset();
        if (addModal) addModal.classList.add("hidden");
        renderObs();
      });
    }

    const toggleStyleBtn = document.getElementById("toggle-style");
    const toggleDriftBtn = document.getElementById("toggle-drift");
    if (toggleStyleBtn) {
      toggleStyleBtn.addEventListener("click", function () { typoContainer.classList.toggle("outline-mode"); });
    }
    if (toggleDriftBtn) {
      toggleDriftBtn.addEventListener("click", function () {
        const on = typoContainer.classList.toggle("drift-active");
        toggleDriftBtn.textContent = on ? "DRIFT: ON" : "DRIFT: OFF";
      });
    }

    window.addEventListener("resize", renderObs);
    renderObs();
  }

  // 4. Photo Gallery
  const galleryGrid = document.getElementById("gallery-grid");
  if (galleryGrid) {
    const fileInput = document.getElementById("file-input");
    const triggerUploadBtn = document.getElementById("trigger-upload-btn");
    const photoModal = document.getElementById("photo-modal");
    const modalImg = document.getElementById("modal-img");
    const closePhotoBtn = document.getElementById("close-photo-modal");
    const deletePhotoBtn = document.getElementById("delete-photo-btn");

    const defaultPhotos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let localPhotos = [];
    try {
      localPhotos = JSON.parse(localStorage.getItem("street_observation_photos")) || [];
    } catch (_) {}

    let photos = defaultPhotos.concat(localPhotos);
    let pIdx = 0;
    let selPhotoIdx = null;

    const pBar = document.createElement("div");
    pBar.className = "mobile-swipe-bar";
    pBar.innerHTML = `
      <button type="button" class="btn" id="photo-prev">← VORIGE</button>
      <span class="swipe-counter" id="photo-count">1 / 1</span>
      <button type="button" class="btn" id="photo-next">VOLGENDE →</button>
    `;
    document.body.appendChild(pBar);

    const pPrev = document.getElementById("photo-prev");
    const pNext = document.getElementById("photo-next");
    const pCount = document.getElementById("photo-count");

    function stepPhoto(delta) {
      if (!photos.length) return;
      pIdx = (pIdx + delta + photos.length) % photos.length;
      renderPhotos();
    }

    if (pPrev) pPrev.addEventListener("click", function () { stepPhoto(-1); });
    if (pNext) pNext.addEventListener("click", function () { stepPhoto(1); });
    attachSwipe(galleryGrid, function () { stepPhoto(1); }, function () { stepPhoto(-1); });

    function makePhotoCard(item, index) {
      const wrap = document.createElement("div");
      wrap.className = "gallery-item";
      const img = document.createElement("img");
      img.alt = "Observation " + (index + 1);

      if (index < defaultPhotos.length) {
        const tries = [
          "./beeld/Artboard " + item + ".jpg",
          "./beeld/Artboard%20" + item + ".jpg",
          "beeld/Artboard " + item + ".jpg",
          "./beeld/Artboard " + item + ".JPG"
        ];
        let t = 0;
        img.src = tries[0];
        img.onerror = function () {
          t++;
          if (t < tries.length) this.src = tries[t];
          else wrap.style.display = "none";
        };
      } else {
        img.src = item;
      }

      wrap.appendChild(img);
      wrap.addEventListener("click", function () {
        selPhotoIdx = index;
        if (modalImg && photoModal) {
          modalImg.src = img.src;
          photoModal.classList.remove("hidden");
        }
      });
      return wrap;
    }

    function renderPhotos() {
      galleryGrid.innerHTML = "";
      if (!photos.length) return;

      if (isMobile()) {
        if (pIdx >= photos.length) pIdx = photos.length - 1;
        galleryGrid.appendChild(makePhotoCard(photos[pIdx], pIdx));
        if (pCount) pCount.textContent = (pIdx + 1) + " / " + photos.length;
      } else {
        photos.forEach(function (item, idx) {
          galleryGrid.appendChild(makePhotoCard(item, idx));
        });
      }
    }

    if (triggerUploadBtn && fileInput) {
      triggerUploadBtn.onclick = function () { fileInput.click(); };
      fileInput.onchange = function (e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        Promise.all(files.map(function (file) {
          return new Promise(function (resolve) {
            const reader = new FileReader();
            reader.onload = function (ev) {
              const im = new Image();
              im.onload = function () {
                const canvas = document.createElement("canvas");
                const maxW = 1200;
                let w = im.width;
                let h = im.height;
                if (w > maxW) {
                  h = Math.round((h * maxW) / w);
                  w = maxW;
                }
                canvas.width = w;
                canvas.height = h;
                canvas.getContext("2d").drawImage(im, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", 0.7));
              };
              im.src = ev.target.result;
            };
            reader.readAsDataURL(file);
          });
        })).then(function (added) {
          localPhotos = localPhotos.concat(added);
          localStorage.setItem("street_observation_photos", JSON.stringify(localPhotos));
          photos = defaultPhotos.concat(localPhotos);
          pIdx = photos.length - 1;
          renderPhotos();
          fileInput.value = "";
        });
      };
    }

    if (deletePhotoBtn) {
      deletePhotoBtn.onclick = function () {
        if (selPhotoIdx !== null) {
          const localPos = selPhotoIdx - defaultPhotos.length;
          if (localPos >= 0) {
            localPhotos.splice(localPos, 1);
            localStorage.setItem("street_observation_photos", JSON.stringify(localPhotos));
            photos = defaultPhotos.concat(localPhotos);
            if (pIdx >= photos.length) pIdx = Math.max(0, photos.length - 1);
          }
          selPhotoIdx = null;
          if (photoModal) photoModal.classList.add("hidden");
          renderPhotos();
        }
      };
    }

    if (closePhotoBtn) {
      closePhotoBtn.onclick = function () {
        if (photoModal) photoModal.classList.add("hidden");
        selPhotoIdx = null;
      };
    }

    window.addEventListener("resize", renderPhotos);
    renderPhotos();
  }
});
