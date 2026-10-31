import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { llmBridge } from '../ai';

export default function SettingsScreen({ navigation }: any) {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
  
  const handleSaveKey = async () => {
    if (!apiKey) return;
    try {
      await llmBridge.saveApiKey(provider, apiKey);
      Alert.alert('تم الحفظ', 'تم حفظ المفتاح بنجاح');
      setApiKey('');
    } catch (e) {
      Alert.alert('خطأ', 'تعذر حفظ المفتاح');
    }
  };

  const handleClearData = async () => {
    Alert.alert(
      'تأكيد',
      'هل أنت متأكد من حذف البيانات؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: async () => {
            Alert.alert('تم', 'تم الحذف');
        }}
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>إعدادات الذكاء الاصطناعي</Text>
        <Text style={styles.label}>مزود الخدمة:</Text>
        <View style={styles.row}>
          {(['gemini', 'openai'] as const).map((p) => (
            <TouchableOpacity 
              key={p}
              style={[styles.providerBtn, provider === p && styles.providerActive]}
              onPress={() => setProvider(p)}
            >
              <Text style={[styles.providerText, provider === p && styles.providerTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>مفتاح API:</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="أدخل المفتاح هنا..."
          placeholderTextColor="#666"
          secureTextEntry
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveKey}>
          <Text style={styles.saveBtnText}>حفظ المفتاح</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>إدارة البيانات</Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData}>
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          <Text style={styles.dangerText}>حذف جميع البيانات</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a192f' },
  content: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#0f2438', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1a3b5d' },
  cardTitle: { color: '#d4af37', fontSize: 18, fontWeight: 'bold', textAlign: 'right', writingDirection: 'rtl', marginBottom: 16 },
  label: { color: '#e8e8e8', fontSize: 14, textAlign: 'right', writingDirection: 'rtl', marginBottom: 8, marginTop: 8 },
  row: { flexDirection: 'row-reverse', gap: 8, marginBottom: 16 },
  providerBtn: { flex: 1, padding: 10, backgroundColor: '#1a3b5d', borderRadius: 8, alignItems: 'center' },
  providerActive: { backgroundColor: '#d4af37' },
  providerText: { color: '#e8e8e8', fontWeight: 'bold' },
  providerTextActive: { color: '#0a192f' },
  input: { backgroundColor: '#0a192f', color: '#fff', padding: 12, borderRadius: 8, textAlign: 'right', writingDirection: 'rtl', borderWidth: 1, borderColor: '#2c5070', marginBottom: 12 },
  saveBtn: { backgroundColor: '#d4af37', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#0a192f', fontWeight: 'bold', fontSize: 16 },
  dangerBtn: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#2c1a1a', borderRadius: 8 },
  dangerText: { color: '#e74c3c', fontWeight: 'bold', fontSize: 14 },
});
