import React, { createContext, useState, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';

export const RefreshContext = createContext({
  refreshAll: () => {},
  refreshing: false,
});

export const RefreshProvider = ({ children }) => {
  const [refreshing, setRefreshing] = useState(false);

  const refreshAll = useCallback(() => {
    setRefreshing(true);
    // stop refreshing automatically after short delay
     // 🔥 GLOBAL EVENT FIRE
    DeviceEventEmitter.emit("GLOBAL_REFRESH");
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshAll, refreshing }}>
      {children}
    </RefreshContext.Provider>
  );
};
