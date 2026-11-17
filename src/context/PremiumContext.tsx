import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { checkPremiumStatus, setPremiumStatus } from '../storage/premiumStorage';
import { isOwnerUnlocked } from '../services/OwnerUnlockService';

interface PremiumValue {
  /** مفتوح بالشراء (Google Play Billing) أو بفتح المالك */
  isPremium: boolean;
  /** مفتوح بالرقم السري للمالك */
  ownerUnlocked: boolean;
  setPremium: (val: boolean) => Promise<void>;
  /** أعد قراءة الحالة من التخزين (بعد فتح/قفل المالك) */
  refresh: () => Promise<void>;
}

const PremiumContext = createContext<PremiumValue>({
  isPremium: false,
  ownerUnlocked: false,
  setPremium: async () => {},
  refresh: async () => {},
});

export const PremiumProvider = ({ children }: any) => {
  const [purchased, setPurchased] = useState(false);
  const [ownerUnlocked, setOwnerUnlocked] = useState(false);

  const refresh = useCallback(async () => {
    setPurchased(await checkPremiumStatus());
    setOwnerUnlocked(await isOwnerUnlocked());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setPremium = async (val: boolean) => {
    await setPremiumStatus(val);
    setPurchased(val);
  };

  return (
    <PremiumContext.Provider
      value={{ isPremium: purchased || ownerUnlocked, ownerUnlocked, setPremium, refresh }}
    >
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => useContext(PremiumContext);
