document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("add-log-form");
  const dayInput = document.getElementById("input-day");
  const timeInput = document.getElementById("input-time");
  const observationInput = document.getElementById("input-text");
  const errorMessage = document.getElementById("observation-error");

  if (!form || !dayInput || !timeInput || !observationInput) return;

  // Keep the native date/time pickers, while disallowing manual text entry.
  [dayInput, timeInput].forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key.length === 1 || event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
      }
    });
    input.addEventListener("paste", (event) => event.preventDefault());
    input.addEventListener("drop", (event) => event.preventDefault());
  });

  const profanityPattern = /\b(?:asshole|bastard|bitch(?:es)?|bullshit|cunt|damn|dick(?:head)?|fag(?:got)?|fuck(?:ed|er|ing|s)?|motherfucker|piss|prick|屁|shit(?:head|ty|s)?|slut|twat|whore|kanker|klootzak|kut|tyfus|tering|godverdomme)\b/i;

  function containsProfanity(value) {
    const normalized = value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[0]/g, "o")
      .replace(/[1!|]/g, "i")
      .replace(/[3]/g, "e")
      .replace(/[4@]/g, "a")
      .replace(/[5$]/g, "s")
      .replace(/[7]/g, "t");

    return profanityPattern.test(normalized);
  }

  function showError(message) {
    if (!errorMessage) return;
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }

  function clearError() {
    if (!errorMessage) return;
    errorMessage.textContent = "";
    errorMessage.hidden = true;
  }

  observationInput.addEventListener("input", () => {
    if (!containsProfanity(observationInput.value)) clearError();
  });

  form.addEventListener("submit", (event) => {
    const observation = observationInput.value.trim();
    if (containsProfanity(observation)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showError("Gebruik geen scheldwoorden in de observatie.");
      observationInput.focus();
      return;
    }

    // Convert the selected calendar/clock values to the log's existing format
    // for the original form handler, then restore the native picker controls.
    const dateValue = dayInput.value;
    const timeValue = timeInput.value;
    if (!dateValue || !timeValue) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showError("Kies een datum in de kalender en een tijd via de klok.");
      return;
    }

    const date = new Date(`${dateValue}T00:00:00Z`);
    const dayLabel = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC"
    }).format(date).toUpperCase();

    const [hourText, minute] = timeValue.split(":");
    const hour = Number(hourText);
    const meridiem = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    const timeLabel = `${displayHour}${minute === "00" ? "" : `:${minute}`}${meridiem}`;

    dayInput.type = "text";
    dayInput.value = dayLabel;
    timeInput.type = "text";
    timeInput.value = timeLabel;

    queueMicrotask(() => {
      dayInput.type = "date";
      timeInput.type = "time";
    });
  }, true);
});
