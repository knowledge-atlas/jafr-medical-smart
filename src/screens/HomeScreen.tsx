import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { reportsStorage, SavedReport } from '../storage/reportsStorage';
import { analyzeName } from '../application/di';
import { freeTrial } from '../monetization/freeTrial';
import { ContextMode } from '../ai/ContextAwarePrompter';

const MODES: Array<{ id: ContextMode; label: string; icon: string }> = [
  { id: 'personal', label: 'شخصي', icon: '🧠' },
  { id: 'marital', label: 'زواجي', icon: '💞' },
  { id: 'professional', label: 'مهني', icon: '💼' },
  { id: 'commercial', label: 'تجاري', icon: '🏷️' },
];

export default function HomeScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<ContextMode>('personal');
  const [recent, setRecent] = useState<SavedReport[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadRecent();
    }, [])
  );

  const loadRecent = async () => {
    try {
      const count = await reportsStorage.count();
      setTotalCount(count);
      const all = await (reportsStorage as any).getAll?.() ?? [];
      const sorted = Array.isArray(all)
        ? [...all].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 3)
        : [];
      setRecent(sorted);
    } catch {
      setTotalCount(0);
      setRecent([]);
    }
  };

  const analyze = async () => {
    if (!name.trim()) {
      Alert.alert('تنبيه', 'أدخل اسمك أولاً');
      return;
    }

    // ═══ فحص التجربة المجانية ═══
    const canAnalyze = await freeTrial.canAnalyze();
    if (!canAnalyze) {
      Alert.alert(
        '✨ تجربتك المجانية انتهت',
        'استخدمت 3 تحليلات مجانية كاملة.\n\nالنسخة الكاملة قادمة قريباً — تحليلات غير محدودة ونسخ ومشاركة.',
        [
          { text: 'حسناً', style: 'cancel' },
          { text: 'اعرف المزيد', onPress: () => navigation.navigate('Paywall') },
        ]
      );
      return;
    }

    const analysis = analyzeName.execute({ name: name.trim() });
    if (analysis.status === 'abstained') {
      Alert.alert('تنبيه', analysis.report);
      return;
    }

    // ═══ تسجيل الاستخدام ═══
    await freeTrial.recordAnalysis();

    navigation.navigate('ProductPicker', {
      analysis,
      name: name.trim(),
      mode,
    });
  };

  const openRecent = (report: SavedReport) => {
    const analysis = analyzeName.execute({ name: report.name });
    if (analysis.status !== 'full') {
      Alert.alert('تنبيه', 'تعذّر إعادة التحليل');
      return;
    }
    navigation.navigate('ProductPicker', {
      analysis,
      name: report.name,
      mode: 'personal',
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* ═══ Hero ═══ */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🪞</Text>
        <Text style={styles.heroTitle}>الجفر التراثي الذكي</Text>
        <Text style={styles.heroSubtitle}>الجفر التراثي الذكي · v1.0.0</Text>
      </View>

      {/* ═══ Dashboard مصغّر ═══ */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCount}</Text>
          <Text style={styles.statLabel}>تقرير</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>19</Text>
          <Text style={styles.statLabel}>قسم</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>10</Text>
          <Text style={styles.statLabel}>محرك</Text>
        </View>
      </View>

      {/* ═══ بطاقة التحليل ═══ */}
      <View style={styles.card}>
        <Text style={styles.label}>👤 أدخل اسمك (بالعربية):</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="مثال: محمد"
          placeholderTextColor="#666"
          textAlign="right"
        />

        <Text style={styles.label}>🎯 اختر السياق:</Text>
        <View style={styles.modesRow}>
          {MODES.map((m) => {
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

        <TouchableOpacity style={styles.primaryBtn} onPress={analyze}>
          <Text style={styles.primaryBtnText}>🎯 حلّل الآن</Text>
        </TouchableOpacity>
      </View>

      {/* ═══ آخر التقارير ═══ */}
      {recent.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📂 آخر التقارير</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.sectionLink}>الكل ←</Text>
            </TouchableOpacity>
          </View>
          {recent.map((r, i) => (
            <TouchableOpacity
              key={r.id || i}
              style={styles.recentCard}
              onPress={() => openRecent(r)}
            >
              <Text style={styles.recentName}>{r.name}</Text>
              <Text style={styles.recentMeta}>
                الجذر {r.root} · {r.createdAt?.slice(0, 10) ?? '—'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ═══ اختصارات ═══ */}
      <View style={styles.shortcutsRow}>
        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('Main', { screen: 'LibraryTab' })}
        >
          <Text style={styles.shortcutIcon}>📖</Text>
          <Text style={styles.shortcutLabel}>البحث</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('Compare')}
        >
          <Text style={styles.shortcutIcon}>💞</Text>
          <Text style={styles.shortcutLabel}>قارن</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.shortcutIcon}>📂</Text>
          <Text style={styles.shortcutLabel}>السجل</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.shortcutIcon}>⚙️</Text>
          <Text style={styles.shortcutLabel}>الإعدادات</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>© 2026 — الجفر التراثي الذكي</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#0a1628', flexGrow: 1 },

  hero: { alignItems: 'center', padding: 20, marginBottom: 14 },
  heroEmoji: { fontSize: 44, marginBottom: 6 },
  heroTitle: { color: '#d4af37', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  heroSubtitle: { color: '#a0a0a0', fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statCard: {
    flex: 1, backgroundColor: '#1a3b5d', borderRadius: 10,
    padding: 12, alignItems: 'center',
  },
  statValue: { color: '#d4af37', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#b0b8c0', fontSize: 11, marginTop: 4 },

  card: {
    backgroundColor: '#1a3b5d', padding: 18, borderRadius: 14, marginBottom: 16,
  },
  label: { color: '#d4af37', fontSize: 15, fontWeight: 'bold', marginBottom: 8, textAlign: 'right' },
  input: {
    backgroundColor: '#0a1628', borderWidth: 1, borderColor: '#2c5070',
    borderRadius: 10, padding: 14, fontSize: 18, color: '#fff', marginBottom: 14,
  },
  modesRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  modeChip: {
    flex: 1, backgroundColor: '#0a1628', borderWidth: 1, borderColor: '#2c5070',
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  modeChipActive: { backgroundColor: '#d4af37', borderColor: '#d4af37' },
  modeText: { color: '#d4af37', fontSize: 12, fontWeight: 'bold' },
  modeTextActive: { color: '#0a1628' },

  primaryBtn: {
    backgroundColor: '#27ae60', padding: 16, borderRadius: 12, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  sectionTitle: { color: '#d4af37', fontSize: 16, fontWeight: 'bold' },
  sectionLink: { color: '#3498db', fontSize: 13 },
  recentCard: {
    backgroundColor: '#1a3b5d', padding: 12, borderRadius: 10, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: '#d4af37',
  },
  recentName: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'right' },
  recentMeta: { color: '#a0a0a0', fontSize: 12, marginTop: 4, textAlign: 'right' },

  shortcutsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  shortcut: {
    flex: 1, backgroundColor: '#1a3b5d', borderRadius: 10,
    padding: 12, alignItems: 'center',
  },
  shortcutIcon: { fontSize: 22, marginBottom: 4 },
  shortcutLabel: { color: '#b0b8c0', fontSize: 11 },

  footer: { textAlign: 'center', color: '#555', fontSize: 11, marginTop: 8 },
});
