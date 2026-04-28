const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const ISTANBUL_BBOX = "40.80,28.80,41.20,29.20"; // Much wider BBOX covering all of Istanbul

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
            console.warn("Overpass failed, returning seeded places only.");
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