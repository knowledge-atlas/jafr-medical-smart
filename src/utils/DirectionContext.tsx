import React, { createContext, useState, useContext } from 'react';

const DirectionContext = createContext({
  isRTL: true,
  toggleDirection: () => {},
});

export const DirectionProvider = ({ children }: any) => {
  const [isRTL, setIsRTL] = useState(true);

  const toggleDirection = () => setIsRTL((prev) => !prev);

  return (
    <DirectionContext.Provider value={{ isRTL, toggleDirection }}>
      {children}
    </DirectionContext.Provider>
  );
};

export const useDirection = () => useContext(DirectionContext);
