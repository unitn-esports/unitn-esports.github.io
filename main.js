
// --- Utility Functions ---
function qs(selector, parent = document) {
  return parent.querySelector(selector);
}
function qsa(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

// --- Navigation ---
function setupNavToggle() {
  const navToggle = qs('#navToggle');
  const mainNav = qs('#mainNav');
  if (!navToggle || !mainNav) return;
  navToggle.addEventListener('click', () => {
    mainNav.style.display = mainNav.style.display === 'block' ? '' : 'block';
  });
  navToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') navToggle.click();
  });
}

function setupSmoothScrolling() {
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href.length > 1) {
        const el = qs(href);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (window.innerWidth < 900 && qs('#mainNav')) qs('#mainNav').style.display = '';
        }
      }
    });
  });
}

function setupRevealOnScroll() {
  const revealEls = qsa('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => revealObserver.observe(el));
}

// --- Calendar Links ---
function setupCalendarLinks() {
  const iframe = qs('#gcalIframe');
  const gcalSubscribe = qs('#gcalSubscribe');
  const icsDownload = qs('#icsDownload');
  if (!iframe || !gcalSubscribe || !icsDownload) return;
  const placeholderId = 'your_calendar_id';
  const src = iframe.getAttribute('src') || '';
  let calId = null;
  try {
    const url = new URL(src);
    calId = url.searchParams.get('src') || null;
  } catch (e) {
    calId = null;
  }
  if (!calId) calId = placeholderId;
  gcalSubscribe.href = `https://www.google.com/calendar/render?cid=${encodeURIComponent(calId)}`;
  icsDownload.href = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calId)}/public/basic.ics`;
  icsDownload.setAttribute('download', 'events.ics');
}

// --- Internationalization (i18n) ---
let translations = {};

async function loadTranslations() {
  try {
    const res = await fetch('i18n.json');
    if (!res.ok) throw new Error('Failed to load i18n.json');
    translations = await res.json();
  } catch (err) {
    console.error('i18n load error:', err);
    translations = {
      en: { brand: 'UniTn E-sports', footer: { note: 'Made with ❤️ by Pietro Marini' } },
      it: { footer: { note: 'Fatto con ❤️ da Pietro Marini' } }
    };
  }
}

function getTranslation(lang, key) {
  if (!lang || !key) return '';
  const parts = key.split('.');
  let cur = translations[lang];
  for (const p of parts) {
    if (!cur) return '';
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : '';
}

function applyTranslations(lang) {
  document.documentElement.lang = lang;
  // elements with data-i18n
  qsa('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    let textVal = getTranslation(lang, key + '.text') || getTranslation(lang, key);
    if (!textVal) return;
    const img = el.querySelector('img');
    if (img) {
      const altVal = getTranslation(lang, key + '.alt') || textVal;
      try { img.alt = altVal; } catch (e) { }
      el.setAttribute('aria-label', textVal);
    } else {
      el.innerHTML = textVal;
    }
  });
  // placeholders
  qsa('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = getTranslation(lang, key);
    if (val) el.setAttribute('placeholder', val);
  });
  // footer note
  const footerNote = qs('.footer-note');
  if (footerNote) {
    footerNote.innerHTML = getTranslation(lang, 'footer.note');
  }
  // active language button
  qsa('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-lang') === lang);
  });
  localStorage.setItem('site-lang', lang);
  updateModalLabels(lang);
}

function updateModalLabels(lang) {
  const modalEventDateLabel = qs('#modalEventDateLabel');
  const modalEventParticipantsLabel = qs('#modalEventParticipantsLabel');
  const modalEventDescriptionLabel = qs('#modalEventDescriptionLabel');
  if (modalEventDateLabel) modalEventDateLabel.textContent = getTranslation(lang, 'modal.date');
  if (modalEventParticipantsLabel) modalEventParticipantsLabel.textContent = getTranslation(lang, 'modal.participants');
  if (modalEventDescriptionLabel) modalEventDescriptionLabel.textContent = getTranslation(lang, 'modal.description');
}

// --- Event Modal Logic ---
function setupEventModal(langRef) {
  const eventCards = qsa('.event-card');
  const eventModal = qs('#eventModal');
  const modalEventImg = qs('#modalEventImg');
  const modalEventTitle = qs('#modalEventTitle');
  const modalEventDate = qs('#modalEventDate');
  const modalEventParticipants = qs('#modalEventParticipants');
  const modalEventDescription = qs('#modalEventDescription');

  function showEventModal(card) {
    if (!eventModal) return;
    modalEventImg.src = card.getAttribute('data-img') || '';
    // Title translation support
    const titleKey = card.getAttribute('data-title');
    modalEventImg.alt = getTranslation(langRef.current, titleKey) || titleKey || '';
    modalEventTitle.textContent = getTranslation(langRef.current, titleKey) || titleKey || '';

    // Description translation support
    const descKey = card.getAttribute('data-description');
    const descVal = getTranslation(langRef.current, descKey) || descKey || '';
    modalEventDescription.textContent = descVal;

    // Date translation support
    const dateKey = card.getAttribute('data-date');
    let dateVal = getTranslation(langRef.current, dateKey) || dateKey || '';
    // If the value is a date string, format it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      const d = new Date(dateVal);
      dateVal = d.toLocaleDateString(langRef.current, { year: 'numeric', month: 'long', day: 'numeric' });
    }
    modalEventDate.textContent = dateVal;

    // Participants translation support
    const partKey = card.getAttribute('data-participants');
    modalEventParticipants.textContent = getTranslation(langRef.current, partKey) || partKey || '';

    updateModalLabels(langRef.current);
    eventModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function hideEventModal() {
    if (!eventModal) return;
    eventModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  eventCards.forEach(card => {
    card.addEventListener('click', () => showEventModal(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showEventModal(card);
      }
    });
  });
  if (eventModal) {
    eventModal.addEventListener('click', (e) => {
      if (e.target === eventModal) hideEventModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (eventModal && eventModal.style.display === 'flex' && e.key === 'Escape') hideEventModal();
  });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  setupNavToggle();
  setupSmoothScrolling();
  setupRevealOnScroll();
  setupCalendarLinks();

  await loadTranslations();
  const saved = localStorage.getItem('site-lang');
  const browserLang = (navigator.language || navigator.userLanguage || 'en').slice(0, 2);
  const lang = saved || (['en', 'it'].includes(browserLang) ? browserLang : 'en');
  // Use a ref object to allow dynamic updates in modal
  const langRef = { current: lang };
  applyTranslations(lang);

  // Language switch buttons
  qsa('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const l = btn.getAttribute('data-lang');
      langRef.current = l;
      applyTranslations(l);
    });
  });

  setupEventModal(langRef);
});
