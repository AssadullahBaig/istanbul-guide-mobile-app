import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getTripPlaces, removePlaceFromTrip } from '../../services/places.services';

export default function TripDetailsScreen() {
  const { id, name } = useLocalSearchParams();
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlaces = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const data = await getTripPlaces(id as string);
    setPlaces(data || []);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadPlaces();
    }, [loadPlaces])
  );

  const handleRemove = (placeId: string, placeTitle: string) => {
    Alert.alert(
      "Remove Place",
      `Are you sure you want to remove ${placeTitle} from this trip?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const success = await removePlaceFromTrip(id as string, placeId);
            if (success) {
              setPlaces(current => current.filter(p => p.id !== placeId));
            }
          }
        }
      ]
    );
  };

  const openPlaceOnMap = (item: any) => {
    const url = `/?focusTitle=${encodeURIComponent(item.title)}&focusLat=${item.latitude}&focusLng=${item.longitude}&focusKey=${Date.now()}`;
    router.push(url as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {name || "Trip Details"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f4c5c" />
        </View>
      ) : places.length === 0 ? (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="map" size={48} color="#0f4c5c" />
            </View>
            <Text style={styles.emptyTitle}>Your Itinerary is Empty</Text>
            <Text style={styles.emptyText}>
              You haven't added any historical places to this trip yet. Go back to the map or saved places to start building your route.
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push("/(tabs)" as any)}
            >
              <Text style={styles.exploreButtonText}>Explore Places on Map</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.listContent}>
          {places.map((place) => (
            <TouchableOpacity 
              key={place.id} 
              style={styles.listCard} 
              activeOpacity={0.88}
              onPress={() => openPlaceOnMap(place)}
            >
              <Image 
                source={{ uri: (place.media && place.media.length > 0) ? place.media[0] : "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=900&q=80" }} 
                style={styles.listImage} 
              />
              <View style={styles.listContentText}>
                <Text style={styles.listTitle} numberOfLines={1}>{place.title}</Text>
                <Text style={styles.listSubtitle}>
                  {place.category} {place.period ? `• ${place.period}` : ""}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleRemove(place.id, place.title)}
              >
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f6f8" },
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: "#ffffff", 
    borderBottomWidth: 1, 
    borderBottomColor: "#e2e8f0" 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    alignItems: "center", 
    justifyContent: "center", 
    borderRadius: 20, 
    backgroundColor: "#f1f5f9" 
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", maxWidth: 200, textAlign: "center" },
  content: { padding: 24, flexGrow: 1, justifyContent: "center" },
  listContent: { padding: 16, paddingBottom: 40 },
  emptyContainer: { alignItems: "center", paddingVertical: 40 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#e2e8f0", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: "900", color: "#0f172a", marginBottom: 12 },
  emptyText: { fontSize: 15, color: "#64748b", textAlign: "center", lineHeight: 24, marginBottom: 32, paddingHorizontal: 20 },
  exploreButton: { backgroundColor: "#0f4c5c", paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16 },
  exploreButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  
  // Liste stilleri
  listCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", borderRadius: 24, padding: 16, marginBottom: 14 },
  listImage: { width: 70, height: 70, borderRadius: 16, marginRight: 14 },
  listContentText: { flex: 1, paddingRight: 10 },
  listTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  listSubtitle: { fontSize: 13, lineHeight: 20, color: "#64748b" },
  removeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" }
});