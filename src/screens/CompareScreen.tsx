// ================================================================
// شاشة المقارنة — تحليل عميق بين اسمين
// ================================================================

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Share, ActivityIndicator, Alert,
} from 'react-native';
import { compareNames, ComparisonResult } from '../engine/comparisonEngine';

export default function CompareScreen() {
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);

  const compare = () => {
    if (!name1.trim() || !name2.trim()) {
      Alert.alert('تنبيه', 'أدخل كلا الاسمين');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const r = compareNames(name1.trim(), name2.trim());
      if ('error' in r) {
        Alert.alert('خطأ', r.error);
        setResult(null);
      } else {
        setResult(r);
      }
      setLoading(false);
    }, 100);
  };

  const shareComparison = async () => {
    if (!result) return;
    const lines = [
      `═══ مقارنة ${result.name1} × ${result.name2} ═══\n`,
      `📊 النتيجة الإجمالية: ${result.overallScore}%`,
      `🎯 الحكم: ${result.verdict}\n`,
      `🔷 الجذور:`,
      `   ${result.name1}: الجذر ${result.root1}`,
      `   ${result.name2}: الجذر ${result.root2}`,
      result.rootResonance ? `   الرنين: ${result.rootResonance.description}` : '',
      result.rootResonance ? `   الظل: ${result.rootResonance.shadow}` : '',
      result.rootResonance ? `   الترياق: ${result.rootResonance.remedy}` : '',
      '',
      `🔥 الطبائع:`,
      `   ${result.name1}: ${result.element1}`,
      `   ${result.name2}: ${result.element2}`,
      result.elementResonance ? `   النوع: ${result.elementResonance.result}` : '',
      result.elementResonance ? `   التقييم: ${result.elementResonance.rating}` : '',
      result.elementResonance ? `   التوصية: ${result.elementResonance.advice}` : '',
      '',
      `💪 القوى:`,
      ...result.strengths.map(s => `   ${s}`),
      '',
      `⚠️ التحديات:`,
      ...result.challenges.map(s => `   ${s}`),
      '',
      `💊 التوصيات:`,
      ...result.recommendations.map(s => `   ${s}`),
    ].filter(Boolean).join('\n');
    await Share.share({ message: lines });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>⚖️</Text>
        <Text style={styles.headerTitle}>المقارنة التحليلية</Text>
        <Text style={styles.headerSubtitle}>تحليل عميق للتوافق بين اسمين</Text>
      </View>

      {/* Inputs */}
      <View style={styles.inputsRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={name1}
          onChangeText={setName1}
          placeholder="الاسم الأول"
          placeholderTextColor="#666"
          textAlign="center"
        />
        <Text style={styles.vs}>×</Text>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={name2}
          onChangeText={setName2}
          placeholder="الاسم الثاني"
          placeholderTextColor="#666"
          textAlign="center"
        />
      </View>

      <TouchableOpacity style={styles.compareBtn} onPress={compare} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#0a1628" />
        ) : (
          <Text style={styles.compareBtnText}>🔍 ابدأ التحليل العميق</Text>
        )}
      </TouchableOpacity>

      {result && (
        <>
          {/* ═══ البطاقة الكبرى: النتيجة ═══ */}
          <View style={[styles.verdictCard, { borderColor: result.verdictColor }]}>
            <Text style={styles.verdictScore}>
              {result.overallScore}<Text style={styles.verdictPercent}>%</Text>
            </Text>
            <Text style={[styles.verdictText, { color: result.verdictColor }]}>
              {result.verdict}
            </Text>
            <View style={styles.scoreBar}>
              <View
                style={[
                  styles.scoreBarFill,
                  { width: `${result.overallScore}%`, backgroundColor: result.verdictColor },
                ]}
              />
            </View>
          </View>

          {/* ═══ جدول الطبقات ═══ */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 مقارنة الطبقات الجوهرية</Text>
            <View style={styles.compareRow}>
              <Text style={[styles.compareCell, styles.compareHeader]}>البُعد</Text>
              <Text style={[styles.compareCell, styles.compareHeader]}>{result.name1}</Text>
              <Text style={[styles.compareCell, styles.compareHeader]}>{result.name2}</Text>
            </View>
            {[
              ['🔷 الجذر', `الجذر ${result.root1}`, `الجذر ${result.root2}`],
              ['☀️ الكوكب', result.planet1, result.planet2],
              ['♈ البرج', result.sign1, result.sign2],
              ['🔥 الطبع', result.element1, result.element2],
              ['🏠 البيت', `${result.house1} — ${result.houseName1}`, `${result.house2} — ${result.houseName2}`],
              ['📊 المجموع', String(result.total1), String(result.total2)],
            ].map(([label, v1, v2], i) => (
              <View key={i} style={styles.compareRow}>
                <Text style={styles.compareCell}>{label}</Text>
                <Text style={styles.compareCell}>{v1}</Text>
                <Text style={styles.compareCell}>{v2}</Text>
              </View>
            ))}
          </View>

          {/* ═══ رنين الجذور ═══ */}
          {result.rootResonance && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔷 رنين الجذرين ({result.root1} × {result.root2})</Text>
              <Text style={styles.resonanceDesc}>{result.rootResonance.description}</Text>
              <View style={styles.resonanceBlock}>
                <Text style={styles.blockLabel}>🌑 الظل المحتمل:</Text>
                <Text style={styles.blockText}>{result.rootResonance.shadow}</Text>
              </View>
              <View style={styles.resonanceBlock}>
                <Text style={styles.blockLabel}>💊 الترياق:</Text>
                <Text style={styles.blockText}>{result.rootResonance.remedy}</Text>
              </View>
            </View>
          )}

          {/* ═══ رنين الطبائع ═══ */}
          {result.elementResonance && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔥 رنين الطبائع</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>{result.elementResonance.title}</Text>
                <Text style={styles.ratingValue}>{result.elementResonance.rating}</Text>
              </View>
              <Text style={styles.resonanceDesc}>{result.elementResonance.result}</Text>
              <View style={styles.resonanceBlock}>
                <Text style={styles.blockLabel}>📌 التوصية:</Text>
                <Text style={styles.blockText}>{result.elementResonance.advice}</Text>
              </View>
            </View>
          )}

          {/* ═══ تحليل الكوكبين ═══ */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>☀️ تحليل الكوكبين</Text>
            <Text style={styles.resonanceDesc}>{result.planetAnalysis.insight}</Text>
          </View>

          {/* ═══ تحليل البرجين ═══ */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>♈ تحليل البرجين</Text>
            <Text style={styles.resonanceDesc}>{result.signAnalysis.insight}</Text>
          </View>

          {/* ═══ تحليل البيتين ═══ */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🏠 تحليل مسرح الحياة</Text>
            <Text style={styles.resonanceDesc}>{result.houseAnalysis.insight}</Text>
          </View>

          {/* ═══ القوى ═══ */}
          {result.strengths.length > 0 && (
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#27ae60' }]}>
              <Text style={styles.cardTitle}>💪 القوى المشتركة</Text>
              {result.strengths.map((s, i) => (
                <Text key={i} style={styles.listItem}>{s}</Text>
              ))}
            </View>
          )}

          {/* ═══ التحديات ═══ */}
          {result.challenges.length > 0 && (
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#e67e22' }]}>
              <Text style={styles.cardTitle}>⚠️ التحديات المحتملة</Text>
              {result.challenges.map((s, i) => (
                <Text key={i} style={styles.listItem}>{s}</Text>
              ))}
            </View>
          )}

          {/* ═══ التوصيات ═══ */}
          {result.recommendations.length > 0 && (
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#3498db' }]}>
              <Text style={styles.cardTitle}>💊 التوصيات العملية</Text>
              {result.recommendations.map((s, i) => (
                <Text key={i} style={styles.listItem}>{s}</Text>
              ))}
            </View>
          )}

          {/* زر المشاركة */}
          <TouchableOpacity style={styles.shareBtn} onPress={shareComparison}>
            <Text style={styles.shareBtnText}>📤 مشاركة التحليل</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1628' },
  header: {
    backgroundColor: '#1a3b5d',
    padding: 20,
    alignItems: 'center',
  },
  headerIcon: { fontSize: 40 },
  headerTitle: { color: '#d4af37', fontSize: 22, fontWeight: 'bold', marginTop: 5 },
  headerSubtitle: { color: '#c0c0c0', fontSize: 12, marginTop: 4 },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  input: {
    backgroundColor: '#1a3b5d',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  vs: { color: '#d4af37', fontSize: 24, fontWeight: 'bold' },
  compareBtn: {
    backgroundColor: '#d4af37',
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  compareBtnText: { color: '#0a1628', fontWeight: 'bold', fontSize: 16 },
  verdictCard: {
    backgroundColor: '#1a3b5d',
    margin: 12,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
  },
  verdictScore: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  verdictPercent: { fontSize: 24, color: '#888' },
  verdictText: { fontSize: 16, fontWeight: 'bold', marginTop: 5, textAlign: 'center' },
  scoreBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#0f2438',
    borderRadius: 4,
    marginTop: 15,
    overflow: 'hidden',
  },
  scoreBarFill: { height: '100%', borderRadius: 4 },
  card: {
    backgroundColor: '#1a3b5d',
    margin: 12,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: { color: '#d4af37', fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  compareRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#0f2438',
  },
  compareCell: {
    flex: 1,
    color: '#e8e8e8',
    fontSize: 11,
    padding: 8,
    textAlign: 'center',
  },
  compareHeader: { color: '#d4af37', fontWeight: 'bold' },
  resonanceDesc: { color: '#e8e8e8', fontSize: 14, lineHeight: 22, marginBottom: 10 },
  resonanceBlock: {
    backgroundColor: '#0f2438',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  blockLabel: { color: '#d4af37', fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  blockText: { color: '#c0c0c0', fontSize: 13, lineHeight: 20 },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ratingLabel: { color: '#d4af37', fontSize: 14, fontWeight: 'bold' },
  ratingValue: { color: '#27ae60', fontSize: 16, fontWeight: 'bold' },
  listItem: {
    color: '#e8e8e8',
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 6,
  },
  shareBtn: {
    backgroundColor: '#27ae60',
    margin: 12,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
