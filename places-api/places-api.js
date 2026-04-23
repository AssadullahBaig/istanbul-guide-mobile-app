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
            console.warn("Overpass failed, returning seeded places only.");
            return res.json(REQUIRED_PLACES);
        }

        const data = await response.json();

        const livePlaces = (data.elements || [])
            .map(normalizeElement)
            .filter(isUsefulPlace);

        const mergedPlaces = dedupePlaces([...REQUIRED_PLACES, ...livePlaces])
            .sort((a, b) => a.title.localeCompare(b.title))
            .slice(0, 120);

        res.json(mergedPlaces);
    } catch (error) {
        console.error("Places API failed, returning seeded places only:", error);
        res.json(REQUIRED_PLACES);
    }
});