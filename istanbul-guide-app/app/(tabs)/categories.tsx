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

// SUPABASE API INTEGRATION
import { supabase } from '../../services/supabase';

function getCategoryInfo(category: string) {
    switch (category) {
        case "Mosque":
            return { color: "#2563eb", icon: "moon" as const };
        case "Palace":
            return { color: "#7c3aed", icon: "business" as const };
        case "Museum":
            return { color: "#059669", icon: "color-palette" as const };
        case "Historical Event":
        case "Event":
            return { color: "#dc2626", icon: "calendar" as const };
        case "Monument":
            return { color: "#d97706", icon: "trail-sign" as const };
        case "Restaurant":
            return { color: "#eab308", icon: "restaurant" as const };
        case "Cafe":
            return { color: "#ea580c", icon: "cafe" as const };
        case "Park":
            return { color: "#10b981", icon: "leaf" as const };
        case "Shopping":
            return { color: "#f43f5e", icon: "cart" as const };
        case "Historical":
            return { color: "#8b5cf6", icon: "time" as const };
        default:
            return { color: "#0f766e", icon: "location" as const };
    }
}

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('name')
          .order('name');
          
        if (error) throw error;
        
        if (data) {
          setCategories(data.map(c => c.name));
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
      pathname: "/",
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
        <Text style={styles.title}>{t('categories.title')}</Text>
        <Text style={styles.subtitle}>
          {t('categories.subtitle')}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0f4c5c" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.grid}>
            {categories.map((category) => {
              const info = getCategoryInfo(category);

              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.card, { backgroundColor: info.color }]}
                  activeOpacity={0.88}
                  onPress={() => handleCategoryPress(category)}
                >
                  <View style={styles.iconWrapHighlighted}>
                    <Ionicons name={info.icon} size={22} color="#ffffff" />
                  </View>

                  <Text style={styles.cardTitleHighlighted}>
                    {category}
                  </Text>

                  <Text style={styles.cardTextHighlighted}>
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
    backgroundColor: "#f4f6f8",
  },
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    lineHeight: 24,
    marginBottom: 22,
  },
  grid: {
    gap: 16,
  },
  card: {
    borderRadius: 28,
    padding: 24,
    minHeight: 170,
    justifyContent: "flex-end",
  },
  iconWrapHighlighted: {
    position: "absolute",
    top: 24,
    left: 24,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleHighlighted: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
  },
  cardTextHighlighted: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 22,
  },
});