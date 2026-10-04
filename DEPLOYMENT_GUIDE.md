# 🚀 Deployment Guide — Google Play

**دليل خطوة بخطوة للنشر على Google Play Store**

---

## 📋 المتطلبات الأساسية

| المتطلب | التكلفة | الوقت |
|---------|--------|-------|
| حساب Google | $0 | 5 دقائق |
| Google Play Console | $25 (مرة واحدة) | 15 دقيقة |
| بطاقة بنكية أو PayPal | — | — |
| APK موقّع | $0 | ساعة |
| Screenshots | $0 | ساعتان |
| Privacy Policy | $0 | ساعة |

**الإجمالي: ~$25 + 6 ساعات عمل**

---

## 🎯 المرحلة 1: تجهيز الحساب (يوم 1)

### 1.1 إنشاء حساب Google Play Console

1. افتح: https://play.google.com/console
2. سجّل بحساب Google
3. اختر: **مطوّر فردي**
4. ادفع الرسوم: **$25**
5. أدخل معلومات:
   - الاسم القانوني: Mohammed Saeed
   - العنوان
   - رقم الهاتف
   - البريد الإلكتروني

### 1.2 التحقق من الهوية

Google سيطلب:
- صورة من بطاقة الهوية أو جواز السفر
- إثبات العنوان (فاتورة كهرباء أو كشف بنكي)

**مدة التحقق:** 1-3 أيام عمل

---

## 🎯 المرحلة 2: تجهيز APK موقّع (يوم 2)

### 2.1 توليد مفتاح التوقيع (Keystore)

في Termux:

```bash
cd ~/my-jafr-app
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore release.keystore \
  -alias knowledgeatlas \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**سيطلب منك:**
- كلمة مرور Keystore (احفظها في مكان آمن!)
- الاسم: Mohammed Saeed
- المؤسسة: KnowledgeAtlas
- المدينة، الدولة

### 2.2 بناء APK موقّع

```bash
cd android
./gradlew assembleRelease
```

**الملف الناتج:**
`android/app/build/outputs/apk/release/app-release.apk`

**⚠️ مهم:** احفظ `release.keystore` + كلمة المرور **خارج Termux** (نسخة على Google Drive)

---

## 🎯 المرحلة 3: تجهيز الأصول البصرية (يوم 2-3)

### 3.1 الأصول المطلوبة

| الأصل | الحجم | الحالة |
|-------|-------|--------|
| أيقونة التطبيق | 512×512 | ✅ مولّد HTML |
| Feature Graphic | 1024×500 | ✅ مولّد HTML |
| 6-8 Screenshots | 1080×1920 | ⏳ من الهاتف |
| فيديو ترويجي (اختياري) | 30 ثانية | ⏳ لاحقاً |

### 3.2 إنشاء Screenshots

**الطريقة الأسهل:**
1. افتح التطبيق في Expo Go
2. انتقل لكل شاشة مهمة
3. خُذ screenshot (Power + Volume Down)
4. كرر لكل شاشة

**الشاشات المقترحة:**
1. الشاشة الرئيسية
2. ProductPicker (7 بطاقات)
3. التقرير العميق (Radar Chart)
4. الملف الانعكاسي (12 محور)
5. التقويم الزمني
6. المساعد AI
7. ConsentScreen
8. ميزات الحماية

---

## 🎯 المرحلة 4: إنشاء التطبيق في Console (يوم 3)

### 4.1 إنشاء تطبيق جديد

1. من Dashboard → **Create app**
2. اختر:
   - **الاسم:** KnowledgeAtlas — نظام المعرفة الذكي
   - **اللغة الافتراضية:** العربية
   - **التطبيق/اللعبة:** تطبيق
   - **مجاناً/مدفوع:** مجاني

### 4.2 إعداد Store Listing

من **Store presence → Main store listing**:

| الحقل | القيمة |
|-------|--------|
| اسم التطبيق | KnowledgeAtlas |
| الوصف القصير | انسخ من STORE_LISTING.md |
| الوصف الكامل | انسخ من STORE_LISTING.md |
| Screenshots (Phone) | 6-8 صور |
| Feature Graphic | 1024×500 |
| الأيقونة | 512×512 |

### 4.3 إعداد Classification

- **App category:** Lifestyle
- **Tags:** self-improvement, personalization
- **Content rating:** املأ استبيان IARC → Teen (13+)

### 4.4 إعداد Privacy Policy

- **URL:** (نشر ملف PRIVACY_POLICY.md على GitHub Pages)
- الخطوات:
  1. اذهب إلى مستودع GitHub
  2. Settings → Pages → Source: main
  3. ستُتاح URL: `username.github.io/jafr-medical-smart/PRIVACY_POLICY.md`

---

## 🎯 المرحلة 5: رفع APK (يوم 3-4)

### 5.1 إنشاء Release

1. من Dashboard → **Production → Create new release**
2. ارفع APK الموقّع
3. اكتب Release notes (عربي):

```
🎉 الإصدار الأول من KnowledgeAtlas Sovereign!

✨ الميزات:
- 18 قسماً في التقرير العميق
- 11 محركاً تحليلياً
- 12 محوراً انعكاسياً
- حماية طبية تلقائية
- يعمل 100% بدون إنترنت
```

### 5.2 النشر التدريجي

**اختر:**
- 🎯 **Internal testing** (10 أشخاص) — أسبوع
- 🎯 **Closed testing** (100) — أسبوع
- 🎯 **Open testing** (1,000) — أسبوعان
- 🎯 **Production** — عام

---

## 🎯 المرحلة 6: بعد النشر

### 6.1 مراقبة الـ KPIs

من Play Console → Statistics:
- عدد التثبيتات
- التقييمات
- ANRs (Application Not Responding)
- Crashes

### 6.2 الرد على التقييمات

- رد على كل تقييم خلال 48 ساعة
- شكر على الإيجابي
- اسأل عن التفاصيل في السلبي

### 6.3 التحديثات

- **أسبوعياً:** إصلاح الأعطال
- **كل شهر:** ميزات جديدة
- **كل ربع:** إصدار كبير

---

## 📊 جدول النشر الزمني

| الأسبوع | المرحلة |
|---------|---------|
| 1 | تسجيل + تحقق هوية
| 2 | بناء APK + Assets
| 3 | Store listing + APK رفع
| 4 | Internal testing
| 5 | Closed testing
| 6-7 | Open testing
| 8 | Production

---

## ✅ Checklist نهائي قبل النشر

- [ ] حساب Play Console مُفعّل
- [ ] APK موقّع + release.keystore محفوظ
- [ ] أيقونة 512×512
- [ ] Feature Graphic 1024×500
- [ ] 6-8 Screenshots
- [ ] Store listing (عربي كامل)
- [ ] Store listing (إنجليزي)
- [ ] Privacy Policy URL
- [ ] Content rating
- [ ] Target audience (13+)
- [ ] Countries (كل العالم)
- [ ] Release notes

---

## 🚨 تحذيرات مهمة

### ⚠️ احفظ مفتاح التوقيع!
- إذا فقدته → **لا يمكن تحديث التطبيق** أبداً
- احفظ نسختين: جهاز + سحابة

### ⚠️ لا تستخدم "Test" APK
- يجب أن يكون **Release** signed
- Test APK لن يُقبل

### ⚠️ مراجعة Google قد تستغرق 7 أيام
- الإصدار الأول: 7 أيام
- التحديثات: 1-3 أيام

---

## 📞 المساعدة

- **Play Console Support:** support.google.com/googleplay/android-developer
- **GitHub:** github.com/mohammedsaeedsaeed95-byte/jafr-medical-smart

---

*آخر تحديث: 2026-10-04 · v2.3.2*

