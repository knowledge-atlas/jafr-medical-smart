import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'remedy_state_v1';

export interface RemedyEntry {
  id: string;
  name: string;
  date: string;
  completed: boolean;
  notes?: string;
}

class RemedyStorage {
  private cache: RemedyEntry[] | null = null;

  async getAll(): Promise<RemedyEntry[]> {
    if (this.cache !== null) return this.cache;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      this.cache = raw ? JSON.parse(raw) : [];
    } catch {
      this.cache = [];
    }
    return this.cache as RemedyEntry[];
  }

  async add(entry: Omit<RemedyEntry, 'id'>): Promise<RemedyEntry> {
    const all = await this.getAll();
    const newEntry: RemedyEntry = {
      ...entry,
      id: `remedy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
    this.cache = [newEntry, ...all];
    await AsyncStorage.setItem(KEY, JSON.stringify(this.cache));
    return newEntry;
  }

  async toggle(id: string): Promise<void> {
    const all = await this.getAll();
    this.cache = all.map(e => e.id === id ? { ...e, completed: !e.completed } : e);
    await AsyncStorage.setItem(KEY, JSON.stringify(this.cache));
  }

  async remove(id: string): Promise<void> {
    const all = await this.getAll();
    this.cache = all.filter(e => e.id !== id);
    await AsyncStorage.setItem(KEY, JSON.stringify(this.cache));
  }

  async clear(): Promise<void> {
    this.cache = [];
    await AsyncStorage.removeItem(KEY);
  }

  async getStreak(): Promise<number> {
    const all = await this.getAll();
    const completed = all.filter(e => e.completed).map(e => e.date).sort().reverse();
    if (completed.length === 0) return 0;

    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // ابدأ من اليوم أو أمس
    let checkDate = completed[0] === today ? today : completed[0] === yesterday ? yesterday : null;
    if (!checkDate) return 0;

    for (const d of completed) {
      if (d === checkDate) {
        streak++;
        const prev = new Date(new Date(checkDate).getTime() - 86400000).toISOString().slice(0, 10);
        checkDate = prev;
      } else if (d < checkDate) {
        break;
      }
    }
    return streak;
  }
}

export const remedyStorage = new RemedyStorage();
