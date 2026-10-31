import React, { createContext, useState, useContext, useEffect } from 'react';
import { checkPremiumStatus } from '../storage/premiumStorage';

const PremiumContext = createContext({
  isPremium: false,
  setPremium: (val: boolean) => {},
});

export const PremiumProvider = ({ children }: any) => {
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
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
