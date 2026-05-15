const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const ISTANBUL_BBOX = "40.80,28.80,41.20,29.20"; // Much wider BBOX covering all of Istanbul

const REQUIRED_PLACES = [
    {
        id: "seed_1",
        type: "landmark",
        title: "Hagia Sophia",
        description: "A world-famous architectural masterpiece that has served as a church and mosque.",
        category: "Museum",
        latitude: 41.0082,
        longitude: 28.9784,
        period: "537 AD"
    },
    {
        id: "seed_2",
        type: "landmark",
        title: "Blue Mosque",
        description: "Historic mosque known for its six minarets and blue tiles.",
        category: "Mosque",
        latitude: 41.0054,
        longitude: 28.9768,
        period: "1616"
    },
    {
        id: "seed_3",
        type: "landmark",
        title: "Topkapi Palace",
        description: "The primary residence of the Ottoman sultans for nearly 400 years.",
        category: "Palace",
        latitude: 41.0115,
        longitude: 28.9833,
        period: "1465"
    },
    {
        id: "seed_4",
        type: "landmark",
        title: "Galata Tower",
        description: "A medieval stone tower offering panoramic views of Istanbul.",
        category: "Monument",
        latitude: 41.0256,
        longitude: 28.9741,
        period: "1348"
    },
    {
        id: "seed_5",
        type: "landmark",
        title: "Grand Bazaar",
        description: "One of the largest and oldest covered markets in the world.",
        category: "Shopping",
        latitude: 41.0106,
        longitude: 28.9680,
        period: "1461"
    },
    {
        id: "seed_6",
        type: "landmark",
        title: "Basilica Cistern",
        description: "The largest of several hundred ancient cisterns beneath the city.",
        category: "Historical",
        latitude: 41.0080,
        longitude: 28.9769,
        period: "532 AD"
    },
    {
        id: "seed_7",
        type: "landmark",
        title: "Dolmabahçe Palace",
        description: "An opulent 19th-century palace along the Bosphorus.",
        category: "Palace",
        latitude: 41.0391,
        longitude: 28.9981,
        period: "1856"
    },
    {
        id: "seed_8",
        type: "landmark",
        title: "Istiklal Avenue",
        description: "A famous pedestrian street filled with cafes, boutiques, and historic trams.",
        category: "Shopping",
        latitude: 41.0340,
        longitude: 28.9798,
        period: "19th Century"
    },
    {
        id: "seed_9",
        type: "landmark",
        title: "Gülhane Park",
        description: "A historical urban park adjacent to Topkapi Palace.",
        category: "Park",
        latitude: 41.0125,
        longitude: 28.9800,
        period: "1912"
    },
    {
        id: "seed_10",
        type: "landmark",
        title: "Taksim Square",
        description: "The heart of modern Istanbul, known for restaurants, shops, and hotels.",
        category: "Monument",
        latitude: 41.0370,
        longitude: 28.9850,
        period: "Modern"
    }
];

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
    else if (tags.shop || tags.amenity === "marketplace") category = "Shopping";
    else if (tags.historic === "palace" || tags.building === "palace") category = "Palace";
    else if (tags.historic === "castle" || tags.historic === "fort") category = "Palace";
    else if (tags.historic === "monument" || tags.historic === "memorial") category = "Monument";
    else if (tags.historic === "battlefield" || tags.historic === "archaeological_site" || tags.historic === "ruins") category = "Historical Event";
    else if (tags.amenity === "events_venue" || tags.amenity === "theatre" || tags.amenity === "arts_centre" || tags.leisure === "stadium" || tags.amenity === "cinema") category = "Event";
    else if (tags.historic) category = "Historical";
    else if (tags.tourism === "attraction") category = "Historical";

    return {
        id: String(el.type || "osm") + "_" + String(el.id),
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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

let cachedMergedPlaces = null;
let lastCacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

app.get("/api/places", async (_req, res) => {
    try {
        if (cachedMergedPlaces && (Date.now() - lastCacheTime < CACHE_DURATION)) {
            console.log("Serving places from server cache...");
            return res.json(cachedMergedPlaces);
        }

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

  node["leisure"="park"](${ISTANBUL_BBOX});
  way["leisure"="park"](${ISTANBUL_BBOX});
  relation["leisure"="park"](${ISTANBUL_BBOX});

  node["amenity"="restaurant"](${ISTANBUL_BBOX});
  node["amenity"="cafe"](${ISTANBUL_BBOX});
  node["shop"](${ISTANBUL_BBOX});
  
  node["amenity"="marketplace"](${ISTANBUL_BBOX});
  way["amenity"="marketplace"](${ISTANBUL_BBOX});
  relation["amenity"="marketplace"](${ISTANBUL_BBOX});
  
  node["tourism"="attraction"](${ISTANBUL_BBOX});
  way["tourism"="attraction"](${ISTANBUL_BBOX});
  relation["tourism"="attraction"](${ISTANBUL_BBOX});

  node["historic"="battlefield"](${ISTANBUL_BBOX});
  node["historic"="archaeological_site"](${ISTANBUL_BBOX});
  node["historic"="ruins"](${ISTANBUL_BBOX});

  node["amenity"="events_venue"](${ISTANBUL_BBOX});
  node["amenity"="theatre"](${ISTANBUL_BBOX});
  node["amenity"="arts_centre"](${ISTANBUL_BBOX});
  node["leisure"="stadium"](${ISTANBUL_BBOX});
  node["amenity"="cinema"](${ISTANBUL_BBOX});
);
out center tags;
    `.trim();

        const response = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "IstanbulGuideApp/1.0"
            },
            body: "data=" + encodeURIComponent(query),
        });

        if (!response.ok) {
            console.warn("Overpass failed, returning cached or seeded places only. Status:", response.status);
            if (cachedMergedPlaces) {
                return res.json(cachedMergedPlaces);
            }
            return res.json(REQUIRED_PLACES);
        }

        const data = await response.json();

        const livePlaces = (data.elements || [])
            .map(normalizeElement)
            .filter(isUsefulPlace);

        const allPlaces = dedupePlaces([...REQUIRED_PLACES, ...livePlaces]);
        shuffleArray(allPlaces); // Randomize locations instead of clustering them

        const byCategory = {};
        for (const p of allPlaces) {
            if (!byCategory[p.category]) byCategory[p.category] = [];
            byCategory[p.category].push(p);
        }

        const targetTotal = 150;
        const categories = Object.keys(byCategory);
        let mergedPlaces = [];
        
        let added = true;
        let index = 0;
        while (mergedPlaces.length < targetTotal && added) {
            added = false;
            for (const cat of categories) {
                if (mergedPlaces.length >= targetTotal) break;
                if (index < byCategory[cat].length) {
                    mergedPlaces.push(byCategory[cat][index]);
                    added = true;
                }
            }
            index++;
        }

        cachedMergedPlaces = mergedPlaces;
        lastCacheTime = Date.now();

        res.json(mergedPlaces);
    } catch (error) {
        console.error("Places API failed, returning cached or seeded places only:", error);
        if (cachedMergedPlaces) {
            return res.json(cachedMergedPlaces);
        }
        res.json(REQUIRED_PLACES);
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log("Places API is running on port " + PORT);
});