import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { buildReport } from '../engine/reportBuilder';

export default function TraditionalReportScreen({ route, navigation }: any) {
  const { name } = route.params || {};
  const [reportText, setReportText] = useState<string>('');
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

      const fullReport =
        (report as any).fullReport ||
        (report as any).text ||
        JSON.stringify(report, null, 2);

      setReportText(fullReport);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'فشل التوليد');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(reportText);
    Alert.alert('✅ تم النسخ', 'التقرير التقليدي كامل في الحافظة');
  };

  const shareReport = async () => {
    try {
      await Share.share({
        message: reportText,
        title: `التقرير التقليدي — ${name}`,
      });
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل المشاركة');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={styles.loadingText}>جارٍ توليد التقرير الشامل...</Text>
        <Text style={styles.loadingHint}>
          يتم تحميل كل نصوص الموسوعة المرجعية
        </Text>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          📜 التقرير التقليدي الشامل
        </Text>
        <Text style={styles.headerSubtitle}>
          {name} · {reportText.length.toLocaleString()} حرف
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={copyToClipboard}>
          <Text style={styles.actionText}>📋 نسخ الكل</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={shareReport}>
          <Text style={styles.actionText}>📤 مشاركة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.actionText}>⬅ رجوع</Text>
        </TouchableOpacity>
      </View>

      {/* Content — Monospace to preserve box-drawing characters */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          contentContainerStyle={styles.horizontalContent}
        >
          <Text style={styles.reportText} selectable>
            {reportText}
          </Text>
        </ScrollView>
      </ScrollView>

      {/* Footer note */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2026 — نظام الجفر الطبي الذكي · v3.0
        </Text>
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
    backgroundColor: '#3498db', padding: 14, borderRadius: 10,
    paddingHorizontal: 30,
  },
  retryBtnText: { color: '#fff', fontWeight: 'bold' },

  header: {
    backgroundColor: '#1a3b5d',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2c5070',
  },
  headerTitle: { color: '#d4af37', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  headerSubtitle: { color: '#c0c0c0', fontSize: 12, textAlign: 'center', marginTop: 4 },

  actionsRow: {
    flexDirection: 'row', gap: 8, padding: 10,
    backgroundColor: '#0f2438',
  },
  actionBtn: {
    flex: 1, backgroundColor: '#2c5070', padding: 10,
    borderRadius: 8, alignItems: 'center',
  },
  actionText: { color: '#d4af37', fontSize: 13, fontWeight: 'bold' },

  scroll: { flex: 1, backgroundColor: '#0a1628' },
  scrollContent: { padding: 12 },
  horizontalContent: { paddingBottom: 20 },

  reportText: {
    color: '#e8e8e8',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 18,
  },

  footer: {
    padding: 8, backgroundColor: '#0f2438',
    borderTopWidth: 1, borderTopColor: '#1a3b5d',
  },
  footerText: { color: '#666', fontSize: 10, textAlign: 'center' },
});
