# HIJJAWI X Device — Factory Bootstrap v0.1

هذه أول نسخة مختبر للوحة LILYGO T-CAN485 / ME-12220.

## الهدف الآن
- لا تحتاج microSD.
- تعمل من USB فقط على الطاولة.
- تنشئ شبكة إعداد محلية.
- تحفظ Wi-Fi وServer URL وClaim Code في NVS.
- تشغل CAN بسرعة 500 kbps في LISTEN ONLY فقط.
- تعرض Device ID وFrames/s وحالة Wi-Fi.
- ترسل Bootstrap Heartbeat اختباري إذا تم إدخال Server URL.

## شبكة الإعداد
بعد البرمجة:
- SSID: `HXD-SETUP-xxxxxx`
- Password: `hxdsetup123`
- افتح: `http://192.168.4.1`

> كلمة المرور الحالية مختبرية فقط وليست إعداد المنتج النهائي.

## مهم أمنيًا
هذا الإصدار Alpha لا يُستخدم كمنتج تجاري ولا للتفعيل النهائي. إذا تم إدخال HTTPS فهو يستخدم اتصال TLS بدون تحقق CA فقط لاختبار مسار الشبكة. قبل التفعيل والترخيص الحقيقي سنستبدله بتحقق كامل من شهادة السيرفر + هوية مشفرة فريدة للجهاز + Secure Boot + Flash Encryption في Production profile.

## CAN
حسب pinout الرسمي للـT-CAN485:
- CAN TX: GPIO27
- CAN RX: GPIO26
- CAN speed mode: GPIO23
- CAN/RS485 boost enable: GPIO16

الوضع المستخدم: `TWAI_MODE_LISTEN_ONLY` بسرعة 500 kbps، لذلك firmware لا يرسل CAN frames.

## أول تجربة
1. لا توصل القطعة بالسيارة.
2. وصلها USB فقط.
3. ارفع `merged.bin` باستخدام تطبيق Android Programmer أو esptool.
4. أعد تشغيلها.
5. من الهاتف اتصل بشبكة HXD-SETUP.
6. افتح 192.168.4.1.
7. تأكد أن Device ID ظاهر وأن CAN = Listen Only.
8. أدخل Wi-Fi فقط الآن واترك Server URL فارغًا إذا لم ننشر API بعد.
