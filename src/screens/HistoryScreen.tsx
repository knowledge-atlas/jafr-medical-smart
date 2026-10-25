// ================================================================
// شاشة السجل — عرض وحذف التقارير المحفوظة
// ================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { reportsStorage, SavedReport } from '../storage/reportsStorage';

export default function HistoryScreen({ navigation }: any) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const all = await reportsStorage.getAll();
    setReports(all);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // إعادة تحميل عند التركيز على الشاشة
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openReport = (report: SavedReport) => {
    navigation.navigate('Report', {
      report: report.report,
      name: report.name,
      reportId: report.id,
      readOnly: true,
    });
  };

  const deleteReport = (id: string) => {
    Alert.alert(
      'حذف التقرير',
      'هل أنت متأكد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            await reportsStorage.delete(id);
            await load();
          },
        },
      ]
    );
  };

  const clearAll = () => {
    Alert.alert(
      'مسح السجل',
      'سيتم حذف كل التقارير المحفوظة. هل أنت متأكد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'مسح الكل',
          style: 'destructive',
          onPress: async () => {
            await reportsStorage.clear();
            await load();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  if (reports.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>📂</Text>
        <Text style={styles.emptyTitle}>السجل فارغ</Text>
        <Text style={styles.emptyHint}>
          عندما تحلل أي اسم، سيُحفظ تقريره هنا تلقائياً.
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← العودة للرئيسية</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerCount}>
          📂 {reports.length} تقرير محفوظ
        </Text>
        <TouchableOpacity onPress={clearAll}>
          <Text style={styles.clearAll}>🗑️ مسح الكل</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#d4af37" />
        }
      >
        {reports.map(r => (
          <TouchableOpacity
            key={r.id}
            style={styles.card}
            onPress={() => openReport(r)}
            onLongPress={() => deleteReport(r.id)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardName}>{r.name}</Text>
              <Text style={styles.cardDate}>
                {new Date(r.createdAt).toLocaleDateString('ar-EG')}
              </Text>
            </View>

            <View style={styles.cardMeta}>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>🔷 {r.root}</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>☀️ {r.planet}</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>♈ {r.sign}</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaText}>🔥 {r.element}</Text>
              </View>
            </View>

            <Text style={styles.cardPreview} numberOfLines={2}>
              {r.fullText.substring(0, 120)}...
            </Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a1628',
    padding: 30,
  },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  emptyTitle: {
    color: '#d4af37',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyHint: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  backBtn: {
    backgroundColor: '#1a3b5d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backBtnText: { color: '#d4af37', fontWeight: 'bold' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#1a3b5d',
  },
  headerCount: { color: '#d4af37', fontSize: 14, fontWeight: 'bold' },
  clearAll: { color: '#e74c3c', fontSize: 13 },
  scroll: { flex: 1 },
  card: {
    backgroundColor: '#1a3b5d',
    margin: 12,
    marginBottom: 0,
    borderRadius: 12,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardName: { color: '#d4af37', fontSize: 17, fontWeight: 'bold' },
  cardDate: { color: '#888', fontSize: 11 },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  metaChip: {
    backgroundColor: '#0f2438',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  metaText: { color: '#c0c0c0', fontSize: 11 },
  cardPreview: {
    color: '#888',
    fontSize: 12,
    lineHeight: 18,
    borderTopWidth: 1,
    borderTopColor: '#0f2438',
    paddingTop: 8,
  },
});
