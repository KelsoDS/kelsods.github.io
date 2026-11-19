// Replace the typography wall with readable, tappable observation cards on small screens.
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("typography-container");
  if (!container) return;

  const mobileQuery = window.matchMedia("(max-width: 700px)");

  function renderMobileCards() {
    if (!mobileQuery.matches) return;

    const rows = Array.from(container.querySelectorAll(":scope > .svg-log-row"));
    if (!rows.length) return;

    const cards = [];
    let currentCard = null;

    rows.forEach((row) => {
      const meta = row.querySelector(".svg-text-meta")?.textContent.trim() || "";
      const text = row.querySelector(".svg-text-main")?.textContent.trim() || "";

      if (meta || !currentCard) {
        currentCard = {
          meta,
          text: [],
          sourceRow: row
        };
        cards.push(currentCard);
      }
      if (text) currentCard.text.push(text);
    });

    const fragment = document.createDocumentFragment();
    cards.forEach((item) => {
      const card = document.createElement("article");
      card.className = "mobile-observation-card";
      card.setAttribute("role", "button");
      card.tabIndex = 0;

      const meta = document.createElement("p");
      meta.className = "mobile-observation-meta";
      meta.textContent = item.meta;

      const text = document.createElement("p");
      text.className = "mobile-observation-text";
      text.textContent = item.text.join(" ");

      const openDetails = () => item.sourceRow.click();
      card.addEventListener("click", openDetails);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetails();
        }
      });

      card.append(meta, text);
      fragment.appendChild(card);
    });

    container.replaceChildren(fragment);
  }

  const observer = new MutationObserver(renderMobileCards);
  observer.observe(container, { childList: true });
  renderMobileCards();
  mobileQuery.addEventListener("change", () => {
    if (mobileQuery.matches) renderMobileCards();
  });
});
