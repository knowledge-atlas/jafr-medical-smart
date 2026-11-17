/**
 * OwnerUnlockService — فتح الميزات المدفوعة لمالك التطبيق برقم سري.
 *
 * الأمان:
 *  - لا يُحفظ الرقم السري نصاً واضحاً؛ يُقارَن فقط ناتج التجزئة (SHA-256 مملّح ومكرَّر) بـ OWNER_PIN_HASH.
 *  - لا يُرسَل الرقم إلى أي خادم؛ كل شيء محلي.
 *  - إن لم يُضبط OWNER_PIN_HASH في الإنتاج، أو بقي على قيمة الرقم الافتراضي 123456، تُعطَّل الميزة (fail-closed).
 *  - 3 محاولات خاطئة = قفل 5 دقائق (محفوظ في SecureStore فلا يُصفَّر بإعادة التشغيل).
 *
 * ملاحظة صادقة: أي قيمة تُشحن داخل التطبيق يمكن لمهاجم يفكك الـ APK محاولة كسرها دون اتصال.
 * لذلك استخدم رقماً غير تخميني، ولا تعتبر هذه الآلية حماية قوية.
 */
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

export const PIN_LENGTH = 6;
export const MAX_ATTEMPTS = 3;
export const LOCK_DURATION_MS = 5 * 60 * 1000;

const SALT = 'jafr-owner-v1';
const ROUNDS = 1000;
const UNLOCKED_KEY = 'owner_unlocked_v1';
const LOCK_STATE_KEY = 'owner_lock_state_v1';

/** تجزئة الرقم الافتراضي 123456 — للتطوير فقط، ومرفوضة في الإنتاج. */
export const DEFAULT_DEV_PIN_HASH =
  '9e86b96846dd911d1c2f4e68fd21499f2e2c98e646bbad027548e201d172280e';

const HEX64 = /^[0-9a-f]{64}$/;

type Digest = (s: string) => Promise<string>;

const defaultDigest: Digest = (s) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, s);

let overrides: { hash?: string | null; isDev?: boolean; digest?: Digest; now?: () => number } = {};

/** للاختبارات فقط. */
export function __configureForTests(o: typeof overrides) {
  overrides = o;
}

function isDev(): boolean {
  if (overrides.isDev !== undefined) return overrides.isDev;
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}

const now = () => (overrides.now ? overrides.now() : Date.now());

/** يعيد التجزئة المضبوطة، أو null إذا كانت الميزة معطّلة. */
export function getConfiguredHash(): string | null {
  const raw =
    overrides.hash !== undefined ? overrides.hash : process.env.EXPO_PUBLIC_OWNER_PIN_HASH;
  const h = (raw ?? '').trim().toLowerCase();
  if (HEX64.test(h)) {
    if (h === DEFAULT_DEV_PIN_HASH && !isDev()) return null; // رفض الرقم الافتراضي في الإنتاج
    return h;
  }
  return isDev() ? DEFAULT_DEV_PIN_HASH : null;
}

export function isOwnerPinConfigured(): boolean {
  return getConfiguredHash() !== null;
}

/** تجزئة الرقم — نفس الخوارزمية في scripts/make-owner-pin-hash.mjs */
export async function hashPin(pin: string): Promise<string> {
  const digest = overrides.digest ?? defaultDigest;
  let h = pin;
  for (let i = 0; i < ROUNDS; i++) {
    h = await digest(`${h}:${SALT}:${pin}`);
  }
  return h;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** يقارن الرقم بالتجزئة. لا يعدّ المحاولات (استخدم attemptOwnerUnlock للشاشة). */
export async function verifyOwnerPin(pin: string): Promise<boolean> {
  const expected = getConfiguredHash();
  if (!expected || !new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)) return false;
  return safeEqual(await hashPin(pin), expected);
}

export async function unlockAllPaid(): Promise<void> {
  await SecureStore.setItemAsync(UNLOCKED_KEY, 'true');
}

export async function isOwnerUnlocked(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(UNLOCKED_KEY)) === 'true';
  } catch {
    return false;
  }
}

/** إلغاء فتح المالك (يعيد الأقفال). */
export async function lockOwner(): Promise<void> {
  await SecureStore.deleteItemAsync(UNLOCKED_KEY);
}

interface LockState {
  fails: number;
  lockedUntil: number;
}

async function readLockState(): Promise<LockState> {
  try {
    const raw = await SecureStore.getItemAsync(LOCK_STATE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { fails: Number(p.fails) || 0, lockedUntil: Number(p.lockedUntil) || 0 };
    }
  } catch {}
  return { fails: 0, lockedUntil: 0 };
}

async function writeLockState(s: LockState) {
  await SecureStore.setItemAsync(LOCK_STATE_KEY, JSON.stringify(s));
}

/** الثواني المتبقية من القفل (0 = غير مقفل). */
export async function getLockRemainingSeconds(): Promise<number> {
  const s = await readLockState();
  return Math.max(0, Math.ceil((s.lockedUntil - now()) / 1000));
}

export type UnlockResult =
  | { status: 'success' }
  | { status: 'wrong'; attemptsLeft: number }
  | { status: 'locked'; remainingSeconds: number }
  | { status: 'disabled' }
  | { status: 'invalid' };

/** المسار الذي تستخدمه الشاشة: تحقق + عدّاد محاولات + قفل + فتح. */
export async function attemptOwnerUnlock(pin: string): Promise<UnlockResult> {
  if (!isOwnerPinConfigured()) return { status: 'disabled' };

  const state = await readLockState();
  const remaining = Math.ceil((state.lockedUntil - now()) / 1000);
  if (remaining > 0) return { status: 'locked', remainingSeconds: remaining };

  if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)) return { status: 'invalid' };

  // انتهى القفل السابق: ابدأ عدّاداً جديداً
  const fails = state.lockedUntil > 0 ? 0 : state.fails;

  if (await verifyOwnerPin(pin)) {
    await writeLockState({ fails: 0, lockedUntil: 0 });
    await unlockAllPaid();
    return { status: 'success' };
  }

  const nextFails = fails + 1;
  if (nextFails >= MAX_ATTEMPTS) {
    const lockedUntil = now() + LOCK_DURATION_MS;
    await writeLockState({ fails: 0, lockedUntil });
    return { status: 'locked', remainingSeconds: Math.ceil(LOCK_DURATION_MS / 1000) };
  }
  await writeLockState({ fails: nextFails, lockedUntil: 0 });
  return { status: 'wrong', attemptsLeft: MAX_ATTEMPTS - nextFails };
}
