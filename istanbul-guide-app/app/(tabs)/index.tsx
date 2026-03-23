import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { getDistance } from "geolib";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CategoryFilter from "../../components/CategoryFilter";
import LandmarkDetailCard from "../../components/LandmarkDetailCard";
import MyLocationButton from "../../components/MyLocationButton";
import NearbyPlacesPanel from "../../components/NearbyPlacesPanel";
import { useHistoricalPlaces } from "../../hooks/useHistoricalPlaces";
import { MapCategory, MapItem } from "../../types/map";


// ==============================
// Constants
// ==============================

const ISTANBUL_REGION: Region = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.22,
  longitudeDelta: 0.22,
};


// ==============================
// Component
// ==============================

export default function MapScreen() {

  // ==============================
  // Refs
  // ==============================

  const mapRef = useRef<MapView | null>(null);


  // ==============================
  // Safe Area Insets
  // ==============================

  const insets = useSafeAreaInsets();


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
  // Route Params
  // ==============================

  const params = useLocalSearchParams<{
    category?: string;
    focusTitle?: string;
    focusLat?: string;
    focusLng?: string;
    focusKey?: string;
    nearby?: string;
  }>();


  // ==============================
  // Data Loading
  // ==============================

  const { places, loading, error } = useHistoricalPlaces();


  // ==============================
  // Helper Functions
  // ==============================

  const normalizeTitle = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/’/g, "'")
      .trim();

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

  const getCategoryColor = (category: MapCategory) => {
    switch (category) {
      case "Mosque":
        return "blue";
      case "Palace":
        return "purple";
      case "Museum":
        return "green";
      case "Historical Event":
        return "red";
      case "Monument":
        return "orange";
      default:
        return "gray";
    }
  };

  const findPlaceByFocusParams = () => {
    if (places.length === 0) return null;

    const focusTitle = params.focusTitle
      ? normalizeTitle(String(params.focusTitle))
      : null;

    const focusLat = params.focusLat ? Number(params.focusLat) : null;
    const focusLng = params.focusLng ? Number(params.focusLng) : null;

    // Try exact title match first
    if (focusTitle) {
      const titleMatch = places.find(
        (item) => normalizeTitle(item.title) === focusTitle
      );

      if (titleMatch) {
        return titleMatch;
      }
    }

    // Fallback: find closest place by coordinates
    if (
      focusLat !== null &&
      !Number.isNaN(focusLat) &&
      focusLng !== null &&
      !Number.isNaN(focusLng)
    ) {
      let closestPlace: MapItem | null = null;
      let smallestDistance = Number.POSITIVE_INFINITY;

      for (const place of places) {
        const distance = getDistance(
          { latitude: focusLat, longitude: focusLng },
          { latitude: place.latitude, longitude: place.longitude }
        );

        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestPlace = place;
        }
      }

      if (closestPlace && smallestDistance < 800) {
        return closestPlace;
      }
    }

    return null;
  };


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

  // Apply category filter coming from another screen
  useEffect(() => {
    if (!params.category) return;

    const incomingCategory = String(params.category) as MapCategory | "All";
    setSelectedCategory(incomingCategory);
    setSelectedItem(null);
    setShowNearbyPlaces(false);
  }, [params.category]);

  // Open nearby places panel coming from another screen
  useEffect(() => {
    if (params.nearby === "1") {
      setShowNearbyPlaces(true);
      setSelectedItem(null);
    }
  }, [params.nearby]);

  // Focus a place coming from another screen and open its detail card
  useEffect(() => {
    if (!params.focusTitle && !params.focusLat && !params.focusLng) return;
    if (places.length === 0) return;

    const place = findPlaceByFocusParams();
    if (!place) return;

    if (selectedCategory !== "All" && place.category !== selectedCategory) {
      setSelectedCategory("All");
    }

    setSelectedItem(place);
    setShowNearbyPlaces(false);

    const newRegion: Region = {
      latitude: place.latitude,
      longitude: place.longitude,
      latitudeDelta: 0.025,
      longitudeDelta: 0.025,
    };

    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 1000);
  }, [
    params.focusKey,
    params.focusTitle,
    params.focusLat,
    params.focusLng,
    places,
  ]);


  // ==============================
  // Derived Data
  // ==============================

  const filteredPlaces = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return places.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.period ?? "").toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [places, selectedCategory, searchQuery]);

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

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onPress={() => {
          setSelectedItem(null);
          setShowNearbyPlaces(false);
        }}
      >
        {filteredPlaces.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            onPress={() => {
              setSelectedItem(place);
              setShowNearbyPlaces(false);

              const newRegion: Region = {
                latitude: place.latitude,
                longitude: place.longitude,
                latitudeDelta: 0.025,
                longitudeDelta: 0.025,
              };

              setRegion(newRegion);
              mapRef.current?.animateToRegion(newRegion, 700);
            }}
            pinColor={getCategoryColor(place.category)}
          />
        ))}
      </MapView>


      {/* ============================== */}
      {/* My Location Button */}
      {/* ============================== */}

      {userLocation && (
        <View
          style={[
            styles.locationButtonWrapper,
            { bottom: insets.bottom + 90 },
          ]}
        >
          <MyLocationButton
            onPress={() => {
              const newRegion: Region = {
                ...userLocation,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              };

              setRegion(newRegion);
              mapRef.current?.animateToRegion(newRegion, 1000);
            }}
          />
        </View>
      )}


      {/* ============================== */}
      {/* Top Overlay */}
      {/* ============================== */}

      <View
        style={[
          styles.topOverlay,
          { top: insets.top + 10 },
        ]}
      >

        {locationStatus && (
          <Text style={styles.statusText}>{locationStatus}</Text>
        )}

        {loading && (
          <Text style={styles.statusText}>Loading places...</Text>
        )}

        {error && (
          <Text style={styles.errorText}>{error}</Text>
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
            <View style={[styles.legendBadge, { backgroundColor: "#2563eb" }]} />
            <Text style={styles.legendText}>Mosque</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, { backgroundColor: "#7c3aed" }]} />
            <Text style={styles.legendText}>Palace</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, { backgroundColor: "#059669" }]} />
            <Text style={styles.legendText}>Museum</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, { backgroundColor: "#dc2626" }]} />
            <Text style={styles.legendText}>Event</Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendBadge, { backgroundColor: "#d97706" }]} />
            <Text style={styles.legendText}>Monument</Text>
          </View>
        </ScrollView>

        {/* Nearby Toggle */}
        <NearbyPlacesPanel
          showNearbyPlaces={showNearbyPlaces}
          searchQuery={searchQuery}
          nearbyPlaces={nearbyPlaces}
          onToggle={() => {
            setShowNearbyPlaces((prev) => !prev);
            setSelectedItem(null);
          }}
          onSelectPlace={(placeId) => {
            const place = nearbyPlaces.find((item) => item.id === placeId);
            if (!place) return;

            setSelectedItem(place);
            setShowNearbyPlaces(false);

            const newRegion: Region = {
              latitude: place.latitude,
              longitude: place.longitude,
              latitudeDelta: 0.025,
              longitudeDelta: 0.025,
            };

            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 1000);
          }}
        />
      </View>


      {/* ============================== */}
      {/* Detail Card */}
      {/* ============================== */}

      {selectedItem && (
        <View
          style={[
            styles.detailCardWrapper,
            { bottom: insets.bottom + 76 },
          ]}
        >
          <LandmarkDetailCard
            item={selectedItem}
            distanceKm={selectedItemDistanceKm}
            onClose={() => setSelectedItem(null)}
          />
        </View>
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
    backgroundColor: "#f3f4f6",
  },

  map: {
    flex: 1,
  },

  topOverlay: {
    position: "absolute",
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
    color: "#374151",
  },

  errorText: {
    fontSize: 12,
    marginBottom: 6,
    color: "#dc2626",
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

  legendText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "500",
  },

  locationButtonWrapper: {
    position: "absolute",
    right: 16,
  },

  detailCardWrapper: {
    position: "absolute",
    left: 12,
    right: 12,
  },
});