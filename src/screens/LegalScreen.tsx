import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';

const DOCS = {
  privacy: {
    title: '🔒 سياسة الخصوصية',
    content: `
# سياسة الخصوصية

المبدأ الأساسي: التطبيق يعمل Offline-first ولا يجمع أي بيانات شخصية.

## ما لا نجمعه
• الاسم الذي تحلله
• التقرير المولّد
• محتوى المحادثات
• بريدك الإلكتروني
• موقعك
• جهات الاتصال
• الصور أو الملفات

## ما يبقى على جهازك
• التقارير المحفوظة (AsyncStorage)
• مفاتيح API (SecureStore مشفّر)
• حالة الموافقة
• إحصائيات الاستخدام
• قائمة انتظار الوحدة الطبية
• سجل الأخطاء

## متى تُرسَل بيانات خارجاً؟
فقط في حالة استخدام AI بموافقتك:
• Gemini (Google)
• OpenAI
• Groq
• OpenRouter

أنت المسؤول عن تكاليف الاستخدام.

## أذونات النظام
لا يطلب التطبيق أي إذن نظام.

## تنبيه قانوني
التطبيق أداة تأمل رمزية تراثية. لا يقدم:
• تشخيصاً طبياً
• توصيات دوائية
• تنبؤات قطعية
• فتاوى دينية

## حذف بياناتك
• من التطبيق: الإعدادات → حذف التقارير
• حذف التطبيق = حذف كل شيء

## التواصل
mohammedsaeed95@gmail.com
    `,
  },
  terms: {
    title: '📜 شروط الخدمة',
    content: `
# شروط الخدمة

## طبيعة الخدمة
منصة تحليل معرفي تراثي (ليست أداة طبية).

## الاستخدام المسموح
• التحليل الذاتي
• التأمل الشخصي
• المشاركة مع الأصدقاء
• الاستخدام التعليمي

## الاستخدام الممنوع
• تشخيص مرض أو تحديد علاج
• قرارات قانونية أو مالية
• إيذاء الآخرين
• اختراق التطبيق
• إعادة البيع دون ترخيص

## الملكية الفكرية
• تملك: الاسم، التقرير، الملاحظات
• نملك: الكود، الموسوعة، الواجهة، العلامة

## حد المسؤولية
التطبيق «كما هو» — لا نضمن الدقة الكاملة.
القرارات التي تتخذها = مسؤوليتك.

## التواصل
mohammedsaeed95@gmail.com
    `,
  },
  license: {
    title: '🔐 الترخيص',
    content: `
# الترخيص

حقوق الطبع والنشر © 2026 محمد الاهنومي

## الملكية
هذا المشروع ملكية فكرية حصرية لـ:
محمد الاهنومي

## استخدام الكود
مسموح:
• الاستخدام الشخصي
• الدراسة الأكاديمية
• التطوير الشخصي
• الفروع على GitHub

ممنوع بدون إذن كتابي:
• البيع التجاري
• التضمين في منتج تجاري
• إعادة التوزيع باسم آخر
• استخدام العلامة التجارية

## الترخيص التجاري
للحصول على ترخيص تجاري:
mohammedsaeed95@gmail.com

## المكتبات الخارجية
React Native (MIT), Expo (MIT), TypeScript (Apache-2.0)

## التواصل
mohammedsaeed95@gmail.com
    `,
  },
};

export default function LegalScreen({ route, navigation }: any) {
  const { doc } = route.params || { doc: 'privacy' };
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const d = DOCS[doc as keyof typeof DOCS] ?? DOCS.privacy;
    setTitle(d.title);
    setContent(d.content);
    setLoading(false);
    navigation.setOptions({ title: d.title });
  }, [doc]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#d4af37" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{title}</Text>
      <Text style={styles.body}>{content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: '#0a1628', justifyContent: 'center', alignItems: 'center' },
  heading: { color: '#d4af37', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'right', writingDirection: 'rtl' },
  body: { color: '#e8e8e8', fontSize: 13, lineHeight: 24, textAlign: 'right', writingDirection: 'rtl' },
});
