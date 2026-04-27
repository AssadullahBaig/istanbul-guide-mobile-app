import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { supabase } from "../services/supabase";
import {
    addPlaceToTrip,
    checkIsFavorite,
    createNewTrip,
    getPlaceRatingStats,
    getUserTrips,
    submitReview,
    toggleFavorite,
    ensurePlaceInDb,
} from "../services/places.services";
import { generateLandmarkDescription } from "../services/ai.service";
import { MapItem } from "../types/map";

type Props = {
    item: MapItem;
    distanceKm?: string | null;
    onClose: () => void;
};

type TripRow = {
    id: string;
    trip_name?: string;
    name?: string;
    title?: string;
};

export default function LandmarkDetailCard({
    item,
    distanceKm,
    onClose,
}: Props) {
    const { t } = useTranslation();
    const categoryColor = getCategoryColor(item.category);

    const [userId, setUserId] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [favoriteLoading, setFavoriteLoading] = useState(false);

    const [averageRating, setAverageRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);
    const [statsLoading, setStatsLoading] = useState(true);

    const [tripModalVisible, setTripModalVisible] = useState(false);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);

    const [trips, setTrips] = useState<TripRow[]>([]);
    const [tripsLoading, setTripsLoading] = useState(false);
    const [creatingTrip, setCreatingTrip] = useState(false);
    const [newTripName, setNewTripName] = useState("");

    const [selectedRating, setSelectedRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    const [aiLoading, setAiLoading] = useState(false);
    const [shortAiDescription, setShortAiDescription] = useState("");
    const [detailedAiDescription, setDetailedAiDescription] = useState("");

    const displayedTripCount = useMemo(() => trips.length, [trips.length]);

    useEffect(() => {
        let active = true;

        async function init() {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!active) return;

                setUserId(user?.id ?? null);

                if (user?.id) {
                    try {
                        const favorite = await checkIsFavorite(user.id, item.id);
                        if (active) {
                            setIsFavorite(favorite);
                        }
                    } catch (error) {
                        console.error("Failed to check favorite:", error);
                    }
                }

                try {
                    const stats = await getPlaceRatingStats(item.id);
                    if (active) {
                        setAverageRating(stats.averageRating ?? 0);
                        setReviewCount(stats.reviewCount ?? 0);
                    }
                } catch (error) {
                    console.error("Failed to load rating stats:", error);
                }
            } finally {
                if (active) {
                    setStatsLoading(false);
                }
            }
        }

        init();

        return () => {
            active = false;
        };
    }, [item.id]);

    const requireAuth = () => {
        if (!userId) {
            Alert.alert(
                t('card.signInRequired'),
                t('card.signInRequiredDesc')
            );
            return false;
        }
        return true;
    };

    const handleToggleFavorite = async () => {
        if (!requireAuth() || favoriteLoading || !userId) return;

        try {
            setFavoriteLoading(true);
            const dbPlaceId = await ensurePlaceInDb(item);
            const newValue = await toggleFavorite(userId, dbPlaceId);
            setIsFavorite(newValue);
        } catch (error) {
            console.error("Failed to toggle favorite:", error);
            Alert.alert(t('card.error'), "Could not update your saved place.");
        } finally {
            setFavoriteLoading(false);
        }
    };

    const openTripModal = async () => {
        if (!requireAuth() || !userId) return;

        try {
            setTripModalVisible(true);
            setTripsLoading(true);
            const data = await getUserTrips(userId);
            setTrips(data || []);
        } catch (error) {
            console.error("Failed to load trips:", error);
            Alert.alert(t('card.error'), "Could not load your trips.");
        } finally {
            setTripsLoading(false);
        }
    };

    const handleAddToTrip = async (tripId: string) => {
        try {
            const dbPlaceId = await ensurePlaceInDb(item);
            await addPlaceToTrip(tripId, dbPlaceId);
            setTripModalVisible(false);
            Alert.alert(t('card.added'), t('card.addedDesc', { title: item.title }));
        } catch (error: any) {
            console.error("Failed to add to trip:", error);
            Alert.alert(t('card.error'), error?.message || "Could not add place to trip.");
        }
    };

    const handleCreateTrip = async () => {
        if (!requireAuth() || !userId) return;

        const name = newTripName.trim();
        if (!name) {
            Alert.alert(t('card.missingName'), t('card.missingNameDesc'));
            return;
        }

        try {
            setCreatingTrip(true);
            const createdTrip = await createNewTrip(userId, name);
            setTrips((prev) => [createdTrip, ...prev]);
            setNewTripName("");
            await handleAddToTrip(createdTrip.id);
        } catch (error: any) {
            console.error("Failed to create trip:", error);
            Alert.alert(t('card.error'), error?.message || "Could not create a new trip.");
        } finally {
            setCreatingTrip(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!requireAuth() || !userId) return;

        if (selectedRating < 1) {
            Alert.alert(t('card.missingRating'), t('card.missingRatingDesc'));
            return;
        }

        try {
            setSubmittingReview(true);
            const dbPlaceId = await ensurePlaceInDb(item);
            await submitReview(userId, dbPlaceId, selectedRating, reviewComment.trim());

            const stats = await getPlaceRatingStats(dbPlaceId);
            setAverageRating(stats.averageRating ?? 0);
            setReviewCount(stats.reviewCount ?? 0);

            setReviewModalVisible(false);
            setSelectedRating(0);
            setReviewComment("");

            Alert.alert(t('card.thankYou'), t('card.reviewSaved'));
        } catch (error: any) {
            console.error("Failed to submit review:", error);
            Alert.alert(t('card.error'), error?.message || "Could not save your review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleGenerateAiDescription = async () => {
        try {
            setAiLoading(true);
            const result = await generateLandmarkDescription(item.title);
            setShortAiDescription(result.shortDescription || "");
            setDetailedAiDescription(result.detailedDescription || "");
        } catch (error: any) {
            console.error("Failed to generate AI description:", error);
            Alert.alert(
                t('card.aiError'),
                error?.message || "Could not generate the AI description."
            );
        } finally {
            setAiLoading(false);
        }
    };

    const displayTripName = (trip: TripRow) =>
        trip.trip_name || trip.name || trip.title || "Untitled Trip";

    return (
        <>
            <View style={styles.wrapper}>
                <View style={styles.handle} />

                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <View
                            style={[
                                styles.categoryBadge,
                                { backgroundColor: `${categoryColor}18` },
                            ]}
                        >
                            <View
                                style={[
                                    styles.categoryDot,
                                    { backgroundColor: categoryColor },
                                ]}
                            />
                            <Text
                                style={[styles.categoryBadgeText, { color: categoryColor }]}
                            >
                                {item.category}
                            </Text>
                        </View>

                        {!!item.period && <Text style={styles.periodText}>{item.period}</Text>}
                    </View>

                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </Pressable>
                </View>

                <Text style={styles.title}>{item.title}</Text>

                <View style={styles.metaRow}>
                    {!!distanceKm && (
                        <View style={styles.metaPill}>
                            <Text style={styles.metaPillLabel}>{t('card.distance')}</Text>
                            <Text style={styles.metaPillValue}>{distanceKm} km</Text>
                        </View>
                    )}

                    {item.period ? (
                        <View style={styles.metaPill}>
                            <Text style={styles.metaPillLabel}>{t('card.period')}</Text>
                            <Text style={styles.metaPillValue} numberOfLines={1}>
                                {item.period}
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.metaPill}>
                        <Text style={styles.metaPillLabel}>{t('card.rating')}</Text>
                        {statsLoading ? (
                            <ActivityIndicator size="small" color="#0f4c5c" />
                        ) : (
                            <Text style={styles.metaPillValue}>
                                {reviewCount > 0 ? `${averageRating.toFixed(1)} ★` : t('card.noReviews')}
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            isFavorite && styles.actionButtonPrimary,
                        ]}
                        onPress={handleToggleFavorite}
                        activeOpacity={0.88}
                        disabled={favoriteLoading}
                    >
                        {favoriteLoading ? (
                            <ActivityIndicator color={isFavorite ? "#ffffff" : "#0f172a"} />
                        ) : (
                            <>
                                <Ionicons
                                    name={isFavorite ? "heart" : "heart-outline"}
                                    size={18}
                                    color={isFavorite ? "#ffffff" : "#0f172a"}
                                />
                                <Text
                                    style={[
                                        styles.actionButtonText,
                                        isFavorite && styles.actionButtonTextPrimary,
                                    ]}
                                >
                                    {isFavorite ? t('card.saved') : t('card.save')}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={openTripModal}
                        activeOpacity={0.88}
                    >
                        <Ionicons name="add-circle-outline" size={18} color="#0f172a" />
                        <Text style={styles.actionButtonText}>{t('card.trip')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setReviewModalVisible(true)}
                        activeOpacity={0.88}
                    >
                        <Ionicons name="star-outline" size={18} color="#0f172a" />
                        <Text style={styles.actionButtonText}>{t('card.review')}</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    style={{ flex: 1, marginTop: 4 }} 
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.description}>{item.description}</Text>

                    <View style={styles.aiSection}>
                        <View style={styles.aiHeaderRow}>
                            <View>
                                <Text style={styles.aiTitle}>{t('card.aiDescription')}</Text>
                                <Text style={styles.aiSubtitle}>
                                    {t('card.aiSubtitle')}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.aiButton}
                                onPress={handleGenerateAiDescription}
                                activeOpacity={0.88}
                                disabled={aiLoading}
                            >
                                {aiLoading ? (
                                    <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="sparkles-outline" size={16} color="#ffffff" />
                                        <Text style={styles.aiButtonText}>{t('card.generate')}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {!!shortAiDescription && (
                            <View style={styles.aiCard}>
                                <Text style={styles.aiCardLabel}>{t('card.short')}</Text>
                                <Text style={styles.aiCardText}>{shortAiDescription}</Text>
                            </View>
                        )}

                        {!!detailedAiDescription && (
                            <View style={styles.aiCard}>
                                <Text style={styles.aiCardLabel}>{t('card.detailed')}</Text>
                                <Text style={styles.aiCardText}>{detailedAiDescription}</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>

            <Modal
                visible={tripModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setTripModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('card.addToTrip')}</Text>
                            <TouchableOpacity onPress={() => setTripModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#475569" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            {t('card.chooseTrip')}
                        </Text>

                        <View style={styles.createTripBox}>
                            <TextInput
                                style={styles.createTripInput}
                                placeholder={t('card.newTripName')}
                                placeholderTextColor="#94a3b8"
                                value={newTripName}
                                onChangeText={setNewTripName}
                            />
                            <TouchableOpacity
                                style={styles.createTripButton}
                                onPress={handleCreateTrip}
                                disabled={creatingTrip}
                            >
                                {creatingTrip ? (
                                    <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                    <Text style={styles.createTripButtonText}>{t('card.create')}</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {tripsLoading ? (
                            <View style={styles.modalLoadingWrap}>
                                <ActivityIndicator size="large" color="#0f4c5c" />
                            </View>
                        ) : (
                            <ScrollView
                                style={styles.modalList}
                                contentContainerStyle={{ paddingBottom: 8 }}
                                showsVerticalScrollIndicator={false}
                            >
                                <Text style={styles.tripCountText}>
                                    {t('card.tripCount', { count: displayedTripCount })}
                                </Text>

                                {trips.length === 0 ? (
                                    <Text style={styles.emptyModalText}>
                                        {t('card.noTrips')}
                                    </Text>
                                ) : (
                                    trips.map((trip) => (
                                        <TouchableOpacity
                                            key={trip.id}
                                            style={styles.tripRow}
                                            onPress={() => handleAddToTrip(trip.id)}
                                        >
                                            <View style={styles.tripRowLeft}>
                                                <View style={styles.tripIconWrap}>
                                                    <Ionicons
                                                        name="map-outline"
                                                        size={18}
                                                        color="#0f4c5c"
                                                    />
                                                </View>
                                                <Text style={styles.tripNameText}>
                                                    {displayTripName(trip)}
                                                </Text>
                                            </View>
                                            <Ionicons
                                                name="chevron-forward"
                                                size={20}
                                                color="#64748b"
                                            />
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            <Modal
                visible={reviewModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setReviewModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('card.leaveReview')}</Text>
                            <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#475569" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            {t('card.shareExperience', { title: item.title })}
                        </Text>

                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setSelectedRating(star)}
                                    style={styles.starButton}
                                >
                                    <Ionicons
                                        name={selectedRating >= star ? "star" : "star-outline"}
                                        size={30}
                                        color="#f59e0b"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={styles.reviewInput}
                            placeholder={t('card.writeThoughts')}
                            placeholderTextColor="#94a3b8"
                            multiline
                            value={reviewComment}
                            onChangeText={setReviewComment}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={styles.submitReviewButton}
                            onPress={handleSubmitReview}
                            disabled={submittingReview}
                        >
                            {submittingReview ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                                <Text style={styles.submitReviewButtonText}>{t('card.submitReview')}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

function getCategoryColor(category: MapItem["category"]) {
    switch (category) {
        case "Mosque":
            return "#2563eb";
        case "Palace":
            return "#7c3aed";
        case "Museum":
            return "#059669";
        case "Historical Event":
        case "Event":
            return "#dc2626";
        case "Monument":
            return "#d97706";
        case "Restaurant":
            return "#eab308";
        case "Cafe":
            return "#ea580c";
        case "Park":
            return "#10b981";
        case "Shopping":
            return "#f43f5e";
        case "Historical":
            return "#8b5cf6";
        default:
            return "#0f766e";
    }
}

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: "rgba(255,255,255,0.98)",
        borderRadius: 28,
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 18,
        shadowColor: "#0f172a",
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
        borderWidth: 1,
        borderColor: "#eef2f7",
        maxHeight: "100%",
    },

    handle: {
        alignSelf: "center",
        width: 52,
        height: 6,
        borderRadius: 999,
        backgroundColor: "#dbe3ea",
        marginBottom: 14,
    },

    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
    },

    headerLeft: {
        flex: 1,
        paddingRight: 12,
    },

    categoryBadge: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 999,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 8,
    },

    categoryDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },

    categoryBadgeText: {
        fontSize: 12,
        fontWeight: "800",
    },

    periodText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#64748b",
    },

    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
    },

    closeButtonText: {
        fontSize: 16,
        fontWeight: "800",
        color: "#475569",
    },

    title: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "800",
        color: "#0f172a",
        marginBottom: 14,
    },

    metaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 14,
    },

    metaPill: {
        minWidth: 120,
        backgroundColor: "#f8fafc",
        borderRadius: 18,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#eef2f7",
    },

    metaPillLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#64748b",
        marginBottom: 4,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },

    metaPillValue: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0f172a",
    },

    actionsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 14,
    },

    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#f8fafc",
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: "#e5edf4",
    },

    actionButtonPrimary: {
        backgroundColor: "#0f4c5c",
        borderColor: "#0f4c5c",
    },

    actionButtonText: {
        fontSize: 14,
        fontWeight: "800",
        color: "#0f172a",
    },

    actionButtonTextPrimary: {
        color: "#ffffff",
    },

    description: {
        fontSize: 15,
        lineHeight: 23,
        color: "#334155",
        marginBottom: 16,
    },

    aiSection: {
        backgroundColor: "#f8fafc",
        borderRadius: 22,
        padding: 14,
        borderWidth: 1,
        borderColor: "#eaf0f5",
    },

    aiHeaderRow: {
        gap: 12,
        marginBottom: 6,
    },

    aiTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#0f172a",
        marginBottom: 4,
    },

    aiSubtitle: {
        fontSize: 13,
        lineHeight: 20,
        color: "#64748b",
    },

    aiButton: {
        marginTop: 6,
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#0f4c5c",
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },

    aiButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "800",
    },

    aiCard: {
        marginTop: 12,
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: "#ebf1f5",
    },

    aiCardLabel: {
        fontSize: 12,
        fontWeight: "800",
        color: "#0f4c5c",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },

    aiCardText: {
        fontSize: 14,
        lineHeight: 22,
        color: "#334155",
    },

    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.36)",
        justifyContent: "flex-end",
    },

    modalCard: {
        backgroundColor: "#ffffff",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 28,
        maxHeight: "80%",
    },

    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    modalTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#0f172a",
    },

    modalSubtitle: {
        marginTop: 8,
        marginBottom: 16,
        fontSize: 14,
        lineHeight: 21,
        color: "#64748b",
    },

    createTripBox: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 14,
    },

    createTripInput: {
        flex: 1,
        backgroundColor: "#f8fafc",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 15,
        color: "#0f172a",
        borderWidth: 1,
        borderColor: "#e7edf3",
    },

    createTripButton: {
        backgroundColor: "#0f4c5c",
        borderRadius: 16,
        paddingHorizontal: 16,
        justifyContent: "center",
        alignItems: "center",
        minWidth: 84,
    },

    createTripButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "800",
    },

    modalLoadingWrap: {
        paddingVertical: 30,
        alignItems: "center",
        justifyContent: "center",
    },

    modalList: {
        maxHeight: 320,
    },

    tripCountText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#64748b",
        marginBottom: 10,
    },

    emptyModalText: {
        fontSize: 14,
        color: "#64748b",
        lineHeight: 22,
    },

    tripRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#f8fafc",
        borderRadius: 18,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#eaf0f4",
    },

    tripRowLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        paddingRight: 12,
    },

    tripIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#eaf4f7",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    tripNameText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
    },

    starsRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 18,
    },

    starButton: {
        paddingHorizontal: 6,
    },

    reviewInput: {
        minHeight: 120,
        backgroundColor: "#f8fafc",
        borderRadius: 18,
        padding: 14,
        fontSize: 15,
        lineHeight: 22,
        color: "#0f172a",
        borderWidth: 1,
        borderColor: "#e7edf3",
        marginBottom: 16,
    },

    submitReviewButton: {
        backgroundColor: "#0f4c5c",
        borderRadius: 16,
        minHeight: 54,
        alignItems: "center",
        justifyContent: "center",
    },

    submitReviewButtonText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "800",
    },
});