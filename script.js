document.addEventListener("DOMContentLoaded", function() {

  // ==========================================
  // 1. HAMBURGER MENU & NAVIGATIE (Beide pagina's)
  // ==========================================
  
  const btnToIndex = document.getElementById("btn-to-index");
  if (btnToIndex) {
    btnToIndex.onclick = function(e) {
      e.stopPropagation();
      window.location.href = "index.html";
    };
  }

  const menuToggle = document.getElementById("menu-toggle");
  const navDrawer = document.getElementById("nav-drawer");
  const closeDrawer = document.getElementById("close-drawer");

  if (menuToggle && navDrawer) {
    menuToggle.onclick = function(e) {
      e.stopPropagation();
      navDrawer.classList.toggle("open");
    };
  }

  if (closeDrawer && navDrawer) {
    closeDrawer.onclick = function(e) {
      e.stopPropagation();
      navDrawer.classList.remove("open");
    };
  }

  document.addEventListener("click", function(e) {
    if (navDrawer && navDrawer.classList.contains("open")) {
      if (!navDrawer.contains(e.target) && !menuToggle.contains(e.target)) {
        navDrawer.classList.remove("open");
      }
    }
  });


  // ==========================================
  // 2. FOTOGALERIJ LOGICA (Alleen op photos.html)
  // ==========================================
  
  const galleryGrid = document.getElementById("gallery-grid");
  
  // Als er geen fotogalerij op deze pagina staat (zoals op index.html), 
  // stopt het script hier direct, zodat jouw index-pagina met rust wordt gelaten!
  if (!galleryGrid) return; 

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

    photos.forEach(function(photoItem, index) {
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

        img.onerror = function() {
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

      itemDiv.onclick = function() {
        selectedPhotoIndex = index;
        modalImg.src = img.src;
        photoModal.classList.remove("hidden");
      };

      galleryGrid.appendChild(itemDiv);
    });
  }

  if (triggerUploadBtn && fileInput) {
    triggerUploadBtn.onclick = function() {
      fileInput.click();
    };

    fileInput.onchange = async function(e) {
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
        alert("Browsergeheugen vol! Verwijder enkele foto's.");
      }
      fileInput.value = "";
    };
  }

  function compressImage(file, maxWidth = 1200, quality = 0.7) {
    return new Promise(function(resolve) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
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
    deletePhotoBtn.onclick = function() {
      if (selectedPhotoIndex !== null) {
        const localIndex = selectedPhotoIndex - defaultPhotos.length;
        if (localIndex >= 0) {
          localPhotos.splice(localIndex, 1);
          localStorage.setItem("street_observation_photos", JSON.stringify(localPhotos));
          photos = defaultPhotos.concat(localPhotos);
        } else {
          alert("Vaste foto's uit de map 'beeld' kunnen niet via de browser worden verwijderd.");
        }
        selectedPhotoIndex = null;
        photoModal.classList.add("hidden");
        renderGallery();
      }
    };
  }

  if (closePhotoModalBtn) {
    closePhotoModalBtn.onclick = function() {
      photoModal.classList.add("hidden");
      selectedPhotoIndex = null;
    };
  }

  renderGallery();
});
