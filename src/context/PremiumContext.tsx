import React, { createContext, useState, useContext, useEffect } from 'react';
import { checkPremiumStatus } from '../storage/premiumStorage';

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
  };

  return (
    <PremiumContext.Provider value={{ isPremium, setPremium }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => useContext(PremiumContext);
