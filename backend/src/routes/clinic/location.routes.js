'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const {
  reverseGeocodeAddress,
  searchLocationByQuery,
} = require('../../controllers/clinic/location.controller');

// Require authentication for all location endpoints
router.use(authenticate);

/**
 * GET /api/location/reverse-geocode?lat={lat}&lng={lng}
 * Convert coordinates to human-readable address
 */
router.get('/reverse-geocode', reverseGeocodeAddress);

/**
 * GET /api/location/search?q={query}
 * Search for locations by name/address
 */
router.get('/search', searchLocationByQuery);

module.exports = router;
