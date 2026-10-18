const i18n = window.olivineI18n;
const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const inquiryForm = document.querySelector('#inquiry-form');
const inquiryResult = document.querySelector('#form-result');
const serviceSelect = document.querySelector('#service');
const levelField = document.querySelector('#level-field');
const settingsDialog = document.querySelector('#settings-dialog');
const accountDialog = document.querySelector('#account-dialog');
const accountTabs = document.querySelector('.account-tabs');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const accountPanel = document.querySelector('#account-panel');
const accountMessage = document.querySelector('#account-message');

document.querySelector('#year').textContent = new Date().getFullYear();

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  menuButton.setAttribute('aria-label', i18n.t(open ? 'openMenu' : 'closeMenu'));
  mainNav.classList.toggle('is-open', !open);
});

function closeMobileMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', i18n.t('openMenu'));
  mainNav.classList.remove('is-open');
}

mainNav.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMobileMenu();
});

function updateLevelVisibility() {
  const relevant = serviceSelect.value === 'tutoring';
  levelField.hidden = !relevant;
  if (!relevant) document.querySelector('#level').value = '';
}

serviceSelect.addEventListener('change', updateLevelVisibility);
updateLevelVisibility();

document.querySelectorAll('[data-service]').forEach((link) => {
  link.addEventListener('click', () => {
    serviceSelect.value = link.dataset.service;
    updateLevelVisibility();
    if (link.dataset.level) document.querySelector('#level').value = link.dataset.level;
  });
});

function clearErrors(form) {
  form.querySelectorAll('.field-error').forEach((field) => {
    field.classList.remove('field-error');
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  });
  form.querySelectorAll('.error-message').forEach((message) => message.remove());
}

function showError(field, message) {
  field.classList.add('field-error');
  field.setAttribute('aria-invalid', 'true');
  const error = document.createElement('span');
  error.className = 'error-message';
  error.id = `${field.id || 'method'}-error`;
  error.textContent = message;
  field.insertAdjacentElement('afterend', error);
  field.setAttribute('aria-describedby', error.id);
}

inquiryForm.addEventListener('submit', (event) => {
  event.preventDefault();
  clearErrors(inquiryForm);
  inquiryResult.hidden = true;
  const name = document.querySelector('#name');
  const contact = document.querySelector('#contact-detail');
  const consent = document.querySelector('#consent');
  const method = inquiryForm.querySelector('input[name="method"]:checked').value;
  let firstInvalid = null;

  if (!name.value.trim()) {
    showError(name, i18n.t('requiredName'));
    firstInvalid = name;
  }
  if (!contact.value.trim()) {
    showError(contact, i18n.t('requiredContact'));
    firstInvalid ||= contact;
  } else {
    const value = contact.value.trim();
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const looksLikePhone = /^\+?[\d\s().-]{7,20}$/.test(value) && /\d{7,}/.test(value.replace(/\D/g, ''));
    if (!looksLikeEmail && !looksLikePhone) {
      showError(contact, i18n.t('invalidContact'));
      firstInvalid ||= contact;
    }
  }
  if (!serviceSelect.value) {
    showError(serviceSelect, i18n.t('requiredService'));
    firstInvalid ||= serviceSelect;
  }
  if (!consent.checked) {
    showError(consent, i18n.t('requiredConsent'));
    firstInvalid ||= consent;
  }
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const level = document.querySelector('#level').value;
  const message = document.querySelector('#message').value.trim();
  const serviceLabel = serviceSelect.selectedOptions[0].textContent.trim();
  const levelLabel = document.querySelector('#level').selectedOptions[0]?.textContent.trim() || '';
  const methodLabel = inquiryForm.querySelector('input[name="method"]:checked').closest('.radio-option').querySelector('span').textContent.trim();
  const lines = [
    i18n.t('inquiryIntro'),
    `${i18n.t('name')}: ${name.value.trim()}`,
    `${i18n.t('contact')}: ${contact.value.trim()}`,
    `${i18n.t('service')}: ${serviceLabel}`,
  ];
  if (level) lines.push(`${i18n.t('level')}: ${levelLabel}`);
  lines.push(`${i18n.t('method')}: ${methodLabel}`);
  if (message) lines.push(`${i18n.t('message')}: ${message}`);
  const encodedBody = encodeURIComponent(lines.join('\n'));
  const actionLink = document.createElement('a');
  actionLink.className = 'button button-small';
  actionLink.textContent = method === 'whatsapp' ? i18n.t('whatsappSend') : i18n.t('emailSend');
  if (method === 'whatsapp') {
    actionLink.href = `https://wa.me/213542974739?text=${encodedBody}`;
    actionLink.target = '_blank';
    actionLink.rel = 'noopener noreferrer';
  } else {
    actionLink.href = `mailto:olivineschooldz@gmail.com?subject=${encodeURIComponent(i18n.t('subject'))}&body=${encodedBody}`;
  }
  inquiryResult.replaceChildren();
  const explanation = document.createElement('p');
  explanation.textContent = i18n.t('formReady');
  inquiryResult.append(explanation, actionLink);
  inquiryResult.hidden = false;
  inquiryResult.focus();
});

inquiryForm.querySelectorAll('input, select, textarea').forEach((field) => {
  field.addEventListener('input', () => {
    field.classList.remove('field-error');
    field.removeAttribute('aria-invalid');
    const error = document.getElementById(`${field.id || 'method'}-error`);
    if (error) error.remove();
    field.removeAttribute('aria-describedby');
  });
});

document.querySelectorAll('.settings-open').forEach((button) => button.addEventListener('click', () => settingsDialog.showModal()));
document.querySelectorAll('.account-open').forEach((button) => button.addEventListener('click', async () => {
  closeMobileMenu();
  accountMessage.textContent = '';
  accountMessage.dataset.state = '';
  accountDialog.showModal();
  try {
    const response = await fetch('/api/me', { credentials: 'same-origin' });
    const data = await response.json();
    if (response.ok && data.user) showAccount(data.user);
  } catch {
    setAccountMessage(i18n.t('networkError'), true);
  }
}));

document.querySelectorAll('dialog .dialog-close').forEach((button) => button.addEventListener('click', (event) => {
  event.preventDefault();
  button.closest('dialog').close();
}));

document.querySelectorAll('.account-tab').forEach((tab) => tab.addEventListener('click', () => setAccountView(tab.dataset.accountView)));
accountTabs.addEventListener('keydown', (event) => {
  const tabs = [...document.querySelectorAll('.account-tab')];
  const current = tabs.indexOf(document.activeElement);
  if (current < 0) return;
  let next = current;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = (current + 1) % tabs.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = tabs.length - 1;
  else return;
  event.preventDefault();
  tabs[next].focus();
  setAccountView(tabs[next].dataset.accountView);
});

function setAccountView(view) {
  loginForm.hidden = view !== 'login';
  registerForm.hidden = view !== 'register';
  accountPanel.hidden = true;
  accountTabs.hidden = false;
  document.querySelectorAll('.account-tab').forEach((tab) => {
    const active = tab.dataset.accountView === view;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  setAccountMessage('', false);
}

function setAccountMessage(message, error) {
  accountMessage.textContent = message;
  accountMessage.dataset.state = error ? 'error' : '';
}

function showAccount(user) {
  loginForm.hidden = true;
  registerForm.hidden = true;
  accountTabs.hidden = true;
  accountPanel.hidden = false;
  document.querySelector('#account-welcome').textContent = i18n.welcome(user.name);
  const adminLink = document.querySelector('#admin-dashboard-link');
  adminLink.hidden = user.role !== 'admin';
  loadStudentDashboard();
}

function formatContentDate(date) {
  try { return new Date(date).toLocaleDateString(document.documentElement.lang || 'ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return ''; }
}

function addContentMedia(parent, item) {
  if (!item.mediaPath) return;
  const media = item.mediaType?.startsWith('video/') ? document.createElement('video') : document.createElement('img');
  media.src = item.mediaPath;
  if (media instanceof HTMLVideoElement) { media.controls = true; media.preload = 'metadata'; media.setAttribute('aria-label', item.title); }
  else { media.alt = item.title; media.loading = 'lazy'; }
  parent.append(media);
}

function courseCard(item, index) {
  const article = document.createElement('article');
  article.className = 'program-card live-program-card reveal-on-scroll';
  const top = document.createElement('div'); top.className = 'card-top';
  const number = document.createElement('span'); number.className = 'card-number'; number.textContent = String(index + 5).padStart(2, '0');
  const glyph = document.createElement('span'); glyph.className = 'card-glyph'; glyph.textContent = '✦'; glyph.setAttribute('aria-hidden', 'true');
  top.append(number, glyph);
  const kicker = document.createElement('p'); kicker.className = 'card-kicker'; kicker.textContent = i18n.t('دورة جديدة');
  const title = document.createElement('h3'); title.textContent = item.title;
  const description = document.createElement('p'); description.className = 'card-description'; description.textContent = item.description;
  const details = document.createElement('p'); details.className = 'live-course-details'; details.textContent = item.details || '';
  const link = document.createElement('a'); link.className = 'card-link'; link.href = '#inquiry'; link.textContent = i18n.t('استفسر عن البرنامج');
  link.addEventListener('click', () => { if (serviceSelect) serviceSelect.value = ''; });
  article.append(top, kicker, title, description);
  if (item.mediaPath) addContentMedia(article, item);
  if (item.details) article.append(details);
  article.append(link);
  return article;
}

function postCard(item) {
  const article = document.createElement('article'); article.className = 'public-post-card reveal-on-scroll';
  if (item.mediaPath) { const media = document.createElement('div'); media.className = 'public-post-media'; addContentMedia(media, item); article.append(media); }
  const content = document.createElement('div'); content.className = 'public-post-copy';
  const date = document.createElement('p'); date.className = 'eyebrow'; date.textContent = formatContentDate(item.createdAt);
  const title = document.createElement('h3'); title.textContent = item.title;
  const body = document.createElement('p'); body.textContent = item.body;
  content.append(date, title, body); article.append(content); return article;
}

async function loadStudentDashboard() {
  const dashboard = document.querySelector('#student-dashboard');
  if (!dashboard) return;
  dashboard.replaceChildren();
  try {
    const response = await fetch('/api/content', { credentials: 'same-origin' });
    if (!response.ok) return;
    const data = await response.json();
    const heading = document.createElement('h3'); heading.textContent = i18n.t('آخر ما نُشر'); dashboard.append(heading);
    const items = [...data.courses.map((item) => ({ ...item, kind: 'course' })), ...data.posts.map((item) => ({ ...item, kind: 'post' }))]
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 4);
    if (!items.length) { const empty = document.createElement('p'); empty.textContent = i18n.t('ستظهر الدورات والمنشورات الجديدة هنا.'); dashboard.append(empty); return; }
    items.forEach((item) => {
      const row = document.createElement('article'); row.className = 'student-update';
      const label = document.createElement('small'); label.textContent = i18n.t(item.kind === 'course' ? 'دورة جديدة' : 'منشور جديد');
      const title = document.createElement('strong'); title.textContent = item.title;
      const date = document.createElement('time'); date.textContent = formatContentDate(item.createdAt);
      row.append(label, title, date); dashboard.append(row);
    });
  } catch { /* The account can still be used when the public feed is unavailable. */ }
}

async function loadPublicContent() {
  try {
    const response = await fetch('/api/content', { credentials: 'same-origin' });
    if (!response.ok) return;
    const data = await response.json();
    const courseGrid = document.querySelector('#live-course-grid');
    data.courses.forEach((item, index) => courseGrid.append(courseCard(item, index)));
    courseGrid.hidden = data.courses.length === 0;
    const news = document.querySelector('#school-news');
    const postGrid = document.querySelector('#public-post-grid');
    data.posts.forEach((item) => postGrid.append(postCard(item)));
    news.hidden = data.posts.length === 0;
    revealElements([...courseGrid.children, ...postGrid.children]);
  } catch { /* The brochure remains readable if the API is offline. */ }
}

let revealObserver;
function revealElements(elements) {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('motion-ready');
  revealObserver ||= new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  }), { threshold: 0.12 });
  elements.forEach((element) => {
    element.classList.add('reveal-on-scroll');
    if (!element.classList.contains('is-visible')) revealObserver.observe(element);
  });
}

revealElements([...document.querySelectorAll('.program-card, .step, .contact-card, .section-heading, .about-copy, .level-item, .faq-heading, .faq-list details, .inquiry-copy, .inquiry-form, .contact-heading, .footer-main > *')]);
loadPublicContent();

function accountErrorMessage(code) {
  const messages = {
    email_exists: 'emailExists', invalid_credentials: 'badCredentials', invalid_password: 'weakPassword',
    invalid_name: 'invalidName',
  };
  return i18n.t(messages[code] || 'genericError');
}

async function submitAccountForm(event, endpoint, successKey) {
  event.preventDefault();
  const form = event.currentTarget;
  clearErrors(form);
  setAccountMessage('', false);
  const values = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch(endpoint, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
    });
    const data = await response.json();
    if (!response.ok) {
      setAccountMessage(accountErrorMessage(data.error), true);
      return;
    }
    showAccount(data.user);
    setAccountMessage(i18n.t(successKey), false);
  } catch {
    setAccountMessage(i18n.t('networkError'), true);
  }
}

loginForm.addEventListener('submit', (event) => submitAccountForm(event, '/api/login', 'signedIn'));
registerForm.addEventListener('submit', (event) => submitAccountForm(event, '/api/register', 'accountCreated'));
document.querySelector('#logout-button').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/logout', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!response.ok) throw new Error('Logout failed');
    setAccountView('login');
    loginForm.reset();
    registerForm.reset();
    setAccountMessage(i18n.t('signedOut'), false);
  } catch {
    setAccountMessage(i18n.t('networkError'), true);
  }
});

document.querySelector('#language-setting').addEventListener('change', () => {
  setAccountMessage('', false);
});

if (new URLSearchParams(location.search).has('account')) {
  history.replaceState(null, '', `${location.pathname}${location.hash}`);
  document.querySelector('.account-open')?.click();
}
