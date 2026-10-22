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

  document.addEventListener("click", (e) => {
    if (navDrawer && navDrawer.classList.contains("open")) {
      if (!navDrawer.contains(e.target) && menuToggle && !menuToggle.contains(e.target)) {
        closeMenu();
      }
    }
  });

  const btnToIndex = document.getElementById("btn-to-index");
  if (btnToIndex) {
    btnToIndex.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "index.html";
    });
  }

  function showNotice(message) {
    const noticeModal = document.getElementById("notice-modal");
    const noticeMessage = document.getElementById("notice-message");
    if (noticeModal && noticeMessage) {
      noticeMessage.textContent = message;
      noticeModal.classList.remove("hidden");
    }
  }

  const closeNoticeBtn = document.getElementById("close-notice-btn");
  if (closeNoticeBtn) {
    closeNoticeBtn.addEventListener("click", () => {
      const noticeModal = document.getElementById("notice-modal");
      if (noticeModal) noticeModal.classList.add("hidden");
    });
  }

  const logContainer = document.getElementById("log-display");

  if (logContainer) {
    const defaultObservations = [
      { day: "MON 5 OCT", time: "2AM", text: "5 PEOPLE WALKING NORTH TO SOUTH YELLING AND SINGING LOUD" },
      { day: "TUE 6 OCT", time: "10PM", text: "1 PERSON WALKING SOUTH TO NORTH STOPPED TO TIE SHOES" },
      { day: "WED 7 OCT", time: "8PM", text: "WALKING WITH LOUD MUSIC WEARING A RED HOODIE AND SLIPPERS" },
      { day: "THU 8 OCT", time: "1AM", text: "2 PEOPLE IN A HEATED ARGUMENT DRUNK WALKING IN THE MIDDLE OF ROAD" }
    ];

    let observations = JSON.parse(localStorage.getItem("street_observations_v4")) || defaultObservations;
    let selectedObservationIndex = null;

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
      logContainer.innerHTML = "";
      if (drawerLogCount) drawerLogCount.textContent = observations.length;

      const totalRows = observations.length;
      if (totalRows === 0) {
        logContainer.innerHTML = `
          <div style="font-family: monospace; color: #555; text-align: center; margin: auto; font-size: 0.9rem; letter-spacing: 1px;">
            GEEN OBSERVATIES BESCHIKBAAR.<br>KLIK OP "+ ADD OBS" OM EEN NIEUWE OBSERVATIE TOE TE VOEGEN.
          </div>`;
        return;
      }

      const availableHeight = Math.max(window.innerHeight - 120, 300);
      const baseFontSize = Math.max(1.6, Math.min(7.5, (availableHeight / totalRows) / 1.8));

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

          span.addEventListener("click", () => {
            selectedObservationIndex = index;
            if (infoTime) infoTime.textContent = `${item.day} — ${item.time}`;
            if (infoText) infoText.textContent = item.text;
            if (infoModal) infoModal.classList.remove("hidden");
          });

          row.appendChild(span);
        });

        logContainer.appendChild(row);
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

    window.addEventListener("resize", renderLogs);
    renderLogs();
  }

  const galleryGrid = document.getElementById("gallery-grid");

  if (galleryGrid) {
    const fileInput = document.getElementById("file-input");
    const triggerUploadBtn = document.getElementById("trigger-upload-btn");
    const photoModal = document.getElementById("photo-modal");
    const modalImg = document.getElementById("modal-img");
    const closePhotoModalBtn = document.getElementById("close-photo-modal");
    const deletePhotoBtn = document.getElementById("delete-photo-btn");
    const drawerPhotoCount = document.getElementById("drawer-log-count");

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
      if (drawerPhotoCount) drawerPhotoCount.textContent = photos.length;

      photos.forEach((photoItem, index) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "gallery-item";

        const img = document.createElement("img");
        img.alt = "Observation Photo " + (index + 1);

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

          img.onerror = function() {
            attemptIndex++;
            if (attemptIndex < attempts.length) {
              this.src = attempts[attemptIndex];
            } else {
              this.src = `https://placehold.co/600x600/111111/ffffff?text=ARTBOARD+${num}`;
            }
          };
        } else {
          img.src = photoItem;
        }

        itemDiv.appendChild(img);

        itemDiv.addEventListener("click", () => {
          selectedPhotoIndex = index;
          if (modalImg) modalImg.src = img.src;
          if (photoModal) photoModal.classList.remove("hidden");
        });

        galleryGrid.appendChild(itemDiv);
      });
    }

    if (triggerUploadBtn && fileInput) {
      triggerUploadBtn.addEventListener("click", () => {
        fileInput.click();
      });

      fileInput.addEventListener("change", async (e) => {
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
          showNotice("Browsergeheugen vol! Verwijder enkele foto's.");
        }
        fileInput.value = "";
      });
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

    if (deletePhotoBtn) {
      deletePhotoBtn.addEventListener("click", () => {
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
          if (photoModal) photoModal.classList.add("hidden");
          renderGallery();
        }
      });
    }

    if (closePhotoModalBtn) {
      closePhotoModalBtn.addEventListener("click", () => {
        if (photoModal) photoModal.classList.add("hidden");
        selectedPhotoIndex = null;
      });
    }

    renderGallery();
  }
});

