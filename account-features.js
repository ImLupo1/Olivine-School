(() => {
  const host = document.querySelector('#account-tools');
  if (!host) return;
  const ar = document.documentElement.lang !== 'fr' && document.documentElement.lang !== 'en';
  let lang = document.documentElement.lang;
  const t = (a, f, e) => lang === 'fr' ? f : lang === 'en' ? e : a;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const api = async (url, method = 'GET', body) => {
    const response = await fetch(url, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    let data = {}; try { data = await response.json(); } catch {}
    if (!response.ok) { const error = new Error(data.error || 'request_failed'); error.status = response.status; throw error; }
    return data;
  };
  const date = (value) => { try { return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium' }).format(new Date(String(value).replace(' ', 'T') + (String(value).includes('Z') ? '' : 'Z'))); } catch { return ''; } };
  let busy = false;

  async function refresh() {
    if (busy || document.querySelector('#account-panel')?.hidden) return;
    busy = true;
    lang = document.documentElement.lang;
    try {
      const data = await api('/api/me/dashboard');
      lang = document.documentElement.lang;
      const p = data.profile;
      const avatar = p.avatarPath?.startsWith('/media/') ? p.avatarPath : '';
      const counts = data.stats;
      const n = (key) => esc(counts[key] || 0);
      const notificationCopy = (item) => {
        const actor = item.actorName || t('أحد أعضاء المدرسة', 'Un membre de l’école', 'A school member');
        const words = { new_post: t('شارك منشوراً جديداً', 'a partagé une nouvelle publication', 'shared a new post'), post_like: t('أعجب بمنشورك', 'a aimé votre publication', 'liked your post'), comment: t('علّق على منشورك', 'a commenté votre publication', 'commented on your post'), reply: t('ردّ على تعليقك', 'a répondu à votre commentaire', 'replied to your comment'), comment_like: t('أعجب بتعليقك', 'a aimé votre commentaire', 'liked your comment') };
        return `${actor} ${words[item.type] || ''}`;
      };
      const list = (items, empty) => items.length ? items.map((item) => `<a class="acct-item" href="/posts?${item.kind === 'course' ? 'course' : 'post'}=${Number(item.id)}"><span>${esc(item.title)}</span><small>${date(item.savedAt || item.lastViewedAt || item.createdAt)}</small></a>`).join('') : `<p class="acct-empty">${empty}</p>`;
      host.innerHTML = `
        <section class="acct-section acct-profile"><div class="acct-section-head"><div><small>${t('ملفي الشخصي', 'Mon profil', 'My profile')}</small><h3>${t('مساحتي في Olivine', 'Mon espace Olivine', 'My Olivine space')}</h3></div><button type="button" class="acct-avatar acct-avatar-picker" aria-label="${t('تغيير الصورة الشخصية', 'Changer la photo de profil', 'Change profile picture')}" aria-describedby="acct-avatar-instructions">${avatar ? `<img src="${esc(avatar)}" alt="">` : `<span class="acct-avatar-fallback">${esc((p.name || '?').slice(0,1))}</span>`}<span class="acct-avatar-edit-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m4 16.5-.8 4.3 4.3-.8L19.2 8.3l-3.5-3.5L4 16.5Z"/><path d="m13.9 6.1 3.5 3.5M4 20.8h16"/></svg></span></button></div>
          <form id="acct-profile-form" class="acct-form"><label>${t('الاسم الظاهر', 'Nom affiché', 'Display name')}<input name="name" maxlength="80" required value="${esc(p.name)}"></label><label>${t('نبذة قصيرة', 'Courte bio', 'Short bio')}<textarea name="bio" maxlength="280" rows="2">${esc(p.bio)}</textarea></label><input id="acct-avatar-input" class="acct-file-input" type="file" accept="image/jpeg,image/png,image/webp" aria-label="${t('اختر صورة الملف الشخصي', 'Choisir une photo de profil', 'Choose a profile picture')}"><p class="acct-avatar-help" id="acct-avatar-instructions">${t('اضغط على الصورة لتغييرها · JPG أو PNG أو WebP حتى 3MB', 'Touchez la photo pour la modifier · JPG, PNG ou WebP jusqu’à 3 Mo', 'Tap your photo to change it · JPG, PNG, or WebP up to 3MB')}</p><button class="button" type="submit">${t('حفظ الملف الشخصي', 'Enregistrer le profil', 'Save profile')}</button></form>
        </section>
        <section class="acct-section acct-activity"><div class="acct-section-head"><div><small>${t('نشاطي', 'Mon activité', 'My activity')}</small><h3>${t('لوحة حسابك', 'Tableau de bord', 'Account dashboard')}</h3></div></div><div class="acct-stats"><div><b>${n('saved')}</b><span>${t('محفوظ', 'Enregistrés', 'Saved')}</span></div><div><b>${n('viewed')}</b><span>${t('قُرئ', 'Consultés', 'Read')}</span></div><div><b>${n('comments')}</b><span>${t('تعليق', 'Commentaires', 'Comments')}</span></div><div><b>${n('likes')}</b><span>${t('إعجاب', 'J’aime', 'Likes')}</span></div></div></section>
        <section class="acct-section acct-library"><div class="acct-section-head"><div><small>${t('مكتبتك', 'Votre bibliothèque', 'Your library')}</small><h3>${t('محتوى محفوظ', 'Contenus enregistrés', 'Saved content')}</h3></div></div><div class="acct-list">${list(data.savedPosts, t('احفظ دورة أو منشوراً ليظهر هنا.', 'Enregistrez un cours ou une publication pour le retrouver ici.', 'Save a course or post to find it here.'))}</div></section>
        <section class="acct-section acct-history"><div class="acct-section-head"><div><small>${t('آخر نشاط', 'Activité récente', 'Recent activity')}</small><h3>${t('ما قرأته مؤخراً', 'Consultés récemment', 'Recently viewed')}</h3></div></div><div class="acct-list">${list(data.recentPosts, t('ستظهر المنشورات التي تفتحها هنا.', 'Les publications consultées apparaîtront ici.', 'Posts you open will appear here.'))}</div></section>
        <section class="acct-section acct-notification-section"><div class="acct-section-head"><div><small>${t('ابقَ على اطلاع', 'Restez informé', 'Stay in the loop')}</small><h3>${t('مركز الإشعارات', 'Centre de notifications', 'Notification center')}</h3></div><button type="button" class="acct-link" data-acct="read-all">${t('تحديد الكل كمقروء', 'Tout marquer comme lu', 'Mark all read')} · ${n('unread')}</button></div><div class="acct-notifications">${data.notifications.length ? data.notifications.map((item) => `<button class="acct-notice ${item.readAt ? '' : 'is-unread'}" type="button" data-open-notification="${Number(item.id)}" data-post-id="${Number(item.postId || 0)}"><span>${esc(notificationCopy(item))}</span><small>${esc(item.postTitle || '')} · ${date(item.createdAt)}</small></button>`).join('') : `<p class="acct-empty">${t('ستصلك الإشعارات هنا عند وجود جديد.', 'Vos notifications apparaîtront ici.', 'Your notifications will appear here.')}</p>`}</div></section>
        <section class="acct-section acct-preferences"><div class="acct-section-head"><div><small>${t('تحكّم', 'Préférences', 'Preferences')}</small><h3>${t('الإشعارات والأمان', 'Notifications et sécurité', 'Notifications & security')}</h3></div></div><label class="acct-toggle"><input data-pref="notifyNewPosts" type="checkbox" ${data.preferences.notifyNewPosts ? 'checked' : ''}><span>${t('أعلمني عند نشر جديد', 'M’avertir des nouvelles publications', 'Notify me about new posts')}</span></label><label class="acct-toggle"><input data-pref="notifySocial" type="checkbox" ${data.preferences.notifySocial ? 'checked' : ''}><span>${t('أعلمني بالتعليقات والإعجابات والردود', 'M’avertir des commentaires, mentions J’aime et réponses', 'Notify me about comments, likes, and replies')}</span></label><button type="button" class="acct-link acct-revoke" data-acct="revoke">${t('إنهاء الجلسات الأخرى', 'Révoquer les autres sessions', 'Sign out other sessions')} (${n('otherSessions')})</button></section>
        <section class="acct-section acct-security"><div class="acct-section-head"><div><small>${t('حماية الحساب', 'Sécurité du compte', 'Account security')}</small><h3>${t('تغيير كلمة المرور', 'Changer le mot de passe', 'Change password')}</h3></div></div><form id="acct-password-form" class="acct-form"><label>${t('كلمة المرور الحالية', 'Mot de passe actuel', 'Current password')}<input name="currentPassword" type="password" autocomplete="current-password" required maxlength="128"></label><label>${t('كلمة المرور الجديدة (12 خانة على الأقل)', 'Nouveau mot de passe (12 caractères min.)', 'New password (at least 12 characters)')}<input name="newPassword" type="password" autocomplete="new-password" required minlength="12" maxlength="128"></label><button class="button" type="submit">${t('تحديث كلمة المرور', 'Mettre à jour', 'Update password')}</button></form></section>
        <p class="acct-feedback" id="acct-feedback" role="status" aria-live="polite"></p>`;
      host.querySelector('#acct-profile-form').addEventListener('submit', saveProfile);
      const avatarInput = host.querySelector('#acct-avatar-input');
      host.querySelector('.acct-avatar-picker').addEventListener('click', () => avatarInput.click());
      avatarInput.addEventListener('change', uploadAvatar);
      host.querySelector('#acct-password-form').addEventListener('submit', changePassword);
      host.querySelectorAll('[data-pref]').forEach((input) => input.addEventListener('change', async () => {
        const values = Object.fromEntries([...host.querySelectorAll('[data-pref]')].map((node) => [node.dataset.pref, node.checked]));
        try { await api('/api/me/preferences', 'PATCH', values); feedback(t('تم حفظ التفضيلات.', 'Préférences enregistrées.', 'Preferences saved.')); } catch { feedback(t('تعذر حفظ الإعدادات.', 'Impossible d’enregistrer les préférences.', 'Could not save preferences.'), true); }
      }));
      host.querySelector('[data-acct="read-all"]')?.addEventListener('click', async () => { try { await api('/api/me/notifications/read-all', 'POST', {}); await refresh(); } catch {} });
      host.querySelector('[data-acct="revoke"]')?.addEventListener('click', async () => { try { const result = await api('/api/me/sessions/others', 'DELETE'); feedback(t(`تم إنهاء ${result.revoked} جلسة.`, `${result.revoked} session(s) révoquée(s).`, `${result.revoked} session(s) revoked.`)); await refresh(); } catch { feedback(t('تعذر إنهاء الجلسات.', 'Impossible de révoquer les sessions.', 'Could not revoke sessions.'), true); } });
      host.querySelectorAll('[data-open-notification]').forEach((button) => button.addEventListener('click', async () => {
        try { await api(`/api/me/notifications/${button.dataset.openNotification}`, 'PATCH', { read: true }); } catch {}
        if (Number(button.dataset.postId)) location.href = `/posts?post=${Number(button.dataset.postId)}`;
      }));
    } catch (error) { host.innerHTML = `<p class="acct-empty">${error.status === 401 ? t('انتهت الجلسة. سجّل الدخول مجدداً.', 'Session expirée. Connectez-vous à nouveau.', 'Session expired. Please sign in again.') : t('تعذر تحميل لوحة الحساب.', 'Impossible de charger le tableau de bord.', 'Could not load your dashboard.')}</p>`; }
    finally { busy = false; }
  }
  function feedback(message, error = false) { const el = host.querySelector('#acct-feedback'); if (!el) return; el.textContent = message; el.dataset.error = String(error); }
  async function saveProfile(event) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); try { const result = await api('/api/me/profile', 'PATCH', values); const welcome = document.querySelector('#account-welcome'); if (welcome) welcome.textContent = window.olivineI18n?.welcome(result.user.name) || result.user.name; feedback(t('تم تحديث ملفك الشخصي.', 'Profil mis à jour.', 'Profile updated.')); await refresh(); } catch { feedback(t('تعذر حفظ الملف الشخصي.', 'Impossible d’enregistrer le profil.', 'Could not save profile.'), true); } }
  async function uploadAvatar(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type) || file.size > 3 * 1024 * 1024) {
      input.value = '';
      feedback(t('اختر صورة JPG أو PNG أو WebP لا تتجاوز 3MB.', 'Choisissez une image JPG, PNG ou WebP de 3 Mo maximum.', 'Choose a JPG, PNG, or WebP image up to 3MB.'), true);
      return;
    }
    const button = host.querySelector('.acct-avatar-picker');
    let previewUrl = '';
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.classList.add('is-uploading');
      previewUrl = URL.createObjectURL(file);
      let preview = button.querySelector('img');
      if (!preview) {
        preview = document.createElement('img');
        preview.alt = '';
        const editIcon = button.querySelector('.acct-avatar-edit-icon');
        button.querySelector('.acct-avatar-fallback')?.remove();
        button.insertBefore(preview, editIcon);
      }
      preview.src = previewUrl;
    }
    feedback(t('جارٍ رفع الصورة…', 'Envoi de la photo…', 'Uploading photo…'));
    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await api('/api/me/avatar', 'POST', { type: file.type, data });
      await refresh();
      feedback(t('تم تحديث الصورة.', 'Photo mise à jour.', 'Photo updated.'));
    } catch (error) {
      await refresh();
      const message = error.status === 401
        ? t('سجّل الدخول لتغيير صورة حسابك.', 'Connectez-vous pour changer votre photo.', 'Sign in to change your photo.')
        : error.status === 413 || error.message === 'too_large'
          ? t('الصورة أكبر من الحد المسموح، اختر صورة أصغر.', 'La photo dépasse la taille autorisée.', 'The photo exceeds the upload limit.')
          : error.message === 'invalid_media'
            ? t('تعذر قراءة الصورة. اختر JPG أو PNG أو WebP صالحة.', 'Photo invalide. Choisissez un fichier JPG, PNG ou WebP.', 'Invalid image. Choose a valid JPG, PNG, or WebP file.')
            : t('تعذر رفع الصورة. تحقق من اتصال الخادم وحاول مجدداً.', 'Envoi impossible. Vérifiez la connexion au serveur et réessayez.', 'Could not upload the photo. Check the server connection and try again.');
      feedback(message, true);
    } finally {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      input.value = '';
    }
  }
  async function changePassword(event) { event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form)); try { await api('/api/me/password', 'PATCH', values); form.reset(); feedback(t('تم تغيير كلمة المرور وإنهاء الجلسات الأخرى.', 'Mot de passe modifié et autres sessions révoquées.', 'Password changed and other sessions signed out.')); await refresh(); } catch (error) { feedback(error.message === 'invalid_current_password' ? t('كلمة المرور الحالية غير صحيحة.', 'Mot de passe actuel incorrect.', 'Current password is incorrect.') : t('تعذر تغيير كلمة المرور. تأكد من طولها.', 'Impossible de changer le mot de passe. Vérifiez sa longueur.', 'Could not change password. Check its length.'), true); } }
  window.addEventListener('olivine:account', refresh);
  window.addEventListener('olivine:account-open', refresh);
  const accountObserver = new MutationObserver(() => { if (!document.querySelector('#account-panel')?.hidden) refresh(); });
  accountObserver.observe(document.querySelector('#account-panel'), { attributes: true, attributeFilter: ['hidden'] });
  accountObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  if (!document.querySelector('#account-panel')?.hidden) refresh();
  document.querySelector('#account-dialog')?.addEventListener('close', () => { host.replaceChildren(); });
})();
