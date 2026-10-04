import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Share,
  Alert, ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Markdown from 'react-native-markdown-display';
import { reportsStorage, SavedReport } from '../storage/reportsStorage';
import ElementsRadarChart from '../components/ElementsRadarChart';
import { computeElementBalance } from '../products/DeepDiveReport';

export default function ReportScreen({ route, navigation }: any) {
  const { report, name, layers } = route.params || {};

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (report) autoSave();
  }, []);

  const autoSave = async () => {
    if (saved || !report) return;
    setSaving(true);
    try {
      const id = `report_${Date.now()}`;
      const savedReport: SavedReport = {
        id,
        name: name || 'بدون اسم',
        symptoms: [],
        root: report.root || 0,
        planet: report.internalPlanet || '',
        sign: report.internalSign || '',
        element: report.internalElement || '',
        house: report.internalHouse || 1,
        total: report.calculation?.total || 0,
        fullText: report.fullReport || '',
        report,
        createdAt: new Date().toISOString(),
      };
      await reportsStorage.save(savedReport);
      setSaved(true);
    } catch (e: any) {
      console.warn('⚠️ فشل الحفظ التلقائي:', e?.message);
    } finally {
      setSaving(false);
    }
  };

  const getReportText = (): string =>
    (report?.fullReport as string) || (report?.markdown as string) || (report?.fullText as string) || '';

  const copyReport = async () => {
    const text = getReportText();
    if (!text) return;
    await Clipboard.setStringAsync(text);
    Alert.alert('✅', 'تم نسخ التقرير');
  };

  const shareReport = async () => {
    const text = getReportText();
    if (!text) {
      Alert.alert('تنبيه', 'لا يوجد نص');
      return;
    }
    try {
      await Share.share({ message: text, title: `تقرير — ${name || ''}` });
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل');
    }
  };

  const deleteReport = () => {
    Alert.alert('حذف التقرير', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  // ─── حماية: تقرير غير صالح ───
  if (!report) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>⚠️ لم يتم استلام التقرير</Text>
        <Text style={styles.errorText}>اعد من الشاشة الرئيسية</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>⬅ رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const text = getReportText();

  return (
    <View style={styles.container}>

      {/* ═══ الشريط العلوي ═══ */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          {saving && <ActivityIndicator size="small" color="#d4af37" />}
          {saved && <Text style={styles.savedBadge}>💾 محفوظ</Text>}
        </View>
        <View style={styles.topBarActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={copyReport}>
            <Text style={styles.actionBtnText}>📋 نسخ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={shareReport}>
            <Text style={styles.actionBtnText}>📤 مشاركة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.askBtn]}
            onPress={() => navigation.navigate('ReportChat')}
          >
            <Text style={styles.actionBtnText}>✨ اسأل</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══ المحتوى ═══ */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Radar Chart */}
        {layers && (
          <ElementsRadarChart
            balance={computeElementBalance(layers)}
            size={260}
          />
        )}

        {/* Markdown Report */}
        {text ? (
          <Markdown style={markdownStyles as any} rules={markdownRules as any}>{text}</Markdown>
        ) : (
          <Text style={styles.emptyText}>لا يوجد محتوى للتقرير.</Text>
        )}
      </ScrollView>

      {/* ═══ شريط سفلي ═══ */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomBtn, { backgroundColor: '#e74c3c' }]}
          onPress={deleteReport}
        >
          <Text style={styles.bottomBtnText}>🗑️ حذف</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomBtn, { backgroundColor: '#8e44ad' }]}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.bottomBtnText}>📂 السجل</Text>
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
  errorTitle: { color: '#e74c3c', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  errorText: { color: '#a0a0a0', fontSize: 14, marginBottom: 20 },
  backBtn: {
    backgroundColor: '#3498db', paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 10,
  },
  backBtnText: { color: '#fff', fontWeight: 'bold' },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#1a3b5d',
    borderBottomWidth: 1,
    borderBottomColor: '#2c5070',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarActions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    backgroundColor: '#2c5070',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  askBtn: { backgroundColor: '#d4af37' },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  savedBadge: { color: '#2ecc71', fontSize: 12, fontWeight: 'bold' },

  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 30 },

  emptyText: { color: '#666', fontSize: 14, textAlign: 'center', marginTop: 40 },

  bottomBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    backgroundColor: '#0f2438',
    borderTopWidth: 1,
    borderTopColor: '#1a3b5d',
  },
  bottomBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  bottomBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});

// ═══════════════════════════════════════════════════════════
// Markdown Styles — مع RTL كامل
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// Custom Rules — لعرض الجداول والقوائم
// ═══════════════════════════════════════════════════════════
const markdownRules = {
  table: (node: any, children: any, parent: any, styles: any) => (
    <View key={node.key} style={styles.table}>
      {children}
    </View>
  ),
  thead: (node: any, children: any, parent: any, styles: any) => (
    <View key={node.key} style={styles.thead}>
      {children}
    </View>
  ),
  tbody: (node: any, children: any, parent: any, styles: any) => (
    <View key={node.key} style={styles.tbody}>
      {children}
    </View>
  ),
  tr: (node: any, children: any, parent: any, styles: any) => (
    <View key={node.key} style={styles.tr}>
      {children}
    </View>
  ),
  th: (node: any, children: any, parent: any, styles: any) => (
    <View key={node.key} style={styles.th}>
      {children}
    </View>
  ),
  td: (node: any, children: any, parent: any, styles: any) => (
    <View key={node.key} style={styles.td}>
      {children}
    </View>
  ),
};

const markdownStyles = {
  body: {
    color: '#e8e8e8',
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
  heading1: {
    color: '#d4af37',
    fontSize: 22,
    fontWeight: 'bold' as const,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37',
    paddingBottom: 6,
  },
  heading2: {
    color: '#d4af37',
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginTop: 18,
    marginBottom: 10,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
  heading3: {
    color: '#f0e0a0',
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
  heading4: {
    color: '#f0e0a0',
    fontSize: 15,
    fontWeight: 'bold' as const,
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
  paragraph: {
    marginBottom: 12,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
  strong: {
    color: '#d4af37',
    fontWeight: 'bold' as const,
  },
  em: {
    fontStyle: 'italic' as const,
    color: '#b0b8c0',
  },
  bullet_list: {
    marginLeft: 0,
    marginRight: 8,
  },
  ordered_list: {
    marginLeft: 0,
    marginRight: 8,
  },
  list_item: {
    marginBottom: 6,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
  },
  blockquote: {
    borderLeftWidth: 0,
    borderRightWidth: 4,
    borderRightColor: '#d4af37',
    paddingLeft: 0,
    paddingRight: 12,
    marginVertical: 10,
    backgroundColor: '#1a3b5d',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  code_inline: {
    backgroundColor: '#1a3b5d',
    color: '#f39c12',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
  },
  fence: {
    backgroundColor: '#1a3b5d',
    color: '#e8e8e8',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    marginVertical: 10,
    textAlign: 'left' as const,
  },
  hr: {
    backgroundColor: '#2c5070',
    height: 1,
    marginVertical: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: '#d4af37',
    borderRadius: 8,
    marginVertical: 12,
    overflow: 'hidden',
    backgroundColor: '#0a1628',
  },
  thead: {
    backgroundColor: '#1a3b5d',
    flexDirection: 'row',
  },
  tbody: {
    flexDirection: 'column',
  },
  tr: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2c5070',
    alignItems: 'stretch',
  },
  th: {
    flex: 1,
    color: '#d4af37',
    fontWeight: 'bold' as const,
    padding: 10,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
    fontSize: 13,
    borderRightWidth: 1,
    borderRightColor: '#2c5070',
  },
  td: {
    flex: 1,
    color: '#e8e8e8',
    padding: 10,
    textAlign: 'right' as const,
    writingDirection: 'rtl' as const,
    fontSize: 13,
    borderRightWidth: 1,
    borderRightColor: '#2c5070',
  },
};
