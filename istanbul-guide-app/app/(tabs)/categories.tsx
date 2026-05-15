import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

import { userService } from '../../services/user.services';

function getCategoryInfo(category: string) {
    switch (category) {
        case "Mosque":
            return { color: "#2563eb", bg: "#eff6ff", icon: "moon" as const };
        case "Palace":
            return { color: "#7c3aed", bg: "#f5f3ff", icon: "business" as const };
        case "Museum":
            return { color: "#059669", bg: "#ecfdf5", icon: "color-palette" as const };
        case "Historical Event":
            return { color: "#9f1239", bg: "#fff1f2", icon: "time" as const };
        case "Event":
            return { color: "#dc2626", bg: "#fef2f2", icon: "calendar" as const };
        case "Monument":
            return { color: "#d97706", bg: "#fffbeb", icon: "trail-sign" as const };
        case "Restaurant":
            return { color: "#eab308", bg: "#fefce8", icon: "restaurant" as const };
        case "Cafe":
            return { color: "#ea580c", bg: "#fff7ed", icon: "cafe" as const };
        case "Park":
            return { color: "#10b981", bg: "#ecfdf5", icon: "leaf" as const };
        case "Shopping":
            return { color: "#f43f5e", bg: "#fff1f2", icon: "cart" as const };
        case "Historical":
            return { color: "#8b5cf6", bg: "#f5f3ff", icon: "time" as const };
        default:
            return { color: "#0f766e", bg: "#f0fdfa", icon: "location" as const };
    }
}

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await userService.getCategories();
        if (data) {
          const catNames = data.map((c: any) => c.name).sort();
          setCategories(catNames);
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCategories();
  }, []);

  const handleCategoryPress = (category: string) => {
    router.push({
      pathname: "/map",
      params: { category },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#083344", "#155e75", "#1f6f82"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Ionicons name="grid" size={32} color="#f6e7cf" style={{ marginBottom: 12 }} />
          <Text style={styles.title}>{t('categories.title')}</Text>
          <Text style={styles.subtitle}>
            {t('categories.subtitle')}
          </Text>
        </LinearGradient>

        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Categories</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#155e75" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.grid}>
            {categories.map((category) => {
              const info = getCategoryInfo(category);

              return (
                <TouchableOpacity
                  key={category}
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() => handleCategoryPress(category)}
                >
                  <View style={[styles.iconWrap, { backgroundColor: info.bg }]}>
                    <Ionicons name={info.icon} size={24} color={info.color} />
                  </View>
                  <Text style={styles.cardTitle}>
                    {category}
                  </Text>
                  <Text style={styles.cardText}>
                    {t('categories.viewLocations', { category: category.toLowerCase() })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  heroCard: {
    borderRadius: 30,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: {
    fontSize: 31,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 10,
    lineHeight: 39,
  },
  subtitle: {
    fontSize: 15,
    color: "#d9e7ea",
    lineHeight: 24,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#102733",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },
  card: {
    width: "47.5%",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 20,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#102733",
    marginBottom: 6,
  },
  cardText: {
    fontSize: 13,
    color: "#66757d",
    lineHeight: 18,
  },
});
