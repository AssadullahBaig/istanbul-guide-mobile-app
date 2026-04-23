import { useFocusEffect, router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { supabase } from "../../services/supabase";
import {
  getTripPlaces,
  getUserFavoritePlaces,
  getUserTrips,
} from "../../services/places.services";

type FavoritePlace = {
  id: string;
  place_id?: string;
  title: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  period?: string;
};

type TripRow = {
  id: string;
  trip_name: string;
  created_at?: string;
};

export default function FavoritesScreen() {
  const [loading, setLoading] = useState(true);
  const [favoritePlaces, setFavoritePlaces] = useState<FavoritePlace[]>([]);
  const [trips, setTrips] = useState<Array<TripRow & { placeCount: number }>>(
    []
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFavoritePlaces([]);
        setTrips([]);
        return;
      }

      const [favoritesData, tripsData] = await Promise.all([
        getUserFavoritePlaces(user.id),
        getUserTrips(user.id),
      ]);

      setFavoritePlaces(favoritesData || []);

      const tripsWithCounts = await Promise.all(
        (tripsData || []).map(async (trip: TripRow) => {
          const places = await getTripPlaces(trip.id);
          return {
            ...trip,
            placeCount: places.length,
          };
        })
      );

      setTrips(tripsWithCounts);
    } catch (error) {
      console.error("Failed to load saved data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const openPlaceOnMap = (item: FavoritePlace) => {
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

  const openTrip = (trip: TripRow) => {
    router.push({
      pathname: `/trip/${trip.id}` as any,
      params: {
        name: trip.trip_name,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.subtitle}>
          Revisit your favorite places and continue the trips you created.
        </Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#0f4c5c" />
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Saved Places</Text>

            {favoritePlaces.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="bookmark-outline" size={28} color="#0f4c5c" />
                <Text style={styles.emptyTitle}>No saved places yet</Text>
                <Text style={styles.emptyText}>
                  Save places from the map detail card and they will appear here.
                </Text>
              </View>
            ) : (
              favoritePlaces.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.listCard}
                  activeOpacity={0.9}
                  onPress={() => openPlaceOnMap(place)}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons name="location-outline" size={22} color="#0f4c5c" />
                  </View>

                  <View style={styles.listContent}>
                    <Text style={styles.listTitle}>{place.title}</Text>
                    <Text style={styles.listSubtitle}>
                      {place.category}
                      {place.period ? ` • ${place.period}` : ""}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#64748b"
                  />
                </TouchableOpacity>
              ))
            )}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>My Trips</Text>

            {trips.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="map-outline" size={28} color="#0f4c5c" />
                <Text style={styles.emptyTitle}>No trips yet</Text>
                <Text style={styles.emptyText}>
                  Create a trip from a place detail card to see it here.
                </Text>
              </View>
            ) : (
              trips.map((trip) => (
                <TouchableOpacity
                  key={trip.id}
                  style={styles.tripCard}
                  activeOpacity={0.9}
                  onPress={() => openTrip(trip)}
                >
                  <View style={styles.tripIconWrap}>
                    <Ionicons name="map-outline" size={22} color="#ffffff" />
                  </View>

                  <View style={styles.listContent}>
                    <Text style={styles.listTitle}>{trip.trip_name}</Text>
                    <Text style={styles.listSubtitle}>
                      {trip.placeCount} place{trip.placeCount === 1 ? "" : "s"}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#64748b"
                  />
                </TouchableOpacity>
              ))
            )}
          </>
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
  loadingWrap: {
    paddingTop: 36,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 14,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  tripCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#eef5f8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  tripIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#0f4c5c",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  listContent: {
    flex: 1,
    paddingRight: 10,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  listSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: "#64748b",
    textAlign: "center",
  },
});