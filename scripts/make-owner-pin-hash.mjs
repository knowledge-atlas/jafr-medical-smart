#!/usr/bin/env node
// الاستخدام: node scripts/make-owner-pin-hash.mjs 482916
// يطبع قيمة EXPO_PUBLIC_OWNER_PIN_HASH (نفس خوارزمية src/services/OwnerUnlockService.ts).
import { createHash } from 'node:crypto';

const pin = process.argv[2];
if (!/^\d{6}$/.test(pin ?? '')) {
  console.error('أدخل رقماً سرياً من 6 أرقام: node scripts/make-owner-pin-hash.mjs 482916');
  process.exit(1);
}
const SALT = 'jafr-owner-v1';
const ROUNDS = 1000;
const sha = (s) => createHash('sha256').update(s).digest('hex');
let h = pin;
for (let i = 0; i < ROUNDS; i++) h = sha(`${h}:${SALT}:${pin}`);
console.log(`EXPO_PUBLIC_OWNER_PIN_HASH=${h}`);
