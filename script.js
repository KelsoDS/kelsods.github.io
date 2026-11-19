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

  if (menuToggle) menuToggle.addEventListener("click", () => setMenu(!navDrawer?.classList.contains("open")));
  if (closeDrawer) closeDrawer.addEventListener("click", () => setMenu(false));
  if (drawerOverlay) drawerOverlay.addEventListener("click", () => setMenu(false));

  const isMobile = () => window.innerWidth < 900;

  // Helper voor veeggebaren op telefoon
  function attachSwipe(el, onPrev, onNext) {
    if (!el) return;
    let startX = 0;
    el.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });
    el.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < 45) return;
      if (dx < 0) onNext();
      else onPrev();
    }, { passive: true });
  }

// 2. Typography Log: Behoud eigen tekst & originele standaardteksten
  const typoContainer = document.getElementById("typography-container");
  if (typoContainer) {
    const originalDefaultObs = [
      { day: "MON 5 OCT", time: "2AM", text: "MAN STANDING STILL IN THE RAIN WITHOUT UMBRELLA" },
      { day: "TUE 6 OCT", time: "11PM", text: "NEON SIGN FLICKERING ABOVE EMPTY TRAM STOP" },
      { day: "THU 8 OCT", time: "4PM", text: "PIGEON RIDING THE METRO FOR THREE STOPS" },
      { day: "FRI 9 OCT", time: "1AM", text: "TWO STRANGERS SHARING HEADPHONES ON BENCH" },
      { day: "SAT 10 OCT", time: "6PM", text: "SHOPPING CART FLOATING IN THE CANAL" },
      { day: "SUN 11 OCT", time: "9AM", text: "CHALK MESSAGE WASHING AWAY ON PAVEMENT" }
    ];

    function loadSavedObservations() {
      const keys = ["street_observations_v4", "street_observations", "observations"];
      for (const key of keys) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (_) {}
      }
      return originalDefaultObs;
    }

    let observations = loadSavedObservations();
    let activeIndex = 0;
    let selectedIndex = null;

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

    prevBtn.addEventListener("click", () => stepObs(-1));
    nextBtn.addEventListener("click", () => stepObs(1));
    attachSwipe(typoContainer, () => stepObs(-1), () => stepObs(1));

    const detailModal = document.getElementById("detail-modal");
    const detailMeta = document.getElementById("detail-meta");
    const detailText = document.getElementById("detail-text");
    const deleteLogBtn = document.getElementById("delete-log-btn");
    const closeDetailBtn = document.getElementById("close-detail-modal");

    function openDetail(idx) {
      selectedIndex = idx;
      const item = observations[idx];
      if (!item || !detailModal) return;
      detailMeta.textContent = `${item.day} — ${item.time}`;
      detailText.textContent = item.text;
      detailModal.classList.remove("hidden");
    }

    if (closeDetailBtn) {
      closeDetailBtn.addEventListener("click", () => {
        detailModal.classList.add("hidden");
        selectedIndex = null;
      });
    }

    if (deleteLogBtn) {
      deleteLogBtn.addEventListener("click", () => {
        if (selectedIndex === null) return;
        observations.splice(selectedIndex, 1);
        localStorage.setItem("street_observations_v4", JSON.stringify(observations));
        if (activeIndex >= observations.length) activeIndex = Math.max(0, observations.length - 1);
        detailModal.classList.add("hidden");
        selectedIndex = null;
        renderTypography();
      });
    }

    function renderTypography() {
      typoContainer.innerHTML = "";
      if (!observations.length) {
        typoContainer.innerHTML = `<div class="overview-card"><p class="overview-text">GEEN OBSERVATIES</p></div>`;
        counterEl.textContent = "0 / 0";
        return;
      }

      if (isMobile()) {
        typoContainer.className = "typography-container";
        const obs = observations[activeIndex];
        const card = document.createElement("article");
        card.className = "overview-card";
        card.innerHTML = `
          <div class="overview-meta">${obs.day} · ${obs.time}</div>
          <p class="overview-text">${obs.text}</p>
          <div class="overview-index">VEEG HORIZONTAAL OF GEBRUIK KNOPPEN · TIK VOOR OPTIES</div>
        `;
        card.addEventListener("click", () => openDetail(activeIndex));
        typoContainer.appendChild(card);
        counterEl.textContent = `${activeIndex + 1} / ${observations.length}`;
      } else {
        typoContainer.className = "typography-container desktop-overview";
        observations.forEach((obs, idx) => {
          const card = document.createElement("article");
          card.className = "overview-card";
          card.innerHTML = `
            <div class="overview-meta">${obs.day} · ${obs.time}</div>
            <p class="overview-text">${obs.text}</p>
            <div class="overview-index">#${String(idx + 1).padStart(2, "0")}</div>
          `;
          card.addEventListener("click", () => openDetail(idx));
          typoContainer.appendChild(card);
        });
      }
    }

    const openAddBtn = document.getElementById("open-add-modal");
    const addModal = document.getElementById("observation-modal");
    const closeAddBtn = document.getElementById("close-modal");
    const addForm = document.getElementById("add-log-form");
    const inputDay = document.getElementById("input-day");
    const inputTime = document.getElementById("input-time");

    [inputDay, inputTime].forEach((el) => {
      if (el) {
        el.addEventListener("click", () => {
          if (typeof el.showPicker === "function") {
            try { el.showPicker(); } catch (_) { el.focus(); }
          }
        });
      }
    });

    if (openAddBtn && addModal) {
      openAddBtn.addEventListener("click", () => {
        if (addForm) addForm.reset();
        addModal.classList.remove("hidden");
      });
    }
    if (closeAddBtn && addModal) {
      closeAddBtn.addEventListener("click", () => addModal.classList.add("hidden"));
    }

    function formatDate(dateStr) {
      const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const [y, m, d] = dateStr.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return `${days[dt.getDay()]} ${d} ${months[dt.getMonth()]}`;
    }

    function formatTime(timeStr) {
      let [h, min] = timeStr.split(":").map(Number);
      const suffix = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return min === 0 ? `${h}${suffix}` : `${h}:${String(min).padStart(2, "0")}${suffix}`;
    }

    if (addForm) {
      addForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = document.getElementById("input-text").value.trim().toUpperCase();
        if (!inputDay.value || !inputTime.value || !text) return;

        observations.push({
          day: formatDate(inputDay.value),
          time: formatTime(inputTime.value),
          text
        });
        localStorage.setItem("street_observations_v4", JSON.stringify(observations));
        activeIndex = observations.length - 1;
        addForm.reset();
        addModal.classList.add("hidden");
        renderTypography();
      });
    }

    window.addEventListener("resize", renderTypography);
    renderTypography();
  }
