import { useEffect, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, Polygon, GeoJSON, useMap, Popup } from 'react-leaflet';
import { cellToBoundary, getResolution } from 'h3-js';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ... (icon fix code remains same)
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
    opacity: number;
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

export function MapContainer({ zipBoundary, hexes, opacity }: MapContainerProps) {
    const [selectedHex, setSelectedHex] = useState<string | null>(null);

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
                    const isSelected = selectedHex === hex;
                    const resolution = getResolution(hex);

                    return (
                        <Polygon
                            key={hex}
                            positions={boundary}
                            pathOptions={{
                                color: isSelected ? '#f59e0b' : '#10b981', // amber-500 : emerald-500
                                weight: isSelected ? 2 : 1,
                                fillOpacity: isSelected ? 0.6 : opacity,
                                fillColor: isSelected ? '#f59e0b' : '#10b981'
                            }}
                            eventHandlers={{
                                click: () => setSelectedHex(hex)
                            }}
                        >
                            <Popup className="custom-popup">
                                <div className="flex flex-col gap-1 min-w-[120px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Index</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Res {resolution}</span>
                                    </div>
                                    <code className="text-sm font-mono text-slate-800 select-all bg-slate-50 px-2 py-1 rounded border border-slate-100 text-center">
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
