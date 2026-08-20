'use strict';

const https = require('https');
const logger = require('../config/logger');

/**
 * Reverse Geocoding Service
 * Converts latitude/longitude to human-readable address
 * 
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 * Rate limit: 1 request/second
 * 
 * Alternative: Google Maps Geocoding API (requires API key)
 */

/**
 * Make an HTTPS GET request
 * @param {string} url - Full URL to request
 * @returns {Promise<Object>} Parsed JSON response
 */
const httpsGet = (url) => {
  return new Promise((resolve, reject) => {
    https
      .get(url, {
        headers: {
          'User-Agent': 'PulseMate-Connect/1.0 (Clinic Onboarding)',
        },
        timeout: 5000,
      })
      .on('response', (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        });
      })
      .on('error', (error) => {
        reject(error);
      })
      .on('timeout', () => {
        reject(new Error('Request timeout'));
      });
  });
};

/**
 * Reverse geocode coordinates to address using Nominatim (OpenStreetMap)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Address components
 */
const reverseGeocode = async (lat, lng) => {
  try {
    // Validate coordinates
    if (!lat || !lng) {
      throw new Error('Latitude and longitude are required');
    }

    if (lat < -90 || lat > 90) {
      throw new Error('Invalid latitude. Must be between -90 and 90');
    }

    if (lng < -180 || lng > 180) {
      throw new Error('Invalid longitude. Must be between -180 and 180');
    }

    // Use Nominatim API (OpenStreetMap)
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`;
    const data = await httpsGet(url);

    if (!data || !data.address) {
      throw new Error('Unable to geocode the provided coordinates');
    }

    const address = data.address;

    // Extract address components
    const addressComponents = {
      // Full formatted address
      formattedAddress: data.display_name || '',

      // Address components
      addressLine1: buildAddressLine1(address),
      addressLine2: buildAddressLine2(address),
      landmark: address.landmark || address.building || null,
      city: address.city || address.town || address.village || address.municipality || '',
      district: address.county || address.state_district || '',
      state: address.state || '',
      pincode: address.postcode || '',
      country: address.country || 'India',
      countryCode: address.country_code?.toUpperCase() || 'IN',

      // Additional details
      neighbourhood: address.neighbourhood || address.suburb || null,
      road: address.road || null,
    };

    logger.info('[reverseGeocode] Success', {
      lat,
      lng,
      city: addressComponents.city,
      state: addressComponents.state,
    });

    return addressComponents;
  } catch (error) {
    logger.error('[reverseGeocode] Error:', {
      lat,
      lng,
      error: error.message,
    });

    throw new Error(error.message || 'Failed to geocode location');
  }
};

/**
 * Build address line 1 from components
 * Typically: building number, street name
 */
const buildAddressLine1 = (address) => {
  const parts = [];

  if (address.house_number) parts.push(address.house_number);
  if (address.building) parts.push(address.building);
  if (address.road) parts.push(address.road);

  return parts.join(', ') || address.road || '';
};

/**
 * Build address line 2 from components
 * Typically: neighbourhood, locality, suburb
 */
const buildAddressLine2 = (address) => {
  const parts = [];

  if (address.neighbourhood) parts.push(address.neighbourhood);
  if (address.suburb) parts.push(address.suburb);
  if (address.locality) parts.push(address.locality);

  return parts.join(', ') || '';
};

/**
 * Search for locations by query string
 * @param {string} query - Search query (e.g., "Apollo Hospital Bangalore")
 * @returns {Promise<Array>} Array of location results
 */
const searchLocation = async (query) => {
  try {
    if (!query || query.trim().length < 3) {
      throw new Error('Search query must be at least 3 characters');
    }

    const encodedQuery = encodeURIComponent(query);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&addressdetails=1&limit=10&countrycodes=in`;
    
    const data = await httpsGet(url);
    const results = data || [];

    return results.map((result) => ({
      name: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      type: result.type,
      importance: result.importance,
      address: result.address,
    }));
  } catch (error) {
    logger.error('[searchLocation] Error:', {
      query,
      error: error.message,
    });

    throw new Error(error.message || 'Location search failed');
  }
};

module.exports = {
  reverseGeocode,
  searchLocation,
};
