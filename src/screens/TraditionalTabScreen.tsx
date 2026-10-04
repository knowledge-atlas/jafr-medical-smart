import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analyzeName } from '../application/di';

const SAMPLES = ['محمد', 'فاطمة', 'علي', 'أحمد', 'نور'];

export default function TraditionalTabScreen({ navigation }: any) {
  const [name, setName] = useState('');

  const openReport = (targetName: string) => {
    const trimmed = targetName.trim();
    if (!trimmed) {
      Alert.alert('تنبيه', 'أدخل اسماً أولاً');
      return;
    }

    const analysis = analyzeName.execute({ name: trimmed });
    if (analysis.status === 'abstained') {
      Alert.alert('تنبيه', analysis.report);
      return;
    }

    navigation.navigate('TraditionalReport', { name: trimmed });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="document-text" size={42} color="#f39c12" />
        </View>
        <Text style={styles.heroTitle}>📜 التقرير التقليدي الشامل</Text>
        <Text style={styles.heroSubtitle}>
          الموسوعة المرجعية كاملة — كل نص بدون اختصار
        </Text>
      </View>

      {/* المميزات */}
      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>✨ ما يحتويه:</Text>
        <View style={styles.featureRow}>
          <Text style={styles.featureIcon}>📖</Text>
          <Text style={styles.featureText}>نصوص الإمام البوني كاملة</Text>
        </View>
        <View style={styles.featureRow}>
          <Text style={styles.featureIcon}>🔢</Text>
          <Text style={styles.featureText}>البواقي التفصيلية (9، 7، 28)</Text>
        </View>
        <View style={styles.featureRow}>
          <Text style={styles.featureIcon}>🌱</Text>
          <Text style={styles.featureText}>الجذور التسعة بنصوصها الأصلية</Text>
        </View>
        <View style={styles.featureRow}>
          <Text style={styles.featureIcon}>🏥</Text>
          <Text style={styles.featureText}>الموسوعة الطبية التكاملية</Text>
        </View>
        <View style={styles.featureRow}>
          <Text style={styles.featureIcon}>⚖️</Text>
          <Text style={styles.featureText}>الأوفاق + الرنين + التراكيب</Text>
        </View>
      </View>

      {/* الإدخال */}
      <View style={styles.card}>
        <Text style={styles.label}>👤 أدخل الاسم:</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="مثال: محمد"
          placeholderTextColor="#666"
          textAlign="right"
          onSubmitEditing={() => openReport(name)}
        />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => openReport(name)}
        >
          <Ionicons name="document-text" size={20} color="#0a1628" />
          <Text style={styles.primaryBtnText}> توليد التقرير التقليدي</Text>
        </TouchableOpacity>
      </View>

      {/* أمثلة سريعة */}
      <View style={styles.card}>
        <Text style={styles.label}>🚀 أسماء للتجربة السريعة:</Text>
        <View style={styles.samplesRow}>
          {SAMPLES.map((s) => (
            <TouchableOpacity
              key={s}
              style={styles.sampleChip}
              onPress={() => {
                setName(s);
                openReport(s);
              }}
            >
              <Text style={styles.sampleText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ملاحظة */}
      <View style={styles.noteCard}>
        <Text style={styles.noteText}>
          ℹ️ التقرير التقليدي يستعرض كل بيانات الموسوعة الأصلية كما هي،
          دون تلخيص أو اختصار. قد يصل حجم النص إلى 6000+ كلمة.
        </Text>
      </View>

      <Text style={styles.footer}>
        © 2026 — نظام الجفر الطبي الذكي v3.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#0a1628', flexGrow: 1 },

  hero: { alignItems: 'center', paddingVertical: 20 },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#f39c1222',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: { color: '#f39c12', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  heroSubtitle: { color: '#c0c0c0', fontSize: 13, textAlign: 'center', lineHeight: 20 },

  featuresCard: {
    backgroundColor: '#1a3b5d', padding: 16, borderRadius: 12, marginBottom: 14,
    borderLeftWidth: 4, borderLeftColor: '#f39c12',
  },
  featuresTitle: { color: '#d4af37', fontSize: 15, fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, justifyContent: 'flex-end' },
  featureIcon: { fontSize: 16, marginLeft: 10 },
  featureText: { color: '#e8e8e8', fontSize: 13, textAlign: 'right' },

  card: {
    backgroundColor: '#1a3b5d', padding: 16, borderRadius: 12, marginBottom: 14,
  },
  label: { color: '#d4af37', fontSize: 15, fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
  input: {
    backgroundColor: '#0a1628', borderWidth: 1, borderColor: '#2c5070',
    borderRadius: 10, padding: 14, fontSize: 18, color: '#fff', marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: '#f39c12', padding: 15, borderRadius: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  primaryBtnText: { color: '#0a1628', fontSize: 16, fontWeight: 'bold' },

  samplesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  sampleChip: {
    backgroundColor: '#0a1628', borderWidth: 1, borderColor: '#f39c12',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
  },
  sampleText: { color: '#f39c12', fontSize: 14, fontWeight: 'bold' },

  noteCard: {
    backgroundColor: '#1a3b5d', padding: 14, borderRadius: 10, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: '#3498db',
  },
  noteText: { color: '#b0b8c0', fontSize: 12, lineHeight: 20, textAlign: 'right' },

  footer: { textAlign: 'center', color: '#555', fontSize: 11, marginTop: 8 },
});
