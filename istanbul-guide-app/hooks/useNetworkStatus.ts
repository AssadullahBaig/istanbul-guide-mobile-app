import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval>;

    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (isMounted) {
          // If internetReachable is false or isConnected is false, we are offline.
          setIsConnected(!!state.isConnected && state.isInternetReachable !== false);
        }
      } catch (error) {
        console.warn("Failed to check network status:", error);
      }
    };

    // Check immediately
    checkNetwork();

    // Check periodically since expo-network doesn't have an event listener for connectivity changes in managed workflow yet
    intervalId = setInterval(checkNetwork, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return isConnected;
}
