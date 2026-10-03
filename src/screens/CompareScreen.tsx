import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { CompatibilityEngine } from '../products/CompatibilityEngine';
import { analyzeName } from '../application/di';

export default function CompareScreen({ route }: any) {
  const [nameA, setNameA] = useState(route.params?.nameA ?? '');
  const [nameB, setNameB] = useState(route.params?.nameB ?? '');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const compare = () => {
    if (!nameA.trim() || !nameB.trim()) {
      Alert.alert('تنبيه', 'أدخل الاسمين للمقارنة');
      return;
    }
    setLoading(true);
    try {
      const a = analyzeName.execute({ name: nameA.trim() });
      const b = analyzeName.execute({ name: nameB.trim() });
      if (a.status === 'abstained' || b.status === 'abstained') {
        Alert.alert('تنبيه', 'أحد الأسماء لم يُحلَّل — تأكد أنهما بالعربية');
        setLoading(false);
        return;
      }
      const engine = new CompatibilityEngine();
      const out = engine.analyzeDeep(a, b);
      setResult(out);
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل التحليل');
    } finally {
      setLoading(false);
    }
  };

  const swap = () => {
    const tmp = nameA;
    setNameA(nameB);
    setNameB(tmp);
    setResult(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>💞 محرك التوافق المتقدم</Text>
        <Text style={styles.heroText}>8 أبعاد + رنين حقيقي من نصوص البوني</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={nameA}
            onChangeText={setNameA}
            placeholder="الاسم الأول"
            placeholderTextColor="#666"
            textAlign="right"
          />
          <TouchableOpacity style={styles.swapBtn} onPress={swap}>
            <Text style={styles.swapText}>⇅</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={nameB}
            onChangeText={setNameB}
            placeholder="الاسم الثاني"
            placeholderTextColor="#666"
            textAlign="right"
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={compare}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>🔍 قارن</Text>
          )}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultBox}>
          <Markdown style={mdStyles}>{result.markdown}</Markdown>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#0a1628', flexGrow: 1 },
  hero: {
    alignItems: 'center', padding: 18, backgroundColor: '#1a3b5d',
    borderRadius: 12, marginBottom: 16,
  },
  heroTitle: { color: '#d4af37', fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  heroText: { color: '#c0c0c0', fontSize: 13 },
  form: { backgroundColor: '#1a3b5d', padding: 16, borderRadius: 12, marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  input: {
    flex: 1, color: '#fff', fontSize: 15, padding: 12,
    backgroundColor: '#0a1628', borderRadius: 8,
  },
  swapBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#d4af37', justifyContent: 'center', alignItems: 'center',
  },
  swapText: { color: '#0a1628', fontSize: 20, fontWeight: 'bold' },
  btn: {
    backgroundColor: '#3498db', padding: 14, borderRadius: 10, alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultBox: { backgroundColor: '#1a3b5d', padding: 14, borderRadius: 12 },
});

const mdStyles: any = {
  body: { color: '#e8e8e8', fontSize: 14, lineHeight: 23, textAlign: 'right' },
  heading1: { color: '#d4af37', fontSize: 20, fontWeight: 'bold', marginTop: 12, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#d4af37', paddingBottom: 6 },
  heading2: { color: '#d4af37', fontSize: 17, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  heading3: { color: '#f0e0a0', fontSize: 15, fontWeight: 'bold', marginTop: 10, marginBottom: 6 },
  strong: { color: '#d4af37' },
  bullet_list: { marginLeft: 8 },
  list_item: { textAlign: 'right', marginBottom: 4 },
  blockquote: {
    borderLeftWidth: 3, borderLeftColor: '#d4af37',
    paddingLeft: 10, backgroundColor: '#0a1628',
    paddingVertical: 8, paddingRight: 8, marginVertical: 8,
  },
  hr: { backgroundColor: '#2c5070', height: 1, marginVertical: 14 },
};
