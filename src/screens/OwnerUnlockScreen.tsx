import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  PIN_LENGTH,
  attemptOwnerUnlock,
  getLockRemainingSeconds,
  isOwnerPinConfigured,
  lockOwner,
} from '../services/OwnerUnlockService';
import { usePremium } from '../context/PremiumContext';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function OwnerUnlockScreen({ navigation }: any) {
  const { ownerUnlocked, refresh } = usePremium();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [lockSeconds, setLockSeconds] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const configured = isOwnerPinConfigured();

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const startCountdown = useCallback((seconds: number) => {
    stopTimer();
    setLockSeconds(seconds);
    timer.current = setInterval(() => {
      setLockSeconds((s) => {
        if (s <= 1) {
          stopTimer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    getLockRemainingSeconds().then((s) => s > 0 && startCountdown(s));
    return stopTimer;
  }, [startCountdown]);

  const press = (k: string) => {
    if (busy || lockSeconds > 0 || ownerUnlocked) return;
    setMessage(null);
    if (k === '⌫') return setPin((p) => p.slice(0, -1));
    if (k === '') return;
    setPin((p) => (p.length < PIN_LENGTH ? p + k : p));
  };

  const submit = async () => {
    if (pin.length !== PIN_LENGTH || busy) return;
    setBusy(true);
    try {
      const r = await attemptOwnerUnlock(pin);
      setPin('');
      if (r.status === 'success') {
        await refresh();
        setMessage({ ok: true, text: 'تم فتح جميع الأقفال للمالك' });
      } else if (r.status === 'locked') {
        startCountdown(r.remainingSeconds);
        setMessage({ ok: false, text: 'محاولات كثيرة خاطئة. تم القفل لمدة 5 دقائق.' });
      } else if (r.status === 'wrong') {
        setMessage({ ok: false, text: `الرقم السري غير صحيح. المحاولات المتبقية: ${r.attemptsLeft}` });
      } else if (r.status === 'disabled') {
        setMessage({ ok: false, text: 'فتح المالك غير مفعّل في هذه النسخة.' });
      } else {
        setMessage({ ok: false, text: `أدخل ${PIN_LENGTH} أرقام.` });
      }
    } finally {
      setBusy(false);
    }
  };

  const revoke = async () => {
    await lockOwner();
    await refresh();
    setMessage({ ok: true, text: 'أُعيدت الأقفال المدفوعة.' });
  };

  const disabled = !configured || lockSeconds > 0 || ownerUnlocked;

  return (
    <View style={styles.container}>
      <Ionicons
        name={ownerUnlocked ? 'lock-open-outline' : 'lock-closed-outline'}
        size={56}
        color="#d4af37"
      />
      <Text style={styles.title}>فتح المالك</Text>

      {ownerUnlocked ? (
        <>
          <Text style={[styles.msg, { color: '#2ecc71' }]}>تم فتح جميع الأقفال للمالك</Text>
          <TouchableOpacity style={styles.ghostBtn} onPress={revoke} accessibilityRole="button">
            <Text style={styles.ghostText}>إعادة الأقفال</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mainBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.mainBtnText}>رجوع</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.sub}>أدخل الرقم السري ({PIN_LENGTH} أرقام)</Text>

          <View style={styles.dots} accessibilityLabel={`تم إدخال ${pin.length} من ${PIN_LENGTH}`}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
            ))}
          </View>

          {lockSeconds > 0 && (
            <Text style={[styles.msg, { color: '#e74c3c' }]}>مقفل — حاول بعد {fmt(lockSeconds)}</Text>
          )}
          {message && lockSeconds === 0 && (
            <Text style={[styles.msg, { color: message.ok ? '#2ecc71' : '#e74c3c' }]}>{message.text}</Text>
          )}
          {!configured && (
            <Text style={[styles.msg, { color: '#e74c3c' }]}>فتح المالك غير مفعّل في هذه النسخة.</Text>
          )}

          <View style={styles.pad}>
            {KEYS.map((k, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.key, k === '' && { opacity: 0 }]}
                onPress={() => press(k)}
                disabled={disabled || k === ''}
                accessibilityRole="button"
                accessibilityLabel={k === '⌫' ? 'حذف' : k || undefined}
              >
                <Text style={styles.keyText}>{k}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.mainBtn, (disabled || pin.length !== PIN_LENGTH) && { opacity: 0.5 }]}
            onPress={submit}
            disabled={disabled || pin.length !== PIN_LENGTH || busy}
            accessibilityRole="button"
          >
            {busy ? <ActivityIndicator color="#0a192f" /> : <Text style={styles.mainBtnText}>فتح الأقفال المدفوعة</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a192f', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#d4af37', fontSize: 22, fontWeight: 'bold', marginTop: 10, writingDirection: 'rtl' },
  sub: { color: '#b9c4d2', fontSize: 14, marginTop: 6, marginBottom: 18, writingDirection: 'rtl' },
  dots: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#d4af37' },
  dotFilled: { backgroundColor: '#d4af37' },
  msg: { fontSize: 14, textAlign: 'center', writingDirection: 'rtl', marginVertical: 8, lineHeight: 22 },
  pad: { flexDirection: 'row', flexWrap: 'wrap', width: 264, justifyContent: 'space-between', marginVertical: 12 },
  key: { width: 80, height: 60, borderRadius: 12, backgroundColor: '#1a3b5d', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  keyText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  mainBtn: { backgroundColor: '#d4af37', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 10, minHeight: 48, minWidth: 220, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  mainBtnText: { color: '#0a192f', fontSize: 16, fontWeight: 'bold', writingDirection: 'rtl' },
  ghostBtn: { borderWidth: 1, borderColor: '#2c5070', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10, marginTop: 12 },
  ghostText: { color: '#d4af37', fontWeight: 'bold', writingDirection: 'rtl' },
});
