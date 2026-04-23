import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

import { colors, radii } from "../constants/theme";
import { supabase } from "../services/supabase";
import { userService } from "../services/user.services";

export default function SettingsScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const cats = await userService.getCategories();
        setCategories(cats);

        const userInts = await userService.getUserInterests(user.id);
        setSelectedIds(userInts);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleInterest = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(catId => catId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!userId) return;
    try {
      setSaving(true);
      await userService.saveUserInterests(userId, selectedIds);
      Alert.alert("Success", "Your personal interests have been saved!");
    } catch (error) {
      console.error("Error saving interests:", error);
      Alert.alert("Error", "Could not save your preferences.");
    } finally {
      setSaving(false);
    }
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
      {/* İŞTE BURASI DÜZELTİLDİ: ScrollView eklendi */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your Interests</Text>
        <Text style={styles.subtitle}>Select the categories you love to get personalized AI recommendations.</Text>

        <View style={styles.card}>
          {categories.map((cat, index) => {
            const isSelected = selectedIds.includes(cat.id);
            return (
              <View key={cat.id} style={[styles.row, index === categories.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="star-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{cat.name}</Text>
                  </View>
                </View>
                <Switch
                  value={isSelected}
                  onValueChange={() => toggleInterest(cat.id)}
                  trackColor={{ true: colors.primary, false: "#d7dbde" }}
                  thumbColor={colors.white}
                />
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 120 },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", letterSpacing: -0.8 },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 24 },
  card: { backgroundColor: colors.surface, borderRadius: 24, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, borderBottomWidth: 1, borderBottomColor: "#eff2f3" },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1, paddingRight: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#eef5f8", alignItems: "center", justifyContent: "center" },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  saveButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: { color: colors.white, fontWeight: "800", fontSize: 16 },
});