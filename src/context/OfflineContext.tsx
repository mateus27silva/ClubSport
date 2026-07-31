import React, { createContext, useContext, useEffect, useState } from 'react';

interface PendingAction {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
}

interface OfflineContextType {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  toggleSimulatedOffline: () => void;
  pendingActions: PendingAction[];
  queueAction: (type: string, payload: any) => void;
  clearPendingActions: () => void;
  syncOfflineData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>(() => {
    const saved = localStorage.getItem('clubsport_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const isOnline = isBrowserOnline && !isSimulatedOffline;

  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('clubsport_offline_queue', JSON.stringify(pendingActions));
  }, [pendingActions]);

  // When coming back online, auto-sync pending actions
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncOfflineData();
    }
  }, [isOnline]);

  const toggleSimulatedOffline = () => {
    setIsSimulatedOffline((prev) => !prev);
  };

  const queueAction = (type: string, payload: any) => {
    const action: PendingAction = {
      id: 'act_' + Date.now(),
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    setPendingActions((prev) => [...prev, action]);
  };

  const clearPendingActions = () => {
    setPendingActions([]);
  };

  const syncOfflineData = async () => {
    if (pendingActions.length === 0) return;
    console.log(`Syncing ${pendingActions.length} offline actions to Cloud Firestore...`);
    // Simulate sync processing latency
    await new Promise((res) => setTimeout(res, 1200));
    setPendingActions([]);
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSimulatedOffline,
        toggleSimulatedOffline,
        pendingActions,
        queueAction,
        clearPendingActions,
        syncOfflineData
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error('useOffline must be used within OfflineProvider');
  return context;
};
