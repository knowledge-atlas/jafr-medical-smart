import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useDirection } from '../utils/DirectionContext';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Share, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { reflectiveArchetypesEngine } from '../domain/services/ReflectiveArchetypesEngine';

export default function ReflectiveReportScreen({ route, navigation }: any) {
  const { isRTL, toggleDirection } = useDirection();
  const { name, layers, analysis } = route.params || {};
  const finalLayers = layers ?? analysis?.layers;
  const finalName = name ?? analysis?.name;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      if (!finalName || !finalLayers) {
        setError('لم يتم استلام بيانات كافية');
        setLoading(false);
        return;
      }
      const p = reflectiveArchetypesEngine.analyze(finalName, finalLayers);
      setProfile(p);
      const init = new Set<string>();
      p.axes.slice(0, 3).forEach((a: any) => init.add(a.id));
      setOpenIds(init);
    } catch (e: any) {
      setError(e?.message ?? 'فشل التحليل النفسي');
    } finally {
      setLoading(false);
    }
  }, [name]);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const fullText = profile ? reflectiveArchetypesEngine.renderMarkdown(profile) : '';

  const copyAll = async () => {
    await Clipboard.setStringAsync(fullText);
    Alert.alert('✅ تم النسخ', `${fullText.length.toLocaleString()} حرف`);
  };

  const shareAll = async () => {
    try {
      await Share.share({ message: fullText, title: `الملف النفسي — ${finalName}` });
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل المشاركة');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={styles.loadingText}>جارٍ بناء الملف النفسي...</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ {error ?? 'خطأ غير معروف'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryBtnText}>← رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const balancePct = (profile.overallBalance * 100).toFixed(0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>الملف النفسي المتكامل 🧠</Text>
          <Text style={styles.headerSubtitle}>
            {finalName} · {profile.axes.length} محوراً · توازن {balancePct}%
          </Text>
        </View>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryLine}>
          ⚡ <Text style={styles.summaryLabel}>أقوى محور: </Text>{profile.dominantAxis}
        </Text>
        <Text style={styles.summaryLine}>
          🌑 <Text style={styles.summaryLabel}>أضعف محور: </Text>{profile.weakestAxis}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setOpenIds(new Set(profile.axes.map((a: any) => a.id)))}>
          <Ionicons name="chevron-down-circle-outline" size={16} color="#d4af37" />
          <Text style={styles.actionBtnText}> توسيع الكل</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setOpenIds(new Set())}>
          <Ionicons name="chevron-up-circle-outline" size={16} color="#d4af37" />
          <Text style={styles.actionBtnText}> طي الكل</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {profile.axes.map((axis: any) => {
          const isOpen = openIds.has(axis.id);
          const pct = (axis.score * 100).toFixed(0);
          return (
            <View key={axis.id} style={styles.axisCard}>
              <TouchableOpacity style={styles.axisHeader} onPress={() => toggle(axis.id)}>
                <View style={styles.axisHeaderRight}>
                  <Text style={styles.axisIcon}>{axis.icon}</Text>
                  <Text style={styles.axisTitle}>{axis.index}. {axis.title}</Text>
                </View>
                <View style={styles.axisHeaderLeft}>
                  <Text style={styles.axisPct}>{pct}%</Text>
                  <Text style={styles.axisLevel}>{axis.level}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.barWrap}>
                <View style={[styles.barFill, { width: `${pct}%` as any }]} />
              </View>

              {isOpen && (
                <View style={styles.axisBody}>
                  <Text style={styles.axisNarrative}>{axis.narrative}</Text>
                  {axis.insight ? (
                    <View style={styles.insightBox}>
                      <Text style={styles.insightText}>💡 {axis.insight}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.bottomBtn, { backgroundColor: '#3498db' }]} onPress={copyAll}>
          <Ionicons name="copy-outline" size={18} color="#fff" />
          <Text style={styles.bottomBtnText}> نسخ الكل</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.bottomBtn, { backgroundColor: '#27ae60' }]} onPress={shareAll}>
          <Ionicons name="share-outline" size={18} color="#fff" />
          <Text style={styles.bottomBtnText}> مشاركة</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a1628', padding: 20 },
  loadingText: { color: '#d4af37', fontSize: 15, marginTop: 12, fontWeight: 'bold' },
  errorText: { color: '#e74c3c', fontSize: 15, textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#3498db', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  retryBtnText: { color: '#fff', fontWeight: 'bold' },

  header: { backgroundColor: '#1a3b5d', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#d4af37' },
  headerTitle: { color: '#d4af37', fontSize: 17, fontWeight: 'bold', textAlign: 'right', writingDirection: 'rtl' },
  headerSubtitle: { color: '#a0a0a0', fontSize: 11, marginTop: 3, textAlign: 'right', writingDirection: 'rtl' },

  summaryBox: { backgroundColor: '#1a3b5d', paddingHorizontal: 14, paddingVertical: 10 },
  summaryLine: { color: '#e8e8e8', fontSize: 13, textAlign: 'right', writingDirection: 'rtl', marginVertical: 2 },
  summaryLabel: { color: '#d4af37', fontWeight: 'bold' },

  actions: { flexDirection: 'row', gap: 8, padding: 8, backgroundColor: '#0f2438' },
  actionBtn: { flex: 1, flexDirection: 'row-reverse', backgroundColor: '#1a3b5d', paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionBtnText: { color: '#d4af37', fontSize: 12, fontWeight: 'bold' },

  scroll: { flex: 1 },
  scrollContent: { padding: 10 },

  axisCard: { backgroundColor: '#1a3b5d', borderRadius: 10, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#2c5070' },
  axisHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  axisHeaderRight: { flexDirection: 'row-reverse', alignItems: 'center', flex: 1, gap: 8 },
  axisHeaderLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  axisIcon: { fontSize: 20 },
  axisTitle: { color: '#d4af37', fontSize: 14, fontWeight: 'bold', writingDirection: 'rtl', flex: 1, textAlign: 'right' },
  axisPct: { color: '#2ecc71', fontSize: 13, fontWeight: 'bold' },
  axisLevel: { color: '#a0a0a0', fontSize: 11 },

  barWrap: { height: 3, backgroundColor: '#0a1628', marginHorizontal: 12, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 3, backgroundColor: '#d4af37' },

  axisBody: { paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  axisNarrative: { color: '#e8e8e8', fontSize: 13, lineHeight: 22, textAlign: 'right', writingDirection: 'rtl' },
  insightBox: { backgroundColor: '#0f2438', borderRightWidth: 3, borderRightColor: '#d4af37', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },
  insightText: { color: '#f0e0a0', fontSize: 12, lineHeight: 20, textAlign: 'right', writingDirection: 'rtl' },

  bottomBar: { flexDirection: 'row', gap: 8, padding: 10, backgroundColor: '#0f2438', borderTopWidth: 1, borderTopColor: '#1a3b5d' },
  bottomBtn: { flex: 1, flexDirection: 'row-reverse', paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 6 },
  bottomBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
