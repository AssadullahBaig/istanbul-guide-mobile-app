const AI_API_BASE_URL = "http://10.194.249.101:5000";

type DescriptionResponse = {
    shortDescription: string;
    detailedDescription: string;
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

        return {
            shortDescription:
                data.shortDescription ||
                fallbackDescriptions[landmarkName]?.shortDescription ||
                `${landmarkName} is one of Istanbul's notable attractions.`,
            detailedDescription:
                data.detailedDescription ||
                fallbackDescriptions[landmarkName]?.detailedDescription ||
                `${landmarkName} is an important destination in Istanbul known for its historical and cultural significance.`,
        };
    } catch (error) {
        console.error("AI API failed, using fallback:", error);

        const fallback = fallbackDescriptions[landmarkName];

        if (fallback) {
            return fallback;
        }

        return {
            shortDescription: `${landmarkName} is one of Istanbul's interesting destinations and remains popular among visitors.`,
            detailedDescription: `${landmarkName} is a well-known place in Istanbul that reflects the city’s rich cultural, architectural, and historical identity. It is frequently visited by both tourists and locals and plays an important role in the city’s heritage.`,
        };
    }
}