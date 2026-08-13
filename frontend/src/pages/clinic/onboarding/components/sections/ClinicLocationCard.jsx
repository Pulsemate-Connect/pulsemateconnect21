import React, { useState, useEffect } from 'react';
import MapPicker from '../shared/MapPicker';
import FormInput from '../shared/FormInput';

const ClinicLocationCard = ({ register, setValue, watch, errors, setAutoFilledFields }) => {
  const latitude = watch?.('latitude');
  const longitude = watch?.('longitude');
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapKey, setMapKey] = useState(0); // Key to force map re-render
  // Initialize with form values if they exist
  const [latInput, setLatInput] = useState(latitude ? latitude.toString() : '');
  const [lngInput, setLngInput] = useState(longitude ? longitude.toString() : '');
  // Reverse geocoding state
  const [locationInfo, setLocationInfo] = useState({ area: '', city: '', loading: false });

  // Sync input fields when form values change (e.g., from localStorage)
  useEffect(() => {
    if (latitude !== null && latitude !== undefined && latInput === '') {
      setLatInput(latitude.toString());
    }
    if (longitude !== null && longitude !== undefined && lngInput === '') {
      setLngInput(longitude.toString());
    }
    if (latitude && longitude && !selectedLocation) {
      setSelectedLocation({ lat: parseFloat(latitude), lng: parseFloat(longitude) });
    }
  }, [latitude, longitude]);

  // Reverse geocoding to get area, city, pincode, and state
  const reverseGeocode = async (lat, lng) => {
    setLocationInfo({ area: '', city: '', loading: true });
    
    try {
      // Using Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PulseMateConnect/1.0' // Required by Nominatim
          }
        }
      );
      const data = await response.json();

      if (data && data.address) {
        const address = data.address;
        
        // Extract area (suburb, neighbourhood, or locality)
        const area = address.suburb || 
                     address.neighbourhood || 
                     address.village || 
                     address.town ||
                     address.locality ||
                     '';

        // Extract city
        const city = address.city || 
                     address.town || 
                     address.municipality ||
                     address.county ||
                     '';

        // Extract pincode (postcode)
        const pincode = address.postcode || '';

        // Extract state
        const state = address.state || '';

        setLocationInfo({ area, city, loading: false });
        
        // Auto-fill form fields (excluding locality)
        if (city) {
          setValue('city', city);
          console.log('Auto-filled city:', city);
        }
        if (pincode) {
          setValue('pincode', pincode);
          console.log('Auto-filled pincode:', pincode);
        }
        if (state) {
          setValue('state', state);
          console.log('Auto-filled state:', state);
        }
        
        // Mark fields as auto-filled (read-only)
        if (setAutoFilledFields) {
          setAutoFilledFields({
            city: !!city,
            pincode: !!pincode,
            state: !!state,
          });
        }
        
        console.log('Reverse geocoded:', { 
          area, 
          city, 
          pincode, 
          state, 
          fullAddress: data.display_name 
        });
      } else {
        setLocationInfo({ area: '', city: '', loading: false });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setLocationInfo({ area: '', city: '', loading: false });
    }
  };

  // Trigger reverse geocoding when location changes
  useEffect(() => {
    if (latitude && longitude) {
      reverseGeocode(parseFloat(latitude), parseFloat(longitude));
    }
  }, [latitude, longitude]);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setValue('latitude', location.lat);
    setValue('longitude', location.lng);
    // Update inputs when map is clicked
    setLatInput(location.lat.toString());
    setLngInput(location.lng.toString());
    
    console.log('Selected location:', location);
  };

  const handleCoordinateChange = () => {
    // Force map to re-render with new coordinates
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    
    if (!isNaN(lat) && !isNaN(lng)) {
      setValue('latitude', lat);
      setValue('longitude', lng);
      setSelectedLocation({ lat, lng });
      setMapKey(prev => prev + 1); // Force MapPicker to re-render
    }
  };

  const hasLocation = latitude && longitude;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
      {/* Card Header */}
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Clinic location and address
        </h2>
        <p className="text-sm text-gray-600">
          Add your clinic's exact location so patients can find you easily.
        </p>
      </div>

      {/* Map */}
      <div className="space-y-4">
        <MapPicker
          key={mapKey}
          initialPosition={
            selectedLocation || (hasLocation 
              ? { lat: parseFloat(latitude), lng: parseFloat(longitude) }
              : { lat: 28.6139, lng: 77.2090 })
          }
          onLocationSelect={handleLocationSelect}
          height="400px"
        />

        {/* Location Info Display - Area & City */}
        {hasLocation && (
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            {locationInfo.loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-blue-700">Fetching location details...</p>
              </div>
            ) : (
              <div className="text-sm text-blue-700 space-y-0.5">
                {locationInfo.area && <p className="font-semibold">{locationInfo.area}</p>}
                {locationInfo.city && <p>{locationInfo.city}</p>}
                {!locationInfo.area && !locationInfo.city && (
                  <p className="text-blue-600">
                    Coordinates: {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual Coordinate Entry */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">Enter the co-ordinates</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Latitude Input */}
            <div className="space-y-1.5">
              <input
                type="number"
                step="0.000001"
                placeholder="Enter Latitudinal value *"
                value={latInput}
                onChange={(e) => setLatInput(e.target.value)}
                onBlur={handleCoordinateChange}
                className="w-full px-4 py-2.5 text-gray-900 placeholder-gray-400 border rounded-xl transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white focus:outline-none focus:ring-4"
              />
              {errors?.latitude && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.latitude.message}
                </p>
              )}
            </div>
            
            {/* Longitude Input */}
            <div className="space-y-1.5">
              <input
                type="number"
                step="0.000001"
                placeholder="Enter Longitudinal value *"
                value={lngInput}
                onChange={(e) => setLngInput(e.target.value)}
                onBlur={handleCoordinateChange}
                className="w-full px-4 py-2.5 text-gray-900 placeholder-gray-400 border rounded-xl transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white focus:outline-none focus:ring-4"
              />
              {errors?.longitude && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.longitude.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {errors?.latitude && (
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-red-700">
                {errors.latitude.message || 'Please select your clinic location on the map'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicLocationCard;
