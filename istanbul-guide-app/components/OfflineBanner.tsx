import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function OfflineBanner() {
  const isConnected = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (isConnected !== false) {
    return null; // hide if connected or null (unknown yet)
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 5 }]}>
      <Text style={styles.text}>No internet connection. Showing offline data.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ff4444',
    paddingBottom: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    width: '100%',
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
