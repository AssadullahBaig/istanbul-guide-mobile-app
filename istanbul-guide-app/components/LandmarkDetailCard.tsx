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
                {item.category}
                {item.period ? ` • ${item.period}` : ""}
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
        bottom: 20,
        left: 12,
        right: 12,
        backgroundColor: "white",
        borderRadius: 18,
        padding: 18,
        elevation: 5,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 6,
    },
    meta: {
        fontSize: 12,
        color: "#6b7280",
        marginBottom: 10,
    },
    description: {
        fontSize: 13,
        color: "#111827",
        marginBottom: 14,
        lineHeight: 18,
    },
    closeButton: {
        alignSelf: "flex-end",
        backgroundColor: "#111827",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    closeButtonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 14,
    },
});