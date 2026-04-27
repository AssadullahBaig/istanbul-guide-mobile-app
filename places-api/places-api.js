const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const ISTANBUL_BBOX = "40.97,28.92,41.04,29.02";

const REQUIRED_PLACES = [];

function isUsefulPlace(place) {
    return place.title && place.title !== "Unknown Place" && place.latitude && place.longitude;
}

function normalizeElement(el) {
    const tags = el.tags || {};
    
    let category = "Monument";
    if (tags.tourism === "museum") category = "Museum";
    else if (tags.building === "mosque" || tags.religion === "muslim") category = "Mosque";
    else if (tags.amenity === "restaurant") category = "Restaurant";
    else if (tags.amenity === "cafe") category = "Cafe";
    else if (tags.leisure === "park") category = "Park";
    else if (tags.shop) category = "Shopping";
    else if (tags.historic === "palace" || tags.building === "palace") category = "Palace";
    else if (tags.historic) category = "Historical";

    return {
        id: String(el.id),
        type: "landmark",
        title: tags.name || tags["name:en"] || "Unknown Place",
        description: tags.description || tags["description:en"] || tags.wikipedia || "A notable place in Istanbul.",
        category: category,
        latitude: el.lat || (el.center && el.center.lat),
        longitude: el.lon || (el.center && el.center.lon),
        period: tags.start_date || tags.historic_period || null
    };
}

function dedupePlaces(places) {
    const seen = new Set();
    return places.filter(place => {
        if (seen.has(place.id)) return false;
        seen.add(place.id);
        return true;
    });
}

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

  node["amenity"="restaurant"](${ISTANBUL_BBOX});
  way["amenity"="restaurant"](${ISTANBUL_BBOX});
  relation["amenity"="restaurant"](${ISTANBUL_BBOX});

  node["amenity"="cafe"](${ISTANBUL_BBOX});
  way["amenity"="cafe"](${ISTANBUL_BBOX});
  relation["amenity"="cafe"](${ISTANBUL_BBOX});

  node["leisure"="park"](${ISTANBUL_BBOX});
  way["leisure"="park"](${ISTANBUL_BBOX});
  relation["leisure"="park"](${ISTANBUL_BBOX});

  node["shop"="mall"](${ISTANBUL_BBOX});
  way["shop"="mall"](${ISTANBUL_BBOX});
  relation["shop"="mall"](${ISTANBUL_BBOX});
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
            console.warn("Overpass failed, returning seeded places only.");
            return res.json(REQUIRED_PLACES);
        }

        const data = await response.json();

        const livePlaces = (data.elements || [])
            .map(normalizeElement)
            .filter(isUsefulPlace);

        const mergedPlaces = dedupePlaces([...REQUIRED_PLACES, ...livePlaces])
            .sort((a, b) => a.title.localeCompare(b.title))
            .slice(0, 500);

        res.json(mergedPlaces);
    } catch (error) {
        console.error("Places API failed, returning seeded places only:", error);
        res.json(REQUIRED_PLACES);
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log("Places API is running on port " + PORT);
});