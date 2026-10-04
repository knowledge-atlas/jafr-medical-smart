import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultConsentStorage, CONSENT_KEY } from '../../src/utils/consentStorage';

describe('DefaultConsentStorage', () => {
  let storage: DefaultConsentStorage;

  beforeEach(async () => {
    storage = new DefaultConsentStorage();
    await storage.reset();
  });

  it('get بدون موافقة سابقة → null', async () => {
    const result = await storage.get();
    expect(result).toBeNull();
  });

  it('accept يحفظ "accepted"', async () => {
    await storage.accept();
    const result = await storage.get();
    expect(result).toBe('accepted');
  });

  it('decline يحفظ "declined"', async () => {
    await storage.decline();
    const result = await storage.get();
    expect(result).toBe('declined');
  });

  it('reset يمسح الموافقة', async () => {
    await storage.accept();
    await storage.reset();
    const result = await storage.get();
    expect(result).toBeNull();
  });

  it('accept ثم decline → آخر قيمة هي الفائزة', async () => {
    await storage.accept();
    await storage.decline();
    const result = await storage.get();
    expect(result).toBe('declined');
  });
});
