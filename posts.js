(() => {
  const $ = (selector) => document.querySelector(selector);
  const grid = $('#posts-grid');
  const featured = $('#posts-featured');
  const loading = $('#posts-loading');
  const empty = $('#posts-empty');
  const search = $('#posts-search');
  const detail = $('#post-detail');
  const lang = () => window.olivineI18n?.language || 'ar';
  const copy = {
    ar: { post: 'منشور', course: 'دورة', read: 'اقرأ القصة', published: 'من المدرسة', search: 'ابحث في المنشورات', total: (n) => `${n} منشور`, empty: 'لا توجد منشورات تطابق اختيارك الآن. عُد قريباً للاطلاع على جديد المدرسة.', loadError: 'تعذر تحميل المنشورات. تحقق من اتصال الموقع ثم أعد المحاولة.', emptyTitle: 'كل قصة تبدأ بلحظة.', more: 'عرض التفاصيل', close: 'إغلاق', like: 'إعجاب', save: 'حفظ', share: 'مشاركة', copyLink: 'انسخ رابط المنشور:', comments: 'تعليق', write: 'اكتب تعليقاً…', send: 'نشر التعليق', signIn: 'سجّل الدخول للتفاعل', reply: 'رد', edit: 'تعديل', remove: 'حذف', cancel: 'إلغاء', copied: 'تم نسخ الرابط', error: 'تعذر تنفيذ الطلب' },
    fr: { post: 'Publication', course: 'Cours', read: 'Lire la publication', published: 'Olivine School', search: 'Rechercher une publication', total: (n) => `${n} publication${n === 1 ? '' : 's'}`, empty: 'Aucune publication ne correspond à votre sélection. Revenez bientôt pour découvrir les nouvelles de l’école.', loadError: 'Impossible de charger les publications. Vérifiez la connexion puis réessayez.', emptyTitle: 'Chaque histoire commence par un instant.', more: 'Voir les détails', close: 'Fermer', like: 'J’aime', save: 'Enregistrer', share: 'Partager', copyLink: 'Copiez le lien de la publication :', comments: 'Commenter', write: 'Écrire un commentaire…', send: 'Publier', signIn: 'Connectez-vous pour interagir', reply: 'Répondre', edit: 'Modifier', remove: 'Supprimer', cancel: 'Annuler', copied: 'Lien copié', error: 'Action impossible' },
    en: { post: 'Post', course: 'Course', read: 'Read the story', published: 'From Olivine School', search: 'Search posts', total: (n) => `${n} ${n === 1 ? 'post' : 'posts'}`, empty: 'No posts match your selection right now. Come back soon for the latest from school.', loadError: 'Posts could not be loaded. Check the site connection and try again.', emptyTitle: 'Every story starts with a moment.', more: 'Read details', close: 'Close', like: 'Like', save: 'Save', share: 'Share', copyLink: 'Copy the post link:', comments: 'Comment', write: 'Write a comment…', send: 'Post comment', signIn: 'Sign in to interact', reply: 'Reply', edit: 'Edit', remove: 'Delete', cancel: 'Cancel', copied: 'Link copied', error: 'Could not complete the action' },
  };
  let items = [];
  const initialFilter = new URLSearchParams(location.search).get('filter');
  let activeFilter = ['post', 'course'].includes(initialFilter) ? initialFilter : 'all';
  let failed = false;
  let cardObserver = null;
  let activeItemKind = '';
  let activeItemId = 0;
  const text = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const label = (kind) => copy[lang()][kind];
  const parseDate = (value) => {
    if (!value) return new Date(Number.NaN);
    const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T');
    return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`);
  };
  const formatDate = (value) => {
    const date = parseDate(value);
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
  const signInUrl = (kind, itemId, action = '') => {
    const returnTo = new URL(`/posts?${kind}=${Number(itemId)}`, location.origin);
    if (action) returnTo.searchParams.set('action', action);
    return `/?account=1&return=${encodeURIComponent(`${returnTo.pathname}${returnTo.search}`)}`;
  };
  const socialActions = (item) => `<div class="post-social-actions"><button type="button" data-social-action="like" data-item-kind="${text(item.kind)}" data-item-id="${Number(item.id)}" aria-pressed="${Boolean(item.likedByMe)}" class="${item.likedByMe ? 'is-liked' : ''}" aria-label="${text(copy[lang()].like)}">♥ <span>${Number(item.likeCount || 0)}</span></button><button type="button" data-social-action="bookmark" data-item-kind="${text(item.kind)}" data-item-id="${Number(item.id)}" aria-pressed="${Boolean(item.bookmarkedByMe)}" class="${item.bookmarkedByMe ? 'is-saved' : ''}" aria-label="${text(copy[lang()].save)}">☆ <span>${item.bookmarkedByMe ? '✓' : ''}</span></button><button type="button" data-social-action="share" data-item-kind="${text(item.kind)}" data-item-id="${Number(item.id)}" aria-label="${text(copy[lang()].share)}">↗</button><button type="button" data-open-item="${text(item.kind)}-${Number(item.id)}">${text(copy[lang()].comments)} · ${Number(item.commentCount || 0)}</button></div>`;
  const renderDetail = (item) => {
    const media = item.mediaPath && item.mediaPath.startsWith('/media/') ? item.mediaPath : '';
    const visual = media ? (item.mediaType?.startsWith('video/') ? `<video src="${text(media)}" controls playsinline></video>` : `<img src="${text(media)}" alt="${text(item.title)}">`) : '';
    activeItemKind = item.kind;
    activeItemId = Number(item.id);
    $('#post-detail-content').innerHTML = `${visual ? `<div class="detail-media">${visual}</div>` : ''}<div class="detail-copy"><p class="posts-section-eyebrow">${text(label(item.kind))} · ${dateMarkup(item)}</p><h2>${text(item.title)}</h2><p>${text(item.body)}</p>${socialActions(item)}</div><section class="post-social-panel" id="post-social-panel"><p>${text(copy[lang()].comments)}…</p></section>`;
    if (!detail.open) detail.showModal();
    if (item.kind === 'post') fetch(`/api/posts/${Number(item.id)}/view`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {});
    return loadSocial(item.kind, item.id);
  };
  const cardMarkup = (item) => `<article class="journal-card"><div class="journal-media">${mediaMarkup(item)}</div><div class="journal-card-copy"><div class="journal-meta"><span>${dateMarkup(item)}</span><b>${text(label(item.kind))}</b></div><h3>${text(item.title)}</h3><p>${text(item.body)}</p><button class="read-post" type="button" data-open-item="${text(item.kind)}-${text(item.id)}">${text(copy[lang()].read)} <span aria-hidden="true">↙</span></button>${socialActions(item)}</div></article>`;
  const featuredMarkup = (item) => `<article class="posts-featured-card"><div class="featured-visual">${mediaMarkup(item, true)}<span class="featured-index">OLIVINE · ${String(item.id).padStart(2, '0')}</span></div><div class="featured-copy"><div class="featured-meta"><span class="featured-tag">${text(label(item.kind))}</span><span>${dateMarkup(item)}</span></div><h3>${text(item.title)}</h3><p>${text(item.body)}</p><button class="read-post" type="button" data-open-item="${text(item.kind)}-${text(item.id)}">${text(copy[lang()].read)} <span aria-hidden="true">↙</span></button>${socialActions(item)}</div></article>`;
  async function loadSocial(kind, itemId) {
    const panel = $('#post-social-panel'); if (!panel) return;
    try {
      const response = await fetch(`/api/${kind === 'course' ? 'courses' : 'posts'}/${Number(itemId)}/social`, { credentials: 'same-origin' });
      if (!response.ok) throw new Error('social');
      const data = await response.json();
      const item = items.find((entry) => entry.kind === kind && Number(entry.id) === Number(itemId));
      if (item) Object.assign(item, { likeCount: data.likeCount, commentCount: data.commentCount, likedByMe: data.likedByMe, bookmarkedByMe: data.bookmarkedByMe });
      const author = (comment) => `<span class="comment-avatar">${comment.avatarPath && comment.avatarPath.startsWith('/media/') ? `<img src="${text(comment.avatarPath)}" alt="">` : text((comment.name || '?').slice(0, 1))}</span>`;
      const renderComment = (comment, child = false) => {
        const canManage = data.user && (data.user.id === comment.userId || data.user.role === 'admin');
        const editor = canManage ? `<form class="comment-edit-form" data-comment-edit-form data-comment-id="${Number(comment.id)}" hidden><textarea name="body" maxlength="2000" required>${text(comment.body)}</textarea><div><button type="submit">${text(copy[lang()].save)}</button><button type="button" data-comment-action="cancel-edit">${text(copy[lang()].cancel)}</button></div><small class="comment-edit-error" role="status" hidden>${text(copy[lang()].error)}</small></form>` : '';
        return `<article class="social-comment ${child ? 'is-reply' : ''}" data-comment-id="${Number(comment.id)}">${author(comment)}<div class="social-comment-body"><div class="comment-heading"><strong>${text(comment.name)}</strong><time>${text(formatDate(comment.createdAt))}</time></div><p>${text(comment.body)}</p>${editor}<div class="comment-actions"><button type="button" data-comment-action="like" data-comment-id="${Number(comment.id)}" aria-pressed="${Boolean(comment.likedByMe)}" class="${comment.likedByMe ? 'is-liked' : ''}">♥ ${Number(comment.likeCount || 0)}</button>${data.user && !child ? `<button type="button" data-comment-action="reply" data-comment-id="${Number(comment.id)}">${text(copy[lang()].reply)}</button>` : ''}${canManage ? `<button type="button" data-comment-action="edit" data-comment-id="${Number(comment.id)}">${text(copy[lang()].edit)}</button><button type="button" data-comment-action="delete" data-comment-id="${Number(comment.id)}">${text(copy[lang()].remove)}</button>` : ''}</div></div></article>`;
      };
      const roots = data.comments.filter((comment) => !comment.parentId);
      const comments = roots.map((root) => `<div class="comment-thread">${renderComment(root)}${data.comments.filter((comment) => Number(comment.parentId) === Number(root.id)).map((reply) => renderComment(reply, true)).join('')}<form class="reply-form" data-comment-form data-parent-id="${Number(root.id)}" hidden><textarea name="body" maxlength="2000" required placeholder="${text(copy[lang()].write)}"></textarea><button type="submit">${text(copy[lang()].send)}</button></form></div>`).join('');
      panel.innerHTML = `<div class="social-panel-head"><h3>${text(copy[lang()].comments)} <span>${data.commentCount}</span></h3><button type="button" data-social-action="share" data-item-kind="${text(kind)}" data-item-id="${Number(itemId)}">↗ ${text(copy[lang()].share)}</button></div>${data.user ? `<form class="comment-compose" data-comment-form><textarea name="body" maxlength="2000" required placeholder="${text(copy[lang()].write)}"></textarea><button type="submit">${text(copy[lang()].send)}</button></form>` : `<a class="comment-signin" href="${signInUrl(kind, itemId, 'comments')}">${text(copy[lang()].signIn)}</a>`}<div class="comment-list">${comments || `<p class="no-comments">${text(copy[lang()].comments)} · 0</p>`}</div>`;
      panel.querySelectorAll('[data-comment-form]').forEach((form) => form.addEventListener('submit', async (event) => {
        event.preventDefault(); const body = new FormData(form).get('body');
        try { const result = await fetch(`/api/${kind === 'course' ? 'courses' : 'posts'}/${Number(itemId)}/comments`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body, parentId: Number(form.dataset.parentId || 0) || null }) });
          if (result.status === 401) { location.href = signInUrl(kind, itemId, 'comments'); return; }
          if (!result.ok) throw new Error('comment'); form.reset(); await loadSocial(kind, itemId);
        } catch { panel.querySelector('.comment-compose textarea')?.setAttribute('placeholder', copy[lang()].error); }
      }));
      panel.querySelectorAll('[data-comment-edit-form]').forEach((form) => form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const commentId = Number(form.dataset.commentId);
        const body = new FormData(form).get('body');
        const error = form.querySelector('.comment-edit-error');
        try {
          const response = await fetch(`/api/${kind === 'course' ? 'course-comments' : 'comments'}/${commentId}`, { method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) });
          if (response.status === 401) { location.href = signInUrl(kind, itemId, 'comments'); return; }
          if (!response.ok) throw new Error('comment_edit_failed');
          await loadSocial(kind, itemId);
        } catch { error.hidden = false; }
      }));
      panel.querySelectorAll('[data-comment-action]').forEach((button) => button.addEventListener('click', async () => {
        const id = Number(button.dataset.commentId); const action = button.dataset.commentAction;
        try {
          if (action === 'reply') { const form = button.closest('.comment-thread').querySelector('.reply-form'); form.hidden = !form.hidden; if (!form.hidden) form.querySelector('textarea').focus(); return; }
          if (action === 'edit') { const form = button.closest('.social-comment').querySelector('[data-comment-edit-form]'); form.hidden = !form.hidden; if (!form.hidden) form.querySelector('textarea').focus(); return; }
          if (action === 'cancel-edit') { const form = button.closest('[data-comment-edit-form]'); form.hidden = true; return; }
          if (action === 'delete') { if (!window.confirm(copy[lang()].remove + '?')) return; const response = await fetch(`/api/${kind === 'course' ? 'course-comments' : 'comments'}/${id}`, { method: 'DELETE', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' }); if (!response.ok) throw new Error(); }
          if (action === 'like') { const response = await fetch(`/api/${kind === 'course' ? 'course-comments' : 'comments'}/${id}/like`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' }); if (response.status === 401) { location.href = signInUrl(kind, itemId, 'comments'); return; } if (!response.ok) throw new Error(); }
          await loadSocial(kind, itemId);
        } catch { button.title = copy[lang()].error; }
      }));
    } catch { panel.innerHTML = `<p class="no-comments">${text(copy[lang()].error)}</p>`; }
  }
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
    if (cardObserver) { cardObserver.disconnect(); cardObserver = null; }
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cards.forEach((card) => card.classList.add('is-visible'));
      return;
    }
    cardObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); cardObserver.unobserve(entry.target); }
    }), { threshold: 0.12 });
    cards.forEach((card) => cardObserver.observe(card));
  };
  document.querySelectorAll('.post-filter').forEach((button) => button.addEventListener('click', () => { activeFilter = button.dataset.filter; render(); }));
  search.addEventListener('input', render);
  document.addEventListener('click', (event) => {
    const social = event.target.closest('[data-social-action]');
    if (social) { event.preventDefault(); handleSocialAction(social); return; }
    const button = event.target.closest('[data-open-item]');
    if (!button) return;
    const [kind, ...idParts] = button.dataset.openItem.split('-');
    const item = items.find((entry) => entry.kind === kind && String(entry.id) === idParts.join('-'));
    if (item) renderDetail(item);
  });
  async function handleSocialAction(button) {
    const id = Number(button.dataset.itemId); const kind = button.dataset.itemKind === 'course' ? 'course' : 'post'; const action = button.dataset.socialAction;
    if (action === 'share') {
      const url = `${location.origin}/posts?${kind}=${id}`;
      try {
        if (navigator.share) await navigator.share({ title: document.title, url });
        else if (navigator.clipboard?.writeText && window.isSecureContext) { await navigator.clipboard.writeText(url); button.title = copy[lang()].copied; }
        else { window.prompt(copy[lang()].copyLink, url); }
      } catch (error) {
        if (error.name !== 'AbortError') {
          try { window.prompt(copy[lang()].copyLink, url); } catch { button.title = copy[lang()].error; }
        }
      }
      return;
    }
    const item = items.find((entry) => entry.kind === kind && Number(entry.id) === id); if (!item) return;
    try {
      const response = await fetch(`/api/${kind === 'course' ? 'courses' : 'posts'}/${id}/${action}`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (response.status === 401) { location.href = signInUrl(kind, id, action); return; }
      if (!response.ok) throw new Error('action');
      const result = await response.json();
      if (action === 'like') Object.assign(item, { likedByMe: result.liked, likeCount: result.likeCount });
      if (action === 'bookmark') item.bookmarkedByMe = result.bookmarked;
      render();
      if (activeItemId === id && activeItemKind === kind) renderDetail(item);
    } catch { button.title = copy[lang()].error; }
  }
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); search.focus(); }
    if (event.key === 'Escape' && detail.open) detail.close();
  });
  new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  $('#post-detail').addEventListener('click', (event) => { if (event.target === detail) detail.close(); });
  $('.post-detail-close').addEventListener('click', () => detail.close());
  $('#posts-year').textContent = new Date().getFullYear();
  $('#posts-loading').hidden = false;
  fetch('/api/content', { credentials: 'same-origin' }).then((response) => {
    if (!response.ok) throw new Error('Content unavailable');
    return response.json();
  }).then(async (data) => {
    items = [
      ...(Array.isArray(data.posts) ? data.posts.map((item) => ({ ...item, kind: 'post', body: item.body || '' })) : []),
      ...(Array.isArray(data.courses) ? data.courses.map((item) => ({ ...item, kind: 'course', body: [item.description, item.details].filter(Boolean).join('\n\n') })) : []),
    ].sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt));
    loading.hidden = true;
    render();
    const params = new URLSearchParams(location.search);
    const requestedKind = params.has('course') ? 'course' : 'post';
    const requestedId = params.get(requestedKind);
    const requested = requestedId ? items.find((item) => item.kind === requestedKind && String(item.id) === requestedId) : null;
    if (requested) {
      await renderDetail(requested);
      const url = new URL(location.href);
      const requestedAction = url.searchParams.get('action');
      url.searchParams.delete('action');
      if (requestedAction) history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
      if (requestedAction === 'like' && !requested.likedByMe || requestedAction === 'bookmark' && !requested.bookmarkedByMe) {
        const actionButton = document.querySelector(`#post-detail-content [data-social-action="${requestedAction}"]`);
        if (actionButton) await handleSocialAction(actionButton);
      } else if (requestedAction === 'comments') {
        document.querySelector('#post-social-panel .comment-compose textarea')?.focus();
      }
    }
  }).catch(() => { failed = true; loading.hidden = true; render(); });
})();
