import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { buildReport } from '../engine/reportBuilder';
import { reportsStorage } from '../storage/reportsStorage';
import { analyzeName, analysisToLegacyReport } from '../application/di';
import { DeepDiveReport } from '../products/DeepDiveReport';
import { ContextMode } from '../ai/ContextAwarePrompter';

const SYMPTOMS = [
  'تشتت', 'جمود', 'استنزاف', 'غضب', 'خوف',
  'تردد', 'قسوة', 'عزلة', 'مبالغة', 'اندفاع',
];

const MODES: Array<{ id: ContextMode; label: string; icon: string }> = [
  { id: 'personal', label: 'شخصي', icon: '🧠' },
  { id: 'marital', label: 'زواجي', icon: '💞' },
  { id: 'professional', label: 'مهني', icon: '💼' },
  { id: 'commercial', label: 'تجاري', icon: '🏷️' },
];

const deepDive = new DeepDiveReport();

export default function HomeScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [reportsCount, setReportsCount] = useState(0);
  const [mode, setMode] = useState<ContextMode>('personal');
  const [deepLoading, setDeepLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reportsStorage.count().then(setReportsCount);
    }, [])
  );

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const analyzeClassic = () => {
    if (!name.trim()) {
      Alert.alert('تنبيه', 'الرجاء إدخال اسم للتحليل');
      return;
    }
    const report = buildReport(name.trim(), selectedSymptoms);
    if (report.error) {
      Alert.alert('خطأ', report.error);
      return;
    }
    navigation.navigate('Report', { report, name: name.trim() });
  };

  const runDeepDive = () => {
    if (!name.trim()) {
      Alert.alert('تنبيه', 'الرجاء إدخال اسم للتحليل');
      return;
    }
    setDeepLoading(true);
    try {
      const analysis = analyzeName.execute({ name: name.trim() });
      const out = deepDive.generate(analysis, mode);
      const legacy = analysisToLegacyReport(analysis, out);
      navigation.navigate('Report', { report: legacy, name: analysis.name });
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'حدث خطأ غير متوقع');
    } finally {
      setDeepLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.heroSection}>
        <Text style={styles.heroEmoji}>⚖️  🪞  ⚖️</Text>
        <Text style={styles.heroTitle}>نظام الجفر الطبي الذكي</Text>
        <Text style={styles.heroSubtitle}>ميزان المرآة الذكي</Text>
        <Text style={styles.heroQuote}>
          "حيث ينعكس كيانك على ميزان دقيق، وتلتقي روحك بالعلم الطبي"
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.label}>👤 أدخل الاسم (بالعربية):</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="مثال: محمد"
          placeholderTextColor="#999"
          textAlign="right"
        />
      </View>

      {/* اختيار السياق */}
      <View style={styles.section}>
        <Text style={styles.label}>🎯 اختر سياق التحليل:</Text>
        <View style={styles.modesRow}>
          {MODES.map(m => {
            const active = mode === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.modeChip, active && styles.modeChipActive]}
                onPress={() => setMode(m.id)}
              >
                <Text style={[styles.modeText, active && styles.modeTextActive]}>
                  {m.icon} {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* التقرير العميق — الزر الجديد */}
      <TouchableOpacity
        style={[styles.deepBtn, deepLoading && styles.deepBtnDisabled]}
        onPress={runDeepDive}
        disabled={deepLoading}
      >
        {deepLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.deepBtnText}>📖 التقرير العميق (19 قسماً)</Text>
        )}
      </TouchableOpacity>

      {/* الأعراض — للتحليل الكلاسيكي */}
      <View style={styles.section}>
        <Text style={styles.label}>🤔 الأعراض (اختياري — للتحليل التقليدي):</Text>
        <View style={styles.symptomsBox}>
          {SYMPTOMS.map(s => {
            const active = selectedSymptoms.includes(s);
            return (
              <TouchableOpacity
                key={s}
                style={[styles.symptomChip, active && styles.symptomChipActive]}
                onPress={() => toggleSymptom(s)}
              >
                <Text style={[styles.symptomText, active && styles.symptomTextActive]}>
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {selectedSymptoms.length > 0 && (
          <Text style={styles.symptomsSelected}>
            المختار: {selectedSymptoms.join('، ')}
          </Text>
        )}
      </View>

      {/* زر التحليل الكلاسيكي */}
      <TouchableOpacity style={styles.primaryBtn} onPress={analyzeClassic}>
        <Text style={styles.primaryBtnText}>🔍 تحليل تقليدي</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => navigation.navigate('Main', { screen: 'SearchTab' })}
      >
        <Text style={styles.secondaryBtnText}>📖 البحث في المعرفة</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.historyBtn}
        onPress={() => navigation.navigate('History')}
      >
        <Text style={styles.historyBtnText}>
          📂 سجل التقارير ({reportsCount})
        </Text>
      </TouchableOpacity>

      <Text style={styles.footerNote}>© 2026 — جميع الحقوق محفوظة</Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f5f5f5' },
  heroSection: {
    alignItems: 'center', backgroundColor: '#1a3b5d', borderRadius: 16,
    padding: 20, marginBottom: 15, elevation: 4,
  },
  heroEmoji: { fontSize: 28, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: '#d4af37', textAlign: 'center', marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: '#c0c0c0', marginBottom: 10 },
  heroQuote: { fontSize: 12, color: '#a0a0a0', textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#ccc', marginVertical: 15 },
  section: { marginBottom: 15 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'right' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc',
    borderRadius: 10, padding: 14, fontSize: 18, color: '#000',
  },
  modesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  modeChip: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexGrow: 1,
    alignItems: 'center', minWidth: 80,
  },
  modeChipActive: { backgroundColor: '#1a3b5d', borderColor: '#d4af37' },
  modeText: { color: '#333', fontSize: 13 },
  modeTextActive: { color: '#d4af37', fontWeight: 'bold' },
  deepBtn: {
    backgroundColor: '#2c3e50', padding: 18, borderRadius: 12,
    alignItems: 'center', marginVertical: 10, elevation: 3,
  },
  deepBtnDisabled: { opacity: 0.6 },
  deepBtnText: { color: '#d4af37', fontSize: 17, fontWeight: 'bold' },
  symptomsBox: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  symptomChip: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, margin: 3,
  },
  symptomChipActive: { backgroundColor: '#1a3b5d', borderColor: '#1a3b5d' },
  symptomText: { color: '#333', fontSize: 13 },
  symptomTextActive: { color: '#d4af37', fontWeight: 'bold' },
  symptomsSelected: { marginTop: 8, fontSize: 12, color: '#27ae60', textAlign: 'right' },
  primaryBtn: {
    backgroundColor: '#27ae60', padding: 16, borderRadius: 12,
    alignItems: 'center', marginVertical: 6,
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  secondaryBtn: {
    backgroundColor: '#1abc9c', padding: 14, borderRadius: 12,
    alignItems: 'center', marginVertical: 6,
  },
  secondaryBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  historyBtn: {
    backgroundColor: '#8e44ad', padding: 14, borderRadius: 12,
    alignItems: 'center', marginVertical: 6,
  },
  historyBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  footerNote: { textAlign: 'center', color: '#999', fontSize: 11, marginTop: 20 },
});
