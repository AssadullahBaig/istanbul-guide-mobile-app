import { supabase } from "./supabase";

export async function getHistoricalPlaces() {
  try {
    const { data, error } = await supabase
      .from("vw_places_with_categories")
      .select("*");

    if (error) {
      console.error("Supabase Connection Error:", error);
      throw new Error("Failed to load places");
    }

    return (data || []).map((place: any) => ({
      ...place,
      id: place.id || place.place_id,
      category: place.category_name,
    }));
  } catch (error) {
    console.error("Unexpected Error:", error);
    return [];
  }
}

export async function checkIsFavorite(userId: string, placeId: string) {
  const { data, error } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("place_id", placeId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function toggleFavorite(userId: string, placeId: string) {
  const isFavorite = await checkIsFavorite(userId, placeId);

  if (isFavorite) {
    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("place_id", placeId);

    if (error) throw error;
    return false;
  }

  const { error } = await supabase
    .from("user_favorites")
    .insert({
      user_id: userId,
      place_id: placeId,
    });

  if (error) throw error;
  return true;
}

export async function getUserFavoritePlaces(userId: string) {
  const { data: favoriteRows, error: favoriteError } = await supabase
    .from("user_favorites")
    .select("place_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (favoriteError) throw favoriteError;

  const placeIds = (favoriteRows || []).map((row) => row.place_id);
  if (placeIds.length === 0) return [];

  const { data: places, error: placesError } = await supabase
    .from("vw_places_with_categories")
    .select("*")
    .in("place_id", placeIds);

  if (placesError) throw placesError;

  const mapped = (places || []).map((place: any) => ({
    ...place,
    id: place.id || place.place_id,
    category: place.category_name,
  }));

  const orderMap = new Map(placeIds.map((id, index) => [id, index]));
  mapped.sort((a, b) => {
    const aIndex = orderMap.get(a.place_id ?? a.id) ?? 9999;
    const bIndex = orderMap.get(b.place_id ?? b.id) ?? 9999;
    return aIndex - bIndex;
  });

  return mapped;
}

export async function getUserTrips(userId: string) {
  const { data, error } = await supabase
    .from("user_trips")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createNewTrip(userId: string, tripName: string) {
  const { data, error } = await supabase
    .from("user_trips")
    .insert({
      user_id: userId,
      trip_name: tripName,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addPlaceToTrip(tripId: string, placeId: string) {
  const { error } = await supabase
    .from("trip_places")
    .insert({
      trip_id: tripId,
      place_id: placeId,
    });

  if (error) throw error;
  return true;
}

export async function removePlaceFromTrip(tripId: string, placeId: string) {
  const { error } = await supabase
    .from("trip_places")
    .delete()
    .eq("trip_id", tripId)
    .eq("place_id", placeId);

  if (error) throw error;
  return true;
}

export async function getTripPlaces(tripId: string) {
  const { data: tripPlaces, error: tripPlacesError } = await supabase
    .from("trip_places")
    .select("place_id")
    .eq("trip_id", tripId);

  if (tripPlacesError) throw tripPlacesError;

  const placeIds = (tripPlaces || []).map((item) => item.place_id);
  if (placeIds.length === 0) return [];

  const { data: places, error: placesError } = await supabase
    .from("vw_places_with_categories")
    .select("*")
    .in("place_id", placeIds);

  if (placesError) throw placesError;

  return (places || []).map((place: any) => ({
    ...place,
    id: place.id || place.place_id,
    category: place.category_name,
  }));
}

export async function getPlaceRatingStats(placeId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("place_id", placeId);

  if (error) throw error;

  const reviews = data || [];
  const reviewCount = reviews.length;

  if (reviewCount === 0) {
    return {
      averageRating: 0,
      reviewCount: 0,
    };
  }

  const total = reviews.reduce(
    (sum, item) => sum + Number(item.rating || 0),
    0
  );

  return {
    averageRating: total / reviewCount,
    reviewCount,
  };
}

export async function submitReview(
  userId: string,
  placeId: string,
  rating: number,
  comment: string
) {
  const { data: existing, error: existingError } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("place_id", placeId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        rating,
        comment,
      })
      .eq("id", existing.id);

    if (updateError) throw updateError;
    return true;
  }

  const { error: insertError } = await supabase
    .from("reviews")
    .insert({
      user_id: userId,
      place_id: placeId,
      rating,
      comment,
    });

  if (insertError) throw insertError;
  return true;
}