import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Marker, Region } from "react-native-maps";
import ClusteredMapView from "react-native-map-supercluster";
import * as Location from "expo-location";
import { getDistance } from "geolib";

import CategoryFilter from "../../components/CategoryFilter";
import LandmarkDetailCard from "../../components/LandmarkDetailCard";
import MyLocationButton from "../../components/MyLocationButton";
import NearbyPlacesPanel from "../../components/NearbyPlacesPanel";
import { historicalPlaces } from "../../constants/historicalPlaces";
import { MapCategory, MapItem } from "../../types/map";


// ==============================
// Constants
// ==============================

const ISTANBUL_REGION: Region = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};


// ==============================
// Component
// ==============================

export default function MapScreen() {

  // ==============================
  // Refs
  // ==============================

  const mapRef = useRef<any>(null);


  // ==============================
  // State
  // ==============================

  const [region, setRegion] = useState<Region>(ISTANBUL_REGION);
  const [selectedCategory, setSelectedCategory] = useState<MapCategory | "All">("All");
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [locationStatus, setLocationStatus] = useState("Getting location...");
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);


  // ==============================
  // Effects
  // ==============================

  // Run once on mount → get user location
  useEffect(() => {
    getUserLocation();
  }, []);

  // Hide nearby list when user starts typing
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setShowNearbyPlaces(false);
    }
  }, [searchQuery]);


  // ==============================
  // Helper Functions (Actions)
  // ==============================

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocationStatus("Location permission denied. Showing Istanbul by default.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(coords);

      const newRegion: Region = {
        ...coords,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);

      setLocationStatus("");
    } catch (error) {
      setLocationStatus("Could not fetch location. Showing Istanbul by default.");
    }
  };


  const getCategoryLabel = (category: MapCategory) => {
    switch (category) {
      case "Mosque":
        return "MS";
      case "Palace":
        return "PL";
      case "Museum":
        return "MU";
      case "Historical Event":
        return "EV";
      case "Monument":
        return "MN";
      default:
        return "•";
    }
  };
  const getCategoryColor = (category: MapCategory) => {
    switch (category) {
      case "Mosque":
        return "#2563eb";
      case "Palace":
        return "#7c3aed";
      case "Museum":
        return "#059669";
      case "Historical Event":
        return "#dc2626";
      case "Monument":
        return "#d97706";
      default:
        return "#374151";
    }
  };


  // ==============================
  // Derived Data
  // ==============================

  const filteredPlaces = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return historicalPlaces.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.period ?? "").toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    if (
      selectedItem &&
      !filteredPlaces.some((place) => place.id === selectedItem.id)
    ) {
      setSelectedItem(null);
    }
  }, [filteredPlaces, selectedItem]);


  const selectedItemDistanceKm =
    selectedItem && userLocation
      ? (
        getDistance(userLocation, {
          latitude: selectedItem.latitude,
          longitude: selectedItem.longitude,
        }) / 1000
      ).toFixed(1)
      : null;


  const nearbyPlaces = useMemo(() => {
    if (!userLocation) return [];

    return filteredPlaces
      .map((place) => ({
        ...place,
        distance:
          getDistance(userLocation, {
            latitude: place.latitude,
            longitude: place.longitude,
          }) / 1000,
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [userLocation, filteredPlaces]);


  // ==============================
  // Render
  // ==============================

  return (
    <View style={styles.container}>

      {/* ============================== */}
      {/* Map */}
      {/* ============================== */}

      <ClusteredMapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        animationEnabled
        clusterColor="#111827"
        spiralEnabled
      >
        {filteredPlaces.map((place) => {
          const isSelected = selectedItem?.id === place.id;

          return (
            <Marker
              key={place.id}
              coordinate={{
                latitude: place.latitude,
                longitude: place.longitude,
              }}
              onPress={() => setSelectedItem(place)}
            >
              <View collapsable={false}>
                <View
                  style={[
                    styles.customMarker,
                    { backgroundColor: getCategoryColor(place.category) },
                    isSelected && styles.selectedCustomMarker,
                  ]}
                >
                  <Text style={styles.customMarkerText}>
                    {getCategoryLabel(place.category)}
                  </Text>
                </View>
              </View>
            </Marker>
          );
        })}


      </ClusteredMapView>


      {/* ============================== */}
      {/* My Location Button */}
      {/* ============================== */}

      {userLocation && (
        <MyLocationButton
          onPress={() => {
            const newRegion: Region = {
              ...userLocation,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            };

            mapRef.current?.animateToRegion(newRegion, 1000);
          }}
        />
      )}



      {/* ============================== */}
      {/* Top Overlay */}
      {/* ============================== */}

      <View style={styles.topOverlay}>

        {locationStatus && (
          <Text style={styles.statusText}>{locationStatus}</Text>
        )}

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search landmarks or events"
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

        {/* Category Filter */}
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        {/* Category Legends */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.legendContainer}
        >
          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, { backgroundColor: "#2563eb" }]}>
              <Text style={styles.legendBadgeText}>MS</Text>
            </View>
            <Text style={styles.legendText}>Mosque</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, { backgroundColor: "#7c3aed" }]}>
              <Text style={styles.legendBadgeText}>PL</Text>
            </View>
            <Text style={styles.legendText}>Palace</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, { backgroundColor: "#059669" }]}>
              <Text style={styles.legendBadgeText}>MU</Text>
            </View>
            <Text style={styles.legendText}>Museum</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, { backgroundColor: "#dc2626" }]}>
              <Text style={styles.legendBadgeText}>EV</Text>
            </View>
            <Text style={styles.legendText}>Event</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, { backgroundColor: "#d97706" }]}>
              <Text style={styles.legendBadgeText}>MN</Text>
            </View>
            <Text style={styles.legendText}>Monument</Text>
          </View>
        </ScrollView>

        {/* Nearby Toggle */}
        <NearbyPlacesPanel
          showNearbyPlaces={showNearbyPlaces}
          searchQuery={searchQuery}
          nearbyPlaces={nearbyPlaces}
          onToggle={() => setShowNearbyPlaces((prev) => !prev)}
          onSelectPlace={(placeId) => {
            const place = nearbyPlaces.find((item) => item.id === placeId);
            if (!place) return;

            setSelectedItem(place);

            const newRegion: Region = {
              latitude: place.latitude,
              longitude: place.longitude,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03,
            };

            mapRef.current?.animateToRegion(newRegion, 1000);
          }}
        />

      </View>


      {/* ============================== */}
      {/* Detail Card */}
      {/* ============================== */}

      {selectedItem && (
        <LandmarkDetailCard
          item={selectedItem}
          distanceKm={selectedItemDistanceKm}
          onClose={() => setSelectedItem(null)}
        />
      )}

    </View>
  );
}


// ==============================
// Styles
// ==============================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  topOverlay: {
    position: "absolute",
    top: 50,
    left: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  statusText: {
    fontSize: 12,
    marginBottom: 6,
  },

  searchContainer: {
    position: "relative",
    marginBottom: 8,
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

  legendContainer: {
    paddingTop: 6,
    paddingBottom: 2,
    gap: 8,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },

  legendBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },

  legendBadgeText: {
    color: "white",
    fontSize: 9,
    fontWeight: "700",
  },

  legendText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "500",
  },

  customMarker: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 6,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },

  selectedCustomMarker: {
    transform: [{ scale: 1.12 }],
  },

  customMarkerText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
});