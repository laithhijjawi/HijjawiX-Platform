(() => {
  'use strict';

  const API = 'https://ev-api.hijjawix.com/api/ev';

  const setupKeyEl = document.getElementById('setupKey');
  const displayNameEl = document.getElementById('displayName');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const createBtnEl = document.getElementById('createBtn');
  const msgEl = document.getElementById('msg');

  function show(text, ok = false) {
    msgEl.textContent = text;
    msgEl.style.color = ok ? '#55d9a8' : '#ffb75e';
  }

  async function createOwner() {
    const setupKey = setupKeyEl.value.trim();
    const displayName = displayNameEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value;

    if (!setupKey) return show('أدخل Owner Setup Key.');
    if (!email) return show('أدخل البريد الإلكتروني.');
    if (password.length < 10) return show('كلمة المرور يجب أن تكون 10 خانات أو أكثر.');

    createBtnEl.disabled = true;
    createBtnEl.textContent = 'CREATING...';
    show('جاري إنشاء حساب OWNER...');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      const form = new URLSearchParams();
      form.set('setupKey', setupKey);
      form.set('displayName', displayName);
      form.set('email', email);
      form.set('password', password);
      form.set('locale', 'ar');

      const r = await fetch(API + '/setup/owner', {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'
        },
        body: form.toString(),
        signal: controller.signal
      });

      const raw = await r.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch (_) {}

      if (!r.ok) {
        throw new Error(data.error || ('HTTP ' + r.status + (raw ? ' · ' + raw : '')));
      }

      show('تم إنشاء حساب OWNER بنجاح. يمكنك الآن فتح Owner Dashboard وتسجيل الدخول.', true);
      createBtnEl.textContent = 'OWNER CREATED';
      createBtnEl.disabled = true;
    } catch (e) {
      const message = e && e.name === 'AbortError'
        ? 'انتهت مهلة الاتصال بالـAPI. تأكد أن ev-api.hijjawix.com يعمل.'
        : (e && e.message ? e.message : 'تعذر إنشاء الحساب.');
      show(message);
      createBtnEl.disabled = false;
      createBtnEl.textContent = 'CREATE OWNER';
    } finally {
      clearTimeout(timer);
    }
  }

  if (!createBtnEl) {
    console.error('Hijjawi X EV Setup: create button not found');
    return;
  }

  createBtnEl.addEventListener('click', createOwner);
  show('جاهز لإنشاء حساب OWNER.');
})();