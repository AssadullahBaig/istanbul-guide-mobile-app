import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const configuredApiUrl = Constants.expoConfig?.extra?.aiApiBaseUrl as string | undefined;
const debuggerHost = Constants.expoConfig?.hostUri;
const ipAddress = debuggerHost ? debuggerHost.split(':')[0] : undefined;
const localHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

const AI_API_BASE_URL = configuredApiUrl || `http://${ipAddress || localHost}:5000`;

type DescriptionResponse = {
    shortDescription: string;
    detailedDescription: string;
};

export type ItineraryStop = {
    name: string;
    shortDescription: string;
    detailedDescription: string;
};

export type ItineraryResponse = {
    title: string;
    stops: ItineraryStop[];
};

const fallbackDescriptions: Record<string, DescriptionResponse> = {
    "Galata Tower": {
        shortDescription:
            "Galata Tower is one of Istanbul’s most iconic medieval landmarks, offering panoramic views of the Bosphorus, Golden Horn, and the historic peninsula.",
        detailedDescription:
            "Built by the Genoese in 1348, Galata Tower has stood for centuries as one of Istanbul’s most recognizable structures. Rising above Beyoğlu, it has served as a watchtower, prison, and fire observation point throughout Byzantine and Ottoman history. Today it attracts visitors with its panoramic observation deck, historic architecture, and sweeping views of the city skyline.",
    },
    "Hagia Sophia": {
        shortDescription:
            "Hagia Sophia is a world-famous architectural masterpiece that has served as both a church and mosque throughout Istanbul’s history.",
        detailedDescription:
            "Originally built in 537 AD during the Byzantine Empire, Hagia Sophia is one of the most important monuments in Istanbul. Its enormous dome, intricate mosaics, and layered religious history make it one of the city’s most visited landmarks. Over the centuries it has functioned as a cathedral, mosque, museum, and mosque again, symbolizing the cultural crossroads of Istanbul.",
    },
    "Blue Mosque": {
        shortDescription:
            "The Blue Mosque is one of Istanbul’s most famous religious landmarks, known for its six minarets and beautiful blue İznik tiles.",
        detailedDescription:
            "Officially known as Sultan Ahmed Mosque, the Blue Mosque was built in the early 17th century during the Ottoman period. Its spacious courtyard, elegant domes, and richly decorated interior make it one of the most recognizable landmarks in Istanbul. Visitors are drawn by both its architectural beauty and its historical significance near Hagia Sophia.",
    },
    "Topkapi Palace": {
        shortDescription:
            "Topkapi Palace was the administrative center of the Ottoman Empire and remains one of Istanbul’s most important historic attractions.",
        detailedDescription:
            "For nearly 400 years, Topkapi Palace served as the residence of Ottoman sultans and the political heart of the empire. The palace complex contains royal courtyards, ceremonial halls, treasury collections, and views overlooking the Bosphorus. Today it is a museum that offers insight into Ottoman court life and imperial history.",
    },
};

export async function generateLandmarkDescription(
    landmarkName: string
): Promise<DescriptionResponse> {
    const CACHE_KEY = `@ai_desc_${landmarkName.replace(/\s+/g, '_')}`;

    try {
        const response = await fetch(`${AI_API_BASE_URL}/generate-description`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                landmark: landmarkName,
                language: "English",
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to generate description: ${response.status}`);
        }

        const data = await response.json();

        const result = {
            shortDescription:
                data.shortDescription ||
                fallbackDescriptions[landmarkName]?.shortDescription ||
                `${landmarkName} is one of Istanbul's notable attractions.`,
            detailedDescription:
                data.detailedDescription ||
                fallbackDescriptions[landmarkName]?.detailedDescription ||
                `${landmarkName} is an important destination in Istanbul known for its historical and cultural significance.`,
        };

        try {
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(result));
        } catch (e) {
            console.error("Failed to cache AI description", e);
        }

        return result;
    } catch (error) {
        console.warn("AI API failed, checking cache:", error);

        try {
            const stored = await AsyncStorage.getItem(CACHE_KEY);
            if (stored) return JSON.parse(stored);
        } catch (e) {
            console.error("Failed to read AI description from cache", e);
        }

        const fallback = fallbackDescriptions[landmarkName];
        if (fallback) return fallback;

        return {
            shortDescription: `${landmarkName} is one of Istanbul's interesting destinations and remains popular among visitors.`,
            detailedDescription: `${landmarkName} is a well-known place in Istanbul that reflects the city’s rich cultural, architectural, and historical identity. It is frequently visited by both tourists and locals and plays an important role in the city’s heritage.`,
        };
    }
}

export async function generateItinerary(
    interests: string[],
    language: string = "English"
): Promise<ItineraryResponse> {
    const CACHE_KEY = `@ai_itinerary_${interests.join('_')}_${language}`;

    try {
        const response = await fetch(`${AI_API_BASE_URL}/generate-itinerary`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                interests,
                language,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to generate itinerary: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.stops || data.stops.length === 0) {
            throw new Error("API returned an empty itinerary");
        }

        try {
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to cache itinerary", e);
        }

        return data as ItineraryResponse;
    } catch (error) {
        console.warn("AI Itinerary API failed, checking cache:", error);

        try {
            const stored = await AsyncStorage.getItem(CACHE_KEY);
            if (stored) return JSON.parse(stored);
        } catch (e) {
            console.error("Failed to load itinerary from cache", e);
        }

        // Fallback generic itinerary
        return {
            title: "Istanbul Highlights Itinerary",
            stops: [
                {
                    name: "Hagia Sophia",
                    shortDescription: "A masterpiece of Byzantine architecture and a symbol of Istanbul.",
                    detailedDescription: "Start your day at Sultanahmet Square. Hagia Sophia is a world-famous architectural marvel that has stood for nearly 1,500 years. You will explore its massive dome and stunning mosaics."
                },
                {
                    name: "Topkapi Palace",
                    shortDescription: "The opulent residence of Ottoman sultans for centuries.",
                    detailedDescription: "Just a short walk from Hagia Sophia, this sprawling palace complex offers incredible views of the Bosphorus and houses the Imperial Treasury. Plan to spend a few hours exploring the courtyards."
                },
                {
                    name: "Grand Bazaar",
                    shortDescription: "One of the largest and oldest covered markets in the world.",
                    detailedDescription: "End your day wandering through the labyrinthine streets of the Grand Bazaar. Here you can shop for spices, textiles, and ceramics while enjoying a traditional Turkish tea."
                }
            ]
        };
    }
}
