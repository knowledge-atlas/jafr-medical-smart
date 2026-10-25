import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'free_trial_v1';
const MAX_FREE_ANALYSES = 3;

export interface FreeTrialState {
  analysesUsed: number;
  firstAnalysisAt: string | null;
  lastAnalysisAt: string | null;
}

const EMPTY: FreeTrialState = {
  analysesUsed: 0,
  firstAnalysisAt: null,
  lastAnalysisAt: null,
};

class FreeTrial {
  private cache: FreeTrialState | null = null;

  async getState(): Promise<FreeTrialState> {
    if (this.cache !== null) return this.cache;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      this.cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
    } catch {
      this.cache = { ...EMPTY };
    }
    return this.cache as FreeTrialState;
  }

  async canAnalyze(): Promise<boolean> {
    const s = await this.getState();
    return s.analysesUsed < MAX_FREE_ANALYSES;
  }

  async recordAnalysis(): Promise<FreeTrialState> {
    const s = await this.getState();
    const now = new Date().toISOString();
    const next: FreeTrialState = {
      analysesUsed: s.analysesUsed + 1,
      firstAnalysisAt: s.firstAnalysisAt ?? now,
      lastAnalysisAt: now,
    };
    this.cache = next;
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }

  async remaining(): Promise<number> {
    const s = await this.getState();
    return Math.max(0, MAX_FREE_ANALYSES - s.analysesUsed);
  }

  async isPremium(): Promise<boolean> {
    // TODO: تكامل مع الاشتراكات لاحقاً
    return false;
  }

  async reset(): Promise<void> {
    this.cache = { ...EMPTY };
    await AsyncStorage.removeItem(KEY);
  }

  get maxFree(): number {
    return MAX_FREE_ANALYSES;
  }
}

export const freeTrial = new FreeTrial();
