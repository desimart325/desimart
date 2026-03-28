const router = require('express').Router();

// Store location: 31134 Haggerty Rd, Farmington Hills, MI 48331
// Coordinates from OpenStreetMap
const STORE_LAT = 42.5247310;
const STORE_LNG = -83.4366529;
const RADIUS_MILES = 5;

function haversine(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodeNominatim(street, city, state, zip) {
  const params = new URLSearchParams({
    street, city, state,
    postalcode: zip,
    country: 'US',
    format: 'json',
    limit: '1',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'DesiMart/1.0 (desimart325@gmail.com)' },
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function geocodeCensus(street, city, state, zip) {
  const params = new URLSearchParams({
    street, city, state, zip,
    benchmark: '2020',
    format: 'json',
  });
  const res = await fetch(`https://geocoding.geo.census.gov/geocoder/locations/address?${params}`, {
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json();
  const matches = data?.result?.addressMatches;
  if (!matches || matches.length === 0) return null;
  return { lat: matches[0].coordinates.y, lng: matches[0].coordinates.x };
}

// POST /api/delivery/check  { street, city, state, zipCode }
router.post('/check', async (req, res) => {
  const { street, city, state, zipCode } = req.body;
  if (!street || !city || !state || !zipCode) {
    return res.status(400).json({ error: 'Full address required' });
  }

  try {
    // Try Nominatim first (better coverage), fall back to Census
    let coords = await geocodeNominatim(street, city, state, zipCode).catch(() => null);
    if (!coords) {
      coords = await geocodeCensus(street, city, state, zipCode).catch(() => null);
    }

    if (!coords) {
      return res.json({ withinRadius: false, distance: null, deliveryFee: 4.99, geocoded: false });
    }

    const distance = haversine(STORE_LAT, STORE_LNG, coords.lat, coords.lng);
    const withinRadius = distance <= RADIUS_MILES;

    res.json({
      withinRadius,
      distance: Math.round(distance * 10) / 10,
      deliveryFee: withinRadius ? 0 : 4.99,
      geocoded: true,
    });
  } catch (e) {
    res.json({ withinRadius: false, distance: null, deliveryFee: 4.99, geocoded: false });
  }
});

module.exports = router;
