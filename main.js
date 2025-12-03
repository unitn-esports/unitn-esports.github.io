// Mobile nav toggle, smooth scrolling, reveal on scroll, calendar link helpers
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

navToggle && navToggle.addEventListener('click', ()=>{
  if(mainNav.style.display === 'block') mainNav.style.display = '';
  else mainNav.style.display = 'block';
});

// Smooth scrolling for same-page anchors
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const href = a.getAttribute('href');
    if(href.length>1){
      const el = document.querySelector(href);
      if(el){
        e.preventDefault();
        el.scrollIntoView({behavior:'smooth',block:'start'});
        // hide mobile nav after click
        if(window.innerWidth < 900 && mainNav) mainNav.style.display = '';
      }
    }
  })
});

// Reveal on scroll
const revealEls = Array.from(document.querySelectorAll('.reveal'));
const revealObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting) entry.target.classList.add('visible');
  });
},{threshold:0.12});
revealEls.forEach(el=>revealObserver.observe(el));

// Calendar helpers: replace placeholder calendar id to create proper links
function setupCalendarLinks(){
  const iframe = document.getElementById('gcalIframe');
  const gcalSubscribe = document.getElementById('gcalSubscribe');
  const icsDownload = document.getElementById('icsDownload');
  if(!iframe || !gcalSubscribe || !icsDownload) return;

  // The calendar id currently in the src: edit this string below with your calendar ID
  const placeholderId = 'your_calendar_id';

  // If user replaced the iframe src directly, parse it
  const src = iframe.getAttribute('src') || '';
  let calId = null;
  try{
    const url = new URL(src);
    calId = url.searchParams.get('src') || null;
  }catch(e){
    // fallback
    calId = null;
  }
  // If not present, use placeholder so links are still instructive
  if(!calId) calId = placeholderId;

  // Google Calendar view link (opens web UI with calendar visible)
  gcalSubscribe.href = `https://www.google.com/calendar/render?cid=${encodeURIComponent(calId)}`;

  // iCal download link for many clients
  icsDownload.href = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calId)}/public/basic.ics`;
  icsDownload.setAttribute('download','events.ics');
}

document.addEventListener('DOMContentLoaded', setupCalendarLinks);

// Small improvement: add keyboard support for nav toggle
navToggle && navToggle.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') navToggle.click(); });

// --- Internationalization (i18n) ---
let translations = {};

async function loadTranslations(){
  try{
    const res = await fetch('i18n.json');
    if(!res.ok) throw new Error('Failed to load i18n.json');
    translations = await res.json();
  }catch(err){
    console.error('i18n load error:', err);
    // Fallback: minimal inline English translations to avoid blank UI
    translations = { en: { brand: 'UniTn E-sports', footer: { note_en: 'Made with ❤️ by Pietro Marini' } }, it: { footer: { note_it: 'Fatto con ❤️ da Pietro Marini' } } };
  }
}

function getTranslation(lang, key){
  if(!lang || !key) return '';
  const parts = key.split('.');
  let cur = (translations && translations[lang]) ? translations[lang] : null;
  for(const p of parts){ if(!cur) return ''; cur = cur[p]; }
  return (typeof cur === 'string') ? cur : '';
}

function applyTranslations(lang){
  document.documentElement.lang = lang;
  // elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    // Prefer a structured translation: try `key.text`, fall back to `key`.
    const textVal = getTranslation(lang, `${key}.text`) || getTranslation(lang, key);
    if(!textVal) return;
    // If the element contains an <img>, avoid replacing innerHTML (which would remove the image).
    // Instead, set the image's alt using `key.alt` (or fallback to the text), and set an aria-label.
    const img = el.querySelector('img');
    if(img){
      const altVal = getTranslation(lang, `${key}.alt`) || textVal;
      try{ img.alt = altVal; }catch(e){}
      el.setAttribute('aria-label', textVal);
    } else {
      el.innerHTML = textVal;
    }
  });
  // placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    const key = el.getAttribute('data-i18n-placeholder');
    const val = getTranslation(lang, key);
    if(val) el.setAttribute('placeholder', val);
  });
  // footer note (special)
  const footerNote = document.querySelector('.footer-note');
  if(footerNote){
    footerNote.innerHTML = (lang === 'it') ? translations.it.footer.note_it : translations.en.footer.note_en;
  }
  // active language button
  document.querySelectorAll('.lang-btn').forEach(b=>{
    b.classList.toggle('active', b.getAttribute('data-lang') === lang);
  });
  localStorage.setItem('site-lang', lang);
}

// initialize language on DOMContentLoaded
document.addEventListener('DOMContentLoaded', async ()=>{
  await loadTranslations();
  const saved = localStorage.getItem('site-lang');
  const browserLang = (navigator.language || navigator.userLanguage || 'en').slice(0,2);
  const lang = saved || (['en','it'].includes(browserLang) ? browserLang : 'en');
  applyTranslations(lang);
  // wire buttons
  document.querySelectorAll('.lang-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const l = btn.getAttribute('data-lang');
      applyTranslations(l);
    });
  });

  // --- Event modal logic ---
  const eventCards = document.querySelectorAll('.event-card');
  const eventModal = document.getElementById('eventModal');
  const modalEventImg = document.getElementById('modalEventImg');
  const modalEventTitle = document.getElementById('modalEventTitle');
  const modalEventDateLabel = document.getElementById('modalEventDateLabel');
  const modalEventDate = document.getElementById('modalEventDate');
  const modalEventParticipantsLabel = document.getElementById('modalEventParticipantsLabel');
  const modalEventParticipants = document.getElementById('modalEventParticipants');
  const modalEventDescriptionLabel = document.getElementById('modalEventDescriptionLabel');
  const modalEventDescription = document.getElementById('modalEventDescription');

  function showEventModal(card) {
    if (!eventModal) return;
    modalEventImg.src = card.getAttribute('data-img') || '';
    modalEventImg.alt = card.getAttribute('data-title') || '';
    modalEventTitle.textContent = card.getAttribute('data-title') || '';
    // Format date
    const dateStr = card.getAttribute('data-date');
    let formattedDate = dateStr;
    if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const d = new Date(dateStr);
      formattedDate = d.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' });
    }
    // Set translated labels
    if (modalEventDateLabel) modalEventDateLabel.textContent = getTranslation(lang, 'modal.date');
    if (modalEventParticipantsLabel) modalEventParticipantsLabel.textContent = getTranslation(lang, 'modal.participants');
    if (modalEventDescriptionLabel) modalEventDescriptionLabel.textContent = getTranslation(lang, 'modal.description');
    modalEventDate.textContent = formattedDate || '';
    modalEventParticipants.textContent = card.getAttribute('data-participants') || '';
    modalEventDescription.textContent = card.getAttribute('data-description') || '';
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
  // Close modal on outside click
  if (eventModal) {
    eventModal.addEventListener('click', (e) => {
      if (e.target === eventModal) hideEventModal();
    });
  }
  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (eventModal && eventModal.style.display === 'flex' && e.key === 'Escape') hideEventModal();
  });
});
