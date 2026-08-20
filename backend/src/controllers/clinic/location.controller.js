'use strict';

const { reverseGeocode, searchLocation } = require('../../services/geocoding.service');
const { sendSuccess, sendError } = require('../../utils/response');

/**
 * GET /api/location/reverse-geocode?lat={lat}&lng={lng}
 * Convert coordinates to address
 */
const reverseGeocodeAddress = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return sendError(res, 'Latitude and longitude are required', 400);
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return sendError(res, 'Invalid latitude or longitude', 400);
    }

    const address = await reverseGeocode(latitude, longitude);

    return sendSuccess(res, address);
  } catch (error) {
    console.error('[reverseGeocodeAddress] Error:', error);
    return sendError(res, error.message || 'Failed to geocode location', 500);
  }
};

/**
 * GET /api/location/search?q={query}
 * Search for locations
 */
const searchLocationByQuery = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 3) {
      return sendError(res, 'Search query must be at least 3 characters', 400);
    }

    const results = await searchLocation(q.trim());

    return sendSuccess(res, results);
  } catch (error) {
    console.error('[searchLocationByQuery] Error:', error);
    return sendError(res, error.message || 'Location search failed', 500);
  }
};

module.exports = {
  reverseGeocodeAddress,
  searchLocationByQuery,
};
