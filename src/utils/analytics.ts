import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'analytics_v1';

export interface AnalyticsData {
  appLaunches: number;
  firstLaunch: string;
  lastLaunch: string;
  reportsGenerated: number;
  productsUsed: Record<string, number>;
  aiChatsUsed: number;
  errorsCount: number;
}

const DEFAULT: AnalyticsData = {
  appLaunches: 0,
  firstLaunch: new Date().toISOString(),
  lastLaunch: new Date().toISOString(),
  reportsGenerated: 0,
  productsUsed: {},
  aiChatsUsed: 0,
  errorsCount: 0,
};

class Analytics {
  private cache: AnalyticsData | null = null;

  async load(): Promise<AnalyticsData> {
    if (this.cache !== null) return this.cache;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      this.cache = raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
    } catch {
      this.cache = { ...DEFAULT };
    }
    return this.cache as AnalyticsData;
  }

  async save(data: AnalyticsData): Promise<void> {
    this.cache = data;
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('⚠️ analytics save failed:', e);
    }
  }

  async trackLaunch(): Promise<void> {
    const d = await this.load();
    d.appLaunches += 1;
    d.lastLaunch = new Date().toISOString();
    await this.save(d);
  }

  async trackReport(): Promise<void> {
    const d = await this.load();
    d.reportsGenerated += 1;
    await this.save(d);
  }

  async trackProduct(id: string): Promise<void> {
    const d = await this.load();
    d.productsUsed[id] = (d.productsUsed[id] ?? 0) + 1;
    await this.save(d);
  }

  async trackAiChat(): Promise<void> {
    const d = await this.load();
    d.aiChatsUsed += 1;
    await this.save(d);
  }

  async trackError(): Promise<void> {
    const d = await this.load();
    d.errorsCount += 1;
    await this.save(d);
  }

  async reset(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
    this.cache = null;
  }

  async getHealth(): Promise<{
    status: 'excellent' | 'good' | 'warning' | 'critical';
    label: string;
    color: string;
  }> {
    const d = await this.load();
    const errorRate = d.reportsGenerated > 0
      ? d.errorsCount / d.reportsGenerated
      : 0;

    if (errorRate === 0) return { status: 'excellent', label: 'ممتاز', color: '#2ecc71' };
    if (errorRate < 0.05) return { status: 'good', label: 'جيد', color: '#3498db' };
    if (errorRate < 0.2) return { status: 'warning', label: 'يحتاج مراجعة', color: '#f39c12' };
    return { status: 'critical', label: 'حرج', color: '#e74c3c' };
  }
}

export const analytics = new Analytics();
