import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ReportScreen({ route, navigation }: any) {
  const { report } = route.params;
  const [saved, setSaved] = useState(false);

  const saveReport = async () => {
    try {
      const existing = await AsyncStorage.getItem('reports');
      const reports = existing ? JSON.parse(existing) : [];
      const newReport = {
        id: Date.now(),
        entity: report.entity,
        date: new Date().toLocaleString(),
        summary: report.fullReport.substring(0, 200) + '...',
        full: report.fullReport
      };
      reports.push(newReport);
      await AsyncStorage.setItem('reports', JSON.stringify(reports));
      setSaved(true);
      Alert.alert('✅ تم الحفظ', 'تم حفظ التقرير في سجلك الشخصي.');
    } catch (error) {
      Alert.alert('❌ خطأ', 'حدث خطأ أثناء حفظ التقرير.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>📜 التقرير الكامل</Text>
      <View style={styles.card}>
        <Text style={styles.label}>👤 الاسم</Text>
        <Text style={styles.value}>{report.entity}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>🧬 الجذر</Text>
        <Text style={styles.value}>{report.root} - {report.rootTitle}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>🪐 الكوكب</Text>
        <Text style={styles.value}>{report.planet}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>♈ البرج</Text>
        <Text style={styles.value}>{report.sign}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>🔥 الطبع</Text>
        <Text style={styles.value}>{report.element}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>🏠 البيت</Text>
        <Text style={styles.value}>{report.house}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>📊 الميزان العددي</Text>
        <Text style={styles.value}>المجموع: {report.calculation.total}</Text>
        <Text style={styles.value}>الجذر الرقمي: {report.calculation.digitalRoot}</Text>
        <Text style={styles.value}>البواقي: 9={report.calculation.remainders.on9}, 7={report.calculation.remainders.on7}, 12={report.calculation.remainders.on12}</Text>
      </View>

      {report.compounds && report.compounds.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.label}>🔹 التراكيب المستخلصة</Text>
          {report.compounds.map((c: string, i: number) => (
            <Text key={i} style={styles.bullet}>• {c}</Text>
          ))}
        </View>
      )}
      {report.wafq && (
        <View style={styles.card}>
          <Text style={styles.label}>🔢 الوفق العددي</Text>
          <Text style={styles.wafq}>{report.wafq}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>📝 التقرير النصي الكامل</Text>
        <Text style={styles.fullText}>{report.fullReport}</Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveReport}>
        <Text style={styles.buttonText}>{saved ? '✅ محفوظ' : '💾 حفظ التقرير'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>🔙 العودة</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f0f4f8' },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#1a3b5d' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
  value: { fontSize: 16, color: '#34495e', marginBottom: 3 },
  bullet: { fontSize: 14, color: '#2c3e50', marginLeft: 10, marginBottom: 2 },
  wafq: { fontSize: 18, fontFamily: 'monospace', textAlign: 'center', backgroundColor: '#ecf0f1', padding: 10, borderRadius: 8 },
  fullText: { fontSize: 14, lineHeight: 22, color: '#2c3e50', textAlign: 'justify' },
  saveButton: { backgroundColor: '#27ae60', padding: 15, borderRadius: 10, marginTop: 10 },
  backButton: { backgroundColor: '#3498db', padding: 15, borderRadius: 10, marginTop: 10 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }
});
