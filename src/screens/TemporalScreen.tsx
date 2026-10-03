import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { temporalAnalyzer } from '../domain/services/TemporalAnalyzer';

export default function TemporalScreen({ route }: any) {
  const name = route.params?.name ?? '';
  const analysis = route.params?.analysis;
  const rootNum = (() => {
    const r = analysis?.layers?.root;
    if (!r) return null;
    const m = String(r).match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  })();

  const [days, setDays] = useState(28);
  const [result, setResult] = useState<any>(null);

  const generate = () => {
    if (rootNum === null) return;
    const out = temporalAnalyzer.analyzeRange(new Date(), rootNum, days);
    setResult(out);
  };

  React.useEffect(() => { generate(); }, [days]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>📅 التقويم الزمني</Text>
        <Text style={styles.heroText}>
          {name ? `الاسم: ${name}` : ''} {rootNum ? `· الجذر: ${rootNum}` : ''}
        </Text>
      </View>

      <View style={styles.buttonsRow}>
        {[7, 14, 28, 60].map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.chip, days === d && styles.chipActive]}
            onPress={() => setDays(d)}
          >
            <Text style={[styles.chipText, days === d && styles.chipTextActive]}>{d} يوم</Text>
          </TouchableOpacity>
        ))}
      </View>

      {result && (
        <View>
          <View style={styles.summaryBox}>
            <Markdown style={mdStyles}>{result.summary}</Markdown>
          </View>

          {result.peakDays.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌟 أيام الذروة</Text>
              {result.peakDays.map((d: any, i: number) => (
                <View key={i} style={styles.dayCard}>
                  <Text style={styles.dayDate}>{d.date}</Text>
                  <Text style={styles.dayScore}>{(d.score * 100).toFixed(0)}%</Text>
                  <Text style={styles.dayAdvice} numberOfLines={2}>{d.advice}</Text>
                </View>
              ))}
            </View>
          )}

          {result.criticalDays.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚠️ أيام التعبئة</Text>
              {result.criticalDays.map((d: any, i: number) => (
                <View key={i} style={[styles.dayCard, styles.dayCardLow]}>
                  <Text style={styles.dayDate}>{d.date}</Text>
                  <Text style={styles.dayScore}>{(d.score * 100).toFixed(0)}%</Text>
                  <Text style={styles.dayAdvice} numberOfLines={2}>{d.advice}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#0a1628', flexGrow: 1 },
  hero: { alignItems: 'center', padding: 16, backgroundColor: '#1a3b5d', borderRadius: 12, marginBottom: 16 },
  heroTitle: { color: '#d4af37', fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  heroText: { color: '#c0c0c0', fontSize: 13 },
  buttonsRow: { flexDirection: 'row', gap: 8, marginBottom: 16, justifyContent: 'space-between' },
  chip: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1a3b5d', alignItems: 'center' },
  chipActive: { backgroundColor: '#d4af37' },
  chipText: { color: '#d4af37', fontWeight: 'bold', fontSize: 13 },
  chipTextActive: { color: '#0a1628' },
  summaryBox: { backgroundColor: '#1a3b5d', padding: 14, borderRadius: 12, marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#d4af37', fontSize: 17, fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
  dayCard: { backgroundColor: '#1a3b5d', padding: 12, borderRadius: 10, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#27ae60' },
  dayCardLow: { borderLeftColor: '#e74c3c' },
  dayDate: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'right' },
  dayScore: { color: '#d4af37', fontSize: 20, fontWeight: 'bold', position: 'absolute', right: 12, top: 10 },
  dayAdvice: { color: '#b0b8c0', fontSize: 12, marginTop: 8, lineHeight: 18, textAlign: 'right' },
});

const mdStyles: any = {
  body: { color: '#e8e8e8', fontSize: 14, lineHeight: 22, textAlign: 'right' },
  strong: { color: '#d4af37' },
};
