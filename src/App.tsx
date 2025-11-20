import { useState, useEffect } from 'react';
import { MapContainer } from './components/MapContainer';
import { ControlPanel } from './components/ControlPanel';
import { ContactModal } from './components/ContactModal';
import { getZipBoundary, type GeoResponse } from './lib/geo';
import { getHexesForPolygon, getHexesForMultiPolygon, getHexForPoint } from './lib/h3-helper';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zipBoundary, setZipBoundary] = useState<GeoResponse | null>(null);
  const [hexes, setHexes] = useState<string[]>([]);
  const [opacity, setOpacity] = useState(0.4);
  const [initialState, setInitialState] = useState<{ zip: string; resolution: number } | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('zip2h3_state');
    if (saved) {
      try {
        const { zipBoundary, hexes, opacity, zip, resolution } = JSON.parse(saved);
        if (zipBoundary) setZipBoundary(zipBoundary);
        if (hexes) setHexes(hexes);
        if (opacity) setOpacity(opacity);
        if (zip && resolution) setInitialState({ zip, resolution });
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }
  }, []);

  // Save opacity when it changes
  useEffect(() => {
    const saved = localStorage.getItem('zip2h3_state');
    if (saved) {
      const state = JSON.parse(saved);
      localStorage.setItem('zip2h3_state', JSON.stringify({ ...state, opacity }));
    }
  }, [opacity]);

  const handleSearch = async (zip: string, resolution: number) => {
    setIsLoading(true);
    setError(null);
    setHexes([]);
    setZipBoundary(null);

    try {
      const data = await getZipBoundary(zip);

      if (!data) {
        setError("Zip code not found or invalid.");
        setIsLoading(false);
        return;
      }

      setZipBoundary(data);

      // Generate Hexes
      // We need to handle MultiPolygon or Polygon
      // The API returns a FeatureCollection, usually with one Feature which is the boundary.
      const feature = data.features[0];
      const geometry = feature.geometry;

      let generatedHexes: string[] = [];

      if (geometry.type === 'Polygon') {
        generatedHexes = getHexesForPolygon(geometry.coordinates as number[][][], resolution);
      } else if (geometry.type === 'MultiPolygon') {
        generatedHexes = getHexesForMultiPolygon(geometry.coordinates as number[][][][], resolution);
      } else if (geometry.type === 'Point') {
        // Nominatim returns Point for US Zips often
        const [lng, lat] = geometry.coordinates as number[];
        generatedHexes = getHexForPoint(lat, lng, resolution);
      }

      setHexes(generatedHexes);

      // Save state
      localStorage.setItem('zip2h3_state', JSON.stringify({
        zipBoundary: data,
        hexes: generatedHexes,
        opacity,
        zip,
        resolution
      }));

      if (generatedHexes.length === 0) {
        setError("No hexes generated. Try a higher resolution or check the zip code area.");
      }

    } catch (err) {
      setError("An unexpected error occurred.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-slate-950">
      <MapContainer zipBoundary={zipBoundary} hexes={hexes} opacity={opacity} />
      <ControlPanel
        onSearch={handleSearch}
        isLoading={isLoading}
        error={error}
        stats={hexes.length > 0 ? { hexCount: hexes.length, hexes } : null}
        opacity={opacity}
        onOpacityChange={setOpacity}
        initialState={initialState}
      />
      <ContactModal />
    </div>
  );
}

export default App;
