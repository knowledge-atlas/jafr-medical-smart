import * as SecureStore from 'expo-secure-store';

export const checkPremiumStatus = async () => {
  try {
    const status = await SecureStore.getItemAsync('isPremium');
    return status === 'true';
  } catch {
    return false;
  }
};

export const setPremiumStatus = async (status: boolean) => {
  try {
    await SecureStore.setItemAsync('isPremium', status ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to set premium status', e);
  }
};
