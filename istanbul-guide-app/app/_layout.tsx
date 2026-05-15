import { Stack } from "expo-router";
import React from "react";
import { View } from "react-native";
import "../i18n";
import { OfflineBanner } from "../components/OfflineBanner";

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="trip/[id]" />
      </Stack>
    </View>
  );
}