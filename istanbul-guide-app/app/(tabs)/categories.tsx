import { router } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { historicalPlaces } from "../../constants/historicalPlaces";


// ==============================
// Component
// ==============================

export default function CategoriesScreen() {

    // ==============================
    // Derived Data
    // ==============================

    const categories = [...new Set(historicalPlaces.map((place) => place.category))];


    // ==============================
    // Helper Functions
    // ==============================

    const handleCategoryPress = (category: string) => {
        router.push({
            pathname: "/",
            params: { category },
        });
    };


    // ==============================
    // Render
    // ==============================

    return (
        <ScrollView contentContainerStyle={styles.content} style={styles.container}>

            {/* ============================== */}
            {/* Header */}
            {/* ============================== */}

            <Text style={styles.title}>Categories</Text>
            <Text style={styles.subtitle}>
                Browse historical places by category and open them directly on the map.
            </Text>

            {/* ============================== */}
            {/* Category Cards */}
            {/* ============================== */}

            <View style={styles.grid}>
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        style={styles.card}
                        activeOpacity={0.85}
                        onPress={() => handleCategoryPress(category)}
                    >
                        <Text style={styles.cardTitle}>{category}</Text>
                        <Text style={styles.cardText}>
                            View {category.toLowerCase()} locations on the map
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
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

    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },

    subtitle: {
        fontSize: 14,
        color: "#374151",
        lineHeight: 20,
        marginBottom: 16,
    },

    grid: {
        gap: 10,
    },

    card: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
    },

    cardTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 6,
    },

    cardText: {
        fontSize: 13,
        color: "#6b7280",
        lineHeight: 18,
    },
});