import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

import { colors, radii } from "../constants/theme";
import { supabase } from "../services/supabase";
import { userService } from "../services/user.services";
import { generateItinerary, ItineraryResponse } from "../services/ai.service";

export default function AiItineraryScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hasInterests, setHasInterests] = useState(true);
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadItinerary() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHasInterests(false);
          setLoading(false);
          return;
        }

        const selectedIds = await userService.getUserInterests(user.id);
        if (!selectedIds || selectedIds.length === 0) {
          setHasInterests(false);
          setLoading(false);
          return;
        }

        const allCategories = await userService.getCategories();
        const interestNames = allCategories
          .filter(cat => selectedIds.includes(cat.id))
          .map(cat => cat.name);

        setGenerating(true);
        setLoading(false);

        const language = i18n.language === 'tr' ? 'Turkish' : 'English';
        const response = await generateItinerary(interestNames, language);
        
        setItinerary(response);
      } catch (err) {
        console.error("Failed to load itinerary", err);
        setError(t('aiItinerary.errorMessage'));
      } finally {
        setGenerating(false);
        setLoading(false);
      }
    }

    loadItinerary();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!hasInterests) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}>
            <Ionicons name="options-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t('aiItinerary.noInterestsTitle')}</Text>
          <Text style={styles.emptyDesc}>{t('aiItinerary.noInterestsDesc')}</Text>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => router.push("/settings")}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>{t('aiItinerary.buttonSettings')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('aiItinerary.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {generating ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('aiItinerary.loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Ionicons name="warning-outline" size={48} color="#ef4444" />
            <Text style={styles.errorTitle}>{t('aiItinerary.errorTitle')}</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={() => router.back()}
            >
              <Text style={styles.primaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : itinerary ? (
          <>
            <LinearGradient
              colors={["#083344", "#155e75"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <Ionicons name="sparkles" size={24} color="#f6e7cf" style={{ marginBottom: 12 }} />
              <Text style={styles.itineraryTitle}>{itinerary.title}</Text>
              <Text style={styles.itinerarySubtitle}>{t('aiItinerary.subtitle')}</Text>
            </LinearGradient>

            <View style={styles.timeline}>
              {itinerary.stops.map((stop, index) => (
                <View key={index} style={styles.stopCard}>
                  <View style={styles.stopNumberBadge}>
                    <Text style={styles.stopNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stopName}>{stop.name}</Text>
                  <Text style={styles.stopShortDesc}>{stop.shortDescription}</Text>
                  <View style={styles.stopDivider} />
                  <Text style={styles.stopDetailedDesc}>{stop.detailedDescription}</Text>
                  
                  {index < itinerary.stops.length - 1 && (
                    <View style={styles.timelineConnector} />
                  )}
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  itineraryTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
    lineHeight: 34,
  },
  itinerarySubtitle: {
    fontSize: 15,
    color: "#d9e7ea",
    lineHeight: 22,
  },
  timeline: {
    paddingLeft: 8,
  },
  stopCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  stopNumberBadge: {
    position: "absolute",
    top: -12,
    left: 24,
    backgroundColor: "#d8b15e",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#f3f4f6",
  },
  stopNumberText: {
    color: "#0f3340",
    fontWeight: "900",
    fontSize: 14,
  },
  stopName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
    marginTop: 8,
  },
  stopShortDesc: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 12,
  },
  stopDivider: {
    height: 1,
    backgroundColor: "#eff2f3",
    marginVertical: 12,
  },
  stopDetailedDesc: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textMuted,
  },
  timelineConnector: {
    position: "absolute",
    bottom: -20,
    left: 40,
    width: 2,
    height: 20,
    backgroundColor: "#d1d5db",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eef5ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: radii.lg,
    width: "100%",
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  loadingState: {
    paddingVertical: 80,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  errorState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ef4444",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
});
