import { useState, useEffect } from 'react';
import { MapContainer } from './components/MapContainer';
import { ControlPanel } from './components/ControlPanel';
import { ContactModal } from './components/ContactModal';
import { AboutModal } from './components/AboutModal';
import { getZipBoundary, getAddressLocation, type GeoResponse } from './lib/geo';
import { getHexesForPolygon, getHexesForMultiPolygon, getHexForPoint, getHexesForLatLongLoop } from './lib/h3-helper';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zipBoundary, setZipBoundary] = useState<GeoResponse | null>(null);
  const [hexes, setHexes] = useState<string[]>([]);
  const [opacity, setOpacity] = useState(0.4);
  const [zipQuery, setZipQuery] = useState('');
  const [addressQuery, setAddressQuery] = useState('');
  const [resolution, setResolution] = useState(8);

  const [showWelcome, setShowWelcome] = useState(false);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [searchMode, setSearchMode] = useState<'zip' | 'address' | 'draw'>('zip');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState<number[][] | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log("Error getting location", error);
        }
      );
    }
  }, []);

  // Dynamic resolution update for drawing
  useEffect(() => {
    if (searchMode === 'draw' && drawnPolygon && resolution) {
      const hexes = getHexesForLatLongLoop(drawnPolygon, resolution);
      setHexes(hexes);
    }
  }, [resolution, drawnPolygon, searchMode]);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('zip2h3_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.zipBoundary) setZipBoundary(state.zipBoundary);
        if (state.hexes) setHexes(state.hexes);
        if (state.opacity) setOpacity(state.opacity);
        if (state.zipQuery) setZipQuery(state.zipQuery);
        if (state.addressQuery) setAddressQuery(state.addressQuery);
        if (state.resolution) setResolution(state.resolution);
        if (state.searchMode) setSearchMode(state.searchMode);
        if (state.drawnPolygon) setDrawnPolygon(state.drawnPolygon);
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }

    // Check for welcome message
    const lastVisit = localStorage.getItem('zip2h3_last_visit');
    const today = new Date().toDateString();
    if (lastVisit !== today) {
      setShowWelcome(true);
      localStorage.setItem('zip2h3_last_visit', today);
    }
  }, []);

  // Save state when relevant changes occur
  useEffect(() => {
    const state = {
      zipBoundary,
      hexes,
      opacity,
      zipQuery,
      addressQuery,
      resolution,
      searchMode,
      drawnPolygon
    };
    localStorage.setItem('zip2h3_state', JSON.stringify(state));
  }, [zipBoundary, hexes, opacity, zipQuery, addressQuery, resolution, searchMode, drawnPolygon]);

  const handleSearch = async (query: string, res: number, type: 'zip' | 'address') => {
    setIsLoading(true);
    setError(null);
    setHexes([]);
    setZipBoundary(null);
    setIsDrawMode(false); // Disable draw mode when searching
    setShowWelcome(false);
    setSearchMode(type);
    setResolution(res);

    if (type === 'zip') setZipQuery(query);
    else setAddressQuery(query);

    try {
      let data: GeoResponse | null = null;

      if (type === 'zip') {
        data = await getZipBoundary(query);
      } else {
        data = await getAddressLocation(query);
      }

      if (!data) {
        setError(type === 'zip' ? "Zip code not found." : "Address not found.");
        setIsLoading(false);
        return;
      }

      setZipBoundary(data);

      // Generate Hexes
      const feature = data.features[0];
      const geometry = feature.geometry;

      let generatedHexes: string[] = [];

      if (geometry.type === 'Polygon') {
        generatedHexes = getHexesForPolygon(geometry.coordinates as number[][][], res);
      } else if (geometry.type === 'MultiPolygon') {
        generatedHexes = getHexesForMultiPolygon(geometry.coordinates as number[][][][], res);
      } else if (geometry.type === 'Point') {
        const [lng, lat] = geometry.coordinates as number[];
        // For address search, we only want Res 10
        const targetRes = type === 'address' ? 10 : res;
        generatedHexes = getHexForPoint(lat, lng, targetRes, type === 'address');
      }

      setHexes(generatedHexes);

      if (generatedHexes.length === 0) {
        setError("No hexes generated. Try a higher resolution.");
      }

    } catch (err) {
      setError("An unexpected error occurred.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrawComplete = (hexes: string[], polygon?: number[][]) => {
    setHexes(hexes);
    if (polygon) {
      setDrawnPolygon(polygon);
      setSearchMode('draw');
    } else {
      // If no polygon (clearing), clear everything
      setDrawnPolygon(null);
      setZipBoundary(null);
    }
    setShowWelcome(false);
  };

  const handleReset = () => {
    setZipBoundary(null);
    setHexes([]);
    setDrawnPolygon(null);
    setZipQuery('');
    setAddressQuery('');
    setSearchMode('zip');
    setIsDrawMode(false);
    setError(null);
    localStorage.removeItem('zip2h3_state');
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-slate-950">
      <MapContainer
        zipBoundary={zipBoundary}
        hexes={hexes}
        opacity={opacity}
        isDrawMode={isDrawMode}
        onDrawComplete={handleDrawComplete}
        showWelcome={showWelcome}
        searchMode={searchMode}
        userLocation={userLocation}
        onAbout={() => setIsAboutOpen(true)}
        onContact={() => setIsContactOpen(true)}
      />
      <ControlPanel
        onSearch={handleSearch}
        onDrawMode={() => {
          setIsDrawMode(true);
          setZipBoundary(null);
          setHexes([]);
          setDrawnPolygon(null);
          setShowWelcome(false);
          setSearchMode('draw');
        }}
        onReset={handleReset}
        isLoading={isLoading}
        error={error}
        stats={hexes.length > 0 ? { hexCount: hexes.length, hexes } : null}
        opacity={opacity}
        onOpacityChange={setOpacity}
        zipQuery={zipQuery}
        addressQuery={addressQuery}
        initialResolution={resolution}
        initialMode={searchMode}
      />
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}

export default App;
