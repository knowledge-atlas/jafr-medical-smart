import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { buildReport } from '../engine/reportBuilder';
import { medicalFilter } from '../domain/services/MedicalFilter';
import { splitIntoSections, ReportSectionSplit } from '../utils/splitIntoSections';

export default function TraditionalReportScreen({ route, navigation }: any) {
  const { name } = route.params || {};
  const [sections, setSections] = useState<ReportSectionSplit[]>([]);
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

      const parsed = splitIntoSections(filtered.text);
      setSections(parsed);

      const initialOpen = new Set<string>();
      parsed.forEach((s) => {
        if (s.defaultOpen) initialOpen.add(s.id);
      });
      setOpenIds(initialOpen);

      if (filtered.applied && filtered.removedItems.length > 0) {
        console.log('🛡️ MedicalFilter حجب:', filtered.removedItems.join(', '));
      }
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
        <Text style={styles.loadingHint}>يتم تحميل كل نصوص الموسوعة المرجعية</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📜 التقرير التقليدي الشامل</Text>
        <Text style={styles.headerSubtitle}>
          {name} · {fullText.length.toLocaleString()} حرف · {sections.length} قسم
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={expandAll}>
          <Ionicons name="chevron-down-circle-outline" size={16} color="#d4af37" />
          <Text style={styles.actionText}> توسيع الكل</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={collapseAll}>
          <Ionicons name="chevron-up-circle-outline" size={16} color="#d4af37" />
          <Text style={styles.actionText}> طي الكل</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {sections.map((section, i) => {
          const isOpen = openIds.has(section.id);
          return (
            <View key={section.id} style={styles.sectionCard}>
              <TouchableOpacity
                style={[styles.sectionHeader, isOpen && styles.sectionHeaderOpen]}
                onPress={() => toggleSection(section.id)}
                activeOpacity={0.7}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Text style={styles.sectionIcon}>{section.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>
                      {i + 1}. {section.title}
                    </Text>
                    <Text style={styles.sectionMeta}>
                      {isOpen ? '▼ اضغط للطي' : `▶ ${section.content.length.toLocaleString()} حرف`}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color="#d4af37"
                />
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.sectionContent}>
                  <ScrollView horizontal showsHorizontalScrollIndicator>
                    <Text style={styles.sectionText} selectable>
                      {section.content}
                    </Text>
                  </ScrollView>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.bottomBtn, { backgroundColor: '#3498db' }]}
          onPress={copyFullReport}
        >
          <Ionicons name="copy-outline" size={18} color="#fff" />
          <Text style={styles.bottomBtnText}> نسخ الكل</Text>
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
  loadingHint: { color: '#a0a0a0', fontSize: 12, marginTop: 8, textAlign: 'center' },
  errorIcon: { fontSize: 48, marginBottom: 10 },
  errorText: { color: '#e74c3c', fontSize: 15, textAlign: 'center', marginBottom: 20 },
  retryBtn: {
    backgroundColor: '#3498db', padding: 14, borderRadius: 10, paddingHorizontal: 30,
  },
  retryBtnText: { color: '#fff', fontWeight: 'bold' },

  header: {
    backgroundColor: '#1a3b5d', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#2c5070',
  },
  headerTitle: { color: '#d4af37', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  headerSubtitle: { color: '#c0c0c0', fontSize: 12, textAlign: 'center', marginTop: 4 },

  actionsRow: {
    flexDirection: 'row', gap: 8, padding: 8, backgroundColor: '#0f2438',
  },
  actionBtn: {
    flex: 1, backgroundColor: '#1a3b5d', paddingVertical: 8,
    borderRadius: 6, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
  },
  actionText: { color: '#d4af37', fontSize: 12, fontWeight: 'bold' },

  scroll: { flex: 1 },
  scrollContent: { padding: 10 },

  sectionCard: {
    backgroundColor: '#1a3b5d', borderRadius: 10, marginBottom: 8,
    overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: '#f39c12',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, justifyContent: 'space-between',
  },
  sectionHeaderOpen: {
    borderBottomWidth: 1, borderBottomColor: '#2c5070',
  },
  sectionHeaderLeft: {
    flexDirection: 'row', alignItems: 'center', flex: 1,
  },
  sectionIcon: { fontSize: 22, marginRight: 10 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'right' },
  sectionMeta: { color: '#a0a0a0', fontSize: 11, marginTop: 4, textAlign: 'right' },

  sectionContent: { padding: 12, backgroundColor: '#0a1628' },
  sectionText: {
    color: '#e8e8e8', fontSize: 11,
    fontFamily: 'monospace', lineHeight: 18,
  },

  bottomActions: {
    flexDirection: 'row', gap: 8, padding: 10,
    backgroundColor: '#0f2438',
    borderTopWidth: 1, borderTopColor: '#1a3b5d',
  },
  bottomBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  bottomBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
