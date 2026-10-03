import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { CompatibilityEngine } from '../products/CompatibilityEngine';
import { analyzeName } from '../application/di';

export default function CompatibilityScreen({ route, navigation }: any) {
  const initialName = route.params?.name ?? '';
  const [nameB, setNameB] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const compare = () => {
    if (!initialName.trim()) {
      Alert.alert('تنبيه', 'الاسم الأول مفقود. اعد من الرئيسية.');
      return;
    }
    if (!nameB.trim()) {
      Alert.alert('تنبيه', 'أدخل الاسم الثاني.');
      return;
    }
    setLoading(true);
    try {
      const a = analyzeName.execute({ name: initialName });
      const b = analyzeName.execute({ name: nameB });
      const engine = new CompatibilityEngine();
      const out = engine.analyzeDeep(a, b);
      setResult(out);
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل التحليل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>💞 محرك التوافق العميق</Text>
        <Text style={styles.heroText}>8 أبعاد + رنين حقيقي من نصوص البوني</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>الاسم الأول (من الرئيسية):</Text>
        <Text style={styles.nameBox}>{initialName || '—'}</Text>

        <Text style={styles.label}>الاسم الثاني:</Text>
        <TextInput
          style={styles.input}
          value={nameB}
          onChangeText={setNameB}
          placeholder="مثال: فاطمة"
          placeholderTextColor="#666"
          textAlign="right"
        />

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={compare}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>قارن</Text>}
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
  hero: { alignItems: 'center', padding: 16, backgroundColor: '#1a3b5d', borderRadius: 12, marginBottom: 16 },
  heroTitle: { color: '#d4af37', fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  heroText: { color: '#c0c0c0', fontSize: 13 },
  form: { backgroundColor: '#1a3b5d', padding: 16, borderRadius: 12, marginBottom: 16 },
  label: { color: '#d4af37', fontSize: 14, marginBottom: 6 },
  nameBox: { color: '#fff', fontSize: 16, padding: 10, backgroundColor: '#0a1628', borderRadius: 8, marginBottom: 12, textAlign: 'right' },
  input: { color: '#fff', fontSize: 16, padding: 12, backgroundColor: '#0a1628', borderRadius: 8, marginBottom: 12 },
  btn: { backgroundColor: '#3498db', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultBox: { backgroundColor: '#1a3b5d', padding: 14, borderRadius: 12 },
});

const mdStyles: any = {
  body: { color: '#e8e8e8', fontSize: 14, lineHeight: 22, textAlign: 'right' },
  heading1: { color: '#d4af37', fontSize: 20, fontWeight: 'bold', marginTop: 10, marginBottom: 10 },
  heading2: { color: '#d4af37', fontSize: 17, fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
  heading3: { color: '#f0e0a0', fontSize: 15, fontWeight: 'bold', marginTop: 10, marginBottom: 6 },
  strong: { color: '#d4af37' },
  bullet_list: { marginLeft: 8 },
  list_item: { textAlign: 'right' },
  blockquote: { borderLeftWidth: 3, borderLeftColor: '#d4af37', paddingLeft: 10, backgroundColor: '#0a1628', paddingVertical: 6, paddingRight: 8, marginVertical: 6 },
  code_inline: { backgroundColor: '#0a1628', color: '#f39c12', paddingHorizontal: 4 },
};
