import React, { useState, useEffect } from 'react';
import { remedyStorage, RemedyEntry } from '../utils/remedyStorage';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { RemedyTracker, Remedy, RemedyLogEntry } from '../products/RemedyTracker';

export default function RemedyScreen({ route }: any) {
  const name = route.params?.name ?? 'المستخدم';
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [logs, setLogs] = useState<RemedyLogEntry[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [report, setReport] = useState<any>(null);

  const tracker = new RemedyTracker();

  const addRemedy = () => {
    if (!title.trim()) {
      Alert.alert('تنبيه', 'اكتب عنوان التوصية');
      return;
    }
    const updated = tracker.addRemedy(remedies, title.trim(), description.trim() || 'توصية شخصية');
    setRemedies(updated);
    setTitle('');
    setDescription('');
    Alert.alert('✅', 'تمت إضافة التوصية');
  };

  const markToday = (remedyId: string) => {
    const updated = tracker.log(logs, remedyId, true, new Date());
    setLogs(updated);
    Alert.alert('✅', 'تم تسجيل الالتزام اليوم');
  };

  const generateReport = () => {
    const out = tracker.generateReport(name, remedies, logs);
    setReport(out);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>✅ متتبع الالتزام</Text>
        <Text style={styles.heroText}>{name}</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>عنوان التوصية:</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="مثال: التأمل اليومي"
          placeholderTextColor="#666"
          textAlign="right"
        />
        <Text style={styles.label}>الوصف:</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="10 دقائق صباحاً"
          placeholderTextColor="#666"
          textAlign="right"
        />
        <TouchableOpacity style={styles.btn} onPress={addRemedy}>
          <Text style={styles.btnText}>➕ إضافة توصية</Text>
        </TouchableOpacity>
      </View>

      {remedies.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 توصياتك ({remedies.length})</Text>
          {remedies.map((r) => (
            <View key={r.id} style={styles.remedyCard}>
              <Text style={styles.remedyTitle}>{r.title}</Text>
              <Text style={styles.remedyDesc}>{r.description}</Text>
              <TouchableOpacity style={styles.markBtn} onPress={() => markToday(r.id)}>
                <Text style={styles.markBtnText}>✓ التزمت اليوم</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={generateReport}>
            <Text style={styles.btnText}>📊 تقرير الالتزام</Text>
          </TouchableOpacity>
        </View>
      )}

      {report && (
        <View style={styles.resultBox}>
          <Markdown style={mdStyles}>{report.markdown}</Markdown>
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
  input: { color: '#fff', fontSize: 15, padding: 12, backgroundColor: '#0a1628', borderRadius: 8, marginBottom: 12 },
  btn: { backgroundColor: '#27ae60', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnSecondary: { backgroundColor: '#3498db', marginTop: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  section: { marginBottom: 16 },
  sectionTitle: { color: '#d4af37', fontSize: 17, fontWeight: 'bold', marginBottom: 10, textAlign: 'right' },
  remedyCard: { backgroundColor: '#1a3b5d', padding: 14, borderRadius: 10, marginBottom: 10 },
  remedyTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' },
  remedyDesc: { color: '#b0b8c0', fontSize: 13, marginBottom: 10, textAlign: 'right' },
  markBtn: { backgroundColor: '#27ae60', padding: 10, borderRadius: 8, alignItems: 'center' },
  markBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  resultBox: { backgroundColor: '#1a3b5d', padding: 14, borderRadius: 12 },
});

const mdStyles: any = {
  body: { color: '#e8e8e8', fontSize: 14, lineHeight: 22, textAlign: 'right' },
  heading1: { color: '#d4af37', fontSize: 20, fontWeight: 'bold' },
  heading2: { color: '#d4af37', fontSize: 17, fontWeight: 'bold', marginTop: 10, marginBottom: 8 },
  heading3: { color: '#f0e0a0', fontSize: 15, fontWeight: 'bold', marginTop: 10, marginBottom: 6 },
  strong: { color: '#d4af37' },
  list_item: { textAlign: 'right' },
};
