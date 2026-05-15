import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, Modal } from "react-native";
import { router } from "expo-router";

import { colors, radii } from "../constants/theme";
import { supabase } from "../services/supabase";
import { userService } from "../services/user.services";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Always fetch categories so they display
        const cats = await userService.getCategories();
        setCategories(cats);

        if (!user) {
          setIsGuest(true);
          return;
        }
        
        setUserId(user.id);


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
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(catId => catId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    if (!userId) return;
    try {
      setSaving(true);
      await userService.saveUserInterests(userId, selectedIds);
      Alert.alert("Success", t('settings.successMessage'));
    } catch (error) {
      console.error("Error saving interests:", error);
      Alert.alert("Error", t('settings.errorMessage'));
    } finally {
      setSaving(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'tr' : 'en';
    i18n.changeLanguage(newLang);
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
        
        <View style={[styles.card, { marginBottom: 24 }]}>
          <TouchableOpacity 
            style={styles.row} 
            activeOpacity={0.7} 
            onPress={toggleLanguage}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="language-outline" size={18} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{t('settings.language')}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                  {t('settings.languageDesc')}
                </Text>
              </View>
            </View>
            <Text style={{ fontWeight: '800', color: colors.primary, fontSize: 16 }}>
              {i18n.language === 'en' ? 'EN' : 'TR'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{t('settings.title')}</Text>
        <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>

        <View style={styles.card}>
          {categories.map((cat, index) => {
            const isSelected = selectedIds.includes(cat.id);
            return (
              <TouchableOpacity 
                key={cat.id} 
                style={[
                  styles.row, 
                  index === categories.length - 1 && { borderBottomWidth: 0 },
                  isGuest && { opacity: 0.5 }
                ]}
                activeOpacity={0.7}
                onPress={() => toggleInterest(cat.id)}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="star-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{cat.name}</Text>
                  </View>
                </View>
                <View pointerEvents={isGuest ? "none" : "auto"}>
                  <Switch
                    value={isSelected}
                    onValueChange={() => toggleInterest(cat.id)}
                    trackColor={{ true: colors.primary, false: "#d7dbde" }}
                    thumbColor={colors.white}
                  />
                </View>
              </TouchableOpacity>
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
            <Text style={styles.saveButtonText}>{t('settings.buttonSave')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* GUEST MODAL */}
      <Modal
        visible={showGuestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGuestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="lock-closed" size={32} color="#d8b15e" />
            </View>
            <Text style={styles.modalTitle}>Login Required</Text>
            <Text style={styles.modalText}>
              You need to sign in to your account to save personal preferences and generate custom AI itineraries.
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalPrimaryButton} 
                activeOpacity={0.8}
                onPress={() => {
                  setShowGuestModal(false);
                  router.push("/sign-in");
                }}
              >
                <Text style={styles.modalPrimaryText}>Sign In</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSecondaryButton}
                activeOpacity={0.8} 
                onPress={() => setShowGuestModal(false)}
              >
                <Text style={styles.modalSecondaryText}>Stay in Guest Mode</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContent: { backgroundColor: "#ffffff", borderRadius: 32, padding: 24, width: "100%", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  modalIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#fef8e7", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: "900", color: "#102733", marginBottom: 12 },
  modalText: { fontSize: 15, color: "#66757d", textAlign: "center", lineHeight: 24, marginBottom: 24 },
  modalActions: { width: "100%", gap: 12 },
  modalPrimaryButton: { backgroundColor: "#0f3340", borderRadius: 20, paddingVertical: 16, alignItems: "center", width: "100%" },
  modalPrimaryText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  modalSecondaryButton: { backgroundColor: "#eef2f4", borderRadius: 20, paddingVertical: 16, alignItems: "center", width: "100%" },
  modalSecondaryText: { color: "#102733", fontSize: 16, fontWeight: "700" },
});
