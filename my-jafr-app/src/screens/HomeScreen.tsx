import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildReport } from '../engine/reportBuilder';

const commonSymptoms = ['تشتت', 'جمود', 'استنزاف', 'غضب', 'خوف', 'تردد', 'قسوة', 'عزلة', 'مبالغة', 'اندفاع'];

export default function HomeScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>([]);

  useEffect(() => {
    loadSavedReports();
  }, []);

  const loadSavedReports = async () => {
    try {
      const data = await AsyncStorage.getItem('reports');
      if (data) setSavedReports(JSON.parse(data));
    } catch (error) {}
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleAnalyze = () => {
    if (!name.trim()) {
      Alert.alert('⚠️ تنبيه', 'الرجاء إدخال اسم للتحليل.');
      return;
    }
    const result = buildReport(name, selectedSymptoms);
    if (result.error) {
      Alert.alert('❌ خطأ', result.error);
      return;
    }
    navigation.navigate('Report', { report: result });
  };

  const goToHistory = () => {
    navigation.navigate('History', { reports: savedReports });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔮 المحرك الوجودي الجفري</Text>
      <Text style={styles.subtitle}>أدخل اسمك لتحليل شخصيتك الجفرية-النفسية</Text>

      <Text style={styles.label}>👤 الاسم (بالعربية):</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="مثال: محمد"
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>🤔 الأعراض (اختر ما يناسبك):</Text>
      <View style={styles.symptomsContainer}>
        {commonSymptoms.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.symptomButton, selectedSymptoms.includes(s) && styles.symptomSelected]}
            onPress={() => toggleSymptom(s)}
          >
            <Text style={[styles.symptomText, selectedSymptoms.includes(s) && styles.symptomTextSelected]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
        <Text style={styles.buttonText}>🔍 تحليل</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.historyButton} onPress={goToHistory}>
        <Text style={styles.buttonText}>📂 سجل التقارير ({savedReports.length})</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>© 2025 - المحرك الوجودي الجفري v2.1</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#f0f4f8' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#1a3b5d', marginTop: 20 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#34495e', marginBottom: 30 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#bdc3c7', borderRadius: 10, padding: 12, marginTop: 5, backgroundColor: '#fff', fontSize: 16 },
  symptomsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  symptomButton: { backgroundColor: '#ecf0f1', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 15, margin: 5 },
  symptomSelected: { backgroundColor: '#3498db' },
  symptomText: { color: '#2c3e50' },
  symptomTextSelected: { color: '#fff' },
  analyzeButton: { backgroundColor: '#27ae60', padding: 15, borderRadius: 10, marginTop: 20 },
  historyButton: { backgroundColor: '#8e44ad', padding: 15, borderRadius: 10, marginTop: 10 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 18 },
  footer: { textAlign: 'center', marginTop: 30, color: '#7f8c8d' }
});
