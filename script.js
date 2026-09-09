/* ==========================================================================
   CPG Design — общ скрипт за всички страници
   1) Смяна на език (използва вградените преводи от languages/translations.js)
   2) Контактна форма
   3) Галерия със снимки само от локалните папки + lightbox за уголемяване
   ========================================================================== */

/* ---------- 1) ЕЗИК ---------- */
const supportedLanguages = ["bg", "en", "de", "gr"];
const fallbackLanguage = "bg";

function applyLanguage(lang) {
  if (!window.TRANSLATIONS || !window.TRANSLATIONS[lang]) lang = fallbackLanguage;
  const translations = window.TRANSLATIONS[lang];

  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (translations[key] !== undefined) {
      element.textContent = translations[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (translations[key] !== undefined) {
      element.setAttribute("placeholder", translations[key]);
    }
  });

  if (translations.meta_title) document.title = translations.meta_title;

  localStorage.setItem("siteLanguage", lang);

  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

function initLanguageSwitcher() {
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => applyLanguage(button.dataset.lang));
  });

  const savedLanguage = localStorage.getItem("siteLanguage");
  const browserLanguage = (navigator.language || "").slice(0, 2);
  applyLanguage(
    savedLanguage ||
      (supportedLanguages.includes(browserLanguage) ? browserLanguage : fallbackLanguage)
  );
}

/* ---------- 1b) МОБИЛНО МЕНЮ (Android / iPhone) ---------- */
function initMobileNav() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("mainMenu");
  if (!toggle || !menu) return;

  const isTouch = window.matchMedia("(hover: none)").matches;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // На телефон/таблет няма "hover", затова падащото меню "Продукти"
  // се отваря с първо докосване, а второто докосване на подменюто отваря страницата.
  document.querySelectorAll(".dropdown > a").forEach((link) => {
    link.addEventListener("click", (e) => {
      if (!isTouch) return;
      const parent = link.parentElement;
      const alreadyOpen = parent.classList.contains("open");
      if (!alreadyOpen) {
        e.preventDefault();
        document.querySelectorAll(".dropdown.open").forEach((d) => d.classList.remove("open"));
        parent.classList.add("open");
      }
    });
  });

  // Затваряме мобилното меню след избор на страница/секция
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------- 2) КОНТАКТНА ФОРМА ---------- */
function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const lang = document.documentElement.lang || fallbackLanguage;
    const t = (window.TRANSLATIONS && window.TRANSLATIONS[lang]) || {};
    alert(t.form_success || "Благодарим ви за съобщението! Ще се свържем с вас скоро.");
    this.reset();
  });
}

/* ---------- 3) ГАЛЕРИЯ + LIGHTBOX (снимки само от локалните папки) ---------- */
let lightboxImages = [];
let lightboxIndex = 0;

function ensureLightboxMarkup() {
  if (document.getElementById("lightbox")) return;

  const overlay = document.createElement("div");
  overlay.id = "lightbox";
  overlay.className = "lightbox";
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="Close">&times;</button>
    <button class="lightbox-prev" aria-label="Previous">&#10094;</button>
    <img class="lightbox-image" src="" alt="">
    <button class="lightbox-next" aria-label="Next">&#10095;</button>
    <div class="lightbox-counter"></div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  overlay.querySelector(".lightbox-prev").addEventListener("click", () => showLightboxImage(lightboxIndex - 1));
  overlay.querySelector(".lightbox-next").addEventListener("click", () => showLightboxImage(lightboxIndex + 1));

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showLightboxImage(lightboxIndex - 1);
    if (e.key === "ArrowRight") showLightboxImage(lightboxIndex + 1);
  });

  // Swipe наляво/надясно за смяна на снимка на телефон/таблет
  let touchStartX = 0;
  overlay.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  overlay.addEventListener("touchend", (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const delta = touchEndX - touchStartX;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) showLightboxImage(lightboxIndex + 1);
    else showLightboxImage(lightboxIndex - 1);
  }, { passive: true });
}

function showLightboxImage(index) {
  if (lightboxImages.length === 0) return;
  lightboxIndex = (index + lightboxImages.length) % lightboxImages.length;
  const overlay = document.getElementById("lightbox");
  const img = overlay.querySelector(".lightbox-image");
  img.src = lightboxImages[lightboxIndex].src;
  img.alt = lightboxImages[lightboxIndex].alt;
  overlay.querySelector(".lightbox-counter").textContent =
    `${lightboxIndex + 1} / ${lightboxImages.length}`;
}

function openLightbox(images, index) {
  ensureLightboxMarkup();
  lightboxImages = images;
  showLightboxImage(index);
  const overlay = document.getElementById("lightbox");
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const overlay = document.getElementById("lightbox");
  if (!overlay) return;
  overlay.classList.remove("open");
  document.body.style.overflow = "";
}

/**
 * Изгражда галерия, чиито снимки идват САМО от локална папка на сайта.
 * @param {string} containerId - id на елемента, в който да се вмъкне галерията
 * @param {string} folder      - относителен път до папката със снимки (напр. "MasivD")
 * @param {string[]} fileNames - имена на файловете вътре в папката
 * @param {string} altText     - алтернативен текст за снимките (за SEO и достъпност)
 */
function buildGallery(containerId, folder, fileNames, altText) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const images = fileNames.map((name) => ({
    src: `${folder}/${name}`,
    alt: altText || name
  }));

  container.innerHTML = "";
  images.forEach((image, index) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = "gallery-thumb";
    thumb.setAttribute("aria-label", image.alt);

    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.alt;
    img.loading = "lazy";

    thumb.appendChild(img);
    thumb.addEventListener("click", () => openLightbox(images, index));
    container.appendChild(thumb);
  });
}

/* ---------- ИНИЦИАЛИЗАЦИЯ ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initLanguageSwitcher();
  initMobileNav();
  initContactForm();
});
