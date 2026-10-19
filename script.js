const i18n = window.olivineI18n;
const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
const inquiryForm = document.querySelector('#inquiry-form');
const inquiryResult = document.querySelector('#form-result');
const serviceSelect = document.querySelector('#service');
const levelField = document.querySelector('#level-field');
const accountDialog = document.querySelector('#account-dialog');
const accountTabs = document.querySelector('.account-tabs');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const accountPanel = document.querySelector('#account-panel');
const accountMessage = document.querySelector('#account-message');
let accountReturnTo = '';

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
  window.dispatchEvent(new CustomEvent('olivine:account', { detail: user }));
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

function postCard(item, kind = 'post') {
  const article = document.createElement('article'); article.className = 'public-post-card reveal-on-scroll';
  if (item.mediaPath) { const media = document.createElement('div'); media.className = 'public-post-media'; addContentMedia(media, item); article.append(media); }
  const content = document.createElement('div'); content.className = 'public-post-copy';
  const date = document.createElement('p'); date.className = 'eyebrow'; date.textContent = formatContentDate(item.createdAt);
  const title = document.createElement('h3'); title.textContent = item.title;
  const body = document.createElement('p'); body.className = 'public-post-body'; body.textContent = kind === 'course' ? [item.description, item.details].filter(Boolean).join('\n\n') : item.body;
  content.append(date, title, body, createHomeSocialActions(item, kind)); article.append(content); return article;
}

function homeSocialCopy() {
  const lang = document.documentElement.lang;
  return lang === 'fr'
    ? { like: 'J’aime', liked: 'Retirer le J’aime', save: 'Enregistrer', saved: 'Enregistré', comments: 'Commentaires', share: 'Partager', copy: 'Copiez le lien de la publication :' }
    : lang === 'en'
      ? { like: 'Like', liked: 'Unlike', save: 'Save post', saved: 'Saved', comments: 'Comments', share: 'Share', copy: 'Copy the post link:' }
      : { like: 'إعجاب', liked: 'إلغاء الإعجاب', save: 'حفظ المنشور', saved: 'تم الحفظ', comments: 'التعليقات', share: 'مشاركة', copy: 'انسخ رابط المنشور:' };
}

function createHomeSocialActions(item, kind = 'post') {
  const labels = homeSocialCopy();
  const actions = document.createElement('div'); actions.className = 'public-post-social-actions';
  const itemId = Number(item.id);
  const like = document.createElement('button'); like.type = 'button'; like.dataset.homeSocial = 'like'; like.dataset.itemKind = kind; like.dataset.itemId = String(itemId);
  like.setAttribute('aria-pressed', String(Boolean(item.likedByMe))); like.setAttribute('aria-label', item.likedByMe ? labels.liked : labels.like);
  like.classList.toggle('is-active', Boolean(item.likedByMe));
  const heart = document.createElement('span'); heart.setAttribute('aria-hidden', 'true'); heart.textContent = '♥';
  const likeCount = document.createElement('span'); likeCount.dataset.homeCount = 'like'; likeCount.textContent = String(Number(item.likeCount || 0));
  like.append(heart, likeCount);
  const comments = document.createElement('a'); comments.className = 'public-post-comments'; comments.href = `/posts?${kind}=${itemId}&action=comments`; comments.setAttribute('aria-label', labels.comments);
  comments.innerHTML = `<span aria-hidden="true">◌</span><span>${Number(item.commentCount || 0)}</span>`;
  const save = document.createElement('button'); save.type = 'button'; save.dataset.homeSocial = 'bookmark'; save.dataset.itemKind = kind; save.dataset.itemId = String(itemId);
  save.setAttribute('aria-pressed', String(Boolean(item.bookmarkedByMe))); save.setAttribute('aria-label', item.bookmarkedByMe ? labels.saved : labels.save);
  save.classList.toggle('is-active', Boolean(item.bookmarkedByMe));
  const star = document.createElement('span'); star.setAttribute('aria-hidden', 'true'); star.textContent = item.bookmarkedByMe ? '★' : '☆'; save.append(star);
  const share = document.createElement('button'); share.type = 'button'; share.dataset.homeSocial = 'share'; share.dataset.itemKind = kind; share.dataset.itemId = String(itemId); share.setAttribute('aria-label', labels.share); share.textContent = '↗';
  actions.append(like, comments, save, share);
  return actions;
}

function homeSignInUrl(itemId, action, kind = 'post') {
  const target = new URL(`/posts?${kind}=${Number(itemId)}`, location.origin);
  if (action) target.searchParams.set('action', action);
  return `/?account=1&return=${encodeURIComponent(`${target.pathname}${target.search}`)}`;
}

async function handleHomeSocialAction(button) {
  const labels = homeSocialCopy();
  const itemId = Number(button.dataset.itemId);
  const kind = button.dataset.itemKind === 'course' ? 'course' : 'post';
  const action = button.dataset.homeSocial;
  if (!itemId || !['like', 'bookmark', 'share'].includes(action)) return;
  if (action === 'share') {
    const url = `${location.origin}/posts?${kind}=${itemId}`;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url });
      else if (navigator.clipboard?.writeText && window.isSecureContext) { await navigator.clipboard.writeText(url); button.title = '✓'; }
      else window.prompt(labels.copy, url);
    } catch (error) { if (error.name !== 'AbortError') window.prompt(labels.copy, url); }
    return;
  }
  button.disabled = true;
  try {
    const response = await fetch(`/api/${kind === 'course' ? 'courses' : 'posts'}/${itemId}/${action}`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (response.status === 401) { location.href = homeSignInUrl(itemId, action, kind); return; }
    if (!response.ok) throw new Error('social_action_failed');
    const result = await response.json();
    const active = action === 'like' ? result.liked : result.bookmarked;
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-label', action === 'like' ? (active ? labels.liked : labels.like) : (active ? labels.saved : labels.save));
    if (action === 'like') button.querySelector('[data-home-count="like"]').textContent = String(result.likeCount);
    else button.querySelector('[aria-hidden="true"]').textContent = active ? '★' : '☆';
  } catch { button.title = i18n.t('تعذر تنفيذ الطلب'); }
  finally { button.disabled = false; }
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
    data.courses.forEach((item) => courseGrid.append(postCard(item, 'course')));
    document.querySelector('#live-course-empty').hidden = data.courses.length > 0;
    const news = document.querySelector('#school-news');
    const postGrid = document.querySelector('#public-post-grid');
    const grids = [courseGrid, postGrid];
    grids.forEach((grid) => grid.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-home-social]');
      if (button) handleHomeSocialAction(button);
    }));
    new MutationObserver(() => {
      const labels = homeSocialCopy();
      grids.forEach((grid) => {
        grid.querySelectorAll('button[data-home-social="like"]').forEach((button) => button.setAttribute('aria-label', button.getAttribute('aria-pressed') === 'true' ? labels.liked : labels.like));
        grid.querySelectorAll('button[data-home-social="bookmark"]').forEach((button) => button.setAttribute('aria-label', button.getAttribute('aria-pressed') === 'true' ? labels.saved : labels.save));
        grid.querySelectorAll('button[data-home-social="share"]').forEach((button) => button.setAttribute('aria-label', labels.share));
        grid.querySelectorAll('.public-post-comments').forEach((link) => link.setAttribute('aria-label', labels.comments));
      });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
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
    if (accountReturnTo) {
      const destination = accountReturnTo;
      accountReturnTo = '';
      location.assign(destination);
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

const accountQuery = new URLSearchParams(location.search);
if (accountQuery.has('account')) {
  const returnTo = accountQuery.get('return');
  if (returnTo) {
    try {
      const target = new URL(returnTo, location.origin);
      if (target.origin === location.origin && target.pathname === '/posts') accountReturnTo = `${target.pathname}${target.search}${target.hash}`;
    } catch { /* Ignore malformed or external return URLs. */ }
  }
  history.replaceState(null, '', `${location.pathname}${location.hash}`);
  document.querySelector('.account-open')?.click();
}
