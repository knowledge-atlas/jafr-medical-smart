const s = new Map<string, string>();
export const getItemAsync = async (k: string) => s.get(k) ?? null;
export const setItemAsync = async (k: string, v: string) => { s.set(k, v); };
export const deleteItemAsync = async (k: string) => { s.delete(k); };
export default { getItemAsync, setItemAsync, deleteItemAsync };
