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

  const isMobile = () => window.innerWidth < 900;

  function attachSwipe(el, onPrev, onNext) {
    if (!el) return;
    let startX = 0;
    el.addEventListener("touchstart", function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });
    el.addEventListener("touchend", function (e) {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < 45) return;
      if (dx < 0) onNext();
      else onPrev();
    }, { passive: true });
  }

  // 2. Typography Log: Telefoon = 1 observatie + vegen | Laptop = hele overzicht
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

    let activeIndex = 0;
    let selectedLogIndex = null;

    const pager = document.createElement("div");
    pager.className = "mobile-pager";
    pager.innerHTML = `
      <button type="button" class="btn" id="prev-obs">← VORIGE</button>
      <span class="pager-status" id="obs-counter"></span>
      <button type="button" class="btn" id="next-obs">VOLGENDE →</button>
    `;
    document.body.appendChild(pager);

    const prevBtn = document.getElementById("prev-obs");
    const nextBtn = document.getElementById("next-obs");
    const counterEl = document.getElementById("obs-counter");

    function stepObs(delta) {
      if (!observations.length) return;
      activeIndex = (activeIndex + delta + observations.length) % observations.length;
      renderTypography();
    }

    if (prevBtn) prevBtn.addEventListener("click", () => stepObs(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => stepObs(1));
    attachSwipe(typoContainer, () => stepObs(-1), () => stepObs(1));

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
          if (activeIndex >= observations.length) {
            activeIndex = Math.max(0, observations.length - 1);
          }
          selectedLogIndex = null;
          detailModal.classList.add("hidden");
          renderTypography();
        }
      });
    }

    function renderTypography() {
      const keepOutline = typoContainer.classList.contains("outline-mode");
      const keepDrift = typoContainer.classList.contains("drift-active");
      typoContainer.innerHTML = "";

      if (!observations.length) {
        typoContainer.className = "typography-container";
        if (keepOutline) typoContainer.classList.add("outline-mode");
        if (keepDrift) typoContainer.classList.add("drift-active");
        typoContainer.innerHTML = `<div class="overview-card"><p class="overview-text">GEEN OBSERVATIES</p></div>`;
        if (counterEl) counterEl.textContent = "0 / 0";
        return;
      }

      if (isMobile()) {
        typoContainer.className = "typography-container";
        if (keepOutline) typoContainer.classList.add("outline-mode");
        if (keepDrift) typoContainer.classList.add("drift-active");

        const obs = observations[activeIndex];
        const card = document.createElement("article");
        card.className = "overview-card";
        card.innerHTML = `
          <div class="overview-meta">${obs.day} · ${obs.time}</div>
          <p class="overview-text">${obs.text}</p>
          <div class="overview-index">VEEG OF GEBRUIK KNOPPEN · TIK VOOR OPTIES</div>
        `;
        card.addEventListener("click", () => openDetailModal(activeIndex));
        typoContainer.appendChild(card);

        if (counterEl) {
          counterEl.textContent = `${activeIndex + 1} / ${observations.length}`;
        }
      } else {
        typoContainer.className = "typography-container desktop-overview";
        if (keepOutline) typoContainer.classList.add("outline-mode");
        if (keepDrift) typoContainer.classList.add("drift-active");

        observations.forEach((obs, idx) => {
          const card = document.createElement("article");
          card.className = "overview-card";
          card.innerHTML = `
            <div class="overview-meta">${obs.day} · ${obs.time}</div>
            <p class="overview-text">${obs.text}</p>
            <div class="overview-index">#${String(idx + 1).padStart(2, "0")}</div>
          `;
          card.addEventListener("click", () => openDetailModal(idx));
          typoContainer.appendChild(card);
        });
      }
    }

    // Modal voor nieuwe observatie met kalender en klok
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
        } catch (err) {
          inputEl.focus();
        }
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
          activeIndex = observations.length - 1;
          addForm.reset();
          if (addModal) addModal.classList.add("hidden");
          renderTypography();
        }
      });
    }

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

    window.addEventListener("resize", renderTypography);
    renderTypography();
  }

  // 3. Photo Gallery: Telefoon = 1 foto + vegen | Laptop = raster
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
    let photoIdx = 0;

    const pager = document.createElement("div");
    pager.className = "mobile-pager";
    pager.innerHTML = `
      <button type="button" class="btn" id="prev-photo">← VORIGE</button>
      <span class="pager-status" id="photo-counter"></span>
      <button type="button" class="btn" id="next-photo">VOLGENDE →</button>
    `;
    document.body.appendChild(pager);

    const prevPhotoBtn = document.getElementById("prev-photo");
    const nextPhotoBtn = document.getElementById("next-photo");
    const photoCounter = document.getElementById("photo-counter");

    function stepPhoto(delta) {
      if (!photos.length) return;
      photoIdx = (photoIdx + delta + photos.length) % photos.length;
      renderGallery();
    }

    if (prevPhotoBtn) prevPhotoBtn.addEventListener("click", () => stepPhoto(-1));
    if (nextPhotoBtn) nextPhotoBtn.addEventListener("click", () => stepPhoto(1));
    attachSwipe(galleryGrid, () => stepPhoto(-1), () => stepPhoto(1));

    function buildGalleryItem(photoItem, index) {
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

      img.addEventListener("click", function () {
        if (!isMobile() && modalImg && photoModal) {
          selectedPhotoIndex = index;
          modalImg.src = img.src;
          photoModal.classList.remove("hidden");
        }
      });

      itemDiv.appendChild(img);
      return itemDiv;
    }

    function renderGallery() {
      galleryGrid.innerHTML = "";
      if (!photos.length) return;

      if (isMobile()) {
        galleryGrid.appendChild(buildGalleryItem(photos[photoIdx], photoIdx));
        if (photoCounter) {
          photoCounter.textContent = `${photoIdx + 1} / ${photos.length}`;
        }
      } else {
        photos.forEach((photoItem, index) => {
          galleryGrid.appendChild(buildGalleryItem(photoItem, index));
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
        for (let file of Array.from(files)) {
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
        photoIdx = photos.length - 1;
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
            if (photoIdx >= photos.length) {
              photoIdx = Math.max(0, photos.length - 1);
            }
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

    window.addEventListener("resize", renderGallery);
    renderGallery();
  }
});
