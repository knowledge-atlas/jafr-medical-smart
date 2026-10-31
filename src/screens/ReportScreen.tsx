import React, { useState, useEffect } from 'react';
import { freeTrial } from '../monetization/freeTrial';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Share,
  Alert, ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { EnrichedMarkdownText } from '../utils/MarkdownMock';
import { useDirection } from '../utils/DirectionContext';
import { Ionicons } from '@expo/vector-icons';
import { reportsStorage, SavedReport } from '../storage/reportsStorage';
import ElementsRadarChart from '../components/ElementsRadarChart';
import { computeElementBalance } from '../products/DeepDiveReport';

export default function ReportScreen({ route, navigation }: any) {
  const { isRTL, toggleDirection } = useDirection();
  const { report, name, layers, reportId, readOnly } = route.params || {};
  const savedReportId = (report as any)?.__reportId;

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // لا نحفظ تلقائياً إذا كان التقرير مفتوحاً من السجل
    if (report && !readOnly && !reportId) {
      void autoSave();
    }
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
    Alert.alert('حذف التقرير', 'هل أنت متأكد؟ لا يمكن التراجع.', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف نهائي',
        style: 'destructive',
        onPress: async () => {
          try {
            const rid = reportId ?? savedReportId;
            if (rid) {
              await reportsStorage.delete(rid);
              Alert.alert('✅', 'تم الحذف');
              navigation.goBack();
            } else {
              Alert.alert('تنبيه', 'لم يتم العثور على معرّف التقرير');
            }
          } catch (e: any) {
            Alert.alert('خطأ', e?.message ?? 'فشل الحذف');
          }
        },
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
  // RLM واعٍ بـMarkdown: لا يكسر الجداول ولا القوائم
  const RLM = '\u200F';
  const rlmText = text.split('\n').map((line: string) => {
    const t = line.trimStart();
    if (!t) return line;
    if (t.startsWith('```')) return line;                                    // code block: لا يلمس
    if (t.startsWith('|')) return line.replace(/\|(\s+)/g, '|$1' + RLM);    // جدول: RLM بعد |
    if (t.startsWith('>')) return line.replace(/^(\s*>+\s*)/, '$1' + RLM);   // blockquote
    if (t.startsWith('#')) return line.replace(/^(#+\s+)/, '$1' + RLM);      // عنوان
    if (/^[-*+]\s/.test(t)) return line.replace(/^([-*+]\s+)/, '$1' + RLM);  // قائمة نقطية
    if (/^\d+\.\s/.test(t)) return line.replace(/^(\d+\.\s+)/, '$1' + RLM); // قائمة مرقمة
    return line.replace(/^(\s*)/, '$1' + RLM);                              // نص عادي
  }).join('\n');

  return (
    <View style={styles.container}>

      {/* ═══ الشريط العلوي ═══ */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          {saving && <ActivityIndicator size="small" color="#d4af37" />}
          {saved && <Text style={styles.savedBadge}>💾 محفوظ</Text>}
        </View>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { opacity: 0.6 }]}
            onPress={() => {
              Alert.alert(
                '💎 النسخة الكاملة',
                'النسخ متاح في النسخة الكاملة.\n\nالتجربة المجانية تقتصر على عرض 3 تقارير كاملة.',
                [
                  { text: 'حسناً', style: 'cancel' },
                  { text: 'اعرف المزيد', onPress: () => navigation.navigate('Paywall') },
                ]
              );
            }}
          >
            <Text style={styles.actionBtnText}>🔒 نسخ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { opacity: 0.6 }]}
            onPress={() => {
              Alert.alert(
                '💎 النسخة الكاملة',
                'المشاركة متاحة في النسخة الكاملة.',
                [
                  { text: 'حسناً', style: 'cancel' },
                  { text: 'اعرف المزيد', onPress: () => navigation.navigate('Paywall') },
                ]
              );
            }}
          >
            <Text style={styles.actionBtnText}>🔒 مشاركة</Text>
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
          <View style={{ direction: 'rtl' as const }}>
            <EnrichedMarkdownText flavor="github" markdown={text} markdownStyle={markdownStyles}  selectionColor="rgba(212, 175, 55, 0.3)"/>
          </View>
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


const markdownStyles: any = {
  body: { color: '#e8e8e8', fontSize: 16, lineHeight: 28 },
  paragraph: { color: '#e8e8e8', fontSize: 16, lineHeight: 28, marginBottom: 12 },
  heading1: { color: '#d4af37', fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 12, borderBottomWidth: 2, borderBottomColor: '#d4af37', paddingBottom: 4 },
  heading2: { color: '#d4af37', fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  heading3: { color: '#d4af37', fontSize: 18, fontWeight: 'bold', marginTop: 14, marginBottom: 6 },
  heading4: { color: '#d4af37', fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
  heading5: { color: '#d4af37', fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 2 },
  heading6: { color: '#d4af37', fontSize: 13, fontWeight: 'bold', marginTop: 8, marginBottom: 2 },
  blockquote: { borderRightWidth: 4, borderRightColor: '#d4af37', paddingRight: 12, marginVertical: 8, backgroundColor: 'rgba(212, 175, 55, 0.05)', paddingVertical: 8, borderRadius: 4, color: '#e8e8e8' },
  code: { backgroundColor: '#1a3b5d', color: '#d4af37', fontFamily: 'monospace', fontSize: 14, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  codeBlock: { backgroundColor: '#0f2438', color: '#e8e8e8', fontFamily: 'monospace', fontSize: 14, padding: 12, borderRadius: 8, marginVertical: 8 },
  link: { color: '#64b5f6', textDecorationLine: 'underline' },
  strong: { fontWeight: 'bold', color: '#ffffff' },
  em: { fontStyle: 'italic', color: '#ffffff' },
  list: { color: '#e8e8e8', fontSize: 16, lineHeight: 28, marginBottom: 8, bulletColor: '#d4af37' },
  table: { borderWidth: 1, borderColor: '#2c5070', borderRadius: 8, marginVertical: 12 },
  tableHeader: { backgroundColor: '#1a3b5d' },
  tableHeaderCell: { color: '#d4af37', fontWeight: 'bold', padding: 10, fontSize: 15 },
  tableRow: { borderBottomWidth: 1, borderBottomColor: '#2c5070' },
  tableCell: { color: '#e8e8e8', padding: 10, fontSize: 14 },
  th: { color: '#d4af37', fontWeight: 'bold', padding: 10 },
  td: { color: '#e8e8e8', padding: 10 },
  hr: { backgroundColor: '#2c5070', height: 1, marginVertical: 16 },
};
