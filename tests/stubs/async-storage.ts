const store = new Map<string, string>();
const AsyncStorage = {
  getItem: async (k: string) => store.get(k) ?? null,
  setItem: async (k: string, v: string) => { store.set(k, v); },
  removeItem: async (k: string) => { store.delete(k); },
  multiGet: async (ks: string[]) => ks.map(k => [k, store.get(k) ?? null]),
  multiSet: async (p: [string, string][]) => { p.forEach(([k, v]) => store.set(k, v)); },
  clear: async () => { store.clear(); },
  getAllKeys: async () => Array.from(store.keys()),
};
export default AsyncStorage;
export { AsyncStorage };
