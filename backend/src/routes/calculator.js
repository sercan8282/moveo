const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { canAccess } = require('../middleware/roles');
const { sendQuoteEmail, sendQuoteConfirmationToCustomer } = require('../services/emailService');

const router = express.Router();
const prisma = new PrismaClient();

// ─── Helper: Get Google Maps API key from settings ───
async function getGoogleMapsApiKey() {
  const setting = await prisma.setting.findUnique({ where: { key: 'google_maps_api_key' } });
  if (!setting?.value) return null;
  const val = typeof setting.value === 'string' ? setting.value.replace(/^["']+|["']+$/g, '') : setting.value;
  return val || null;
}

// ─── Public: Compute route via Google Routes API ───
// Returns distance (vehicle-type aware), duration, tolls, polyline
router.post('/route', async (req, res) => {
  try {
    const { origin, destination, vehicleTypeId } = req.body;

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return res.status(400).json({ error: 'Oorsprong en bestemming coördinaten zijn verplicht' });
    }

    const apiKey = await getGoogleMapsApiKey();
    if (!apiKey) {
      return res.status(400).json({ error: 'Google Maps API key is niet geconfigureerd. Stel deze in via Admin → Bedrijfsinstellingen.' });
    }

    // Get vehicle type for routing preferences
    const vehicleType = vehicleTypeId
      ? await prisma.vehicleType.findUnique({ where: { id: parseInt(vehicleTypeId) } })
      : null;

    // Determine if this is a heavy/tall vehicle needing truck-aware routing
    const heavySlugs = ['vrachtwagen', 'motorwagen', 'koelwagen', 'dieplader'];
    const isHeavyVehicle = vehicleType && heavySlugs.includes(vehicleType.slug);

    // Build Routes API request body
    const routeRequestBody = {
      origin: {
        location: { latLng: { latitude: parseFloat(origin.lat), longitude: parseFloat(origin.lng) } }
      },
      destination: {
        location: { latLng: { latitude: parseFloat(destination.lat), longitude: parseFloat(destination.lng) } }
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      extraComputations: ['TOLLS'],
      computeAlternativeRoutes: false,
      routeModifiers: {
        vehicleInfo: {
          emissionType: 'DIESEL'
        }
      },
      units: 'METRIC'
    };

    // For heavy vehicles, set vehicle dimensions so the API avoids low bridges etc.
    if (isHeavyVehicle) {
      const dims = {
        vrachtwagen:  { heightMeters: 4.0, widthMeters: 2.55, lengthMeters: 16.5, weightKg: 40000 },
        motorwagen:   { heightMeters: 3.8, widthMeters: 2.55, lengthMeters: 12.0, weightKg: 26000 },
        koelwagen:    { heightMeters: 4.0, widthMeters: 2.55, lengthMeters: 16.5, weightKg: 40000 },
        dieplader:    { heightMeters: 4.2, widthMeters: 3.0,  lengthMeters: 22.0, weightKg: 60000 }
      };
      const d = dims[vehicleType.slug] || dims.vrachtwagen;
      // The Routes API doesn't support TRUCK travelMode, but we can set
      // avoidance of highways that have low-clearance restrictions via route modifiers.
      // Vehicle dimensions are primarily used for toll calculation accuracy.
      routeRequestBody.routeModifiers.vehicleInfo = {
        ...routeRequestBody.routeModifiers.vehicleInfo,
        ...d
      };
    }

    // Field mask for response
    const fieldMask = [
      'routes.duration',
      'routes.distanceMeters',
      'routes.polyline.encodedPolyline',
      'routes.travelAdvisory.tollInfo',
      'routes.legs.startLocation',
      'routes.legs.endLocation'
    ].join(',');

    // Call Google Routes API
    const routesResponse = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask
      },
      body: JSON.stringify(routeRequestBody)
    });

    const routeData = await routesResponse.json();

    if (routeData.error) {
      console.error('Google Routes API error:', routeData.error);
      return res.status(502).json({
        error: 'Routeberekening mislukt: ' + (routeData.error.message || 'Onbekende fout')
      });
    }

    if (!routeData.routes || routeData.routes.length === 0) {
      return res.status(400).json({ error: 'Geen route gevonden tussen de opgegeven adressen' });
    }

    const route = routeData.routes[0];
    const distanceMeters = route.distanceMeters || 0;
    const distanceKm = Math.round(distanceMeters / 100) / 10; // 1 decimal
    const durationStr = route.duration || '0s';
    const durationSeconds = parseInt(durationStr.replace('s', '')) || 0;
    const durationMinutes = Math.round(durationSeconds / 60);

    // ── Extract toll info ──
    let tollCostBase = 0;
    let tollCurrency = 'EUR';
    const tollSegments = [];

    if (route.travelAdvisory?.tollInfo?.estimatedPrice) {
      route.travelAdvisory.tollInfo.estimatedPrice.forEach(price => {
        const amount = parseFloat(price.units || 0) + (price.nanos || 0) / 1e9;
        tollCostBase += amount;
        tollCurrency = price.currencyCode || 'EUR';
      });
    }

    // Apply vehicle-type toll multiplier (trucks pay more than cars)
    const tollMultiplier = vehicleType?.tollMultiplier || 1.0;
    const tollCostSingleTrip = Math.round(tollCostBase * tollMultiplier * 100) / 100;
    // Tolls are per-trip, for return trip multiply by 2
    const tollCostReturnTrip = Math.round(tollCostSingleTrip * 2 * 100) / 100;

    if (tollCostBase > 0) {
      tollSegments.push({
        description: 'Tolkosten (enkele reis)',
        amount: tollCostSingleTrip,
        currency: tollCurrency
      });
      tollSegments.push({
        description: 'Tolkosten retour (× 2)',
        amount: tollCostReturnTrip,
        currency: tollCurrency
      });
      if (tollMultiplier > 1.0) {
        tollSegments.push({
          description: `Toltarief vermenigvuldiger (${vehicleType.name}: ×${tollMultiplier})`,
          amount: null,
          currency: tollCurrency,
          info: true
        });
      }
    }

    // ── Reverse-geocode to detect countries ──
    let startCountry = null;
    let endCountry = null;
    try {
      const [startGeo, endGeo] = await Promise.all([
        reverseGeocode(apiKey, origin.lat, origin.lng),
        reverseGeocode(apiKey, destination.lat, destination.lng)
      ]);
      startCountry = startGeo;
      endCountry = endGeo;
    } catch (e) {
      console.warn('Reverse geocoding failed:', e.message);
    }

    res.json({
      distanceKm,
      durationMinutes,
      durationText: formatDuration(durationMinutes),
      tollCostReturnTrip,
      tollSegments,
      hasTolls: tollCostBase > 0,
      encodedPolyline: route.polyline?.encodedPolyline || null,
      startCountry,
      endCountry,
      isDomestic: startCountry && endCountry ? startCountry === endCountry : null,
      vehicleTypeUsed: vehicleType?.name || null
    });
  } catch (error) {
    console.error('Route calculation error:', error);
    res.status(500).json({ error: 'Fout bij berekenen route' });
  }
});

// Helper: reverse geocode to get country code
async function reverseGeocode(apiKey, lat, lng) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&result_type=country`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.results?.length > 0) {
      const comp = data.results[0].address_components?.find(c => c.types.includes('country'));
      return comp?.short_name || null;
    }
    return null;
  } catch { return null; }
}

// Helper: format duration
function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}u ${m}min` : `${h}u`;
}

// Public: Calculate price (no DB save)
router.post('/calculate', async (req, res) => {
  try {
    const { vehicleTypeId, distanceKm, isDomestic, isExpress, tollCosts } = req.body;

    if (!vehicleTypeId || !distanceKm) {
      return res.status(400).json({ error: 'Voertuigtype en afstand zijn verplicht' });
    }

    const vehicleType = await prisma.vehicleType.findUnique({
      where: { id: parseInt(vehicleTypeId) }
    });

    if (!vehicleType || !vehicleType.active) {
      return res.status(404).json({ error: 'Voertuigtype niet gevonden of niet actief' });
    }

    const priceBreakdown = calculatePrice(
      vehicleType, parseFloat(distanceKm),
      isDomestic !== false, isExpress === true,
      parseFloat(tollCosts) || 0
    );

    res.json(priceBreakdown);
  } catch (error) {
    console.error('Calculate price error:', error);
    res.status(500).json({ error: 'Fout bij berekenen prijs' });
  }
});

// Public: Submit quote request
router.post('/quote', async (req, res) => {
  try {
    const {
      startAddress, endAddress, distanceKm,
      vehicleTypeId, isDomestic, isExpress,
      customerName, customerEmail, customerPhone, notes,
      tollCosts
    } = req.body;

    // Validation
    if (!startAddress || !endAddress || !distanceKm || !vehicleTypeId || !customerName || !customerEmail) {
      return res.status(400).json({ error: 'Vul alle verplichte velden in' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({ error: 'Ongeldig e-mailadres' });
    }

    const vehicleType = await prisma.vehicleType.findUnique({
      where: { id: parseInt(vehicleTypeId) }
    });

    if (!vehicleType || !vehicleType.active) {
      return res.status(404).json({ error: 'Voertuigtype niet gevonden of niet actief' });
    }

    const priceBreakdown = calculatePrice(
      vehicleType, parseFloat(distanceKm),
      isDomestic !== false, isExpress === true,
      parseFloat(tollCosts) || 0
    );

    const quote = await prisma.quoteRequest.create({
      data: {
        startAddress,
        endAddress,
        distanceKm: parseFloat(distanceKm),
        vehicleTypeId: parseInt(vehicleTypeId),
        isDomestic: isDomestic !== false,
        isExpress: isExpress === true,
        calculatedPrice: priceBreakdown.totalPrice,
        priceBreakdown,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        notes: notes || null,
        status: 'nieuw'
      }
    });

    // Send email notifications (async, don't block response)
    sendQuoteEmail(quote, vehicleType.name).catch(err => 
      console.error('Quote email failed:', err)
    );
    sendQuoteConfirmationToCustomer(quote, vehicleType.name).catch(err => 
      console.error('Customer confirmation email failed:', err)
    );

    res.status(201).json({
      success: true,
      message: 'Uw offerte aanvraag is ontvangen! Wij nemen zo snel mogelijk contact met u op.',
      quote: {
        id: quote.id,
        calculatedPrice: quote.calculatedPrice,
        priceBreakdown: quote.priceBreakdown
      }
    });
  } catch (error) {
    console.error('Submit quote error:', error);
    res.status(500).json({ error: 'Er is een fout opgetreden bij het versturen van uw aanvraag' });
  }
});

// Admin: Get all quote requests
router.get('/quotes', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, unread } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    
    const where = {};
    if (status) where.status = status;
    if (unread === 'true') where.read = false;

    const [quotes, total] = await Promise.all([
      prisma.quoteRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          vehicleType: { select: { name: true, slug: true, icon: true } }
        }
      }),
      prisma.quoteRequest.count({ where })
    ]);

    res.json({
      data: quotes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({ error: 'Fout bij ophalen offertes' });
  }
});

// Admin: Get single quote
router.get('/quotes/:id', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const quote = await prisma.quoteRequest.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { vehicleType: true }
    });
    if (!quote) return res.status(404).json({ error: 'Offerte niet gevonden' });
    res.json(quote);
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({ error: 'Fout bij ophalen offerte' });
  }
});

// Admin: Update quote status
router.put('/quotes/:id', authenticate, canAccess('settings'), async (req, res) => {
  try {
    const { status, read } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (read !== undefined) updateData.read = read;

    const quote = await prisma.quoteRequest.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
      include: { vehicleType: { select: { name: true } } }
    });
    res.json(quote);
  } catch (error) {
    console.error('Update quote error:', error);
    res.status(500).json({ error: 'Fout bij bijwerken offerte' });
  }
});

// Admin: Delete quote
router.delete('/quotes/:id', authenticate, canAccess('settings'), async (req, res) => {
  try {
    await prisma.quoteRequest.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete quote error:', error);
    res.status(500).json({ error: 'Fout bij verwijderen offerte' });
  }
});

// Admin: Get unread quote count
router.get('/quotes-unread', authenticate, async (req, res) => {
  try {
    const count = await prisma.quoteRequest.count({ where: { read: false } });
    res.json({ count });
  } catch (error) {
    console.error('Unread quotes count error:', error);
    res.status(500).json({ error: 'Fout' });
  }
});

// Price calculation helper (includes toll costs)
function calculatePrice(vehicleType, distanceKm, isDomestic, isExpress, tollCosts = 0) {
  const basePricePerKm = isDomestic 
    ? vehicleType.pricePerKmDomestic 
    : vehicleType.pricePerKmInternational;

  // Base price: tariff × km × 2 (return trip)
  let basePrice = basePricePerKm * distanceKm * 2;

  // Express surcharge
  let expressSurcharge = 0;
  if (isExpress && vehicleType.expressSurchargePercent > 0) {
    expressSurcharge = basePrice * (vehicleType.expressSurchargePercent / 100);
  }

  // Additional costs from vehicle type config
  let additionalCostsTotal = 0;
  const additionalCostsItems = [];
  if (vehicleType.additionalCosts && Array.isArray(vehicleType.additionalCosts)) {
    vehicleType.additionalCosts.forEach(cost => {
      if (cost.enabled !== false) {
        const amount = parseFloat(cost.amount) || 0;
        additionalCostsTotal += amount;
        additionalCostsItems.push({ name: cost.name, amount });
      }
    });
  }

  // Toll costs (already calculated with vehicle multiplier and return trip by /route endpoint)
  const tollCostsFinal = Math.round((parseFloat(tollCosts) || 0) * 100) / 100;

  let totalPrice = basePrice + expressSurcharge + additionalCostsTotal + tollCostsFinal;

  // Minimum price check
  if (vehicleType.minPrice > 0 && totalPrice < vehicleType.minPrice) {
    totalPrice = vehicleType.minPrice;
  }

  return {
    basePricePerKm,
    distanceKm,
    returnTrip: true,
    basePrice: Math.round(basePrice * 100) / 100,
    expressSurcharge: Math.round(expressSurcharge * 100) / 100,
    expressSurchargePercent: vehicleType.expressSurchargePercent,
    additionalCosts: Math.round(additionalCostsTotal * 100) / 100,
    additionalCostsItems,
    tollCosts: tollCostsFinal,
    minPrice: vehicleType.minPrice,
    totalPrice: Math.round(totalPrice * 100) / 100,
    isDomestic,
    isExpress,
    vehicleTypeName: vehicleType.name
  };
}

module.exports = router;
