import * as h3 from "h3-js";

// GeoJSON is [lng, lat], H3 expects [lat, lng] usually, but let's verify.
// h3.polygonToCells(coordinates, res, isGeoJson)
// If isGeoJson is true, it expects [lng, lat] (GeoJSON standard).
// So we can pass GeoJSON coordinates directly if we set the flag.

// Helper to fill gaps with higher resolution hexes (optimized with compactCells)
function fillPolygonWithGaps(coordinates: number[][], resolution: number, isGeoJson: boolean): string[] {
    try {
        // 1. Generate hexes at the finest resolution (base + 2)
        // This gives us maximum detail at the edges
        const fineRes = resolution + 2;
        const fineHexes = h3.polygonToCells(coordinates, fineRes, isGeoJson);

        // 2. Compact the hexes
        // This merges the fine hexes into larger ones where they fill a complete parent
        const compactedHexes = h3.compactCells(fineHexes);

        // 3. Filter and Uncompact
        // We want to keep the optimization (larger hexes), but we don't want hexes
        // larger than our requested base 'resolution'.
        const finalHexes: string[] = [];

        for (const hex of compactedHexes) {
            const hexRes = h3.getResolution(hex);

            if (hexRes < resolution) {
                // If the compacted hex is larger than our target base resolution,
                // uncompact it down to the target resolution.
                // This ensures we don't show huge hexes when the user asked for a specific granularity.
                const children = h3.cellToChildren(hex, resolution);
                finalHexes.push(...children);
            } else {
                // If it's at target resolution or smaller (higher res), keep it.
                finalHexes.push(hex);
            }
        }

        return finalHexes;
    } catch (e) {
        console.error("Error in multi-res fill:", e);
        return [];
    }
}

export function getHexesForPolygon(coordinates: number[][][], resolution: number, useMultiRes: boolean = true): string[] {
    // Handle Polygon (single ring or with holes)
    // coordinates[0] is the outer ring
    // h3.polygonToCells takes the loop directly if it's a simple polygon, 
    // or we might need to handle holes.
    // For simplicity, let's assume the first ring is the outer boundary.

    // h3-js v4 signature: polygonToCells(coordinates, res, isGeoJson)
    // coordinates: number[][] (array of [lat, lng] or [lng, lat])

    // Wait, h3.polygonToCells takes `coordinates` which is `number[][]`.
    // If we have a Polygon, `coordinates` is `number[][][]` (array of rings).
    // We need to pass the outer ring.

    const outerRing = coordinates[0];

    try {
        // isGeoJson = true means input is [lng, lat]
        let hexes: string[];
        if (useMultiRes) {
            hexes = fillPolygonWithGaps(outerRing, resolution, true);
        } else {
            hexes = h3.polygonToCells(outerRing, resolution, true);
        }

        // Fallback: If no hexes are generated (polygon too small for resolution),
        // find the centroid and return that hex.
        if (hexes.length === 0 && outerRing.length > 0) {
            // Simple centroid calculation
            let latSum = 0;
            let lngSum = 0;
            outerRing.forEach(coord => {
                lngSum += coord[0];
                latSum += coord[1];
            });
            const centerLat = latSum / outerRing.length;
            const centerLng = lngSum / outerRing.length;

            const centerHex = h3.latLngToCell(centerLat, centerLng, resolution);
            return [centerHex];
        }

        return hexes;
    } catch (e) {
        console.error("Error generating hexes:", e);
        return [];
    }
}

export function getHexesForMultiPolygon(coordinates: number[][][][], resolution: number, useMultiRes: boolean = true): string[] {
    const allHexes = new Set<string>();

    for (const polygon of coordinates) {
        const hexes = getHexesForPolygon(polygon, resolution, useMultiRes);
        hexes.forEach(h => allHexes.add(h));
    }

    return Array.from(allHexes);
}

export function getHexBoundary(hexIndex: string): number[][] {
    // cellToBoundary returns [lat, lng]
    const boundary = h3.cellToBoundary(hexIndex);
    // Convert to [lng, lat] for GeoJSON/Leaflet if needed?
    // Leaflet expects [lat, lng], so we are good.
    return boundary;
}

export function getHexForPoint(lat: number, lng: number, resolution: number, singleHex: boolean = false): string[] {
    try {
        if (singleHex) {
            return [h3.latLngToCell(lat, lng, resolution)];
        }

        // Instead of just returning the center hex (which shrinks with resolution),
        // let's approximate the zip code area as a circle of fixed radius (e.g., 3km)
        // and fill it with hexes. This way, higher resolution = more hexes.

        const radiusKm = 3;
        const steps = 32;
        const ring: number[][] = [];

        for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * 2 * Math.PI;
            // 1 degree lat is approx 111.32 km
            const dLat = (radiusKm / 111.32) * Math.sin(angle);
            // 1 degree lng is approx 111.32 * cos(lat) km
            const dLng = (radiusKm / (111.32 * Math.cos(lat * (Math.PI / 180)))) * Math.cos(angle);

            ring.push([lng + dLng, lat + dLat]);
        }
        ring.push(ring[0]); // Close the loop

        // Use polygonToCells with isGeoJson=true ([lng, lat])
        return h3.polygonToCells(ring, resolution, true);
    } catch (e) {
        console.error("Error generating hex for point:", e);
        // Fallback to single cell if circle generation fails
        try {
            return [h3.latLngToCell(lat, lng, resolution)];
        } catch (e2) {
            return [];
        }
    }
}

export function getHexesForLatLongLoop(loop: number[][], resolution: number, useMultiRes: boolean = true): string[] {
    try {
        // loop is [lat, lng][]
        // h3.polygonToCells(loop, res, isGeoJson=false) expects [lat, lng]

        let hexes: string[];
        if (useMultiRes) {
            hexes = fillPolygonWithGaps(loop, resolution, false);
        } else {
            hexes = h3.polygonToCells(loop, resolution);
        }
        return hexes;
    } catch (e) {
        console.error("Error generating hexes from loop:", e);
        return [];
    }
}
