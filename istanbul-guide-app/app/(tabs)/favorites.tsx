import React from "react";
import { StyleSheet, Text, View } from "react-native";


// ==============================
// Component
// ==============================

export default function FavoritesScreen() {

    // ==============================
    // Render
    // ==============================

    return (
        <View style={styles.container}>

            {/* ============================== */}
            {/* Header */}
            {/* ============================== */}

            <Text style={styles.title}>Favorites</Text>

            {/* ============================== */}
            {/* Empty State */}
            {/* ============================== */}

            <View style={styles.card}>
                <Text style={styles.text}>
                    No saved places yet. You can add favorites later when the detail screen
                    is connected to saved items.
                </Text>
            </View>
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
        padding: 16,
    },

    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 12,
    },

    card: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 16,
    },

    text: {
        fontSize: 14,
        color: "#374151",
        lineHeight: 20,
    },
});