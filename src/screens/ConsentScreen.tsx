import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ConsentScreenProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function ConsentScreen({ onAccept, onDecline }: ConsentScreenProps) {
  const [checked, setChecked] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>⚠️</Text>
        <Text style={styles.heroTitle}>تنبيه مهم قبل البدء</Text>
        <Text style={styles.heroSubtitle}>اقرأ بعناية — هذه ليست مجرد بداية</Text>
      </View>

      {/* بطاقة ما هو التطبيق */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle" size={24} color="#3498db" />
          <Text style={styles.cardTitle}>ما هو هذا التطبيق؟</Text>
        </View>
        <Text style={styles.cardText}>
          هذا التطبيق **أداة للتأمل الذاتي والاستكشاف الرمزي**.
          {'\n\n'}
          يعتمد على نصوص تراثية (الجفر والحروف والأبراج) لبناء **فرضيات** يمكنك اختبارها على نفسك.
        </Text>
      </View>

      {/* بطاقة ما ليس التطبيق */}
      <View style={[styles.card, styles.cardWarning]}>
        <View style={styles.cardHeader}>
          <Ionicons name="warning" size={24} color="#e74c3c" />
          <Text style={styles.cardTitle}>ما ليس هذا التطبيق؟</Text>
        </View>

        <View style={styles.bulletRow}>
          <Text style={styles.bulletIcon}>❌</Text>
          <Text style={styles.bulletText}>
            <Text style={styles.bold}>ليس تشخيصاً طبياً</Text> — لا يغني عن الطبيب أو المختص النفسي.
          </Text>
        </View>

        <View style={styles.bulletRow}>
          <Text style={styles.bulletIcon}>❌</Text>
          <Text style={styles.bulletText}>
            <Text style={styles.bold}>ليس فتوى دينية</Text> — لا يغني عن أهل العلم.
          </Text>
        </View>

        <View style={styles.bulletRow}>
          <Text style={styles.bulletIcon}>❌</Text>
          <Text style={styles.bulletText}>
            <Text style={styles.bold}>ليس حكماً قاطعاً على شخصيتك</Text> — كل النتائج نمطية، قابلة للرفض.
          </Text>
        </View>

        <View style={styles.bulletRow}>
          <Text style={styles.bulletIcon}>❌</Text>
          <Text style={styles.bulletText}>
            <Text style={styles.bold}>ليس تنبؤاً بالمستقبل</Text> — لا قدرية، لا حتمية.
          </Text>
        </View>
      </View>

      {/* بطاقة الخصوصية */}
      <View style={[styles.card, styles.cardSuccess]}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark" size={24} color="#27ae60" />
          <Text style={styles.cardTitle}>خصوصيتك محمية</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bulletIcon}>✅</Text>
          <Text style={styles.bulletText}>كل التحليلات تعمل **محلياً على جهازك** — بدون إنترنت.</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bulletIcon}>✅</Text>
          <Text style={styles.bulletText}>**لا نرسل** بياناتك لأي طرف ثالث.</Text>
        </View>
        <View style={styles.bulletRow}>
          <Text style={styles.bulletIcon}>✅</Text>
          <Text style={styles.bulletText}>**حذف فوري** لبياناتك متى أردت.</Text>
        </View>
      </View>

      {/* بطاقة الالتزام */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="checkmark-done-circle" size={24} color="#d4af37" />
          <Text style={styles.cardTitle}>تعهدنا لك</Text>
        </View>
        <Text style={styles.cardText}>
          • لا نتبنى أي رؤية قدرية قاطعة.{'\n'}
          • لا نقدم تشخيصاً طبياً.{'\n'}
          • لا نقدم فتوى دينية.{'\n'}
          • نذكّرك دائماً بأن النتائج **فرضيات**، لا حقائق.
        </Text>
      </View>

      {/* Checkbox */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setChecked(!checked)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Ionicons name="checkmark" size={20} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>
          أوافق على المتابعة وفهمت طبيعة التطبيق
        </Text>
      </TouchableOpacity>

      {/* Buttons */}
      <TouchableOpacity
        style={[styles.acceptBtn, !checked && styles.disabledBtn]}
        onPress={onAccept}
        disabled={!checked}
      >
        <Text style={styles.acceptBtnText}>✓ أوافق وأبدأ</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
        <Text style={styles.declineBtnText}>لا أوافق — إغلاق</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>KnowledgeAtlas Sovereign v2.0 · 2026</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#0a1628', flexGrow: 1 },
  hero: { alignItems: 'center', padding: 20, marginBottom: 16 },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroTitle: { color: '#d4af37', fontSize: 24, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' },
  heroSubtitle: { color: '#a0a0a0', fontSize: 14, textAlign: 'center' },
  card: {
    backgroundColor: '#1a3b5d', padding: 16, borderRadius: 12,
    marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#3498db',
  },
  cardWarning: { borderLeftColor: '#e74c3c' },
  cardSuccess: { borderLeftColor: '#27ae60' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'right' },
  cardText: { color: '#d0d8e0', fontSize: 13, lineHeight: 22, textAlign: 'right' },
  bulletRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  bulletIcon: { fontSize: 14, marginRight: 8, marginTop: 2 },
  bulletText: { flex: 1, color: '#d0d8e0', fontSize: 13, lineHeight: 20, textAlign: 'right' },
  bold: { color: '#d4af37', fontWeight: 'bold' },
  checkboxRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    backgroundColor: '#1a3b5d', borderRadius: 12, marginTop: 8, marginBottom: 16,
  },
  checkbox: {
    width: 26, height: 26, borderRadius: 6, borderWidth: 2,
    borderColor: '#d4af37', marginRight: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#d4af37' },
  checkboxLabel: { flex: 1, color: '#fff', fontSize: 14, textAlign: 'right' },
  acceptBtn: {
    backgroundColor: '#27ae60', padding: 16, borderRadius: 12,
    alignItems: 'center', marginBottom: 8,
  },
  disabledBtn: { opacity: 0.4 },
  acceptBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  declineBtn: {
    padding: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#e74c3c', marginBottom: 16,
  },
  declineBtnText: { color: '#e74c3c', fontSize: 15, fontWeight: 'bold' },
  footer: { textAlign: 'center', color: '#555', fontSize: 11, marginTop: 8 },
});
