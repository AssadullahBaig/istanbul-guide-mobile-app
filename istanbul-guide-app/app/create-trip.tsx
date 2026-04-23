import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../services/supabase";
import { createNewTrip } from "../services/places.services";

export default function CreateTripScreen() {
  const [tripName, setTripName] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getUserId() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    }
    getUserId();
  }, []);

  const handleCreate = async () => {
    if (!tripName.trim() || !userId) return;
    
    setLoading(true);
    const newTrip = await createNewTrip(userId, tripName.trim());
    setLoading(false);

    if (newTrip) {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan New Trip</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Trip Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Weekend in Sultanahmet"
            placeholderTextColor="#94a3b8"
            value={tripName}
            onChangeText={setTripName}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.createButton, !tripName.trim() && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={!tripName.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.createButtonText}>Create Trip</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: "#f4f6f8" 
  },
  container: { 
    flex: 1 
  },
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
  headerTitle: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: "#0f172a" 
  },
  content: { 
    padding: 24, 
    flex: 1 
  },
  label: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#334155", 
    marginBottom: 8 
  },
  input: { 
    backgroundColor: "#ffffff", 
    borderWidth: 1, 
    borderColor: "#cbd5e1", 
    borderRadius: 16, 
    padding: 18, 
    fontSize: 16, 
    color: "#0f172a", 
    marginBottom: 24 
  },
  createButton: { 
    backgroundColor: "#0f4c5c", 
    borderRadius: 16, 
    paddingVertical: 18, 
    alignItems: "center" 
  },
  createButtonDisabled: { 
    backgroundColor: "#94a3b8" 
  },
  createButtonText: { 
    color: "#ffffff", 
    fontSize: 16, 
    fontWeight: "800" 
  },
});