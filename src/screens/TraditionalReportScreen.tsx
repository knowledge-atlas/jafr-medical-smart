import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { buildReport } from '../engine/reportBuilder';
import { medicalFilter } from '../domain/services/MedicalFilter';
import { parseReportToBlocks, ReportSection } from '../utils/reportBlocksParser';
import { reorganizeReport } from '../utils/reportReorganizer';
import BlockRenderer from '../components/report/BlockRenderer';

export default function TraditionalReportScreen({ route, navigation }: any) {
  const { name } = route.params || {};
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [fullText, setFullText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateReport();
  }, [name]);

  const generateReport = () => {
    if (!name) {
      setError('لم يتم استلام الاسم');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const report = buildReport(name, []);

      if (report.error) {
        setError(report.error);
        setLoading(false);
        return;
      }

      const raw =
        (report as any).fullReport ||
        (report as any).text ||
        JSON.stringify(report, null, 2);

      const filtered = medicalFilter.filter(raw);
      setFullText(filtered.text);

      // ═══ إعادة الهندسة البصرية ═══
      const reorganized = reorganizeReport(filtered.text);

      const parsed = parseReportToBlocks(reorganized);
      setSections(parsed);

      // فتح القسم الأول فقط افتراضياً
      const initialOpen = new Set<string>();
      if (parsed.length > 0) initialOpen.add(parsed[0].id);
      setOpenIds(initialOpen);
    } catch (e: any) {
      setError(e?.message ?? 'فشل التوليد');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setOpenIds(new Set(sections.map((s) => s.id)));
  };

  const collapseAll = () => {
    setOpenIds(new Set());
  };

  const copyFullReport = async () => {
    await Clipboard.setStringAsync(fullText);
    Alert.alert('✅ تم النسخ', `${fullText.length.toLocaleString()} حرف`);
  };

  const shareReport = async () => {
    try {
      await Share.share({ message: fullText, title: `التقرير التقليدي — ${name}` });
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل المشاركة');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={styles.loadingText}>جارٍ توليد التقرير الشامل...</Text>
        <Text style={styles.loadingHint}>يتم تحليل الموسوعة المرجعية الكاملة</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={generateReport}>
          <Text style={styles.retryBtnText}>🔄 إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ═══ Header ═══ */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>📜</Text>
          <View>
            <Text style={styles.headerTitle}>التقرير التقليدي الشامل</Text>
            <Text style={styles.headerSubtitle}>
              {name} · {sections.length} قسم · {fullText.length.toLocaleString()} حرف
            </Text>
          </View>
        </View>
      </View>

      {/* ═══ Section Tabs ═══ */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {sections.map((s, i) => {
            const isOpen = openIds.has(s.id);
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.tab, isOpen && styles.tabActive]}
                onPress={() => toggleSection(s.id)}
              >
                <Text style={[styles.tabIcon]}>{s.icon}</Text>
                <Text style={[styles.tabLabel, isOpen && styles.tabLabelActive]} numberOfLines={1}>
                  {i + 1}. {s.title.replace(/^القسم\s+/, '')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ═══ Quick Actions ═══ */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickBtn} onPress={expandAll}>
          <Ionicons name="chevron-down-circle-outline" size={16} color="#d4af37" />
          <Text style={styles.quickBtnText}> توسيع الكل</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={collapseAll}>
          <Ionicons name="chevron-up-circle-outline" size={16} color="#d4af37" />
          <Text style={styles.quickBtnText}> طي الكل</Text>
        </TouchableOpacity>
      </View>

      {/* ═══ Content ═══ */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {sections.map((section, i) => {
          const isOpen = openIds.has(section.id);
          if (!isOpen) return null;

          return (
            <View key={section.id} style={styles.sectionCard}>
              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>{section.icon}</Text>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>

              {/* Section Blocks */}
              <View style={styles.sectionBody}>
                {section.blocks.map((block, bi) => (
                  <BlockRenderer key={bi} block={block} index={bi} />
                ))}
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeSectionBtn}
                onPress={() => toggleSection(section.id)}
              >
                <Text style={styles.closeSectionText}>طي القسم ▲</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {sections.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>لا توجد بيانات</Text>
          </View>
        )}
      </ScrollView>

      {/* ═══ Bottom Actions ═══ */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.bottomBtn, { backgroundColor: '#3498db' }]}
          onPress={copyFullReport}
        >
          <Ionicons name="copy-outline" size={18} color="#fff" />
          <Text style={styles.bottomBtnText}> نسخ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomBtn, { backgroundColor: '#27ae60' }]}
          onPress={shareReport}
        >
          <Ionicons name="share-outline" size={18} color="#fff" />
          <Text style={styles.bottomBtnText}> مشاركة</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },

  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0a1628', padding: 20,
  },
  loadingText: { color: '#d4af37', fontSize: 16, marginTop: 15, fontWeight: 'bold' },
  loadingHint: { color: '#a0a0a0', fontSize: 12, marginTop: 8 },
  errorIcon: { fontSize: 48, marginBottom: 10 },
  errorText: { color: '#e74c3c', fontSize: 15, textAlign: 'center', marginBottom: 20 },
  retryBtn: {
    backgroundColor: '#3498db', paddingVertical: 12, paddingHorizontal: 30,
    borderRadius: 10,
  },
  retryBtnText: { color: '#fff', fontWeight: 'bold' },

  // Header
  header: {
    backgroundColor: '#1a3b5d',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37',
  },
  headerLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  headerEmoji: { fontSize: 28 },
  headerTitle: {
    color: '#d4af37',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headerSubtitle: {
    color: '#a0a0a0',
    fontSize: 11,
    marginTop: 3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // Tabs
  tabsWrapper: {
    backgroundColor: '#0f2438',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3b5d',
  },
  tabsContent: { paddingHorizontal: 8, paddingVertical: 8, gap: 6 },
  tab: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#1a3b5d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
    maxWidth: 200,
  },
  tabActive: {
    backgroundColor: '#d4af37',
    borderColor: '#fff',
  },
  tabIcon: { fontSize: 14 },
  tabLabel: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: 'bold',
    writingDirection: 'rtl',
    maxWidth: 150,
  },
  tabLabelActive: { color: '#0a1628' },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    backgroundColor: '#0f2438',
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#1a3b5d',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickBtnText: { color: '#d4af37', fontSize: 12, fontWeight: 'bold' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 10 },

  // Section Card
  sectionCard: {
    backgroundColor: '#1a3b5d',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2c5070',
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#0f2438',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37',
    gap: 10,
  },
  sectionIcon: { fontSize: 22 },
  sectionTitle: {
    flex: 1,
    color: '#d4af37',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  closeSectionBtn: {
    paddingVertical: 10,
    backgroundColor: '#0f2438',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2c5070',
  },
  closeSectionText: { color: '#d4af37', fontSize: 12, fontWeight: 'bold' },

  // Empty
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 14 },

  // Bottom
  bottomActions: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    backgroundColor: '#0f2438',
    borderTopWidth: 1,
    borderTopColor: '#1a3b5d',
  },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row-reverse',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bottomBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
