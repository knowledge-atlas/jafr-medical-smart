import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePremium } from '../context/PremiumContext';

export default function SearchScreen({ navigation }: any) {
  const { isPremium } = usePremium();

  // 1. إذا لم يكن مشتركاً، نظهر شاشة القفل
  if (!isPremium) {
    return (
      <View style={styles.lockContainer}>
        <Ionicons name="lock-closed" size={80} color="#d4af37" />
        <Text style={styles.lockTitle}>المكتبة مقفلة 🔒</Text>
        <Text style={styles.lockText}>
          مكتبة الجفر تحتوي على مئات الكيانات والعلاقات.{"\n"}
          للوصول إلى المعرفة الكاملة، يرجى تفعيل العضوية.
        </Text>
        <TouchableOpacity 
          style={styles.upgradeBtn}
          onPress={() => Alert.alert('الاشتراك', 'سيتم توجيهك لبوابة الدفع قريباً.')}
        >
          <Text style={styles.upgradeText}>اشترك الآن</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. إذا كان مشتركاً، يعرض المكتبة الطبيعية
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>المكتبة الشاملة</Text>
      <TextInput 
        style={styles.input} 
        placeholder="ابحث عن جذر، كوكب، برج..." 
        placeholderTextColor="#666"
      />
      {/* هنا محتوى المكتبة الفعلي */}
      <Text style={styles.placeholderText}>جميع الكيانات والعلاقات متاحة الآن.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lockContainer: { flex: 1, backgroundColor: '#0a192f', justifyContent: 'center', alignItems: 'center', padding: 20 },
  lockTitle: { color: '#d4af37', fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  lockText: { color: '#e8e8e8', fontSize: 16, textAlign: 'center', lineHeight: 26, marginBottom: 30 },
  upgradeBtn: { backgroundColor: '#d4af37', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25 },
  upgradeText: { color: '#0a192f', fontSize: 18, fontWeight: 'bold' },
  
  container: { flex: 1, backgroundColor: '#0a192f' },
  content: { padding: 20 },
  title: { color: '#d4af37', fontSize: 24, fontWeight: 'bold', textAlign: 'right', writingDirection: 'rtl', marginBottom: 20 },
  input: { backgroundColor: '#0f2438', color: '#fff', padding: 15, borderRadius: 10, textAlign: 'right', writingDirection: 'rtl', marginBottom: 20, borderWidth: 1, borderColor: '#2c5070' },
  placeholderText: { color: '#e8e8e8', textAlign: 'center' },
});
