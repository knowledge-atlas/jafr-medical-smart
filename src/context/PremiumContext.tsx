import React, { createContext, useState, useContext, useEffect } from 'react';
import { checkPremiumStatus } from '../storage/premiumStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PremiumContext = createContext({
  isPremium: false,
  setPremium: (val: boolean) => {},
});

export const PremiumProvider = ({ children }: any) => {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // نقرأ الحالة من الذاكرة (إذا أدخلت الرقم السري سابقاً، سيتم تذكرها)
    checkPremiumStatus().then(setIsPremium);
  }, []);

  const setPremium = async (val: boolean) => {
    setIsPremium(val);
    try {
      await AsyncStorage.setItem('@isPremium', val ? 'true' : 'false');
    } catch (e) {
      console.log('Error saving premium status:', e);
    }
  };

  return (
    <PremiumContext.Provider value={{ isPremium, setPremium }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => useContext(PremiumContext);
