import { useEffect, useRef, useState } from 'react';

// Leaflet is loaded dynamically to avoid SSR issues
let L = null;

const loadLeaflet = async () => {
  if (L) return L;
  const leaflet = await import('leaflet');
  L = leaflet.default || leaflet;

  // Fix default marker icon paths broken by bundlers
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });

  return L;
};

/**
 * ClinicLocationPicker
 *
 * Props:
 *   latitude  {string|number}  current lat value
 *   longitude {string|number}  current lng value
 *   onPin     {(lat, lng) => void}  called when user clicks map or uses current location
 */
const ClinicLocationPicker = ({ latitude, longitude, onPin }) => {
  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const markerRef       = useRef(null);
  const [isLocating, setIsLocating]   = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);
  const [locationLabel, setLocationLabel] = useState('');

  // Keep onPin in a ref so map event handlers always call the latest version
  const onPinRef = useRef(onPin);
  useEffect(() => { onPinRef.current = onPin; }, [onPin]);

  // ── Load Leaflet CSS once ───────────────────────────────────────────────────
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link    = document.createElement('link');
      link.id       = 'leaflet-css';
      link.rel      = 'stylesheet';
      link.href     = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // ── Helper: add / move marker on the map ───────────────────────────────────
  const placeMarker = (leaflet, map, lat, lng) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = leaflet
        .marker([lat, lng], { draggable: true })
        .addTo(map)
        .bindPopup('📍 Clinic location')
        .openPopup();

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        onPinRef.current(pos.lat.toFixed(6), pos.lng.toFixed(6));
      });

      markerRef.current = marker;
    }
  };

  // ── Init map (runs once) ────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    loadLeaflet().then((leaflet) => {
      if (!mounted || !mapContainerRef.current || mapRef.current) return;

      const defaultLat = latitude ? Number(latitude) : 20.5937;
      const defaultLng = longitude ? Number(longitude) : 78.9629;
      const zoom       = latitude && longitude ? 15 : 5;

      const map = leaflet.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      leaflet
        .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        })
        .addTo(map);

      // Place existing marker if coords already set
      if (latitude && longitude) {
        placeMarker(leaflet, map, Number(latitude), Number(longitude));
      }

      // Click to pin
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        placeMarker(leaflet, map, lat, lng);
        onPinRef.current(lat.toFixed(6), lng.toFixed(6));
        setLocationLabel('');
      });

      mapRef.current = map;
      setLeafletReady(true);
    });

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync marker when lat/lng changes externally ─────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !leafletReady) return;

    if (!latitude || !longitude) {
      // Coords cleared — remove marker
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    loadLeaflet().then((leaflet) => {
      if (!mapRef.current) return;
      placeMarker(leaflet, mapRef.current, lat, lng);
      mapRef.current.setView([lat, lng], 15);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, leafletReady]);

  // ── Reverse geocode a lat/lng to a human-readable area name ────────────────
  const reverseGeocode = async (lat, lng) => {
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const addr = data.address || {};
      // Build a short readable label: suburb / city / district
      return (
        addr.suburb ||
        addr.neighbourhood ||
        addr.village ||
        addr.town ||
        addr.city ||
        addr.county ||
        addr.state_district ||
        addr.state ||
        'your current location'
      );
    } catch {
      return 'your current location';
    }
  };

  // ── "Use my location" handler ───────────────────────────────────────────────
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationLabel('');

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = coords.latitude.toFixed(6);
        const lng = coords.longitude.toFixed(6);
        onPinRef.current(lat, lng);

        // Reverse geocode to show user where this pin landed
        const label = await reverseGeocode(coords.latitude, coords.longitude);
        setLocationLabel(label);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        const messages = {
          1: 'Location permission denied. Please allow location access in your browser settings, then try again.',
          2: 'Unable to detect your position. Try again or pin manually on the map.',
          3: 'Location request timed out. Try again or pin manually.',
        };
        alert(messages[err.code] || 'Unable to fetch your location. Please pin manually on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="overflow-hidden rounded-[1.2rem] border border-slate-200 bg-white shadow-sm">

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="text-base">📍</span>
            {latitude && longitude ? (
              <span className="font-semibold text-slate-800">
                {Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}
              </span>
            ) : (
              <span>Click on the map to pin your clinic location</span>
            )}
          </div>
          {/* Show reverse-geocoded area after "Use my location" */}
          {locationLabel && (
            <p className="text-xs text-blue-600 font-medium pl-6">
              📌 Pinned at: <span className="font-semibold">{locationLabel}</span>
              {' '}— drag the pin to fine-tune if needed
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {latitude && longitude ? (
            <button
              type="button"
              onClick={() => { onPinRef.current('', ''); setLocationLabel(''); }}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:text-red-500"
            >
              Clear pin
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
          >
            {isLocating ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                Detecting...
              </>
            ) : (
              <>
                <span>🎯</span>
                Use my location
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Notice: "Use my location" pins your physical device position ──── */}
      {!latitude && !longitude && (
        <div className="flex items-start gap-2 bg-amber-50 border-b border-amber-100 px-4 py-2.5">
          <span className="text-amber-500 text-sm mt-0.5 flex-shrink-0">ℹ️</span>
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-semibold">"Use my location"</span> pins your device's current GPS position.
            If you're not at the clinic right now, click on the map instead to drop the pin at the correct clinic address.
          </p>
        </div>
      )}

      {/* ── Map ────────────────────────────────────────────────────────────── */}
      <div className="relative">
        {!leafletReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
              <span className="text-sm">Loading map...</span>
            </div>
          </div>
        )}
        <div ref={mapContainerRef} style={{ height: '320px', width: '100%' }} />
      </div>

      {/* ── Hint ───────────────────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
        Click anywhere on the map to drop a pin at the clinic address · Drag to adjust · Or use "Use my location" if you're at the clinic
      </div>
    </div>
  );
};

export default ClinicLocationPicker;
