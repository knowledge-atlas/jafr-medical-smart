import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>🔮</Text>
        <Text style={styles.heroTitle}>الجفر التراثي الذكي</Text>
        <Text style={styles.heroVersion}>الإصدار 1.0.0</Text>
        <Text style={styles.heroTagline}>مرآة للتأمل الذاتي، لا قاضٍ</Text>
      </View>

      {/* بطاقة المطور */}
      <View style={styles.devCard}>
        <View style={styles.devHeader}>
          <Ionicons name="mail-outline" size={32} color="#d4af37" />
          <Text style={styles.devLabel}>للتواصل</Text>
        </View>
        <Text style={styles.devEmail}>mohammedhnomi95@gmail.com</Text>
        <Text style={styles.devBio}>
          تطبيق معرفي تراثي للتحليل الرمزي — تأمل ذاتي وليس تشخيصاً.
        </Text>
      </View>

      {/* ما هو التطبيق */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📖 ما هذا التطبيق؟</Text>
        <Text style={styles.sectionBody}>
          منصة تحليل معرفي تعتمد على النظام الجفري التراثي (علم الحروف والأعداد)،
          مبني على نصوص الإمام البوني ومصادر تراثية موثقة.{'\n\n'}
          يعمل التطبيق بالكامل دون إنترنت، وجميع بياناتك محفوظة على جهازك فقط.
        </Text>
      </View>

      {/* الأخلاقيات */}
      <View style={styles.ethicsBox}>
        <Text style={styles.ethicsTitle}>⚖️ التزاماتنا</Text>
        <Text style={styles.ethicsLine}>• مرآة للتأمل، ليست سلطة حكم</Text>
        <Text style={styles.ethicsLine}>• فرضيات قابلة للاختبار، ليست تنبؤات</Text>
        <Text style={styles.ethicsLine}>• خصوصية كاملة — لا نجمع بياناتك</Text>
        <Text style={styles.ethicsLine}>• شفافية في المصادر ومستويات الأدلة</Text>
      </View>

      {/* تنبيه قانوني */}
      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>⚠️ تنبيه قانوني</Text>
        <Text style={styles.warningBody}>
          هذا التطبيق أداة تأمل رمزية تراثية. لا يقدم تشخيصاً طبياً،
          ولا توصيات دوائية، ولا تنبؤات قطعية. عند الحاجة لاستشارة،
          راجع المختص المؤهل.
        </Text>
      </View>

      {/* روابط قانونية */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📄 وثائق قانونية</Text>
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Legal', { doc: 'privacy' })}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#d4af37" />
          <Text style={styles.linkText}> سياسة الخصوصية</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Legal', { doc: 'terms' })}>
          <Ionicons name="document-text-outline" size={18} color="#d4af37" />
          <Text style={styles.linkText}> شروط الخدمة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Legal', { doc: 'license' })}>
          <Ionicons name="lock-closed-outline" size={18} color="#d4af37" />
          <Text style={styles.linkText}> الترخيص</Text>
        </TouchableOpacity>
      </View>

      {/* معلومات تقنية */}
      <View style={styles.techBox}>
        <Text style={styles.techTitle}>🔧 معلومات تقنية</Text>
        <View style={styles.techRow}>
          <Text style={styles.techLabel}>الإصدار</Text>
          <Text style={styles.techValue}>3.1.0</Text>
        </View>
        <View style={styles.techRow}>
          <Text style={styles.techLabel}>المعرف</Text>
          <Text style={styles.techValue}>com.ahnomy.heritage</Text>
        </View>
        <View style={styles.techRow}>
          <Text style={styles.techLabel}>المحرك</Text>
          <Text style={styles.techValue}>KnowledgeAtlas Core</Text>
        </View>
        <View style={styles.techRow}>
          <Text style={styles.techLabel}>الاختبارات</Text>
          <Text style={styles.techValue}>416 حالة</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  content: { padding: 16, paddingBottom: 40 },

  hero: { alignItems: 'center', paddingVertical: 30 },
  heroIcon: { fontSize: 70, marginBottom: 10 },
  heroTitle: { color: '#d4af37', fontSize: 24, fontWeight: 'bold', textAlign: 'center', writingDirection: 'rtl' },
  heroVersion: { color: '#a0a0a0', fontSize: 13, marginTop: 6 },
  heroTagline: { color: '#d4af37', fontSize: 12, fontStyle: 'italic', marginTop: 8, textAlign: 'center', writingDirection: 'rtl' },

  devCard: { backgroundColor: '#0f2438', borderRadius: 14, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: '#d4af37', alignItems: 'center' },
  devHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 12 },
  devLabel: { color: '#a0a0a0', fontSize: 12, fontWeight: 'bold' },
  devEmail: { color: '#d4af37', fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, writingDirection: 'ltr' },
  devName: { color: '#d4af37', fontSize: 22, fontWeight: 'bold', textAlign: 'center', writingDirection: 'rtl', marginBottom: 4 },
  devRole: { color: '#e8e8e8', fontSize: 13, textAlign: 'center', writingDirection: 'rtl', marginBottom: 12 },
  devBio: { color: '#a0a0a0', fontSize: 12, textAlign: 'center', lineHeight: 20, writingDirection: 'rtl' },

  section: { backgroundColor: '#0f2438', borderRadius: 10, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2c5070' },
  sectionTitle: { color: '#d4af37', fontSize: 15, fontWeight: 'bold', marginBottom: 10, textAlign: 'right', writingDirection: 'rtl' },
  sectionBody: { color: '#e8e8e8', fontSize: 13, lineHeight: 22, textAlign: 'right', writingDirection: 'rtl' },

  ethicsBox: { backgroundColor: '#0f2438', borderRadius: 10, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2ecc71' },
  ethicsTitle: { color: '#2ecc71', fontSize: 15, fontWeight: 'bold', marginBottom: 10, textAlign: 'right', writingDirection: 'rtl' },
  ethicsLine: { color: '#e8e8e8', fontSize: 13, lineHeight: 22, textAlign: 'right', writingDirection: 'rtl', marginVertical: 2 },

  warningBox: { backgroundColor: '#2c1a1a', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#e67e22' },
  warningTitle: { color: '#e67e22', fontSize: 14, fontWeight: 'bold', marginBottom: 8, textAlign: 'right', writingDirection: 'rtl' },
  warningBody: { color: '#e8e8e8', fontSize: 12, lineHeight: 20, textAlign: 'right', writingDirection: 'rtl' },

  linkRow: { flexDirection: 'row-reverse', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a3b5d', gap: 8 },
  linkText: { color: '#e8e8e8', fontSize: 13, writingDirection: 'rtl' },

  techBox: { backgroundColor: '#0f2438', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#2c5070' },
  techTitle: { color: '#d4af37', fontSize: 14, fontWeight: 'bold', marginBottom: 10, textAlign: 'right', writingDirection: 'rtl' },
  techRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1a3b5d' },
  techLabel: { color: '#a0a0a0', fontSize: 12, writingDirection: 'rtl' },
  techValue: { color: '#e8e8e8', fontSize: 12, fontWeight: 'bold' },
});
