import { describe, it, expect, beforeEach } from 'vitest';
import * as SecureStore from 'expo-secure-store';
import {
  DEFAULT_DEV_PIN_HASH, LOCK_DURATION_MS, __configureForTests, attemptOwnerUnlock,
  getConfiguredHash, getLockRemainingSeconds, hashPin, isOwnerUnlocked, lockOwner, verifyOwnerPin,
} from '../../src/services/OwnerUnlockService';

let t = 1_000_000;
const cfg = (o: any = {}) => __configureForTests({ hash: DEFAULT_DEV_PIN_HASH, isDev: true, now: () => t, ...o });

describe('OwnerUnlockService', () => {
  beforeEach(async () => {
    t = 1_000_000;
    cfg();
    await SecureStore.deleteItemAsync('owner_unlocked_v1');
    await SecureStore.deleteItemAsync('owner_lock_state_v1');
  });

  it('الرقم الافتراضي يطابق التجزئة الثابتة', async () => {
    expect(await hashPin('123456')).toBe(DEFAULT_DEV_PIN_HASH);
  });
  it('verifyOwnerPin: صحيح/خاطئ/صيغة غير صالحة', async () => {
    expect(await verifyOwnerPin('123456')).toBe(true);
    expect(await verifyOwnerPin('654321')).toBe(false);
    expect(await verifyOwnerPin('12345')).toBe(false);
    expect(await verifyOwnerPin('abcdef')).toBe(false);
  });
  it('نجاح الإدخال يفتح الأقفال ويخزّن الحالة', async () => {
    expect(await isOwnerUnlocked()).toBe(false);
    expect((await attemptOwnerUnlock('123456')).status).toBe('success');
    expect(await isOwnerUnlocked()).toBe(true);
    await lockOwner();
    expect(await isOwnerUnlocked()).toBe(false);
  });
  it('3 محاولات خاطئة = قفل 5 دقائق ثم يعود العمل', async () => {
    expect(await attemptOwnerUnlock('000000')).toEqual({ status: 'wrong', attemptsLeft: 2 });
    expect(await attemptOwnerUnlock('000000')).toEqual({ status: 'wrong', attemptsLeft: 1 });
    expect((await attemptOwnerUnlock('000000')).status).toBe('locked');
    // حتى الرقم الصحيح مرفوض أثناء القفل
    expect((await attemptOwnerUnlock('123456')).status).toBe('locked');
    expect(await isOwnerUnlocked()).toBe(false);
    expect(await getLockRemainingSeconds()).toBe(300);
    t += LOCK_DURATION_MS + 1000;
    expect(await getLockRemainingSeconds()).toBe(0);
    expect((await attemptOwnerUnlock('123456')).status).toBe('success');
  });
  it('fail-closed: الإنتاج بلا تجزئة أو بالتجزئة الافتراضية = معطّل', async () => {
    cfg({ isDev: false, hash: undefined });
    __configureForTests({ isDev: false, hash: '', now: () => t });
    expect(getConfiguredHash()).toBeNull();
    expect((await attemptOwnerUnlock('123456')).status).toBe('disabled');
    cfg({ isDev: false, hash: DEFAULT_DEV_PIN_HASH });
    expect(getConfiguredHash()).toBeNull();
    expect((await attemptOwnerUnlock('123456')).status).toBe('disabled');
  });
  it('الإنتاج بتجزئة مخصصة يعمل', async () => {
    const custom = await hashPin('482916');
    cfg({ isDev: false, hash: custom });
    expect(await verifyOwnerPin('482916')).toBe(true);
    expect(await verifyOwnerPin('123456')).toBe(false);
  });
});
