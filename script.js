document.addEventListener("DOMContentLoaded", async function () {

  // ==========================================
  // 1. UNIFORM HAMBURGER MENU & DRAWER
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
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      navDrawer && navDrawer.classList.contains("open") ? closeMenu() : openMenu();
    });
  }
  if (closeDrawer) closeDrawer.addEventListener("click", closeMenu);
  if (drawerOverlay) drawerOverlay.addEventListener("click", closeMenu);

  function showNotice(message) {
    const noticeModal = document.getElementById("notice-modal");
    const noticeMessage = document.getElementById("notice-message");
    const closeNoticeBtn = document.getElementById("close-notice-btn");

    if (noticeModal && noticeMessage) {
      noticeMessage.textContent = message;
      noticeModal.classList.remove("hidden");
      if (closeNoticeBtn) {
        closeNoticeBtn.onclick = () => noticeModal.classList.add("hidden");
      }
    }
  }


  // ==========================================
  // 2. GITHUB REST API OPSLAG (VOOR ALLE BEZOEKERS)
  // ==========================================
  const githubModal = document.getElementById("github-modal");
  const openGithubSettingsBtn = document.getElementById("open-github-settings");
  const closeGithubModalBtn = document.getElementById("close-github-modal");
  const githubSettingsForm = document.getElementById("github-settings-form");

  function getGithubConfig() {
    try {
      return JSON.parse(localStorage.getItem("street_obs_github_cfg")) || null;
    } catch {
      return null;
    }
  }

  if (openGithubSettingsBtn && githubModal) {
    openGithubSettingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeMenu();
      const cfg = getGithubConfig();
      if (cfg) {
        document.getElementById("gh-owner").value = cfg.owner || "";
        document.getElementById("gh-repo").value = cfg.repo || "";
        document.getElementById("gh-branch").value = cfg.branch || "main";
        document.getElementById("gh-token").value = cfg.token || "";
      }
      githubModal.classList.remove("hidden");
    });
  }

  if (closeGithubModalBtn && githubModal) {
    closeGithubModalBtn.addEventListener("click", () => githubModal.classList.add("hidden"));
  }

  if (githubSettingsForm) {
    githubSettingsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const cfg = {
        owner: document.getElementById("gh-owner").value.trim(),
        repo: document.getElementById("gh-repo").value.trim(),
        branch: document.getElementById("gh-branch").value.trim() || "main",
        token: document.getElementById("gh-token").value.trim()
      };
      localStorage.setItem("street_obs_github_cfg", JSON.stringify(cfg));
      githubModal.classList.add("hidden");
      showNotice("GitHub koppeling opgeslagen! Nieuwe teksten en foto's worden nu direct gepubliceerd.");
    });
  }

  // Publieke data ophalen uit data.json (werkt voor elke bezoeker zonder token)
  async function loadPublicData() {
    const defaultData = {
      observations: [
        { day: "MON 5 OCT", time: "2AM", text: "MAN STANDING STILL IN THE RAIN WITHOUT UMBRELLA" },
        { day: "TUE 6 OCT", time: "11PM", text: "NEON SIGN FLICKERING ABOVE EMPTY TRAM STOP" }
      ],
      photos: []
    };

    try {
      const response = await fetch("./data.json?t=" + Date.now(), { cache: "no-store" });
      if (response.ok) {
        const json = await response.json();
        return {
          observations: Array.isArray(json.observations) ? json.observations : defaultData.observations,
          photos: Array.isArray(json.photos) ? json.photos : []
        };
      }
    } catch (e) {
      console.warn("Kon publieke data.json nog niet laden, fallback actief.");
    }
    return defaultData;
  }

  // Bestand uploaden/bijwerken op GitHub via de REST API
  async function githubPutFile(path, base64Content, commitMessage) {
    const cfg = getGithubConfig();
    if (!cfg || !cfg.token || !cfg.owner || !cfg.repo) {
      throw new Error("NO_CONFIG");
    }

    const apiUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
    const headers = {
      "Authorization": `Bearer ${cfg.token}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    };

    // Controleer of bestand al bestaat om de SHA-hash op te halen
    let sha = null;
    const checkRes = await fetch(`${apiUrl}?ref=${cfg.branch}`, { headers });
    if (checkRes.ok) {
      const existing = await checkRes.json();
      sha = existing.sha;
    }

    const body = {
      message: commitMessage,
      content: base64Content,
      branch: cfg.branch
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify(body)
    });

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      throw new Error(errData.message || "GitHub API fout");
    }
    return await putRes.json();
  }

  function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  async function savePublicDataToGithub(dataObj, commitMessage) {
    const jsonStr = JSON.stringify(dataObj, null, 2);
    await githubPutFile("data.json", utf8ToBase64(jsonStr), commitMessage);
  }

  let sharedData = await loadPublicData();


  // ==========================================
  // 3. SVG TYPOGRAPHY LOG (INDEX.HTML)
  // ==========================================
  const typoContainer = document.getElementById("typography-container");

  if (typoContainer) {
    let selectedLogIndex = null;

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
      return minutes === 0 ? `${hours}${period}` : `${hours}:${minutes < 10 ? "0" + minutes : minutes}${period}`;
    }

    // Zet elke regel om naar schaalbare SVG-vectoren die 100% binnen het scherm passen
    function renderSvgLogs() {
      typoContainer.innerHTML = "";
      const observations = sharedData.observations;
      if (!observations || observations.length === 0) return;

      // Bouw regels op basis van aantal observaties zodat niets wordt afgekapt
      const rows = [];
      const wordsPerRow = observations.length > 8 ? 8 : (observations.length > 4 ? 6 : 4);

      observations.forEach((obs, obsIndex) => {
        const metaPrefix = `${obs.day} ${obs.time}`;
        const words = obs.text.split(/\s+/).filter(Boolean);

        if (words.length === 0) {
          rows.push({ meta: metaPrefix, text: "", obsIndex });
        } else {
          for (let i = 0; i < words.length; i += wordsPerRow) {
            rows.push({
              meta: i === 0 ? metaPrefix : "",
              text: words.slice(i, i + wordsPerRow).join(" "),
              obsIndex
            });
          }
        }
      });

      const containerWidth = window.innerWidth;
      const containerHeight = typoContainer.clientHeight || (window.innerHeight - 60);
      const rowHeight = Math.floor(containerHeight / rows.length);

      rows.forEach((row) => {
        const rowDiv = document.createElement("div");
        rowDiv.className = "svg-log-row";
        rowDiv.style.height = `${rowHeight}px`;

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", `0 0 ${containerWidth} ${Math.max(12, rowHeight)}`);
        svg.setAttribute("preserveAspectRatio", "none");

        const fontSize = Math.max(8, rowHeight * 0.84);
        const baselineY = rowHeight * 0.82;

        if (row.meta && row.text) {
          const metaWidth = Math.min(containerWidth * 0.28, row.meta.length * (fontSize * 0.45));
          const gap = 12;
          const textWidth = Math.max(20, containerWidth - metaWidth - gap);

          const metaText = document.createElementNS(svgNS, "text");
          metaText.setAttribute("x", "0");
          metaText.setAttribute("y", baselineY);
          metaText.setAttribute("font-size", Math.max(7, fontSize * 0.42));
          metaText.setAttribute("textLength", metaWidth);
          metaText.setAttribute("lengthAdjust", "spacingAndGlyphs");
          metaText.setAttribute("class", "svg-text-meta");
          metaText.textContent = row.meta;

          const mainText = document.createElementNS(svgNS, "text");
          mainText.setAttribute("x", metaWidth + gap);
          mainText.setAttribute("y", baselineY);
          mainText.setAttribute("font-size", fontSize);
          mainText.setAttribute("textLength", textWidth);
          mainText.setAttribute("lengthAdjust", "spacingAndGlyphs");
          mainText.setAttribute("class", "svg-text-main");
          mainText.textContent = row.text;

          svg.appendChild(metaText);
          svg.appendChild(mainText);
        } else {
          const singleText = document.createElementNS(svgNS, "text");
          singleText.setAttribute("x", "0");
          singleText.setAttribute("y", baselineY);
          singleText.setAttribute("font-size", fontSize);
          singleText.setAttribute("textLength", containerWidth);
          singleText.setAttribute("lengthAdjust", "spacingAndGlyphs");
          singleText.setAttribute("class", row.meta ? "svg-text-meta" : "svg-text-main");
          singleText.textContent = row.meta || row.text;

          svg.appendChild(singleText);
        }

        rowDiv.appendChild(svg);
        rowDiv.addEventListener("click", () => openDetailModal(row.obsIndex));
        typoContainer.appendChild(rowDiv);
      });
    }

    // Herbereken SVG-schaling direct bij verkleinen/vergroten van het venster
    window.addEventListener("resize", renderSvgLogs);

    // Detail & Verwijder Modal
    const detailModal = document.getElementById("detail-modal");
    const detailMeta = document.getElementById("detail-meta");
    const detailText = document.getElementById("detail-text");
    const closeDetailModalBtn = document.getElementById("close-detail-modal");
    const deleteLogBtn = document.getElementById("delete-log-btn");

    function openDetailModal(index) {
      selectedLogIndex = index;
      const obs = sharedData.observations[index];
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
      deleteLogBtn.addEventListener("click", async () => {
        if (selectedLogIndex === null) return;
        deleteLogBtn.disabled = true;
        deleteLogBtn.textContent = "BEZIG...";

        const backup = [...sharedData.observations];
        sharedData.observations.splice(selectedLogIndex, 1);

        try {
          await savePublicDataToGithub(sharedData, "Delete street observation");
          renderSvgLogs();
          detailModal.classList.add("hidden");
        } catch (err) {
          sharedData.observations = backup;
          if (err.message === "NO_CONFIG") {
            detailModal.classList.add("hidden");
            githubModal.classList.remove("hidden");
          } else {
            showNotice("Fout bij verwijderen op GitHub: " + err.message);
          }
        } finally {
          deleteLogBtn.disabled = false;
          deleteLogBtn.textContent = "VERWIJDEREN";
          selectedLogIndex = null;
        }
      });
    }

    // Add Observation Modal (Lege velden + kalender/klok bij klikken)
    const openAddModalBtn = document.getElementById("open-add-modal");
    const addModal = document.getElementById("observation-modal");
    const closeAddModalBtn = document.getElementById("close-modal");
    const addForm = document.getElementById("add-log-form");
    const submitLogBtn = document.getElementById("submit-log-btn");
    const inputDay = document.getElementById("input-day");
    const inputTime = document.getElementById("input-time");

    function openNativePicker(el) {
      if (!el) return;
      if (typeof el.showPicker === "function") {
        try { el.showPicker(); } catch { el.focus(); }
      } else {
        el.focus();
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
      addForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const rawDate = inputDay.value;
        const rawTime = inputTime.value;
        const text = document.getElementById("input-text").value.trim().toUpperCase();

        if (!rawDate || !rawTime || !text) return;

        submitLogBtn.disabled = true;
        submitLogBtn.textContent = "UPLOADING...";

        const newEntry = {
          day: formatDateString(rawDate),
          time: formatTimeString(rawTime),
          text
        };

        sharedData.observations.push(newEntry);

        try {
          await savePublicDataToGithub(sharedData, `Add observation: ${newEntry.day}`);
          renderSvgLogs();
          addForm.reset();
          addModal.classList.add("hidden");
        } catch (err) {
          sharedData.observations.pop();
          if (err.message === "NO_CONFIG") {
            addModal.classList.add("hidden");
            githubModal.classList.remove("hidden");
          } else {
            showNotice("Upload mislukt: " + err.message);
          }
        } finally {
          submitLogBtn.disabled = false;
          submitLogBtn.textContent = "PUBLICEREN NAAR GITHUB";
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

    renderSvgLogs();
  }


  // ==========================================
  // 4. FOTOGALERIJ MET GITHUB UPLOAD (PHOTOS.HTML)
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
    let selectedPhotoIndex = null;

    function renderGallery() {
      galleryGrid.innerHTML = "";
      const allPhotos = defaultPhotos.concat(sharedData.photos || []);

      allPhotos.forEach((photoItem, index) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "gallery-item";

        const img = document.createElement("img");
        img.alt = "Observation " + (index + 1);

        if (index < defaultPhotos.length) {
          const num = photoItem;
          const attempts = [
            `./beeld/Artboard ${num}.jpg`,
            `./beeld/Artboard%20${num}.jpg`,
            `beeld/Artboard ${num}.jpg`,
            `./beeld/Artboard ${num}.JPG`
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
          // Publiek pad op GitHub (bijv. ./beeld/upload-1732028400.jpg)
          img.src = `./${photoItem}?t=${Date.now()}`;
        }

        itemDiv.appendChild(img);
        itemDiv.onclick = () => {
          selectedPhotoIndex = index;
          modalImg.src = img.src;
          photoModal.classList.remove("hidden");
        };

        galleryGrid.appendChild(itemDiv);
      });
    }

    function compressImageToBase64(file, maxWidth = 1400, quality = 0.8) {
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
            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            resolve(dataUrl.split(",")[1]); // Puur base64 zonder prefix voor GitHub API
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (triggerUploadBtn && fileInput) {
      triggerUploadBtn.onclick = () => {
        if (!getGithubConfig()) {
          githubModal.classList.remove("hidden");
          return;
        }
        fileInput.click();
      };

      fileInput.onchange = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        triggerUploadBtn.disabled = true;
        triggerUploadBtn.textContent = "UPLOADING...";

        try {
          for (const file of Array.from(files)) {
            const base64Data = await compressImageToBase64(file);
            const fileName = `beeld/obs-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
            await githubPutFile(fileName, base64Data, `Upload photo ${fileName}`);
            sharedData.photos.push(fileName);
          }
          await savePublicDataToGithub(sharedData, "Update gallery photos list");
          renderGallery();
          showNotice("Foto's staan op GitHub! Het kan ca. 30 seconden duren voordat GitHub Pages ze wereldwijd toont.");
        } catch (err) {
          if (err.message === "NO_CONFIG") {
            githubModal.classList.remove("hidden");
          } else {
            showNotice("Upload naar GitHub mislukt: " + err.message);
          }
        } finally {
          triggerUploadBtn.disabled = false;
          triggerUploadBtn.textContent = "+ UPLOAD PHOTO";
          fileInput.value = "";
        }
      };
    }

    if (deletePhotoBtn) {
      deletePhotoBtn.onclick = async () => {
        if (selectedPhotoIndex === null) return;
        const uploadedIndex = selectedPhotoIndex - defaultPhotos.length;

        if (uploadedIndex < 0) {
          photoModal.classList.add("hidden");
          showNotice("Vaste archieffoto's (Artboard 1-10) kunnen niet via deze knop worden verwijderd.");
          return;
        }

        deletePhotoBtn.disabled = true;
        deletePhotoBtn.textContent = "DELETING...";
        const backup = [...sharedData.photos];
        sharedData.photos.splice(uploadedIndex, 1);

        try {
          await savePublicDataToGithub(sharedData, "Remove photo from gallery");
          photoModal.classList.add("hidden");
          renderGallery();
        } catch (err) {
          sharedData.photos = backup;
          showNotice("Verwijderen mislukt: " + err.message);
        } finally {
          deletePhotoBtn.disabled = false;
          deletePhotoBtn.textContent = "DELETE PHOTO";
          selectedPhotoIndex = null;
        }
      };
    }

    if (closePhotoModalBtn) {
      closePhotoModalBtn.onclick = () => {
        photoModal.classList.add("hidden");
        selectedPhotoIndex = null;
      };
    }

    renderGallery();
  }
});
