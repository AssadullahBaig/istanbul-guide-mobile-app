import { supabase } from "./supabase";
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const ipAddress = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

const PLACES_API_BASE_URL = `http://${ipAddress}:4000`;

let cachedPlaces: any[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export async function getHistoricalPlaces() {
  if (cachedPlaces && Date.now() - lastFetchTime < CACHE_TTL) {
    return cachedPlaces;
  }

  try {
    let dbPlaces: any[] = [];
    const { data, error } = await supabase
      .from("vw_places_with_categories")
      .select("*");

    if (error) {
      console.error("Supabase Connection Error:", error);
    } else if (data) {
      dbPlaces = data.map((place: any) => ({
        ...place,
        id: String(place.id || place.place_id),
        category: place.category_name,
      }));
    }

    let apiPlaces: any[] = [];
    try {
      const response = await fetch(`${PLACES_API_BASE_URL}/api/places`);
      if (response.ok) {
        apiPlaces = await response.json();
      } else {
        console.warn("Places API returned non-ok status:", response.status);
      }
    } catch (apiError) {
      console.warn("Places API is unreachable:", apiError);
    }

    const combined = [...dbPlaces, ...apiPlaces];
    const seen = new Set();
    const result = combined.filter((place) => {
      if (!place.id) return false;
      const key = String(place.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    cachedPlaces = result;
    lastFetchTime = Date.now();
    return result;
  } catch (error) {
    console.error("Unexpected Error in getHistoricalPlaces:", error);
    return cachedPlaces || [];
  }
}

export async function ensurePlaceInDb(place: any): Promise<string> {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(place.id);
  if (isUUID) return place.id;

  const { data: existing } = await supabase
    .from("places")
    .select("id")
    .eq("title", place.title)
    .limit(1);

  if (existing && existing.length > 0) return existing[0].id;

  let categoryId = null;
  if (place.category) {
    const { data: catData } = await supabase
      .from("categories")
      .select("id")
      .eq("name", place.category)
      .maybeSingle();
    if (catData) categoryId = catData.id;
  }

  const { data: inserted, error } = await supabase
    .from("places")
    .insert({
      title: place.title,
      description: place.description || "",
      latitude: place.latitude,
      longitude: place.longitude,
      category_id: categoryId,
    })
    .select("id")
    .single();

  if (error) throw new Error("Could not sync API place to database.");
  return inserted.id;
}

export async function checkIsFavorite(userId: string, placeId: string) {
  const { data, error } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("place_id", placeId)
    .maybeSingle();

  if (error) {
    if (error.code === '22P02') return false; // Not a DB UUID, so it can't be a favorite
    throw error;
  }
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

  const allPlaces = await getHistoricalPlaces();
  
  const mapped = [];
  for (const id of placeIds) {
    const p = allPlaces.find((x: any) => x.id === id || x.place_id === id);
    if (p) {
      mapped.push(p);
    }
  }

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

  const allPlaces = await getHistoricalPlaces();
  
  const mapped = [];
  for (const id of placeIds) {
    const p = allPlaces.find((x: any) => x.id === id || x.place_id === id);
    if (p) {
      mapped.push(p);
    }
  }

  return mapped;
}

export async function getPlaceRatingStats(placeId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("place_id", placeId);

  if (error) {
    if (error.code === '22P02') {
      return { averageRating: 0, reviewCount: 0 };
    }
    throw error;
  }

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

export async function getPlaceReviews(placeId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("place_id", placeId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === '22P02') {
      return []; // invalid uuid format means no reviews yet
    }
    throw error;
  }
  return data || [];
}