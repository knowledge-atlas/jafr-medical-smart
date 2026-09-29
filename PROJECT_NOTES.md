# مشروع المحرك الوجودي الجفري + الموسوعة الطبية التكاملية

## البنية الأساسية

### البيانات (src/data/)
- roots.ts — الجذور التسعة (نصوص كاملة)
- planets.ts — الكواكب العشرة
- signs.ts — الأبراج الاثنا عشر
- elements.ts — الطبائع الأربع
- houses.ts — البيوت الاثنا عشر
- remainders.ts — البواقي التسعة
- wafq.ts — الأوفاق الثمانية
- compounds.ts — التراكيب الثنائية (33 تركيباً)
- remedies.ts — الترياقات
- resonance.ts — الرنين بين الجذور
- letters.ts — الحروف الـ28
- encyclopedia.ts — طبقة الوصول إلى JSON
- jafr_encyclopedia_FULL_v2.json — الموسوعة الكاملة (505KB)
- medicalRoots.ts — البيانات الطبية للجذور والبواقي
- medicalTables.ts — 20 جدولاً تكاملياً ومصفوفياً

### المحرك (src/engine/)
- abjad.ts — حساب الأبجد
- calculator.ts — محرك الحساب
- reportBuilder.ts — بناء التقرير
- compoundAnalyzer.ts — تحليل التراكيب
- wafqGenerator.ts — بناء الأوفاق

### الشاشات (src/screens/)
- HomeScreen.tsx — إدخال الاسم والأعراض
- ReportScreen.tsx — عرض التقرير + زر الموسوعة الطبية
- HistoryScreen.tsx — سجل التقارير
- MedicalScreen.tsx — الموسوعة الطبية التكاملية

## الميزات الرئيسية
1. حساب الجذر والباقي والكوكب والبرج والبيت والطبع
2. عرض نصوص كاملة من الموسوعة (بدون حذف)
3. حفظ التقارير في AsyncStorage
4. تبويب طبي تكاملي (عصبي-هرموني-رمزي)
5. 20 جدولاً مرجعياً

## الأوامر الأساسية
- التشغيل: npx expo start -c
- بناء APK: npx eas build --platform android --profile preview
- بناء ويب: npx expo export:web

## الحالة
- الإصدار: 2.0
- آخر تحديث: 2026
