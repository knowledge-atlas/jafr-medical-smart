import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import { setPremiumStatus } from '../storage/premiumStorage';
import { DEV_ACCESS_HASH } from '../utils/devAccess';

export const DevCodeModal = ({ visible, onClose }: any) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        code.trim()
      );
      if (hash === DEV_ACCESS_HASH) {
        await setPremiumStatus(true);
        Alert.alert('✅ تم التفعيل', 'تم فتح جميع التقارير. يرجى إغلاق التطبيق وفتحه مرة أخرى.');
        setCode('');
        onClose();
      } else {
        Alert.alert('❌ خطأ', 'الرقم السري غير صحيح.');
      }
    } catch {
      Alert.alert('خطأ', 'حدث خطأ في التحقق.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>🔐 وضع المطور</Text>
          <Text style={styles.subtitle}>أدخل الرقم السري لفتح جميع التقارير</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry
            autoFocus
            autoCapitalize="none"
          />
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleVerify} disabled={loading}>
              <Text style={styles.confirmText}>{loading ? 'جاري التحقق...' : 'تأكيد'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '85%', backgroundColor: '#0f2438', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#2c5070' },
  title: { color: '#d4af37', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { color: '#e8e8e8', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: '#0a192f', color: '#fff', padding: 14, borderRadius: 10, textAlign: 'center', fontSize: 18, borderWidth: 1, borderColor: '#2c5070', marginBottom: 20, letterSpacing: 2 },
  btnRow: { flexDirection: 'row-reverse', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, backgroundColor: '#1a3b5d', borderRadius: 10, alignItems: 'center' },
  cancelText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  confirmBtn: { flex: 1, padding: 14, backgroundColor: '#d4af37', borderRadius: 10, alignItems: 'center' },
  confirmText: { color: '#0a192f', fontWeight: 'bold', fontSize: 16 },
});
