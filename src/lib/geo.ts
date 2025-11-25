export interface GeoResponse {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        geometry: {
            type: "Polygon" | "MultiPolygon" | "Point";
            coordinates: number[] | number[][][] | number[][][][];
        };
        properties: any;
    }>;
}

const CACHE_KEY_PREFIX = 'zip_geo_cache_v2_'; // Increment version to invalidate old cache

async function fetchFromOpenDataSoft(zipCode: string): Promise<GeoResponse | null> {
    try {
        const response = await fetch(
            `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-united-states-of-america-zcta5/records?where=zcta5_code%3D%22${zipCode}%22&limit=1`
        );

        if (!response.ok) return null;

        const data = await response.json();
        if (!data.results || data.results.length === 0) return null;

        const result = data.results[0];
        console.log("OpenDataSoft Result:", result); // Debug log

        let geometry = result.geo_shape;
        if (result.geo_shape && result.geo_shape.type === 'Feature') {
            geometry = result.geo_shape.geometry;
        }

        // Transform to GeoJSON FeatureCollection
        return {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: geometry,
                    properties: {
                        name: result.zcta5_name,
                        state: result.ste_name?.[0],
                        county: result.coty_name?.[0]
                    }
                }
            ]
        };
    } catch (e) {
        console.warn("OpenDataSoft API failed:", e);
        return null;
    }
}

export async function getZipBoundary(zipCode: string): Promise<GeoResponse | null> {
    // Check cache first
    const cached = localStorage.getItem(CACHE_KEY_PREFIX + zipCode);
    if (cached) {
        try {
            return JSON.parse(cached) as GeoResponse;
        } catch (e) {
            console.warn("Invalid cache entry for", zipCode);
            localStorage.removeItem(CACHE_KEY_PREFIX + zipCode);
        }
    }

    try {
        // Try OpenDataSoft first (Better for US Zips)
        const odsData = await fetchFromOpenDataSoft(zipCode);
        if (odsData) {
            try {
                localStorage.setItem(CACHE_KEY_PREFIX + zipCode, JSON.stringify(odsData));
            } catch (e) { }
            return odsData;
        }

        // Fallback to Nominatim
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?postalcode=${zipCode}&country=us&format=geojson&polygon_geojson=1`,
            {
                headers: {
                    "User-Agent": "ZipToH3App/1.0",
                },
            }
        );

        if (!response.ok) {
            throw new Error("Failed to fetch zip code data");
        }

        const data = await response.json();

        if (!data || data.features?.length === 0) {
            return null;
        }

        // Cache the result
        try {
            localStorage.setItem(CACHE_KEY_PREFIX + zipCode, JSON.stringify(data));
        } catch (e) {
            console.warn("Failed to cache zip data (storage might be full):", e);
        }

        return data as GeoResponse;
    } catch (error) {
        console.error("Error fetching zip boundary:", error);
        return null;
    }
}

export async function getAddressLocation(address: string): Promise<GeoResponse | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=geojson&limit=1`,
      {
        headers: {
          'User-Agent': 'ZipToHexConverter/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data as GeoResponse;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching address:', error);
    return null;
  }
}
