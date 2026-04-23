import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from "react-native";

import { colors, radii } from "../../constants/theme";
import { supabase } from "../../services/supabase";

export default function ProfileScreen() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedCount, setSavedCount] = useState(0);
  const [tripsCount, setTripsCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? "Unknown User");
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      async function fetchStats() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const savedReq = supabase
            .from('user_favorites')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          const tripsReq = supabase
            .from('user_trips')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          const reviewsReq = supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          const [savedRes, tripsRes, reviewsRes] = await Promise.all([
            savedReq,
            tripsReq,
            reviewsReq
          ]);

          if (!savedRes.error) setSavedCount(savedRes.count ?? 0);
          if (!tripsRes.error) setTripsCount(tripsRes.count ?? 0);
          if (!reviewsRes.error) setReviewsCount(reviewsRes.count ?? 0);
        }
      }
      fetchStats();
    }, [])
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/sign-in");
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.name}>Welcome Back</Text>
          <Text style={styles.subtitle}>{userEmail}</Text>
        </View>

        <View style={styles.statGrid}>
          <Pressable style={styles.statCard} onPress={() => router.push("/favorites")}>
            <Text style={styles.statValue}>{savedCount}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </Pressable>
          
          <Pressable style={styles.statCard} onPress={() => router.push("/favorites")}>
          <Text style={styles.statValue}>{tripsCount}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </Pressable>
          
          <Pressable style={styles.statCard} onPress={() => router.push("/")}>
            <Text style={styles.statValue}>{reviewsCount}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Pressable style={styles.infoRow} onPress={() => router.push("/settings")}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.infoLabel}>Account Settings</Text>
              <Text style={styles.infoValue}>Manage profile & interests</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.white} />
          <Text style={styles.settingsButtonText}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 16 },
  header: { alignItems: "center", paddingTop: 12, marginBottom: 22 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#eef5f8", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  name: { color: colors.text, fontSize: 24, fontWeight: "900", letterSpacing: -0.8 },
  subtitle: { color: colors.primary, marginTop: 4, fontSize: 16, fontWeight: "600" },
  statGrid: { flexDirection: "row", gap: 12, marginBottom: 18 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, paddingVertical: 18, alignItems: "center" },
  statValue: { color: colors.primary, fontSize: 24, fontWeight: "900" },
  statLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "600", marginTop: 4 },
  infoCard: { backgroundColor: colors.surface, borderRadius: 24, overflow: "hidden" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, borderBottomWidth: 1, borderBottomColor: "#eef2f4" },
  infoLabel: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  infoValue: { color: colors.text, fontSize: 16, fontWeight: "800", marginTop: 4 },
  logoutButton: {
    marginTop: 18,
    backgroundColor: "#dc2626",
    borderRadius: radii.lg,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  settingsButtonText: { color: colors.white, fontWeight: "800", fontSize: 15 },
});