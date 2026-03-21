const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

// south,west,north,east
const ISTANBUL_BBOX = "40.80,28.50,41.35,29.40";

const REQUIRED_PLACES = [
    {
        id: "seed-hagia-sophia",
        type: "landmark",
        title: "Hagia Sophia",
        description: "Historic Byzantine cathedral later converted into a mosque and museum.",
        category: "Mosque",
        latitude: 41.0086,
        longitude: 28.9802,
        period: "Byzantine / Ottoman",
    },
    {
        id: "seed-blue-mosque",
        type: "landmark",
        title: "Blue Mosque",
        description: "Famous Ottoman mosque known for its blue Iznik tiles.",
        category: "Mosque",
        latitude: 41.0055,
        longitude: 28.9768,
        period: "Ottoman",
    },
    {
        id: "seed-topkapi-palace",
        type: "landmark",
        title: "Topkapi Palace",
        description: "Residence of Ottoman sultans for nearly 400 years.",
        category: "Palace",
        latitude: 41.0115,
        longitude: 28.9833,
        period: "Ottoman",
    },
    {
        id: "seed-suleymaniye",
        type: "landmark",
        title: "Süleymaniye Mosque",
        description: "A grand Ottoman mosque designed by Mimar Sinan.",
        category: "Mosque",
        latitude: 41.0165,
        longitude: 28.9642,
        period: "Ottoman",
    },
    {
        id: "seed-basilica-cistern",
        type: "landmark",
        title: "Basilica Cistern",
        description: "Ancient underground water cistern from the Byzantine era.",
        category: "Monument",
        latitude: 41.0084,
        longitude: 28.9779,
        period: "Byzantine",
    },
    {
        id: "seed-galata-tower",
        type: "landmark",
        title: "Galata Tower",
        description: "Historic stone tower overlooking Istanbul.",
        category: "Monument",
        latitude: 41.0256,
        longitude: 28.9744,
        period: "Medieval",
    },
    {
        id: "seed-dolmabahce",
        type: "landmark",
        title: "Dolmabahçe Palace",
        description: "Lavish 19th-century Ottoman palace on the Bosphorus.",
        category: "Palace",
        latitude: 41.0392,
        longitude: 29.0007,
        period: "Ottoman",
    },
    {
        id: "seed-beylerbeyi",
        type: "landmark",
        title: "Beylerbeyi Palace",
        description: "Ottoman imperial summer palace on the Asian shore.",
        category: "Palace",
        latitude: 41.0424,
        longitude: 29.0419,
        period: "Ottoman",
    },
    {
        id: "seed-chora",
        type: "landmark",
        title: "Chora Church",
        description: "Famous for its Byzantine mosaics and frescoes.",
        category: "Museum",
        latitude: 41.0317,
        longitude: 28.9392,
        period: "Byzantine",
    },
    {
        id: "seed-maiden-tower",
        type: "landmark",
        title: "Maiden’s Tower",
        description: "Historic tower on a small islet in the Bosphorus.",
        category: "Monument",
        latitude: 41.0211,
        longitude: 29.0041,
        period: "Byzantine / Ottoman",
    },
];

function mapCategory(tags = {}, title = "") {
    const lowerTitle = title.toLowerCase();

    if (tags.tourism === "museum") return "Museum";

    if (
        lowerTitle.includes("palace") ||
        lowerTitle.includes("saray")
    ) {
        return "Palace";
    }

    if (
        lowerTitle.includes("mosque") ||
        lowerTitle.includes("camii") ||
        lowerTitle.includes("cami") ||
        lowerTitle.includes("ayasofya") ||
        tags.building === "mosque" ||
        tags.amenity === "place_of_worship" ||
        tags.religion === "muslim"
    ) {
        return "Mosque";
    }

    return "Monument";
}

function buildPeriod(tags = {}) {
    return (
        tags.start_date ||
        tags.opening_date ||
        tags.period ||
        tags["heritage:period"] ||
        tags.year_of_construction ||
        undefined
    );
}

function buildDescription(tags = {}, title = "", category = "Monument") {
    const description =
        tags["description:en"] ||
        tags.description ||
        tags["alt_name:en"];

    if (description && description.trim().length > 0) {
        return description;
    }

    if (category === "Mosque") {
        return `${title} is a historic mosque in Istanbul.`;
    }

    if (category === "Palace") {
        return `${title} is a historic palace in Istanbul.`;
    }

    if (category === "Museum") {
        return `${title} is a museum and historical attraction in Istanbul.`;
    }

    return `${title} is a historical place in Istanbul.`;
}

function getTitle(tags = {}) {
    return (
        tags["name:en"] ||
        tags.name ||
        tags.official_name ||
        tags["official_name:en"] ||
        null
    );
}

function normalizeElement(element) {
    const tags = element.tags || {};
    const title = getTitle(tags);

    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;

    if (!title || latitude == null || longitude == null) {
        return null;
    }

    const category = mapCategory(tags, title);

    return {
        id: `osm-${element.type}-${element.id}`,
        type: "landmark",
        title,
        description: buildDescription(tags, title, category),
        category,
        latitude,
        longitude,
        period: buildPeriod(tags),
    };
}

function normalizeTitle(title) {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/’/g, "'")
        .trim();
}

function dedupePlaces(places) {
    const seen = new Set();

    return places.filter((place) => {
        const key = normalizeTitle(place.title);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function isUsefulPlace(place) {
    if (!place) return false;

    const lowerTitle = place.title.toLowerCase();

    if (
        lowerTitle === "yes" ||
        lowerTitle === "building" ||
        lowerTitle === "unknown"
    ) {
        return false;
    }

    return true;
}

app.get("/health", (_req, res) => {
    res.json({ ok: true });
});

app.get("/api/places", async (_req, res) => {
    try {
        const query = `
[out:json][timeout:30];
(
  node["historic"](${ISTANBUL_BBOX});
  way["historic"](${ISTANBUL_BBOX});
  relation["historic"](${ISTANBUL_BBOX});

  node["tourism"="museum"](${ISTANBUL_BBOX});
  way["tourism"="museum"](${ISTANBUL_BBOX});
  relation["tourism"="museum"](${ISTANBUL_BBOX});

  node["heritage"](${ISTANBUL_BBOX});
  way["heritage"](${ISTANBUL_BBOX});
  relation["heritage"](${ISTANBUL_BBOX});

  node["building"="mosque"](${ISTANBUL_BBOX});
  way["building"="mosque"](${ISTANBUL_BBOX});
  relation["building"="mosque"](${ISTANBUL_BBOX});

  node["amenity"="place_of_worship"]["religion"="muslim"](${ISTANBUL_BBOX});
  way["amenity"="place_of_worship"]["religion"="muslim"](${ISTANBUL_BBOX});
  relation["amenity"="place_of_worship"]["religion"="muslim"](${ISTANBUL_BBOX});
);
out center tags;
    `.trim();

        const response = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            headers: {
                "Content-Type": "text/plain",
            },
            body: query,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Overpass error: ${response.status} ${text}`);
        }

        const data = await response.json();

        const livePlaces = (data.elements || [])
            .map(normalizeElement)
            .filter(isUsefulPlace);

        const mergedPlaces = dedupePlaces([
            ...REQUIRED_PLACES,
            ...livePlaces,
        ]).sort((a, b) => a.title.localeCompare(b.title))
            .slice(0, 120);

        res.json(mergedPlaces);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch live places data",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Places API running on http://0.0.0.0:${PORT}`);
});