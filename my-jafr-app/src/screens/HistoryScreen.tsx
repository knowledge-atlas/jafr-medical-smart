import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryScreen({ navigation }: any) {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
    const unsubscribe = navigation.addListener('focus', loadReports);
    return unsubscribe;
  }, [navigation]);

  const loadReports = async () => {
    try {
      const data = await AsyncStorage.getItem('reports');
      if (data) setReports(JSON.parse(data));
    } catch (error) {}
  };

  const clearHistory = async () => {
    Alert.alert('⚠️ تأكيد', 'هل أنت متأكد من حذف جميع التقارير؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('reports');
          setReports([]);
        }}
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>📂 سجل التقارير</Text>
      {reports.length === 0 ? (
        <Text style={styles.empty}>لا توجد تقارير محفوظة بعد.</Text>
      ) : (
        reports.map((r, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.name}>👤 {r.entity}</Text>
            <Text style={styles.date}>📅 {r.date}</Text>
            <Text style={styles.summary}>{r.summary}</Text>
            <TouchableOpacity style={styles.viewButton} onPress={() => {
              navigation.navigate('Report', { report: { ...r, fullReport: r.full } });
            }}>
              <Text style={styles.buttonText}>عرض التفاصيل</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
      {reports.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
          <Text style={styles.buttonText}>🗑️ مسح السجل</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f0f4f8' },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#1a3b5d' },
  empty: { textAlign: 'center', fontSize: 16, color: '#7f8c8d', marginTop: 50 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  date: { fontSize: 14, color: '#7f8c8d', marginBottom: 5 },
  summary: { fontSize: 14, color: '#34495e' },
  viewButton: { backgroundColor: '#3498db', padding: 10, borderRadius: 8, marginTop: 10, alignSelf: 'flex-start' },
  clearButton: { backgroundColor: '#e74c3c', padding: 15, borderRadius: 10, marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' }
});
