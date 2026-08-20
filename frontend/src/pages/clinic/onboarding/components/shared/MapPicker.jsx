import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
const LocationMarker = ({ position, setPosition }) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? <Marker position={position} draggable={true} eventHandlers={{
    dragend: (e) => {
      setPosition(e.target.getLatLng());
    },
  }} /> : null;
};

const MapPicker = ({ 
  initialPosition = { lat: 28.6139, lng: 77.2090 }, // Default: New Delhi
  onLocationSelect,
  height = '400px',
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    if (position && onLocationSelect) {
      onLocationSelect(position);
    }
  }, [position, onLocationSelect]);

  const handleCurrentLocation = () => {
    setIsLocating(true);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setPosition(newPos);
          setIsLocating(false);
          
          // Fly to current location
          if (mapRef.current) {
            mapRef.current.flyTo(newPos, 15);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocating(false);
          alert('Unable to get your location. Please select manually on the map.');
        }
      );
    } else {
      setIsLocating(false);
      alert('Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="relative">
      {/* Map Container */}
      <div className="rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={13}
          style={{ height, width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>

      {/* Use Current Location Button */}
      <button
        type="button"
        onClick={handleCurrentLocation}
        disabled={isLocating}
        className="absolute top-4 right-4 z-[1000] px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl shadow-lg border border-gray-200 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLocating ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Locating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Use Current Location
          </>
        )}
      </button>

      {/* Instructions */}
      <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span>
          Click anywhere on the map to set your clinic's location. You can also drag the marker to adjust the position.
        </span>
      </div>
    </div>
  );
};

export default MapPicker;
