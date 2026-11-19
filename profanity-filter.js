document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("add-log-form");
  const observationInput = document.getElementById("input-text");
  if (!form || !observationInput) return;

  // Compare whole words and common obfuscated spellings while allowing normal punctuation.
  const prohibitedWords = new Set([
    "ass", "asshole", "bastard", "bitch", "bullshit", "crap", "cunt",
    "damn", "dick", "douche", "fuck", "fucker", "fucking", "motherfucker",
    "nigger", "nigga", "piss", "prick", "shit", "slut", "twat", "whore"
  ]);
  const substitutions = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s" };

  function containsCurseWord(text) {
    const normalized = text
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[013457@$]/g, character => substitutions[character])
      .replace(/[^a-z]/g, "");

    return [...prohibitedWords].some(word => normalized.includes(word));
  }

  // Capture before the app's submit handler so rejected text is never saved.
  form.addEventListener("submit", event => {
    if (!containsCurseWord(observationInput.value)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    observationInput.setCustomValidity("Gebruik geen scheldwoorden in de observatie.");
    observationInput.reportValidity();
  }, true);

  observationInput.addEventListener("input", () => observationInput.setCustomValidity(""));
});
