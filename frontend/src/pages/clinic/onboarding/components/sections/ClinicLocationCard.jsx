import React, { useState } from 'react';
import MapPicker from '../shared/MapPicker';

const ClinicLocationCard = ({ setValue, watch, errors }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const latitude = watch?.('latitude');
  const longitude = watch?.('longitude');

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setValue('latitude', location.lat);
    setValue('longitude', location.lng);
    
    // TODO: Call reverse geocoding API to get address details
    // This will auto-fill city, state, etc.
    console.log('Selected location:', location);
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
          initialPosition={
            hasLocation 
              ? { lat: latitude, lng: longitude }
              : { lat: 28.6139, lng: 77.2090 }
          }
          onLocationSelect={handleLocationSelect}
          height="400px"
        />

        {/* Location Confirmation */}
        {hasLocation && (
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 mb-1">
                  Clinic location selected
                </p>
                <div className="text-sm text-green-700 space-y-1">
                  <p>Latitude: <span className="font-mono font-semibold">{latitude.toFixed(6)}</span></p>
                  <p>Longitude: <span className="font-mono font-semibold">{longitude.toFixed(6)}</span></p>
                </div>
              </div>
            </div>
          </div>
        )}

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

      {/* Info Message */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 mb-1">
              Why is this important?
            </p>
            <p className="text-sm text-blue-700">
              Your clinic's location will be shown to patients on PulseMate Connect. 
              An accurate location helps patients find you easily and improves your visibility in search results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicLocationCard;
