import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { historicalPlaces } from "../../constants/historicalPlaces";
import { MapCategory } from "../../types/map";


// ==============================
// Constants
// ==============================

const categories: MapCategory[] = [
  "Mosque",
  "Palace",
  "Museum",
  "Historical Event",
  "Monument",
];


// ==============================
// Component
// ==============================

export default function ExploreScreen() {

  // ==============================
  // State
  // ==============================

  const [searchQuery, setSearchQuery] = useState("");


  // ==============================
  // Derived Data
  // ==============================

  const filteredPlaces = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return historicalPlaces.slice(0, 6);
    }

    return historicalPlaces
      .filter((item) => {
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          (item.period ?? "").toLowerCase().includes(query)
        );
      })
      .slice(0, 8);
  }, [searchQuery]);


  // ==============================
  // Helper Functions
  // ==============================

  const openMap = () => {
    router.push("/");
  };

  const openCategoryOnMap = (category: MapCategory) => {
    router.push({
      pathname: "/",
      params: { category },
    });
  };

  const openPlaceOnMap = (item: {
    title: string;
    latitude: number;
    longitude: number;
  }) => {
    router.push({
      pathname: "/",
      params: {
        focusTitle: item.title,
        focusLat: String(item.latitude),
        focusLng: String(item.longitude),
        focusKey: String(Date.now()),
      },
    });
  };

  const openNearbyOnMap = () => {
    router.push({
      pathname: "/",
      params: { nearby: "1" },
    });
  };


  // ==============================
  // Render
  // ==============================

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* ============================== */}
        {/* Hero Card */}
        {/* ============================== */}

        <View style={styles.heroCard}>
          <Text style={styles.title}>Istanbul Smart Tourism Guide</Text>
          <Text style={styles.subtitle}>
            Discover historical landmarks, cultural monuments, and important
            places across Istanbul through an interactive tourism guide.
          </Text>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search landmarks, periods, or categories"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery("")}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={openMap}>
            <Text style={styles.primaryButtonText}>Open Interactive Map</Text>
          </TouchableOpacity>
        </View>

        {/* ============================== */}
        {/* Categories */}
        {/* ============================== */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={styles.categoryChip}
                onPress={() => openCategoryOnMap(category)}
              >
                <Text style={styles.categoryChipText}>{category}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ============================== */}
        {/* Quick Actions */}
        {/* ============================== */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard} onPress={openMap}>
              <Text style={styles.quickActionTitle}>Map</Text>
              <Text style={styles.quickActionText}>
                Open the full interactive map of historical places.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={openNearbyOnMap}
            >
              <Text style={styles.quickActionTitle}>Nearby</Text>
              <Text style={styles.quickActionText}>
                Open the map and view places close to your current location.
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================== */}
        {/* Featured / Search Results */}
        {/* ============================== */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchQuery.trim() ? "Search Results" : "Featured Places"}
          </Text>

          {filteredPlaces.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No places matched your search.</Text>
            </View>
          ) : (
            filteredPlaces.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.placeCard}
                onPress={() =>
                  openPlaceOnMap({
                    title: item.title,
                    latitude: item.latitude,
                    longitude: item.longitude,
                  })
                }
              >
                <Text style={styles.placeTitle}>{item.title}</Text>
                <Text style={styles.placeMeta}>
                  {item.category}
                  {item.period ? ` • ${item.period}` : ""}
                </Text>
                <Text style={styles.placeDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


// ==============================
// Styles
// ==============================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },

  content: {
    padding: 16,
    paddingBottom: 28,
  },

  heroCard: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
    marginBottom: 14,
  },

  searchContainer: {
    position: "relative",
    marginBottom: 12,
  },

  searchInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingRight: 42,
    fontSize: 15,
  },

  clearButton: {
    position: "absolute",
    right: 12,
    top: 9,
  },

  clearButtonText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "700",
  },

  primaryButton: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 15,
  },

  section: {
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },

  categoriesRow: {
    paddingRight: 8,
  },

  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
    marginRight: 8,
  },

  categoryChipText: {
    color: "#111827",
    fontWeight: "500",
  },

  quickActionsGrid: {
    flexDirection: "row",
    gap: 10,
  },

  quickActionCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
  },

  quickActionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  quickActionText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },

  placeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },

  placeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 5,
  },

  placeMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },

  placeDescription: {
    fontSize: 13,
    color: "#111827",
    lineHeight: 18,
  },

  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
  },

  emptyText: {
    fontSize: 14,
    color: "#6b7280",
  },
});