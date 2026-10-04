import AsyncStorage from '@react-native-async-storage/async-storage';

export const CONSENT_KEY = '@knowledgeatlas/consent_v1';

export type ConsentState = 'accepted' | 'declined' | null;

export interface ConsentStorage {
  get: () => Promise<ConsentState>;
  accept: () => Promise<void>;
  decline: () => Promise<void>;
  reset: () => Promise<void>;
}

export class DefaultConsentStorage implements ConsentStorage {
  async get(): Promise<ConsentState> {
    try {
      const v = await AsyncStorage.getItem(CONSENT_KEY);
      if (v === 'accepted' || v === 'declined') return v;
      return null;
    } catch {
      return null;
    }
  }

  async accept(): Promise<void> {
    try {
      await AsyncStorage.setItem(CONSENT_KEY, 'accepted');
    } catch {
      // silent
    }
  }

  async decline(): Promise<void> {
    try {
      await AsyncStorage.setItem(CONSENT_KEY, 'declined');
    } catch {
      // silent
    }
  }

  async reset(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CONSENT_KEY);
    } catch {
      // silent
    }
  }
}

export const consentStorage: ConsentStorage = new DefaultConsentStorage();
