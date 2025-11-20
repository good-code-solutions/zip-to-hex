import { useEffect } from 'react';
import { MapContainer as LeafletMap, TileLayer, Polygon, GeoJSON, useMap, Popup } from 'react-leaflet';
import { cellToBoundary } from 'h3-js';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapContainerProps {
    zipBoundary: any | null;
    hexes: string[];
}

function MapUpdater({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
    const map = useMap();

    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds);
        }
    }, [bounds, map]);

    return null;
}

export function MapContainer({ zipBoundary, hexes }: MapContainerProps) {
    // Calculate bounds if zipBoundary exists
    let bounds: L.LatLngBoundsExpression | null = null;

    if (zipBoundary) {
        // Create a temporary Leaflet GeoJSON layer to get bounds
        const layer = L.geoJSON(zipBoundary);
        bounds = layer.getBounds();
    }

    return (
        <div className="h-full w-full relative z-0 bg-gray-100">
            <LeafletMap
                center={[37.0902, -95.7129]} // Center of US
                zoom={4}
                className="h-full w-full outline-none"
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    className="map-tiles"
                />

                {zipBoundary && (
                    <>
                        <GeoJSON
                            key={JSON.stringify(zipBoundary)}
                            data={zipBoundary}
                            style={{
                                color: '#3b82f6', // blue-500
                                weight: 2,
                                fillOpacity: 0.1,
                                fillColor: '#3b82f6',
                                dashArray: '5, 5'
                            }}
                        />
                        <MapUpdater bounds={bounds} />
                    </>
                )}

                {hexes.map((hex) => {
                    const boundary = cellToBoundary(hex);
                    return (
                        <Polygon
                            key={hex}
                            positions={boundary}
                            pathOptions={{
                                color: '#10b981', // emerald-500
                                weight: 1,
                                fillOpacity: 0.4,
                                fillColor: '#10b981'
                            }}
                        >
                            <Popup className="custom-popup">
                                <div className="text-center">
                                    <p className="text-xs font-bold text-slate-500 mb-1">H3 Index</p>
                                    <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-800 select-all">
                                        {hex}
                                    </code>
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}
            </LeafletMap>
        </div>
    );
}
