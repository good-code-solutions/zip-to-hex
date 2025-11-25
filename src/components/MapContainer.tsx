import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer as LeafletMap, TileLayer, Polygon, GeoJSON, useMap, Popup, Tooltip } from 'react-leaflet';
import { cellToBoundary, getResolution, polygonToCells, cellToParent } from 'h3-js';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw';
import { PenTool, Hand, Trash2, Info, Mail } from 'lucide-react';
// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Fix for leaflet-draw icons
// @ts-ignore
window.type = ''; // Hack to prevent type errors with some leaflet plugins if needed

interface MapContainerProps {
    zipBoundary: any | null;
    hexes: string[];
    opacity: number;
    isDrawMode?: boolean;
    onDrawComplete?: (hexes: string[], polygon?: number[][]) => void;
    showWelcome?: boolean;
    searchMode?: 'zip' | 'address' | 'draw';
    userLocation?: [number, number] | null;
    onAbout?: () => void;
    onContact?: () => void;
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

// Component to set map ref
function MapRefSetter({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
    const map = useMap();

    useEffect(() => {
        mapRef.current = map;
    }, [map, mapRef]);

    return null;
}

// Custom Draw Control Component
function DrawControl({ onCreated, isDrawingEnabled, onMounted }: { onCreated: (e: any) => void, isDrawingEnabled: boolean, onMounted: (drawControl: any) => void }) {
    const map = useMap();
    const drawHandlerRef = useRef<L.Draw.Polygon | null>(null);

    useEffect(() => {
        // Initialize the feature group to store drawn items
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        // Event handler for creation
        const handleCreated = (e: any) => {
            const layer = e.layer;
            drawnItems.addLayer(layer);
            onCreated(e);

            // Keep the drawn polygon for a moment then clear (since we manage state in App)
            setTimeout(() => {
                drawnItems.clearLayers();
            }, 100);
        };

        map.on(L.Draw.Event.CREATED, handleCreated);

        // Expose control for manual triggering
        onMounted({
            startDrawing: () => {
                if (!drawHandlerRef.current) {
                    drawHandlerRef.current = new L.Draw.Polygon(map as any, {
                        allowIntersection: false,
                        drawError: {
                            color: '#e1e100',
                            message: '<strong>Oh snap!<strong> you can\'t draw that!'
                        },
                        shapeOptions: {
                            color: '#10b981'
                        }
                    });
                }
                drawHandlerRef.current.enable();
            },
            stopDrawing: () => {
                if (drawHandlerRef.current) {
                    drawHandlerRef.current.disable();
                }
            }
        });

        // Auto-start drawing if enabled
        if (isDrawingEnabled) {
            if (!drawHandlerRef.current) {
                drawHandlerRef.current = new L.Draw.Polygon(map as any, {
                    allowIntersection: false,
                    drawError: {
                        color: '#e1e100',
                        message: '<strong>Oh snap!<strong> you can\'t draw that!'
                    },
                    shapeOptions: {
                        color: '#10b981'
                    }
                });
            }
            drawHandlerRef.current.enable();
        }

        return () => {
            if (drawHandlerRef.current) {
                drawHandlerRef.current.disable();
            }
            map.off(L.Draw.Event.CREATED, handleCreated);
            map.removeLayer(drawnItems);
        };
    }, [map, onCreated]);

    // React to isDrawingEnabled changes
    useEffect(() => {
        if (isDrawingEnabled) {
            if (drawHandlerRef.current) drawHandlerRef.current.enable();
        } else {
            if (drawHandlerRef.current) drawHandlerRef.current.disable();
        }
    }, [isDrawingEnabled]);

    return null;
}

export function MapContainer({ zipBoundary, hexes, opacity, isDrawMode = false, onDrawComplete, showWelcome = false, searchMode,
    userLocation, onAbout, onContact
}: MapContainerProps) {
    const mapRef = useRef<L.Map | null>(null);
    const [selectedHex, setSelectedHex] = useState<string | null>(null);
    const [isDrawingEnabled, setIsDrawingEnabled] = useState(false);

    // Zoom to user location only on first visit
    useEffect(() => {
        const hasZoomedToLocation = localStorage.getItem('zip2h3_has_zoomed_to_location');

        if (userLocation && mapRef.current && !hasZoomedToLocation) {
            mapRef.current.flyTo(userLocation, 12, {
                duration: 2, // 2 seconds for smooth animation
                easeLinearity: 0.25 // Smooth easing
            });
            localStorage.setItem('zip2h3_has_zoomed_to_location', 'true');
        }
    }, [userLocation]);

    // Auto-enable/disable drawing based on draw mode
    useEffect(() => {
        if (isDrawMode) {
            setIsDrawingEnabled(true);
        } else {
            setIsDrawingEnabled(false);
        }
    }, [isDrawMode]);

    // Sync isDrawMode with searchMode from App
    useEffect(() => {
        if (searchMode !== 'draw' && isDrawMode) {
            setIsDrawingEnabled(false);
        }
    }, [searchMode, isDrawMode]);

    // Save map position to localStorage and restore on mount
    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;

        // Restore saved position
        const savedPosition = localStorage.getItem('zip2h3_map_position');
        if (savedPosition) {
            try {
                const { center, zoom } = JSON.parse(savedPosition);
                map.setView(center, zoom, { animate: false });
            } catch (e) {
                console.error('Failed to restore map position', e);
            }
        }

        // Save position on move/zoom
        const savePosition = () => {
            const center = map.getCenter();
            const zoom = map.getZoom();
            localStorage.setItem('zip2h3_map_position', JSON.stringify({
                center: [center.lat, center.lng],
                zoom
            }));
        };

        map.on('moveend', savePosition);
        map.on('zoomend', savePosition);

        return () => {
            map.off('moveend', savePosition);
            map.off('zoomend', savePosition);
        };
    }, [mapRef.current]);

    // Calculate bounds if zipBoundary exists
    const bounds = useMemo(() => {
        if (!zipBoundary) return null;
        const layer = L.geoJSON(zipBoundary);
        return layer.getBounds();
    }, [zipBoundary]);

    const handleCreated = (e: any) => {
        const layer = e.layer;
        if (onDrawComplete) {
            // Leaflet returns [lat, lng]
            const latlngs = layer.getLatLngs()[0].map((ll: any) => [ll.lat, ll.lng]);

            try {
                // polygonToCells expects [lat, lng] by default (isGeoJson=false)
                // If we pass true, it expects [lng, lat]
                // Since we have [lat, lng], we pass false (or omit the 3rd arg)
                const generatedHexes = polygonToCells(latlngs, 7);
                onDrawComplete(generatedHexes, latlngs);
            } catch (err) {
                console.error("Error generating hexes from draw:", err);
            }
        }
    };

    return (
        <div className="h-full w-full relative z-0 bg-gray-100">
            <LeafletMap
                center={[37.0902, -95.7129]} // Center of US
                zoom={4}
                className="h-full w-full outline-none"
                zoomControl={false}
            >
                <MapRefSetter mapRef={mapRef} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    className="map-tiles"
                />

                <DrawControl
                    onCreated={handleCreated}
                    isDrawingEnabled={isDrawingEnabled}
                    onMounted={() => { }}
                />

                {/* Custom Vertical Tools Panel */}
                <div className="leaflet-top leaflet-right mt-[80px] mr-[10px] z-[1000]">
                    <div className="leaflet-bar leaflet-control flex flex-col bg-white border-2 border-slate-300 rounded-md overflow-hidden shadow-md">
                        {/* Draw Tools - Always Visible, Enabled Only in Draw Mode */}
                        <button
                            onClick={() => isDrawMode && setIsDrawingEnabled(true)}
                            disabled={!isDrawMode}
                            className={`p-2 transition-colors ${!isDrawMode
                                ? 'text-slate-300 cursor-not-allowed opacity-50'
                                : isDrawingEnabled
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            title={isDrawMode ? "Draw Polygon" : "Switch to Draw mode to use"}
                        >
                            <PenTool className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => isDrawMode && setIsDrawingEnabled(false)}
                            disabled={!isDrawMode}
                            className={`p-2 transition-colors ${!isDrawMode
                                ? 'text-slate-300 cursor-not-allowed opacity-50'
                                : !isDrawingEnabled
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            title={isDrawMode ? "Pan Mode" : "Switch to Draw mode to use"}
                        >
                            <Hand className="w-5 h-5" />
                        </button>

                        <div className="h-px bg-slate-200 my-1" />

                        {/* Trash - Always Visible */}
                        <button
                            onClick={() => {
                                if (onDrawComplete) onDrawComplete([], undefined);
                            }}
                            className="p-2 hover:bg-slate-100 transition-colors text-slate-600 hover:text-red-500"
                            title="Clear Map"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>

                        <div className="h-px bg-slate-200 my-1" />

                        {/* About - Always Visible */}
                        {onAbout && (
                            <button
                                onClick={onAbout}
                                className="p-2 hover:bg-slate-100 transition-colors text-slate-600 hover:text-blue-500"
                                title="About"
                            >
                                <Info className="w-5 h-5" />
                            </button>
                        )}

                        {/* Contact - Always Visible */}
                        {onContact && (
                            <button
                                onClick={onContact}
                                className="p-2 hover:bg-slate-100 transition-colors text-slate-600 hover:text-emerald-500"
                                title="Contact Us"
                            >
                                <Mail className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

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
                                click: () => setSelectedHex(hex),
                                mouseover: (e) => {
                                    e.target.openTooltip();
                                },
                                mouseout: (e) => {
                                    e.target.closeTooltip();
                                }
                            }}
                        >
                            <Tooltip sticky direction="top" offset={[0, -10]} opacity={1}>
                                <div className="bg-slate-900 text-white px-3 py-2 rounded shadow-lg border border-white/10">
                                    {searchMode === 'address' ? (
                                        <div className="flex flex-col gap-1">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">H3 Resolutions</div>
                                            <table className="w-full text-xs">
                                                <tbody>
                                                    {[5, 6, 7, 8, 9, 10].map(res => {
                                                        const parent = res === resolution ? hex : (res < resolution ? cellToParent(hex, res) : '-');
                                                        return (
                                                            <tr key={res} className={res === resolution ? "text-emerald-400 font-bold" : "text-slate-300"}>
                                                                <td className="pr-3 py-0.5">Res {res}</td>
                                                                <td className="font-mono">{parent}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-xs font-mono font-bold">
                                            {hex}
                                        </div>
                                    )}
                                </div>
                            </Tooltip>
                            {isSelected && (
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
                            )}
                        </Polygon>
                    );
                })}
            </LeafletMap>

            {showWelcome && !zipBoundary && hexes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-[400] pointer-events-none px-4 bg-black/40 backdrop-blur-sm transition-all duration-500">
                    <div className="bg-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-white/10 text-center max-w-sm shadow-2xl animate-in fade-in zoom-in duration-500 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 pointer-events-none" />

                        {/* Animated rings */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-emerald-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-blue-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl rotate-3 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="-rotate-3"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" /></svg>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3 font-['Outfit'] tracking-tight">
                                Welcome to <span className="text-emerald-400">Zip2H3</span>
                            </h2>
                            <p className="text-slate-300 leading-relaxed text-sm mb-6">
                                The ultimate tool for visualizing H3 spatial indexes. Enter a Zip Code, search an address, or draw a custom area to get started.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse delay-100" />
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse delay-200" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
