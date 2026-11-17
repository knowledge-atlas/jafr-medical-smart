# تقرير المراجعة — الجفر التراثي الذكي

| الملف | الحالة | الخطأ | الخطورة | يمنع النشر؟ |
|---|---|---|---|---|
| App.tsx | ✅ أُصلح | `isPremium` محلي ثابت `false` → الأقفال لا تُفتح أبداً حتى بعد الدفع/الرقم السري | حرجة | نعم |
| ReportScreen.tsx | ✅ أُصلح | أزرار النسخ/المشاركة مقفلة دائماً رغم وجود الدوال | عالية | لا |
| structuredReportBuilder.ts | ✅ أُصلح | قسم «الموسوعة الطبية» يُضاف للتقارير متجاوزاً `FLAGS.MEDICAL_MODULE=false` (مخاطرة Health في Play) | عالية | نعم |
| PaywallScreen.tsx | ✅ أُصلح | ادّعاء طرق دفع غير Google Play (بطاقات/STC/PayPal) — مخالف لسياسة الفوترة | عالية | نعم |
| DevAccessModal / DevCodeModal / devAccess.ts | ✅ حُذفت | كود ميت يحمل تجزئة 123456 غير مملّحة | متوسطة | لا |
| PremiumContext.tsx | ✅ أُصلح | `setPremium` لا يحفظ؛ لا `refresh` | متوسطة | لا |
| HomeScreen.tsx | ⚠️ لم يُغيَّر | `canAnalyze = true` — حد 3 تحليلات مجانية غير مُطبَّق رغم إعلانه | قرار تجاري | لا |
| TraditionalTabScreen / DeepDiveReport | ⚠️ لم يُغيَّر | نص يُعلن «الموسوعة الطبية التكاملية» بينما الوحدة معطّلة (تغيير نص = تغيير معنى) | متوسطة | يُنصح بمراجعته |
| STORE_LISTING.md | ⚠️ ناقص | روابط `https://[domain]/privacy` و`/terms` ما زالت قوالب | عالية | نعم (Play يطلب رابط خصوصية حي) |
| Billing | ⚠️ ناقص | لا مكتبة فوترة ولا منتجات؛ أُضيف `BillingService` كنقطة ربط | عالية | نعم للاشتراكات |
| GitHub remote 404 | ⚠️ لم يُتحقق | يحتاج وصولاً للشبكة/حسابك | منخفضة | لا |
| PRIVACY / TERMS / DATA_SAFETY / AI Disclosure / زر حذف البيانات / icon / feature-graphic / CI | ✅ موجودة | لا أخطاء ظاهرة في الفحص | — | لا |
