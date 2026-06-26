import React, { createContext, useState, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface InternetContextType {
  isOnline: boolean;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  toggleMockOffline: () => void;
  isMockedOffline: boolean;
}

export const InternetContext = createContext<InternetContextType | undefined>(undefined);

export const InternetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMockedOffline, setIsMockedOffline] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  
  const isMockedOfflineRef = useRef(false);

  const toggleMockOffline = () => {
    setIsMockedOffline((prev) => {
      const next = !prev;
      isMockedOfflineRef.current = next;
      console.log(`[InternetProvider] Toggled Mock Offline: ${next}`);
      
      if (next) {
        setIsOnline(false);
        setIsConnected(false);
        setIsInternetReachable(false);
      } else {
        // Restore actual status from NetInfo
        NetInfo.fetch().then((state) => {
          const online = state.isConnected !== false && state.isInternetReachable !== false;
          setIsOnline(online);
          setIsConnected(state.isConnected);
          setIsInternetReachable(state.isInternetReachable);
        }).catch(() => {
          // Default back to online if fetch fails
          setIsOnline(true);
          setIsConnected(true);
          setIsInternetReachable(true);
        });
      }
      return next;
    });
  };

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};
    let isFallbackActive = false;

    const startJsPolling = () => {
      if (isFallbackActive) return;
      isFallbackActive = true;
      console.log('⚠️ [InternetProvider] Active Fallback: Starting JS-only network polling...');

      let intervalId: NodeJS.Timeout;
      const checkConnectivity = async () => {
        if (!isMounted) return;
        // Skip polling state updates if mock offline is active
        if (isMockedOfflineRef.current) return;

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000); // 3-second timeout

          const response = await fetch('https://clients3.google.com/generate_204', {
            method: 'GET',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
            signal: controller.signal,
          });
          clearTimeout(timeout);

          const online = response.ok || response.status === 204;
          
          setIsOnline((prev) => {
            if (prev !== online) {
              console.log(`[InternetProvider-Fallback] Connection changed: ${prev} -> ${online}`);
              return online;
            }
            return prev;
          });
          setIsConnected(online);
          setIsInternetReachable(online);
        } catch (error) {
          setIsOnline((prev) => {
            if (prev !== false) {
              console.log('[InternetProvider-Fallback] Connection offline (fetch failed)');
              return false;
            }
            return prev;
          });
          setIsConnected(false);
          setIsInternetReachable(false);
        }
      };

      // Run immediately
      checkConnectivity();
      // Poll every 5 seconds
      intervalId = setInterval(checkConnectivity, 5000);

      unsubscribe = () => {
        clearInterval(intervalId);
      };
    };

    try {
      // Fetch initial connection state on mount
      NetInfo.fetch().then((state) => {
        if (!isMounted) return;
        if (isMockedOfflineRef.current) return;
        console.log('[InternetProvider] Initial NetInfo State:', JSON.stringify(state));
        
        const online = state.isConnected !== false && state.isInternetReachable !== false;
        console.log(`[InternetProvider] Initial computed online: ${online}`);
        
        setIsOnline(online);
        setIsConnected(state.isConnected);
        setIsInternetReachable(state.isInternetReachable);
      }).catch((err) => {
        console.warn('[InternetProvider] NetInfo.fetch failed. You may need to rebuild the app binary:', err);
        startJsPolling();
      });
    } catch (e) {
      console.warn('[InternetProvider] NetInfo.fetch failed synchronously. Falling back to JS polling...', e);
      startJsPolling();
    }

    try {
      // Subscribe to connection state changes
      const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
        if (!isMounted || isFallbackActive || isMockedOfflineRef.current) return;
        console.log('[InternetProvider] NetInfo Event Triggered:', JSON.stringify(state));

        const online = state.isConnected !== false && state.isInternetReachable !== false;
        console.log(`[InternetProvider] Event computed online: ${online}`);
        
        // Update state, preventing duplicate triggers
        setIsOnline((prev) => {
          if (prev !== online) {
            console.log(`[InternetProvider] Network connection status changed: ${prev} -> ${online}`);
            return online;
          }
          return prev;
        });

        setIsConnected(state.isConnected);
        setIsInternetReachable(state.isInternetReachable);
      });

      unsubscribe = () => {
        unsubscribeNetInfo();
      };
    } catch (e) {
      console.warn('[InternetProvider] NetInfo.addEventListener failed. Falling back to JS polling...', e);
      startJsPolling();
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <InternetContext.Provider value={{ isOnline, isConnected, isInternetReachable, toggleMockOffline, isMockedOffline }}>
      {children}
    </InternetContext.Provider>
  );
};
