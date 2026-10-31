import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Crypto from 'expo-crypto';
import { setPremiumStatus } from '../storage/premiumStorage';
import { DEV_ACCESS_HASH } from './devAccess';

export const DevAccessModal = ({ visible, onClose }: any) => {
  const [code, setCode] = useState('');

  const handleVerify = async () => {
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, code);
    if (hash === DEV_ACCESS_HASH) {
      await setPremiumStatus(true);
      Alert.alert('تم التفعيل', 'تم فتح جميع التقارير بنجاح.');
      onClose();
    } else {
      Alert.alert('خطأ', 'الرقم السري غير صحيح.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>وضع المطور</Text>
          <Text style={styles.subtitle}>أدخل الرقم السري لفتح التقارير</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            secureTextEntry
            placeholder="******"
            placeholderTextColor="#666"
          />
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleVerify}>
              <Text style={styles.confirmText}>تأكيد</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '80%', backgroundColor: '#0f2438', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#2c5070' },
  title: { color: '#d4af37', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { color: '#e8e8e8', fontSize: 14, textAlign: 'center', marginBottom: 15 },
  input: { backgroundColor: '#0a192f', color: '#fff', padding: 12, borderRadius: 8, textAlign: 'center', fontSize: 18, borderWidth: 1, borderColor: '#2c5070', marginBottom: 20 },
  btnRow: { flexDirection: 'row-reverse', gap: 10 },
  cancelBtn: { flex: 1, padding: 12, backgroundColor: '#1a3b5d', borderRadius: 8, alignItems: 'center' },
  cancelText: { color: '#fff', fontWeight: 'bold' },
  confirmBtn: { flex: 1, padding: 12, backgroundColor: '#d4af37', borderRadius: 8, alignItems: 'center' },
  confirmText: { color: '#0a192f', fontWeight: 'bold' },
});
