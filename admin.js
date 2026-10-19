const alertBox = document.querySelector('#admin-alert');
const viewIds = ['course-form', 'post-form', 'content-view', 'notice-view'];
const tabs = [...document.querySelectorAll('.admin-tab')];

function setAlert(message, error = false) {
  alertBox.textContent = message;
  alertBox.dataset.state = error ? 'error' : '';
  alertBox.hidden = !message;
}

async function api(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  let data = {};
  try { data = await response.json(); } catch {}
  if (!response.ok) throw Object.assign(new Error(data.error || 'حدث خطأ أثناء تنفيذ الطلب.'), { status: response.status });
  return data;
}

function openView(id) {
  viewIds.forEach((viewId) => {
    const section = document.getElementById(viewId);
    section.hidden = viewId !== id;
    section.classList.toggle('is-active', viewId === id);
  });
  tabs.forEach((tab) => {
    const active = tab.dataset.view === id;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  if (id === 'content-view' || id === 'notice-view') loadDashboard();
}

tabs.forEach((tab) => tab.addEventListener('click', () => openView(tab.dataset.view)));

function readFile(file) {
  if (!file) return Promise.resolve(null);
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
  if (!allowed.includes(file.type)) throw new Error('نوع الملف غير مدعوم. اختر صورة JPG أو PNG أو WEBP، أو فيديو MP4 أو WEBM.');
  if (file.size > 15 * 1024 * 1024) throw new Error('حجم الملف أكبر من 15 MB.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذرت قراءة الملف.'));
    reader.onload = () => resolve({ type: file.type, data: String(reader.result).split(',')[1] || '' });
    reader.readAsDataURL(file);
  });
}

async function saveForm(form, kind) {
  const submit = form.querySelector('button[type=submit]');
  submit.disabled = true;
  setAlert('جارٍ حفظ المحتوى...');
  let uploadedPath = '';
  try {
    const values = Object.fromEntries(new FormData(form).entries());
    const file = form.elements.media.files[0];
    const uploaded = await readFile(file);
    let mediaPath = '';
    let mediaType = '';
    if (uploaded) {
      setAlert('جارٍ رفع الملف...');
      const media = await api('/api/admin/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(uploaded) });
      mediaPath = media.path;
      mediaType = media.type;
      uploadedPath = media.path;
    }
    const payload = kind === 'courses'
      ? { title: values.title, description: values.description, details: values.details || '', mediaPath, status: values.publish ? 'published' : 'draft' }
      : { title: values.title, body: values.body, mediaPath, mediaType, status: values.publish ? 'published' : 'draft' };
    await api(`/api/admin/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    form.reset();
    form.elements.publish.checked = true;
    setAlert(payload.status === 'published' ? 'تم النشر بنجاح. أصبح المحتوى متاحاً في الموقع.' : 'تم حفظ المحتوى كمسودة.');
  } catch (error) {
    if (uploadedPath) {
      try { await api('/api/admin/media', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: uploadedPath }) }); }
      catch { /* Keep the original publish error visible if cleanup is unavailable. */ }
    }
    setAlert(error.message === 'forbidden' ? 'هذا الحساب لا يملك صلاحية الإدارة.' : error.message, true);
  } finally { submit.disabled = false; }
}

document.querySelector('#new-course-form').addEventListener('submit', (event) => { event.preventDefault(); saveForm(event.currentTarget, 'courses'); });
document.querySelector('#new-post-form').addEventListener('submit', (event) => { event.preventDefault(); saveForm(event.currentTarget, 'posts'); });

function itemElement(item, kind) {
  const article = document.createElement('article');
  article.className = 'admin-item';
  const copy = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = item.title;
  const body = document.createElement('p');
  body.textContent = kind === 'courses' ? item.description : item.body;
  const meta = document.createElement('small');
  meta.textContent = `${kind === 'courses' ? 'دورة' : 'منشور'} · ${item.status === 'published' ? 'منشور' : 'مسودة'} · ${new Date(item.createdAt).toLocaleDateString('ar-DZ')}`;
  const status = document.createElement('span');
  status.className = 'admin-status';
  status.dataset.status = item.status;
  status.textContent = item.status === 'published' ? 'منشور' : 'مسودة';
  copy.append(title, body, meta, status);
  const actions = document.createElement('div');
  actions.className = 'admin-item-actions';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.dataset.action = 'toggle';
  toggle.textContent = item.status === 'published' ? 'إخفاء' : 'نشر';
  toggle.addEventListener('click', async () => {
    try {
      const nextStatus = item.status === 'published' ? 'draft' : 'published';
      await api(`/api/admin/${kind}/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
      await loadDashboard();
      setAlert(nextStatus === 'published' ? 'تم نشر المحتوى.' : 'تم إخفاء المحتوى من الصفحة العامة.');
    } catch (error) { setAlert(error.message, true); }
  });
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.dataset.action = 'delete';
  remove.textContent = 'حذف';
  remove.addEventListener('click', async () => {
    if (!window.confirm(`هل تريد حذف «${item.title}» نهائياً؟`)) return;
    try { await api(`/api/admin/${kind}/${item.id}`, { method: 'DELETE' }); await loadDashboard(); setAlert('تم حذف المحتوى.'); }
    catch (error) { setAlert(error.message, true); }
  });
  actions.append(toggle, remove);
  article.append(copy, actions);
  if (item.mediaPath) {
    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'admin-item-media';
    const media = item.mediaType?.startsWith('video/') ? document.createElement('video') : document.createElement('img');
    media.src = item.mediaPath;
    if (media instanceof HTMLVideoElement) { media.controls = true; media.preload = 'metadata'; }
    else { media.alt = `وسائط: ${item.title}`; media.loading = 'lazy'; }
    mediaWrap.append(media);
    article.append(mediaWrap);
  }
  return article;
}

function notificationElement(item) {
  const article = document.createElement('article');
  article.className = 'admin-item';
  const copy = document.createElement('div');
  const title = document.createElement('h3'); title.textContent = item.subject;
  const body = document.createElement('p'); body.textContent = item.body;
  const status = document.createElement('small'); status.className = 'notification-status';
  status.textContent = item.status === 'sent' ? 'تم إرسال البريد' : item.status === 'failed' ? 'تعذّر الإرسال — راجع إعدادات SMTP' : 'مسجّل، بانتظار إعداد SMTP';
  copy.append(title, body, status);
  article.append(copy);
  return article;
}

async function loadDashboard() {
  try {
    const data = await api('/api/admin/content');
    const content = document.querySelector('#admin-content');
    content.replaceChildren();
    const rows = [...data.courses.map((item) => ({ ...item, kind: 'courses' })), ...data.posts.map((item) => ({ ...item, kind: 'posts' }))].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    if (rows.length) rows.forEach((item) => content.append(itemElement(item, item.kind)));
    else { const empty = document.createElement('p'); empty.className = 'admin-empty'; empty.textContent = 'لا يوجد محتوى بعد. أنشئ أول دورة أو منشور.'; content.append(empty); }
    const emailStatus = document.querySelector('#email-status');
    emailStatus.textContent = data.emailConfigured
      ? `الإرسال مفعّل إلى ${data.notificationEmail}.`
      : `البريد المخصّص للإدارة: ${data.notificationEmail}. سيُسجّل كل إشعار هنا؛ أضف بيانات SMTP إلى ملف .env لتفعيل الإرسال الفعلي.`;
    const notifications = document.querySelector('#admin-notifications');
    notifications.replaceChildren();
    if (data.notifications.length) data.notifications.forEach((item) => notifications.append(notificationElement(item)));
    else { const empty = document.createElement('p'); empty.className = 'admin-empty'; empty.textContent = 'ستظهر إشعارات الدورات والمنشورات هنا.'; notifications.append(empty); }
  } catch (error) {
    setAlert(error.status === 401 ? 'سجّل الدخول أولاً باستخدام حساب مدير.' : error.status === 403 ? 'هذا الحساب لا يملك صلاحية الإدارة.' : error.message, true);
  }
}

document.querySelector('#refresh-content').addEventListener('click', loadDashboard);
document.querySelector('#admin-logout').addEventListener('click', async () => {
  try { await api('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); location.href = '/'; }
  catch (error) { setAlert(error.message, true); }
});

(async () => {
  try {
    const { user } = await api('/api/me');
    if (!user) { setAlert('سجّل الدخول بحساب مدير. لإعداد أول مدير، شغّل node create-admin.cjs في مجلد الموقع، ثم ارجع إلى الصفحة الرئيسية وسجّل الدخول.', true); tabs.forEach((tab) => { tab.disabled = true; }); return; }
    if (user.role !== 'admin') { setAlert('هذه الصفحة مخصّصة للمديرين. حسابك الحالي لا يملك صلاحية الإدارة.', true); tabs.forEach((tab) => { tab.disabled = true; }); return; }
    document.querySelector('#admin-name').textContent = user.name;
  } catch { setAlert('تعذر الاتصال بالخادم. تأكد من تشغيل node serve.cjs.', true); return; }
})();
