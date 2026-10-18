(() => {
  const $ = (selector) => document.querySelector(selector);
  const grid = $('#posts-grid');
  const featured = $('#posts-featured');
  const loading = $('#posts-loading');
  const empty = $('#posts-empty');
  const search = $('#posts-search');
  const settings = $('#settings-dialog');
  const detail = $('#post-detail');
  const lang = () => window.olivineI18n?.language || 'ar';
  const copy = {
    ar: { post: 'منشور', course: 'دورة', read: 'اقرأ القصة', published: 'من المدرسة', search: 'ابحث في المنشورات', total: (n) => `${n} منشور`, empty: 'لا توجد منشورات تطابق اختيارك الآن. عُد قريباً للاطلاع على جديد المدرسة.', loadError: 'تعذر تحميل المنشورات. تحقق من اتصال الموقع ثم أعد المحاولة.', emptyTitle: 'كل قصة تبدأ بلحظة.', more: 'عرض التفاصيل', close: 'إغلاق' },
    fr: { post: 'Publication', course: 'Cours', read: 'Lire la publication', published: 'Olivine School', search: 'Rechercher une publication', total: (n) => `${n} publication${n === 1 ? '' : 's'}`, empty: 'Aucune publication ne correspond à votre sélection. Revenez bientôt pour découvrir les nouvelles de l’école.', loadError: 'Impossible de charger les publications. Vérifiez la connexion puis réessayez.', emptyTitle: 'Chaque histoire commence par un instant.', more: 'Voir les détails', close: 'Fermer' },
    en: { post: 'Post', course: 'Course', read: 'Read the story', published: 'From Olivine School', search: 'Search posts', total: (n) => `${n} ${n === 1 ? 'post' : 'posts'}`, empty: 'No posts match your selection right now. Come back soon for the latest from school.', loadError: 'Posts could not be loaded. Check the site connection and try again.', emptyTitle: 'Every story starts with a moment.', more: 'Read details', close: 'Close' },
  };
  let items = [];
  let activeFilter = 'all';
  let failed = false;
  const text = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const label = (kind) => copy[lang()][kind];
  const formatDate = (value) => {
    const date = new Date(`${value || ''}Z`);
    if (Number.isNaN(date.getTime())) return '';
    try { return new Intl.DateTimeFormat(lang() === 'ar' ? 'ar-DZ' : lang() === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date); }
    catch { return ''; }
  };
  const mediaMarkup = (item, featuredMode = false) => {
    const media = item.mediaPath ? (item.mediaPath.startsWith('/media/') ? item.mediaPath : '') : '';
    if (media && item.mediaType?.startsWith('video/')) return `<video src="${text(media)}" controls preload="metadata" playsinline aria-label="${text(item.title)}"></video>`;
    if (media) return `<img src="${text(media)}" alt="${text(item.title)}" loading="lazy">`;
    return `<div class="${featuredMode ? 'featured-placeholder' : 'journal-placeholder'}" aria-hidden="true"><span class="${featuredMode ? 'featured-placeholder-mark' : ''}">${featuredMode ? 'O' : 'O'}</span>${featuredMode ? '<span class="featured-placeholder-word">LEARN · GROW</span>' : '<i>OLIVINE · SCHOOL DZ</i>'}</div>`;
  };
  const dateMarkup = (item) => text(formatDate(item.createdAt));
  const renderDetail = (item) => {
    const media = item.mediaPath && item.mediaPath.startsWith('/media/') ? item.mediaPath : '';
    const visual = media ? (item.mediaType?.startsWith('video/') ? `<video src="${text(media)}" controls playsinline></video>` : `<img src="${text(media)}" alt="${text(item.title)}">`) : '';
    $('#post-detail-content').innerHTML = `${visual ? `<div class="detail-media">${visual}</div>` : ''}<div class="detail-copy"><p class="posts-section-eyebrow">${text(label(item.kind))} · ${dateMarkup(item)}</p><h2>${text(item.title)}</h2><p>${text(item.body)}</p></div>`;
    if (!detail.open) detail.showModal();
  };
  const cardMarkup = (item, index) => `<article class="journal-card" style="animation-delay:${Math.min(index, 8) * 65}ms"><div class="journal-media">${mediaMarkup(item)}</div><div class="journal-card-copy"><div class="journal-meta"><span>${dateMarkup(item)}</span><b>${text(label(item.kind))}</b></div><h3>${text(item.title)}</h3><p>${text(item.body)}</p><button class="read-post" type="button" data-open-item="${text(item.kind)}-${text(item.id)}">${text(copy[lang()].read)} <span aria-hidden="true">↙</span></button></div></article>`;
  const featuredMarkup = (item) => `<article class="posts-featured-card"><div class="featured-visual">${mediaMarkup(item, true)}<span class="featured-index">OLIVINE · ${String(item.id).padStart(2, '0')}</span></div><div class="featured-copy"><div class="featured-meta"><span class="featured-tag">${text(label(item.kind))}</span><span>${dateMarkup(item)}</span></div><h3>${text(item.title)}</h3><p>${text(item.body)}</p><button class="read-post" type="button" data-open-item="${text(item.kind)}-${text(item.id)}">${text(copy[lang()].read)} <span aria-hidden="true">↙</span></button></div></article>`;
  const render = () => {
    const query = search.value.trim().toLocaleLowerCase();
    const filtered = items.filter((item) => (activeFilter === 'all' || item.kind === activeFilter) && (!query || `${item.title} ${item.body}`.toLocaleLowerCase().includes(query)));
    const counts = { all: items.length, post: items.filter((item) => item.kind === 'post').length, course: items.filter((item) => item.kind === 'course').length };
    document.querySelectorAll('[data-count]').forEach((node) => { node.textContent = counts[node.dataset.count] ?? 0; });
    $('#posts-total').textContent = copy[lang()].total(items.length);
    const lead = filtered[0];
    featured.innerHTML = lead ? featuredMarkup(lead) : '';
    grid.innerHTML = filtered.slice(1).map(cardMarkup).join('');
    const noResults = filtered.length === 0;
    empty.hidden = !noResults;
    if (noResults) {
      empty.querySelector('h3').textContent = failed ? copy[lang()].loadError : copy[lang()].emptyTitle;
      empty.querySelector('p:not(.posts-section-eyebrow)').textContent = copy[lang()].empty;
    }
    document.querySelectorAll('.post-filter').forEach((button) => {
      const selected = button.dataset.filter === activeFilter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    observeCards();
  };
  const observeCards = () => {
    const cards = document.querySelectorAll('.journal-card, .posts-featured-card');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    cards.forEach((card) => { card.classList.remove('is-visible'); observer.observe(card); });
  };
  document.querySelectorAll('.post-filter').forEach((button) => button.addEventListener('click', () => { activeFilter = button.dataset.filter; render(); }));
  search.addEventListener('input', render);
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-open-item]');
    if (!button) return;
    const [kind, ...idParts] = button.dataset.openItem.split('-');
    const item = items.find((entry) => entry.kind === kind && String(entry.id) === idParts.join('-'));
    if (item) renderDetail(item);
  });
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); search.focus(); }
    if (event.key === 'Escape' && detail.open) detail.close();
  });
  document.querySelectorAll('.settings-open').forEach((button) => button.addEventListener('click', () => settings.showModal()));
  new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  $('#post-detail').addEventListener('click', (event) => { if (event.target === detail) detail.close(); });
  $('.post-detail-close').addEventListener('click', () => detail.close());
  $('#posts-year').textContent = new Date().getFullYear();
  $('#posts-loading').hidden = false;
  fetch('/api/content', { credentials: 'same-origin' }).then((response) => {
    if (!response.ok) throw new Error('Content unavailable');
    return response.json();
  }).then((data) => {
    items = [
      ...(Array.isArray(data.posts) ? data.posts.map((item) => ({ ...item, kind: 'post', body: item.body || '' })) : []),
      ...(Array.isArray(data.courses) ? data.courses.map((item) => ({ ...item, kind: 'course', body: [item.description, item.details].filter(Boolean).join('\n\n') })) : []),
    ].sort((a, b) => new Date(`${b.createdAt || ''}Z`) - new Date(`${a.createdAt || ''}Z`));
    loading.hidden = true;
    render();
  }).catch(() => { failed = true; loading.hidden = true; render(); });
})();
