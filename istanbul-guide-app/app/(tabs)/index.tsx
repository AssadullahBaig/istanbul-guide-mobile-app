import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { getDistance } from "geolib";

import CategoryFilter from "../../components/CategoryFilter";
import LandmarkDetailCard from "../../components/LandmarkDetailCard";
import { historicalPlaces } from "../../constants/historicalPlaces";
import { MapCategory, MapItem } from "../../types/map";

const ISTANBUL_REGION: Region = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export default function MapScreen() {
  const mapRef = useRef<MapView | null>(null);

  const [region, setRegion] = useState<Region>(ISTANBUL_REGION);
  const [selectedCategory, setSelectedCategory] = useState<MapCategory | "All">("All");
  const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);
  const [locationStatus, setLocationStatus] = useState("Getting location...");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setShowNearbyPlaces(false);
    }
  }, [searchQuery]);

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

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const newRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
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

  const getCategoryIcon = (category: MapCategory) => {
    switch (category) {
      case "Mosque":
        return "🕌";
      case "Palace":
        return "🏰";
      case "Museum":
        return "🏛️";
      case "Historical Event":
        return "📜";
      case "Monument":
        return "🗿";
      default:
        return "📍";
    }
  };

  const filteredPlaces = useMemo(() => {
    const query = searchQuery.toLowerCase();

    if (selectedCategory === "All") {
      return historicalPlaces.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.period ?? "").toLowerCase().includes(query)
      );
    }

    return historicalPlaces.filter(
      (item) =>
        item.category === selectedCategory &&
        (item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.period ?? "").toLowerCase().includes(query))
    );
  }, [selectedCategory, searchQuery]);

  const selectedItemDistanceKm =
    selectedItem && userLocation
      ? (
        getDistance(
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          {
            latitude: selectedItem.latitude,
            longitude: selectedItem.longitude,
          }
        ) / 1000
      ).toFixed(1)
      : null;

  const nearbyPlaces = useMemo(() => {
    if (!userLocation) return [];

    return filteredPlaces
      .map((place) => {
        const distance =
          getDistance(
            {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            },
            {
              latitude: place.latitude,
              longitude: place.longitude,
            }
          ) / 1000;

        return {
          ...place,
          distance,
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [userLocation, filteredPlaces]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
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
                <Text
                  style={[
                    styles.markerIcon,
                    isSelected && styles.selectedMarkerIcon,
                  ]}
                >
                  {getCategoryIcon(place.category)}
                </Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {userLocation && (
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={() => {
            const newRegion: Region = {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            };

            mapRef.current?.animateToRegion(newRegion, 1000);
          }}
        >
          <Text style={styles.myLocationButtonText}>⌖</Text>
        </TouchableOpacity>
      )}

      <View style={styles.topOverlay}>
        {locationStatus && (
          <Text style={styles.statusText}>{locationStatus}</Text>
        )}

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

        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <TouchableOpacity
          style={styles.nearbyToggleButton}
          onPress={() => setShowNearbyPlaces((prev) => !prev)}
        >
          <Text style={styles.nearbyToggleButtonText}>
            {showNearbyPlaces ? "Hide Nearby Places" : "Show Nearby Places"}
          </Text>
        </TouchableOpacity>

        {showNearbyPlaces && searchQuery.trim().length === 0 && (
          <View style={styles.nearbyContainer}>
            <Text style={styles.nearbyTitle}>Nearby Places</Text>

            {nearbyPlaces.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.nearbyButton}
                onPress={() => {
                  setSelectedItem(place);

                  const newRegion: Region = {
                    latitude: place.latitude,
                    longitude: place.longitude,
                    latitudeDelta: 0.03,
                    longitudeDelta: 0.03,
                  };

                  mapRef.current?.animateToRegion(newRegion, 1000);
                }}
              >
                <Text style={styles.nearbyItem}>
                  {place.title} ({place.distance.toFixed(1)} km)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

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
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    padding: 10,
  },

  statusText: {
    fontSize: 12,
    marginBottom: 8,
  },

  searchContainer: {
    position: "relative",
    marginBottom: 8,
  },

  searchInput: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingRight: 55,
  },

  clearButton: {
    position: "absolute",
    right: 10,
    top: 8,
  },

  clearButtonText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "bold",
  },

  markerIcon: {
    fontSize: 26,
    textShadowColor: "rgba(255,255,255,0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },

  selectedMarkerIcon: {
    fontSize: 34,
    textShadowColor: "rgba(255,255,255,1)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },

  myLocationButton: {
    position: "absolute",
    right: 16,
    bottom: 110,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    elevation: 4,
  },

  myLocationButtonText: {
    fontSize: 24,
  },

  nearbyToggleButton: {
    marginTop: 10,
    backgroundColor: "#111827",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  nearbyToggleButtonText: {
    color: "white",
    fontWeight: "600",
  },

  nearbyContainer: {
    marginTop: 10,
  },

  nearbyTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },

  nearbyButton: {
    paddingVertical: 4,
  },

  nearbyItem: {
    fontSize: 12,
    color: "#374151",
  },
});