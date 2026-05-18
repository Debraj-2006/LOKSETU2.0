import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Loader2, Navigation, Search } from 'lucide-react';
import toast from 'react-hot-toast';

// Fix default Leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapClickHandler({ onLocationChange }) {
  useMapEvents({
    click(e) { onLocationChange(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

export default function LocationPicker({ onLocationChange }) {
  const [position, setPosition] = useState(null);
  const [address, setAddress]   = useState('');
  const [loading, setLoading]   = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  
  const defaultCenter           = [22.5726, 88.3639]; // Kolkata

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch { return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
  };

  const handleLocationChange = async (lat, lng) => {
    setPosition([lat, lng]);
    const addr = await reverseGeocode(lat, lng);
    setAddress(addr);
    onLocationChange({ lat, lng, address: addr });
  };

  const getMyLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await handleLocationChange(pos.coords.latitude, pos.coords.longitude);
        setLoading(false);
      },
      () => {
        setLoading(false);
        toast.error('Unable to fetch your current GPS coordinates.');
      }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        setPosition([newLat, newLng]);
        setAddress(display_name);
        onLocationChange({ lat: newLat, lng: newLng, address: display_name });
        toast.success('Location found! 📍');
      } else {
        toast.error('No matching locations found. Try a different search term.');
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to connect to location search service.');
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => { getMyLocation(); }, []);

  return (
    <div className="space-y-4">
      
      {/* Premium Search and GPS Combo Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="input pr-10 py-2.5 text-sm"
            placeholder="Search address or area (e.g. Park Street, Kolkata)"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searchLoading || !searchQuery.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
          >
            {searchLoading ? (
              <Loader2 size={16} className="animate-spin text-primary-400" />
            ) : (
              <Search size={16} />
            )}
          </button>
        </div>
        
        <button
          type="button"
          onClick={getMyLocation}
          disabled={loading}
          className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3.5 shrink-0 border-white/10 hover:bg-white/5"
          title="Use current GPS"
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Navigation size={13} />
          )}
          <span>GPS</span>
        </button>
      </div>

      {/* Map display */}
      <div className="h-64 rounded-2xl overflow-hidden border border-white/10 relative">
        <MapContainer
          center={position || defaultCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          key={position ? `${position[0]}-${position[1]}` : 'default'}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
          />
          <MapClickHandler onLocationChange={handleLocationChange} />
          {position && <Marker position={position} />}
        </MapContainer>
      </div>

      {/* Selected location indicator */}
      {address && (
        <div className="flex items-start gap-2 text-sm text-white/60 bg-white/[0.02] border border-white/5 p-3 rounded-2xl animate-fade-in">
          <MapPin size={14} className="text-primary-400 shrink-0 mt-0.5" />
          <span>{address}</span>
        </div>
      )}
      {!address && (
        <p className="text-xs text-white/30 px-1">Click on the map, use "GPS", or search above to set the complaint location.</p>
      )}
    </div>
  );
}
