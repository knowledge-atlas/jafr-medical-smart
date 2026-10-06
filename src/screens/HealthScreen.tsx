import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analytics, AnalyticsData } from '../utils/analytics';
import { errorLogger } from '../utils/errorLogger';

export default function HealthScreen({ navigation }: any) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [health, setHealth] = useState<{ label: string; color: string } | null>(null);
  const [errorCount, setErrorCount] = useState(0);

  const load = useCallback(async () => {
    const d = await analytics.load();
    const h = await analytics.getHealth();
    const ec = await errorLogger.count();
    setData(d);
    setHealth(h);
    setErrorCount(ec);
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => {
    Alert.alert('تصفير الإحصائيات', 'سيتم حذف كل الأرقام المحلية. متابعة؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تصفير',
        style: 'destructive',
        onPress: async () => {
          await analytics.reset();
          await errorLogger.clear();
          await load();
        },
      },
    ]);
  };

  if (!data || !health) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>جارٍ التحميل...</Text>
      </View>
    );
  }

  const topProducts = Object.entries(data.productsUsed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 صحة التطبيق</Text>
        <Text style={styles.headerSubtitle}>إحصائيات محلية — لا سحابة</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Health Card */}
        <View style={[styles.healthCard, { borderColor: health.color }]}>
          <Text style={styles.healthLabel}>الحالة العامة</Text>
          <Text style={[styles.healthValue, { color: health.color }]}>{health.label}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{data.appLaunches}</Text>
            <Text style={styles.statLabel}>مرة فُتح التطبيق</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{data.reportsGenerated}</Text>
            <Text style={styles.statLabel}>تقرير مُولَّد</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{data.aiChatsUsed}</Text>
            <Text style={styles.statLabel}>محادثة AI</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: errorCount > 0 ? '#e74c3c' : '#2ecc71' }]}>
              {errorCount}
            </Text>
            <Text style={styles.statLabel}>خطأ مسجَّل</Text>
          </View>
        </View>

        {/* Top Products */}
        {topProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 أكثر المنتجات استخداماً</Text>
            {topProducts.map(([id, count]) => (
              <View key={id} style={styles.productRow}>
                <Text style={styles.productName}>{id}</Text>
                <Text style={styles.productCount}>{count}×</Text>
              </View>
            ))}
          </View>
        )}

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ معلومات</Text>
          <Text style={styles.infoLine}>أول فتح: {new Date(data.firstLaunch).toLocaleDateString('ar-EG')}</Text>
          <Text style={styles.infoLine}>آخر فتح: {new Date(data.lastLaunch).toLocaleString('ar-EG')}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('ErrorLog')}
          >
            <Ionicons name="alert-circle-outline" size={18} color="#e74c3c" />
            <Text style={styles.actionBtnText}> عرض سجل الأخطاء</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, { borderColor: '#e74c3c' }]} onPress={reset}>
            <Ionicons name="refresh-outline" size={18} color="#e74c3c" />
            <Text style={[styles.actionBtnText, { color: '#e74c3c' }]}> تصفير الإحصائيات</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a1628' },
  loading: { color: '#d4af37', fontSize: 14 },

  header: { backgroundColor: '#1a3b5d', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#d4af37' },
  headerTitle: { color: '#d4af37', fontSize: 17, fontWeight: 'bold', textAlign: 'right', writingDirection: 'rtl' },
  headerSubtitle: { color: '#a0a0a0', fontSize: 11, marginTop: 3, textAlign: 'right', writingDirection: 'rtl' },

  scrollContent: { padding: 12 },

  healthCard: { backgroundColor: '#0f2438', borderWidth: 2, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  healthLabel: { color: '#a0a0a0', fontSize: 12, marginBottom: 6 },
  healthValue: { fontSize: 28, fontWeight: 'bold' },

  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { flexBasis: '47%', flexGrow: 1, backgroundColor: '#0f2438', borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2c5070' },
  statNum: { color: '#d4af37', fontSize: 26, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { color: '#a0a0a0', fontSize: 11, textAlign: 'center', writingDirection: 'rtl' },

  section: { backgroundColor: '#0f2438', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#2c5070' },
  sectionTitle: { color: '#d4af37', fontSize: 14, fontWeight: 'bold', marginBottom: 10, textAlign: 'right', writingDirection: 'rtl' },
  productRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1a3b5d' },
  productName: { color: '#e8e8e8', fontSize: 13 },
  productCount: { color: '#2ecc71', fontSize: 13, fontWeight: 'bold' },
  infoLine: { color: '#a0a0a0', fontSize: 12, textAlign: 'right', writingDirection: 'rtl', marginVertical: 3 },

  actions: { gap: 10 },
  actionBtn: { flexDirection: 'row-reverse', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f2438', borderWidth: 1, borderColor: '#2c5070', gap: 6 },
  actionBtnText: { color: '#e8e8e8', fontSize: 14, fontWeight: 'bold' },
});
