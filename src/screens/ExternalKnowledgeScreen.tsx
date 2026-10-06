import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getExternalStats } from '../kb/importers/externalImporters';

const TYPE_LABELS: Record<string, string> = {
  root: '🌱 جذور',
  planet: '🪐 كواكب',
  sign: '♈ أبراج',
  house: '🏠 بيوت',
  element: '🔥 طبائع',
  letter: '🔤 حروف',
  remainder: '🔢 بواقي',
  compound: '⚗️ تراكيب',
  resonance: '🎵 رنين',
  medical: '⚕️ طبي',
  remedy: '💊 ترياق',
  wafq: '🔷 أوفاق',
};

export default function ExternalKnowledgeScreen({ navigation }: any) {
  const [stats, setStats] = useState(getExternalStats());

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 المعرفة الخارجية</Text>
        <Text style={styles.headerSubtitle}>
          بيانات مستوردة من مصادر خارجية
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNum}>{stats.total}</Text>
          <Text style={styles.summaryLabel}>كيان خارجي مُدمج</Text>
          {stats.generatedAt && (
            <Text style={styles.summaryDate}>
              آخر استيراد: {new Date(stats.generatedAt).toLocaleString('ar-EG')}
            </Text>
          )}
        </View>

        {/* By Type */}
        {Object.keys(stats.byType).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>حسب النوع</Text>
            {Object.entries(stats.byType).map(([type, count]) => (
              <View key={type} style={styles.row}>
                <Text style={styles.rowLabel}>
                  {TYPE_LABELS[type] ?? type}
                </Text>
                <Text style={styles.rowCount}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ كيف يعمل التحديث؟</Text>
          <Text style={styles.infoText}>
            التحديث يُشغَّل على جهاز الكمبيوتر بواسطة سكريبت:
          </Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>node tools/knowledge-sync/run.mjs</Text>
          </View>
          <Text style={styles.infoText}>
            ثم إعادة بناء APK. بهذه الطريقة يبقى التطبيق{' '}
            <Text style={styles.bold}>100% offline</Text> مع بيانات محدَّثة.
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Health')}
        >
          <Ionicons name="bar-chart-outline" size={18} color="#d4af37" />
          <Text style={styles.actionBtnText}> عرض صحة التطبيق</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  header: { backgroundColor: '#1a3b5d', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#d4af37' },
  headerTitle: { color: '#d4af37', fontSize: 17, fontWeight: 'bold', textAlign: 'right', writingDirection: 'rtl' },
  headerSubtitle: { color: '#a0a0a0', fontSize: 11, marginTop: 3, textAlign: 'right', writingDirection: 'rtl' },

  scrollContent: { padding: 12 },

  summaryCard: { backgroundColor: '#0f2438', borderWidth: 2, borderColor: '#d4af37', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16 },
  summaryNum: { color: '#d4af37', fontSize: 44, fontWeight: 'bold' },
  summaryLabel: { color: '#a0a0a0', fontSize: 13, marginTop: 4 },
  summaryDate: { color: '#666', fontSize: 11, marginTop: 10 },

  section: { backgroundColor: '#0f2438', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#2c5070' },
  sectionTitle: { color: '#d4af37', fontSize: 14, fontWeight: 'bold', marginBottom: 10, textAlign: 'right', writingDirection: 'rtl' },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1a3b5d' },
  rowLabel: { color: '#e8e8e8', fontSize: 13, writingDirection: 'rtl' },
  rowCount: { color: '#2ecc71', fontSize: 13, fontWeight: 'bold' },

  infoBox: { backgroundColor: '#0f2438', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#2c5070', marginBottom: 14 },
  infoTitle: { color: '#d4af37', fontSize: 14, fontWeight: 'bold', marginBottom: 8, textAlign: 'right', writingDirection: 'rtl' },
  infoText: { color: '#e8e8e8', fontSize: 12, lineHeight: 20, textAlign: 'right', writingDirection: 'rtl', marginVertical: 4 },
  bold: { fontWeight: 'bold', color: '#d4af37' },
  codeBox: { backgroundColor: '#0a1628', borderRadius: 6, padding: 10, marginVertical: 8, borderWidth: 1, borderColor: '#2c5070' },
  code: { color: '#f39c12', fontSize: 11, fontFamily: 'monospace', textAlign: 'left' },

  actionBtn: { flexDirection: 'row-reverse', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f2438', borderWidth: 1, borderColor: '#2c5070', gap: 6 },
  actionBtnText: { color: '#d4af37', fontSize: 14, fontWeight: 'bold' },
});
