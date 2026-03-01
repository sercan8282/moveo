import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || '/api';

export default function TransportCalculator() {
  const location = useLocation();
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [distanceKm, setDistanceKm] = useState(null);
  const [isDomestic, setIsDomestic] = useState(true);
  const [isExpress, setIsExpress] = useState(false);
  const [priceResult, setPriceResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [prefillVehicleId, setPrefillVehicleId] = useState(null);

  // Route info from backend
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [googleMapsReady, setGoogleMapsReady] = useState(false);

  // Quote form
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ customerName: '', customerEmail: '', customerPhone: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Refs for autocomplete & map
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);
  const startAutocomplete = useRef(null);
  const endAutocomplete = useRef(null);
  const startPlaceRef = useRef(null);
  const endPlaceRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const markersRef = useRef([]);

  // Read query params on mount to prefill from quote card
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const from = params.get('from');
    const to = params.get('to');
    const domestic = params.get('domestic');
    const vehicle = params.get('vehicle');
    
    if (from) setStartAddress(from);
    if (to) setEndAddress(to);
    if (domestic !== null) setIsDomestic(domestic === '1');
    if (vehicle) setPrefillVehicleId(vehicle);
  }, [location.search]);

  useEffect(() => {
    fetchVehicleTypes();
    loadGoogleMaps();
  }, []);
  
  // Select prefilled vehicle after vehicle types are loaded
  useEffect(() => {
    if (prefillVehicleId && vehicleTypes.length > 0) {
      const vehicle = vehicleTypes.find(v => String(v.id) === String(prefillVehicleId));
      if (vehicle) {
        setSelectedVehicle(vehicle);
        setPrefillVehicleId(null); // Clear so it doesn't re-trigger
      }
    }
  }, [prefillVehicleId, vehicleTypes]);

  async function fetchVehicleTypes() {
    try {
      const res = await fetch(`${API}/vehicle-types/public`);
      if (res.ok) {
        const data = await res.json();
        setVehicleTypes(data);
        if (data.length > 0 && !prefillVehicleId) setSelectedVehicle(data[0]);
      }
    } catch (err) { console.error('Failed to load vehicle types:', err); }
  }

  function loadGoogleMaps() {
    if (window.google?.maps?.places) {
      setGoogleMapsReady(true);
      initAutocomplete();
      return;
    }

    fetch(`${API}/public/settings`)
      .then(r => r.json())
      .then(settings => {
        const apiKey = settings.google_maps_api_key;
        if (!apiKey || apiKey === '""') {
          console.warn('Google Maps API key not configured — using manual mode');
          return;
        }
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initGoogleAutocomplete`;
        script.async = true;
        script.defer = true;
        window.initGoogleAutocomplete = () => {
          setGoogleMapsReady(true);
          initAutocomplete();
        };
        document.head.appendChild(script);
      })
      .catch(() => console.warn('Could not load settings for Google Maps'));
  }

  function initAutocomplete() {
    if (!window.google?.maps?.places) return;

    if (startInputRef.current && !startAutocomplete.current) {
      startAutocomplete.current = new window.google.maps.places.Autocomplete(startInputRef.current, {
        types: ['address'],
        fields: ['formatted_address', 'geometry', 'address_components']
      });
      startAutocomplete.current.addListener('place_changed', () => {
        const place = startAutocomplete.current.getPlace();
        if (place.formatted_address) {
          setStartAddress(place.formatted_address);
          startPlaceRef.current = place;
          tryCalculateRoute();
        }
      });
    }

    if (endInputRef.current && !endAutocomplete.current) {
      endAutocomplete.current = new window.google.maps.places.Autocomplete(endInputRef.current, {
        types: ['address'],
        fields: ['formatted_address', 'geometry', 'address_components']
      });
      endAutocomplete.current.addListener('place_changed', () => {
        const place = endAutocomplete.current.getPlace();
        if (place.formatted_address) {
          setEndAddress(place.formatted_address);
          endPlaceRef.current = place;
          tryCalculateRoute();
        }
      });
    }
  }

  //  ── Trigger route calc when both addresses are set ──
  const tryCalculateRoute = useCallback(() => {
    setTimeout(() => {
      const start = startPlaceRef.current;
      const end = endPlaceRef.current;
      if (start?.geometry?.location && end?.geometry?.location) {
        calculateRoute(start, end);
      }
    }, 100);
  }, []);

  // When vehicle type changes, recalculate (tolls differ per vehicle)
  const prevVehicleRef = useRef(null);
  useEffect(() => {
    if (selectedVehicle && prevVehicleRef.current && prevVehicleRef.current !== selectedVehicle.id) {
      const start = startPlaceRef.current;
      const end = endPlaceRef.current;
      if (start?.geometry?.location && end?.geometry?.location) {
        calculateRoute(start, end);
      }
    }
    prevVehicleRef.current = selectedVehicle?.id;
  }, [selectedVehicle]);

  // ── Call backend /route ──
  async function calculateRoute(startPlace, endPlace) {
    setRouteLoading(true);
    setRouteError(null);
    try {
      const origin = {
        lat: startPlace.geometry.location.lat(),
        lng: startPlace.geometry.location.lng()
      };
      const dest = {
        lat: endPlace.geometry.location.lat(),
        lng: endPlace.geometry.location.lng()
      };

      const res = await fetch(`${API}/calculator/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination: dest,
          vehicleTypeId: selectedVehicle?.id || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setRouteError(data.error || 'Route berekening mislukt');
        return;
      }

      setRouteInfo(data);
      setDistanceKm(data.distanceKm);
      if (data.isDomestic !== null) setIsDomestic(data.isDomestic);

      // Draw route on map
      if (data.encodedPolyline) {
        drawRouteOnMap(data.encodedPolyline, origin, dest);
      }
    } catch (err) {
      console.error('Route calculation failed:', err);
      setRouteError('Kon route niet berekenen. Probeer het opnieuw.');
    } finally {
      setRouteLoading(false);
    }
  }

  // ── Google Map + Polyline ──
  function drawRouteOnMap(encodedPolyline, origin, dest) {
    if (!window.google?.maps || !mapContainerRef.current) return;

    // Create map if not exists
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
        zoom: 7,
        center: { lat: 52.0, lng: 5.0 },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'simplified' }] }
        ]
      });
    }

    // Clear old polyline & markers
    if (polylineRef.current) polylineRef.current.setMap(null);
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Decode polyline
    const path = window.google.maps.geometry.encoding.decodePath(encodedPolyline);

    // Draw polyline
    polylineRef.current = new window.google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#2563eb',
      strokeOpacity: 0.8,
      strokeWeight: 5
    });
    polylineRef.current.setMap(mapInstanceRef.current);

    // Markers
    const startMarker = new window.google.maps.Marker({
      position: { lat: origin.lat, lng: origin.lng },
      map: mapInstanceRef.current,
      title: 'Vertrekpunt',
      label: { text: 'A', color: '#fff', fontWeight: 'bold' },
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: '#16a34a',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3
      }
    });

    const endMarker = new window.google.maps.Marker({
      position: { lat: dest.lat, lng: dest.lng },
      map: mapInstanceRef.current,
      title: 'Bestemming',
      label: { text: 'B', color: '#fff', fontWeight: 'bold' },
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: '#dc2626',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3
      }
    });

    markersRef.current = [startMarker, endMarker];

    // Fit bounds
    const bounds = new window.google.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    mapInstanceRef.current.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
  }

  // ── Price calculation (triggered by state changes) ──
  useEffect(() => {
    if (selectedVehicle && distanceKm && distanceKm > 0) {
      calculatePrice();
    } else {
      setPriceResult(null);
    }
  }, [selectedVehicle, distanceKm, isDomestic, isExpress, routeInfo]);

  async function calculatePrice() {
    setCalculating(true);
    try {
      const res = await fetch(`${API}/calculator/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleTypeId: selectedVehicle.id,
          distanceKm,
          isDomestic,
          isExpress,
          tollCosts: routeInfo?.tollCostReturnTrip || 0
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPriceResult(data);
      }
    } catch (err) { console.error('Price calculation failed:', err); }
    finally { setCalculating(false); }
  }

  async function handleSubmitQuote(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/calculator/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startAddress,
          endAddress,
          distanceKm,
          vehicleTypeId: selectedVehicle.id,
          isDomestic,
          isExpress,
          tollCosts: routeInfo?.tollCostReturnTrip || 0,
          ...quoteForm
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        setShowQuoteForm(false);
      } else {
        alert(data.error || 'Er is een fout opgetreden');
      }
    } catch (err) {
      alert('Er is een fout opgetreden bij het versturen');
    }
    finally { setSubmitting(false); }
  }

  function resetCalculator() {
    setSubmitted(false);
    setPriceResult(null);
    setDistanceKm(null);
    setStartAddress('');
    setEndAddress('');
    setRouteInfo(null);
    setRouteError(null);
    setShowQuoteForm(false);
    setQuoteForm({ customerName: '', customerEmail: '', customerPhone: '', notes: '' });
    startPlaceRef.current = null;
    endPlaceRef.current = null;
    if (polylineRef.current) polylineRef.current.setMap(null);
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  }

  // ── Submitted state ──
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center" style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text, #0f172a)' }}>Offerte aanvraag ontvangen!</h2>
          <p className="text-lg mb-2" style={{ color: 'var(--color-text-light, #64748b)' }}>
            Bedankt voor uw aanvraag. Wij nemen zo spoedig mogelijk contact met u op.
          </p>
          {priceResult && (
            <p className="text-2xl font-bold mt-4" style={{ color: 'var(--color-primary, #2563eb)' }}>
              Geschatte prijs: €{priceResult.totalPrice.toFixed(2)}
            </p>
          )}
          <button onClick={resetCalculator}
            className="mt-6 px-6 py-3 rounded-lg text-white font-semibold"
            style={{ backgroundColor: 'var(--color-primary, #2563eb)' }}>
            Nieuwe berekening
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ──
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--color-text, #0f172a)' }}>
          🚛 Transportkosten Calculator
        </h1>
        <p className="text-lg" style={{ color: 'var(--color-text-light, #64748b)' }}>
          Bereken direct de kosten voor het transport van uw goederen
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── Route Section ── */}
          <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text, #0f172a)' }}>
              📍 Route
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text, #0f172a)' }}>
                    Vertrekadres
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-lg">A</span>
                    <input ref={startInputRef} type="text" value={startAddress}
                      onChange={e => setStartAddress(e.target.value)}
                      placeholder="Zoek vertrekadres..."
                      className="w-full pl-9 pr-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-colors text-base"
                      style={{ borderColor: 'var(--color-border, #e2e8f0)', backgroundColor: 'var(--color-surface, #fff)' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text, #0f172a)' }}>
                    Bestemmingsadres
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 text-lg">B</span>
                    <input ref={endInputRef} type="text" value={endAddress}
                      onChange={e => setEndAddress(e.target.value)}
                      placeholder="Zoek bestemmingsadres..."
                      className="w-full pl-9 pr-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-colors text-base"
                      style={{ borderColor: 'var(--color-border, #e2e8f0)', backgroundColor: 'var(--color-surface, #fff)' }} />
                  </div>
                </div>
              </div>

              {/* Coordinates display */}
              {startPlaceRef.current?.geometry?.location && endPlaceRef.current?.geometry?.location && (
                <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--color-text-light, #64748b)' }}>
                  <span>📍 A: {startPlaceRef.current.geometry.location.lat().toFixed(5)}, {startPlaceRef.current.geometry.location.lng().toFixed(5)}</span>
                  <span>📍 B: {endPlaceRef.current.geometry.location.lat().toFixed(5)}, {endPlaceRef.current.geometry.location.lng().toFixed(5)}</span>
                </div>
              )}

              {/* Route loading / error */}
              {routeLoading && (
                <div className="flex items-center gap-2 text-sm py-2" style={{ color: 'var(--color-primary, #2563eb)' }}>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Route berekenen op basis van voertuigtype...
                </div>
              )}
              {routeError && (
                <div className="bg-red-50 text-red-700 rounded-lg px-4 py-2 text-sm">
                  ⚠️ {routeError}
                </div>
              )}

              {/* Map */}
              {googleMapsReady && (
                <div
                  ref={mapContainerRef}
                  className="w-full rounded-xl overflow-hidden border transition-all"
                  style={{
                    height: routeInfo ? '300px' : '0',
                    borderColor: routeInfo ? 'var(--color-border, #e2e8f0)' : 'transparent',
                    opacity: routeInfo ? 1 : 0
                  }}
                />
              )}

              {/* Route summary bar */}
              {routeInfo && (
                <div className="flex flex-wrap gap-4 bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📏</span>
                    <div>
                      <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-light, #64748b)' }}>Afstand</div>
                      <div className="font-bold text-lg" style={{ color: 'var(--color-text, #0f172a)' }}>{routeInfo.distanceKm} km</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⏱️</span>
                    <div>
                      <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-light, #64748b)' }}>Reistijd</div>
                      <div className="font-bold text-lg" style={{ color: 'var(--color-text, #0f172a)' }}>{routeInfo.durationText}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔄</span>
                    <div>
                      <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-light, #64748b)' }}>Retour totaal</div>
                      <div className="font-bold text-lg" style={{ color: 'var(--color-text, #0f172a)' }}>{(routeInfo.distanceKm * 2).toFixed(1)} km</div>
                    </div>
                  </div>
                  {routeInfo.isDomestic !== null && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{routeInfo.isDomestic ? '🇳🇱' : '🌍'}</span>
                      <div>
                        <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-light, #64748b)' }}>Type</div>
                        <div className="font-bold text-lg" style={{ color: 'var(--color-text, #0f172a)' }}>
                          {routeInfo.isDomestic ? 'Binnenlands' : 'Internationaal'}
                        </div>
                      </div>
                    </div>
                  )}
                  {routeInfo.hasTolls && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🛣️</span>
                      <div>
                        <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-light, #64748b)' }}>Tolkosten retour</div>
                        <div className="font-bold text-lg text-amber-600">€{routeInfo.tollCostReturnTrip.toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual distance fallback (shown if no Google Maps) */}
              {!googleMapsReady && (
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text, #0f172a)' }}>
                    Afstand (km) — handmatig invoeren
                  </label>
                  <input type="number" min="1" step="0.1"
                    value={distanceKm || ''}
                    onChange={e => setDistanceKm(parseFloat(e.target.value) || null)}
                    placeholder="Voer de afstand in km in"
                    className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-colors text-base"
                    style={{ borderColor: 'var(--color-border, #e2e8f0)', backgroundColor: 'var(--color-surface, #fff)' }} />
                </div>
              )}
            </div>
          </div>

          {/* ── Vehicle Type Selection ── */}
          <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text, #0f172a)' }}>
              🚛 Voertuigtype
            </h2>
            {vehicleTypes.length === 0 ? (
              <p className="text-center py-4" style={{ color: 'var(--color-text-light, #64748b)' }}>
                Geen voertuigtypes beschikbaar
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicleTypes.map(vt => {
                  const isSelected = selectedVehicle?.id === vt.id;
                  return (
                    <button key={vt.id}
                      onClick={() => setSelectedVehicle(vt)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected ? 'shadow-md' : 'hover:shadow-sm'
                      }`}
                      style={{
                        borderColor: isSelected ? 'var(--color-primary, #2563eb)' : 'var(--color-border, #e2e8f0)',
                        backgroundColor: isSelected ? 'var(--color-primary, #2563eb)' : 'var(--color-surface, #fff)'
                      }}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{vt.icon || '🚛'}</span>
                        <div>
                          <div className="font-semibold" style={{ color: isSelected ? '#fff' : 'var(--color-text, #0f172a)' }}>{vt.name}</div>
                          {vt.description && (
                            <div className="text-xs mt-0.5" style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--color-text-light, #64748b)' }}>{vt.description}</div>
                          )}
                          <div className="text-xs mt-1" style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--color-text-light, #64748b)' }}>
                            Vanaf €{(isDomestic ? vt.pricePerKmDomestic : vt.pricePerKmInternational).toFixed(2)}/km
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Options ── */}
          <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text, #0f172a)' }}>
              ⚙️ Opties
            </h2>
            <div className="flex flex-wrap gap-3">
              {/* Domestic / International toggle */}
              <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
                <button onClick={() => setIsDomestic(true)}
                  className="px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{ backgroundColor: isDomestic ? 'var(--color-primary, #2563eb)' : 'var(--color-surface, #fff)', color: isDomestic ? '#fff' : 'var(--color-text, #0f172a)' }}>
                  🇳🇱 Binnenlands
                </button>
                <button onClick={() => setIsDomestic(false)}
                  className="px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{ backgroundColor: !isDomestic ? 'var(--color-primary, #2563eb)' : 'var(--color-surface, #fff)', color: !isDomestic ? '#fff' : 'var(--color-text, #0f172a)' }}>
                  🌍 Internationaal
                </button>
              </div>

              {/* Express toggle */}
              {selectedVehicle?.expressSurchargePercent > 0 && (
                <button onClick={() => setIsExpress(!isExpress)}
                  className="px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors flex items-center gap-2"
                  style={{
                    backgroundColor: isExpress ? '#f59e0b' : 'var(--color-surface, #fff)',
                    borderColor: isExpress ? '#f59e0b' : 'var(--color-border, #e2e8f0)',
                    color: isExpress ? '#fff' : 'var(--color-text, #0f172a)'
                  }}>
                  ⚡ Express (+{selectedVehicle.expressSurchargePercent}%)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Price Result ── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border p-6 sticky top-24" style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text, #0f172a)' }}>
              💰 Prijsindicatie
            </h2>

            {!selectedVehicle || !distanceKm ? (
              <div className="text-center py-8" style={{ color: 'var(--color-text-light, #64748b)' }}>
                <p className="text-4xl mb-3">🧮</p>
                <p className="text-sm">
                  {googleMapsReady
                    ? 'Selecteer een voertuigtype en zoek beide adressen om de prijs te berekenen'
                    : 'Selecteer een voertuigtype en voer de afstand in om de prijs te berekenen'}
                </p>
              </div>
            ) : calculating ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-b-2 rounded-full mx-auto mb-3" style={{ borderColor: 'var(--color-primary, #2563eb)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-light, #64748b)' }}>Berekenen...</p>
              </div>
            ) : priceResult ? (
              <div className="space-y-3">
                {/* Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between" style={{ color: 'var(--color-text, #0f172a)' }}>
                    <span>Tarief per km:</span>
                    <span>€{priceResult.basePricePerKm.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between" style={{ color: 'var(--color-text, #0f172a)' }}>
                    <span>Afstand × 2 (retour):</span>
                    <span>{priceResult.distanceKm.toFixed(1)} km × 2</span>
                  </div>
                  <div className="flex justify-between" style={{ color: 'var(--color-text, #0f172a)' }}>
                    <span>Basisprijs:</span>
                    <span>€{priceResult.basePrice.toFixed(2)}</span>
                  </div>
                  {priceResult.expressSurcharge > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>⚡ Express ({priceResult.expressSurchargePercent}%):</span>
                      <span>+€{priceResult.expressSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                  {priceResult.additionalCostsItems?.length > 0 && priceResult.additionalCostsItems.map((item, i) => (
                    <div key={i} className="flex justify-between" style={{ color: 'var(--color-text-light, #64748b)' }}>
                      <span>{item.name}:</span>
                      <span>+€{item.amount.toFixed(2)}</span>
                    </div>
                  ))}

                  {/* Toll costs */}
                  {priceResult.tollCosts > 0 && (
                    <div className="flex justify-between text-orange-600 font-medium">
                      <span>🛣️ Tolkosten (retour):</span>
                      <span>+€{priceResult.tollCosts.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Toll info detail */}
                {routeInfo?.hasTolls && routeInfo.tollSegments?.length > 0 && (
                  <div className="bg-orange-50 rounded-lg px-3 py-2 space-y-1">
                    <div className="text-xs font-semibold text-orange-700">🛣️ Tolwegen gedetecteerd</div>
                    {routeInfo.tollSegments.filter(s => !s.info).map((seg, i) => (
                      <div key={i} className="flex justify-between text-xs text-orange-600">
                        <span>{seg.description}:</span>
                        <span>€{seg.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    {routeInfo.tollSegments.filter(s => s.info).map((seg, i) => (
                      <div key={i} className="text-xs text-orange-500 italic">{seg.description}</div>
                    ))}
                  </div>
                )}

                {/* Total */}
                <div className="pt-3 border-t" style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text, #0f172a)' }}>Totaalprijs:</span>
                    <span className="text-3xl font-bold" style={{ color: 'var(--color-primary, #2563eb)' }}>
                      €{priceResult.totalPrice.toFixed(2)}
                    </span>
                  </div>
                  {priceResult.minPrice > 0 && priceResult.totalPrice === priceResult.minPrice && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-light, #64748b)' }}>
                      (Minimumprijs van toepassing)
                    </p>
                  )}
                  <p className="text-xs mt-2" style={{ color: 'var(--color-text-light, #64748b)' }}>
                    * Dit is een indicatieve prijs incl. tolkosten. De definitieve prijs kan afwijken.
                  </p>
                </div>

                {/* Submit Quote Button */}
                {!showQuoteForm && (
                  <button onClick={() => setShowQuoteForm(true)}
                    className="w-full py-3 rounded-lg text-white font-semibold text-base transition-colors mt-4"
                    style={{ backgroundColor: 'var(--color-primary, #2563eb)' }}>
                    📩 Offerte aanvragen
                  </button>
                )}

                {/* Quote Form */}
                {showQuoteForm && (
                  <form onSubmit={handleSubmitQuote} className="space-y-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text, #0f172a)' }}>Uw gegevens</h3>
                    <input type="text" required value={quoteForm.customerName}
                      onChange={e => setQuoteForm(f => ({ ...f, customerName: e.target.value }))}
                      placeholder="Naam *"
                      className="w-full px-3 py-2.5 rounded-lg border text-sm"
                      style={{ borderColor: 'var(--color-border, #e2e8f0)' }} />
                    <input type="email" required value={quoteForm.customerEmail}
                      onChange={e => setQuoteForm(f => ({ ...f, customerEmail: e.target.value }))}
                      placeholder="E-mailadres *"
                      className="w-full px-3 py-2.5 rounded-lg border text-sm"
                      style={{ borderColor: 'var(--color-border, #e2e8f0)' }} />
                    <input type="tel" value={quoteForm.customerPhone}
                      onChange={e => setQuoteForm(f => ({ ...f, customerPhone: e.target.value }))}
                      placeholder="Telefoonnummer"
                      className="w-full px-3 py-2.5 rounded-lg border text-sm"
                      style={{ borderColor: 'var(--color-border, #e2e8f0)' }} />
                    <textarea value={quoteForm.notes}
                      onChange={e => setQuoteForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Eventuele opmerkingen..."
                      rows="3"
                      className="w-full px-3 py-2.5 rounded-lg border text-sm resize-y"
                      style={{ borderColor: 'var(--color-border, #e2e8f0)' }} />
                    <div className="flex gap-2">
                      <button type="submit" disabled={submitting}
                        className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-50 transition-colors"
                        style={{ backgroundColor: 'var(--color-primary, #2563eb)' }}>
                        {submitting ? 'Versturen...' : 'Offerte versturen'}
                      </button>
                      <button type="button" onClick={() => setShowQuoteForm(false)}
                        className="px-4 py-2.5 rounded-lg border text-sm"
                        style={{ borderColor: 'var(--color-border, #e2e8f0)', color: 'var(--color-text, #0f172a)' }}>
                        Annuleren
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5 text-center" style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
          <div className="text-3xl mb-2">📍</div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text, #0f172a)' }}>Adres autocomplete</h3>
          <p className="text-sm" style={{ color: 'var(--color-text-light, #64748b)' }}>
            Zoek adressen via Google Maps met exacte coördinaten
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5 text-center" style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
          <div className="text-3xl mb-2">🚛</div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text, #0f172a)' }}>Voertuigtype routing</h3>
          <p className="text-sm" style={{ color: 'var(--color-text-light, #64748b)' }}>
            Route en afstand berekend op basis van uw voertuigkeuze
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5 text-center" style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
          <div className="text-3xl mb-2">🛣️</div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text, #0f172a)' }}>Tolkosten inbegrepen</h3>
          <p className="text-sm" style={{ color: 'var(--color-text-light, #64748b)' }}>
            Automatische detectie en berekening van tolwegen op de route
          </p>
        </div>
        <div className="bg-white rounded-xl border p-5 text-center" style={{ borderColor: 'var(--color-border, #e2e8f0)' }}>
          <div className="text-3xl mb-2">📩</div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text, #0f172a)' }}>Direct offerte</h3>
          <p className="text-sm" style={{ color: 'var(--color-text-light, #64748b)' }}>
            Vraag direct een vrijblijvende offerte aan met een paar klikken
          </p>
        </div>
      </div>
    </div>
  );
}
