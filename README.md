# Hijjawi X Platform · منصة حجاوي X

المستودع الرسمي للواجهة الرئيسية للمنصة على `hijjawix.com`، مستقل كلياً عن مشروع لعبة Fold & Fire.

## محتويات المستودع
- `public/index.html` — الواجهة الرئيسية (عربي/English).
- `public/styles.css` — التصميم المتجاوب والشخصيات البصرية للتصنيفات.
- `public/app.js` — التصنيفات والتطبيقات والبحث والتصفية والتبديل بين اللغات.
- `public/logo.svg` — الشعار المتجهي.
- `wrangler.jsonc` — إعداد Cloudflare Worker خاص بالمنصة.
- `tests/smoke.test.mjs` — فحوصات محلية سريعة.

الواجهة تعرض تطبيق **آية لك** ولعبة **Fold & Fire**، والتصنيفات الخالية تظهر «قيد التطوير».
لتحديث اسم تطبيق أو رابطه أو حالته، عدّل بيانات `categories` داخل `public/app.js`.

## نشر المنصة لأول مرة باستخدام Cloudflare Workers Builds

1. افتح [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages** > **Create application** > **Import a repository**.
2. اختر GitHub ثم المستودع `laithhijjawi/HijjawiX-Platform`.
3. اسم المشروع/الـ Worker: `hijjawix-platform`.
4. Production branch: `main`.
5. Root directory: `/` (جذر المستودع).
6. Build command: **فارغ / none** لأن المشروع HTML/CSS/JS بدون عملية build. لو النظام يطلب أمراً، استخدم `npm install` فقط.
7. Deploy command: `npx wrangler deploy`.
8. انشر المشروع، وافتح رابط `*.workers.dev` الذي تعطيك إياه Cloudflare وتحقق من الصفحة أولاً.
9. افتح Worker الجديد > **Settings > Domains & Routes** > **Add > Custom Domain** وأدخل `hijjawix.com`.
10. بعد نجاح الربط، أضف `www.hijjawix.com` إن رغبت. يمكن ضبط إعادة توجيه www إلى الدومين الرئيسي لاحقاً.

**تنبيه:** لا تضف الدومين الرئيسي إلى `fold-and-fire-online`؛ بل إلى `hijjawix-platform` فقط. لا تحذف نطاق أو Worker `ayahlak.hijjawix.com` الحالي. تطبيق آية لك ما زال يعمل عبر Worker القديم مؤقتاً، ويمكن نقله إلى مشروع مستقل في مرحلة تالية دون التأثير على المنصة. لعبة Fold & Fire تبقى مستقلة من ناحية واجهة المنصة لكن خلفيتها (rooms/social) لا تُنقل هنا.

## تطوير محلي
```sh
npm install
npm test
npm run dev
```

## الخصوصية
الموقع لا يتطلب مفاتيح API أو بيانات دخول. لا تضع أسرار Cloudflare أو Google داخل المستودع. تغيير إعدادات DNS والنشر يتم من حسابك في Cloudflare.

## Post-reconnection verification (2026-10-24)

After restoring the Cloudflare GitHub integration, this documentation update intentionally triggers a fresh push to the production `main` branch. Confirm that Cloudflare Workers Builds deploys the latest platform files and that the live homepage includes the release marker `hijjawix-mobile-20261024-v1` in its HTML. The production Worker must remain `hijjawix-platform` and should serve `hijjawix.com`; keep other apps independent.
