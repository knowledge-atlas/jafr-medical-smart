import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, TouchableOpacity, Share, Modal } from 'react-native';
import { buildReport } from '../engine/reportBuilder';

export default function AnalysisScreen() {
  const [name, setName] = useState('');
  const [report, setReport] = useState<any>(null);
  const [modalContent, setModalContent] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const handleAnalyze = () => {
    if (!name.trim()) return;
    const result = buildReport(name);
    setReport(result);
  };

  const openModal = (content: string) => {
    setModalContent(content);
    setModalVisible(true);
  };

  const exportReport = async () => {
    if (!report) return;
    await Share.share({ message: report.fullReport, title: 'التقرير الكامل' });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>المحرك الوجودي الجفري</Text>
      <TextInput style={styles.input} placeholder="أدخل الاسم" value={name} onChangeText={setName} />
      <Button title="تحليل" onPress={handleAnalyze} />
      {report && (
        <View style={{ marginTop: 20 }}>
          <TouchableOpacity onPress={exportReport} style={styles.exportButton}>
            <Text style={styles.exportText}>تصدير التقرير</Text>
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>ملخص سريع</Text>
          <Text>الجذر: {report.root} - {report.rootText?.split('\n')[0]}</Text>
          <Text>الكوكب: {report.planet}</Text>
          <Text>البرج: {report.sign}</Text>
          <Text>الطبع: {report.element}</Text>
          <Text>البيت: {report.house}</Text>
          <TouchableOpacity onPress={() => openModal(report.fullReport)} style={styles.detailsButton}>
            <Text style={styles.detailsText}>عرض التقرير الكامل</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, padding: 20 }}>
          <ScrollView>
            <Text style={{ fontSize: 14, lineHeight: 24 }}>{modalContent}</Text>
          </ScrollView>
          <Button title="إغلاق" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 18 },
  exportButton: { backgroundColor: '#27ae60', padding: 10, borderRadius: 6, marginTop: 10 },
  exportText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  detailsButton: { backgroundColor: '#2980b9', padding: 10, borderRadius: 6, marginTop: 10 },
  detailsText: { color: '#fff', textAlign: 'center' },
});
