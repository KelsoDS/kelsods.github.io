const initialObservations = [
  {
    id: '1',
    day: 'MON',
    date: '5 OCT',
    time: '2AM',
    people: '5 PEOPLE WALKING NORTH TO SOUTH',
    details: 'YELLING AND SINGING LOUD',
    sizeClass: 'dynamic-text-lg'
  },
  {
    id: '2',
    day: 'TUE',
    date: '6 OCT',
    time: '10PM',
    people: '1 PERSON WALKING SOUTH TO NORTH',
    details: 'STOPPED TO TIE SHOE',
    sizeClass: 'dynamic-text-md'
  },
  {
    id: '3',
    day: 'WED',
    date: '7 OCT',
    time: '8PM',
    people: 'WALKING WITH LOUD MUSIC',
    details: 'WEARING A RED HOODIE, SHORTS AND SLIPPERS',
    sizeClass: 'dynamic-text-md'
  },
  {
    id: '4',
    day: 'THU',
    date: '8 OCT',
    time: '1AM',
    people: '2 PEOPLE IN A HEATED ARGUMENT',
    details: 'DRUNK, WALKING IN THE MIDDLE OF THE ROAD',
    sizeClass: 'dynamic-text-lg'
  }
];

const state = {
  observations: [...initialObservations],
  solidMode: false,
  driftMode: false,
  beamerMode: false
};

const elements = {
  logDisplay: document.getElementById('log-display'),
  logCount: document.getElementById('log-count'),
  searchInput: document.getElementById('search-input'),
  resetSearch: document.getElementById('reset-search'),
  styleLabel: document.getElementById('style-label'),
  driftLabel: document.getElementById('drift-label'),
  beamerLabel: document.getElementById('beamer-label'),
  modal: document.getElementById('observation-modal'),
  detailModal: document.getElementById('detail-modal'),
  addLogForm: document.getElementById('add-log-form'),
  currentTime: document.getElementById('current-time')
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getSearchableText(item) {
  return `${item.day} ${item.date} ${item.time} ${item.people} ${item.details}`.toLowerCase();
}

function renderLogs(list = state.observations) {
  if (!elements.logDisplay) return;

  elements.logDisplay.innerHTML = '';
  if (elements.logCount) {
    elements.logCount.textContent = String(list.length);
  }

  if (list.length === 0) {
    elements.logDisplay.innerHTML = `
      <div class="empty-state">No street observations match this search.</div>
    `;
    return;
  }

  list.forEach((item) => {
    const row = document.createElement('div');
    row.className = `log-row ${item.sizeClass}`;

    const fullText = `${item.day} ${item.date} ${item.time} ${item.people} ${item.details}`;
    const words = fullText.split(/\s+/).filter(Boolean);

    words.forEach((word) => {
      const wordEl = document.createElement('span');
      wordEl.className = 'log-word';
      wordEl.innerHTML = escapeHtml(word);
      wordEl.addEventListener('click', (event) => {
        event.stopPropagation();
        document.querySelectorAll('.log-word').forEach((el) => el.classList.remove('active'));
        wordEl.classList.add('active');
        openDetailModal(item);
      });
      row.appendChild(wordEl);
    });

    row.addEventListener('click', () => openDetailModal(item));
    elements.logDisplay.appendChild(row);
  });
}

function openDetailModal(item) {
  if (!elements.detailModal) return;

  document.getElementById('detail-timestamp').textContent = `${item.day} ${item.date} @ ${item.time}`;
  document.getElementById('detail-content').textContent = `${item.people} ${item.details}`;
  document.getElementById('detail-scale-label').textContent = item.sizeClass.toUpperCase().replace('DYNAMIC-', '');
  elements.detailModal.classList.remove('hidden');
}

function closeDetailModal() {
  if (elements.detailModal) {
    elements.detailModal.classList.add('hidden');
  }
}

function closeModal() {
  if (elements.modal) {
    elements.modal.classList.add('hidden');
  }
}

function openModal() {
  if (elements.modal) {
    elements.modal.classList.remove('hidden');
  }
}

function updateClock() {
  if (!elements.currentTime) return;
  const now = new Date();
  elements.currentTime.textContent = `${now.toUTCString().split(' ')[4]} UTC`;
}

function syncUI() {
  document.body.classList.toggle('solid-style', state.solidMode);
  document.body.classList.toggle('drift-mode', state.driftMode);

  if (elements.styleLabel) {
    elements.styleLabel.textContent = state.solidMode ? 'SOLID' : 'OUTLINE';
  }

  if (elements.driftLabel) {
    elements.driftLabel.textContent = state.driftMode ? 'ACTIVE' : 'OFF';
  }

  if (elements.beamerLabel) {
    elements.beamerLabel.textContent = state.beamerMode ? 'NORMAL VIEW' : 'BEAMER MODE';
  }
}

function handleSearch(event) {
  const query = event.target.value.trim().toLowerCase();

  if (!query) {
    renderLogs(state.observations);
    if (elements.resetSearch) {
      elements.resetSearch.classList.add('hidden');
    }
    return;
  }

  const filtered = state.observations.filter((item) => getSearchableText(item).includes(query));
  renderLogs(filtered);

  if (elements.resetSearch) {
    elements.resetSearch.classList.remove('hidden');
  }
}

function resetSearch() {
  if (elements.searchInput) {
    elements.searchInput.value = '';
  }
  renderLogs(state.observations);
  if (elements.resetSearch) {
    elements.resetSearch.classList.add('hidden');
  }
}

function handleAddLog(event) {
  event.preventDefault();
  if (!elements.addLogForm) return;

  const day = document.getElementById('input-day')?.value.trim().toUpperCase();
  const date = document.getElementById('input-date')?.value.trim().toUpperCase();
  const time = document.getElementById('input-time')?.value.trim().toUpperCase();
  const people = document.getElementById('input-people')?.value.trim().toUpperCase();
  const details = document.getElementById('input-details')?.value.trim().toUpperCase();
  const sizeClass = document.getElementById('input-scale')?.value || 'dynamic-text-md';

  if (!day || !date || !time || !people || !details) {
    return;
  }

  state.observations.unshift({
    id: Date.now().toString(),
    day,
    date,
    time,
    people,
    details,
    sizeClass
  });

  renderLogs(state.observations);
  elements.addLogForm.reset();
  closeModal();
}

document.addEventListener('DOMContentLoaded', () => {
  renderLogs();
  syncUI();
  updateClock();
  setInterval(updateClock, 1000);

  document.getElementById('toggle-style')?.addEventListener('click', () => {
    state.solidMode = !state.solidMode;
    syncUI();
  });

  document.getElementById('toggle-drift')?.addEventListener('click', () => {
    state.driftMode = !state.driftMode;
    syncUI();
  });

  document.getElementById('toggle-beamer')?.addEventListener('click', () => {
    state.beamerMode = !state.beamerMode;
    syncUI();

    if (state.beamerMode && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (!state.beamerMode && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  });

  document.getElementById('toggle-modal')?.addEventListener('click', openModal);
  document.getElementById('close-modal')?.addEventListener('click', closeModal);
  document.getElementById('cancel-modal')?.addEventListener('click', closeModal);
  document.getElementById('close-detail-modal')?.addEventListener('click', closeDetailModal);

  elements.searchInput?.addEventListener('input', handleSearch);
  elements.resetSearch?.addEventListener('click', resetSearch);
  elements.addLogForm?.addEventListener('submit', handleAddLog);

  elements.modal?.addEventListener('click', (event) => {
    if (event.target === elements.modal) closeModal();
  });

  elements.detailModal?.addEventListener('click', (event) => {
    if (event.target === elements.detailModal) closeDetailModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal();
      closeDetailModal();
    }
  });
});
