const ISTANBUL_BBOX = "40.97,28.92,41.04,29.02";
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

  node["shop"](${ISTANBUL_BBOX});
  way["shop"](${ISTANBUL_BBOX});
  relation["shop"](${ISTANBUL_BBOX});
  
  node["amenity"="marketplace"](${ISTANBUL_BBOX});
  way["amenity"="marketplace"](${ISTANBUL_BBOX});
  relation["amenity"="marketplace"](${ISTANBUL_BBOX});
  
  node["tourism"="attraction"](${ISTANBUL_BBOX});
  way["tourism"="attraction"](${ISTANBUL_BBOX});
  relation["tourism"="attraction"](${ISTANBUL_BBOX});
);
out center tags;
`.trim();

fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query
}).then(res => {
    console.log("Status:", res.status);
    return res.text();
}).then(text => console.log(text.substring(0, 500)));
