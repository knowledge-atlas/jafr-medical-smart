// ================================================================
// شاشة التقرير — عرض + حفظ + تصدير
// ================================================================

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Share,
  Alert, ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { reportsStorage, SavedReport } from '../storage/reportsStorage';

export default function ReportScreen({ route, navigation }: any) {
  const { report, name } = route.params || {};

  // حماية: إذا وصل التقرير بشكل غير صحيح
  if (!report) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#e74c3c', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            ⚠️ لم يتم استلام التقرير بشكل صحيح
          </Text>
          <Text style={{ color: '#c0c0c0', fontSize: 14, textAlign: 'center' }}>
            اعد من الشاشة الرئيسية
          </Text>
        </View>
      </View>
    );
  }
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // الحفظ التلقائي عند فتح الشاشة
  useEffect(() => {
    autoSave();
  }, []);

  const autoSave = async () => {
    if (saved) return;
    setSaving(true);
    try {
      const id = `report_${Date.now()}`;
      const savedReport: SavedReport = {
        id,
        name: name || report.entity || 'بدون اسم',
        symptoms: [],
        root: report.root,
        planet: report.internalPlanet || report.planet || '',
        sign: report.internalSign || report.sign || '',
        element: report.internalElement || report.element || '',
        house: report.internalHouse || report.house || 1,
        total: report.calculation?.total || report.total || 0,
        fullText: report.fullReport || report.fullText || '',
        report,
        createdAt: new Date().toISOString(),
      };
      await reportsStorage.save(savedReport);
      setSaved(true);
      setSavedId(id);
    } catch (e: any) {
      console.warn('⚠️ فشل الحفظ التلقائي:', e?.message);
    } finally {
      setSaving(false);
    }
  };

  const shareReport = async () => {
    const text = report.fullReport || report.fullText || '';
    if (!text) {
      Alert.alert('تنبيه', 'لا يوجد نص للتقرير');
      return;
    }
    try {
      await Share.share({
        message: text,
        title: `تقرير ${name || report.entity}`,
      });
    } catch (e: any) {
      Alert.alert('خطأ', e?.message || 'فشل المشاركة');
    }
  };

  const copyReport = async () => {
    const text = report.fullReport || report.fullText || '';
    if (!text) return;
    await Clipboard.setStringAsync(text);
    Alert.alert('✅', 'تم نسخ التقرير إلى الحافظة');
  };

  const deleteReport = async () => {
    if (!savedId) return;
    Alert.alert(
      'حذف التقرير',
      'هل أنت متأكد من حذف هذا التقرير من السجل؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            await reportsStorage.delete(savedId);
            setSaved(false);
            setSavedId(null);
            Alert.alert('✅', 'تم حذف التقرير');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const fullText = report.fullReport || report.fullText || 'لا يوجد نص متاح';

  return (
    <View style={styles.container}>
      {/* شريط الحالة */}
      <View style={styles.statusBar}>
        {saving ? (
          <View style={styles.statusItem}>
            <ActivityIndicator size="small" color="#d4af37" />
            <Text style={styles.statusText}>  جارٍ الحفظ...</Text>
          </View>
        ) : saved ? (
          <Text style={styles.statusSaved}>💾 محفوظ في السجل</Text>
        ) : (
          <Text style={styles.statusPending}>⚠️ لم يُحفظ</Text>
        )}
      </View>

      {/* التقرير */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.reportText} selectable>{fullText}</Text>
      </ScrollView>

      {/* شريط الأزرار */}
      <View style={styles.actionsBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={shareReport}>
          <Text style={styles.actionBtnText}>📤 مشاركة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={copyReport}>
          <Text style={styles.actionBtnText}>📋 نسخ</Text>
        </TouchableOpacity>
        {saved && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDanger]}
            onPress={deleteReport}
          >
            <Text style={styles.actionBtnText}>🗑️ حذف</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  statusBar: {
    backgroundColor: '#0f2438',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statusItem: { flexDirection: 'row', alignItems: 'center' },
  statusText: { color: '#d4af37', fontSize: 13 },
  statusSaved: { color: '#27ae60', fontSize: 13, fontWeight: 'bold' },
  statusPending: { color: '#e74c3c', fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  reportText: {
    fontSize: 15,
    lineHeight: 26,
    color: '#111',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  actionsBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#f5f5f5',
  },
  actionBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  actionBtnDanger: { backgroundColor: '#fdecea' },
  actionBtnText: { color: '#1a3b5d', fontWeight: 'bold', fontSize: 14 },
});
