import React from "react";
import { StyleSheet, Text, View } from "react-native";


// ==============================
// Component
// ==============================

export default function AboutScreen() {

    // ==============================
    // Render
    // ==============================

    return (
        <View style={styles.container}>

            {/* ============================== */}
            {/* Header */}
            {/* ============================== */}

            <Text style={styles.title}>About</Text>

            {/* ============================== */}
            {/* About Card */}
            {/* ============================== */}

            <View style={styles.card}>
                <Text style={styles.text}>
                    This application is part of the Istanbul Smart Tourism Guide project.
                    It helps users explore historical landmarks, monuments, museums,
                    mosques, palaces, and important historical places through an
                    interactive map-based interface.
                </Text>

                <Text style={styles.text}>
                    The application was developed using React Native and Expo, with a
                    focus on usability, location-based exploration, and organized screen
                    navigation.
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
        marginBottom: 10,
    },
});