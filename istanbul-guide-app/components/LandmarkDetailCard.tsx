import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, TextInput } from "react-native";
import { MapItem } from "../types/map";

type Props = {
    item: MapItem;
    distanceKm: string | null;
    onClose: () => void;
};

export default function LandmarkDetailCard({
    item,
    distanceKm,
    onClose,
}: Props) {
    return (
        <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
                {item.category} • {item.period ?? "Unknown period"}
                {distanceKm ? ` • Approx ${distanceKm} km away` : ""}
            </Text>
            <Text style={styles.description}>{item.description}</Text>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        position: "absolute",
        bottom: 24,
        left: 12,
        right: 12,
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        elevation: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
    },
    meta: {
        fontSize: 13,
        color: "#6b7280",
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: "#111827",
        marginBottom: 12,
    },
    closeButton: {
        alignSelf: "flex-end",
        backgroundColor: "#111827",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    closeButtonText: {
        color: "white",
        fontWeight: "600",
    },
});