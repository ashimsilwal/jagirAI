'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin,
  Search,
  Crosshair,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  Compass,
  Building
} from 'lucide-react';
import type * as LeafletType from 'leaflet';

interface JobLocationMapPickerProps {
  locationName: string;
  onLocationNameChange: (name: string) => void;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onCoordinatesChange: (lat: number | null, lng: number | null) => void;
}

const CITY_PRESETS = [
  { name: 'Kathmandu', lat: 27.7172, lng: 85.3240, label: 'Kathmandu' },
  { name: 'Lalitpur (Patan)', lat: 27.6710, lng: 85.3206, label: 'Lalitpur' },
  { name: 'Bhaktapur', lat: 27.6710, lng: 85.4298, label: 'Bhaktapur' },
  { name: 'Pokhara', lat: 28.2096, lng: 83.9856, label: 'Pokhara' },
  { name: 'Biratnagar', lat: 26.4525, lng: 87.2718, label: 'Biratnagar' },
  { name: 'Chitwan (Bharatpur)', lat: 27.6833, lng: 84.4333, label: 'Chitwan' },
  { name: 'Butwal', lat: 27.7006, lng: 83.4484, label: 'Butwal' },
];

export default function JobLocationMapPicker({
  locationName,
  onLocationNameChange,
  latitude,
  longitude,
  onCoordinatesChange,
}: JobLocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletType.Map | null>(null);
  const markerRef = useRef<LeafletType.Marker | null>(null);
  const leafletModuleRef = useRef<typeof LeafletType | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [locatingUser, setLocatingUser] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);

  // Helper to create modern SVG pin
  const createPinIcon = (L: typeof LeafletType) => {
    return L.divIcon({
      className: 'jagir-custom-map-pin',
      html: `
        <div style="position: relative; width: 36px; height: 36px; transform: translate(-18px, -36px);">
          <div style="
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            width: 36px;
            height: 36px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 16px -2px rgba(2, 132, 199, 0.45), 0 3px 6px -1px rgba(0, 0, 0, 0.2);
            border: 2.5px solid #ffffff;
          ">
            <div style="
              width: 12px;
              height: 12px;
              background-color: #ffffff;
              border-radius: 50%;
              transform: rotate(45deg);
              box-shadow: inset 0 1px 3px rgba(0,0,0,0.25);
            "></div>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });
  };

  // Reverse geocode to suggest location name
  const reverseGeocode = useCallback(
    async (lat: number, lng: number, updateInput = false) => {
      try {
        setReverseGeocoding(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.display_name) {
          const addr = data.address || {};
          const city =
            addr.city ||
            addr.town ||
            addr.municipality ||
            addr.suburb ||
            addr.county ||
            addr.state ||
            '';
          const road = addr.road || addr.neighbourhood || addr.suburb || '';
          const country = addr.country || 'Nepal';

          let formatted = '';
          if (road && city) {
            formatted = `${road}, ${city}, ${country}`;
          } else if (city) {
            formatted = `${city}, ${country}`;
          } else {
            formatted = data.display_name.split(',').slice(0, 3).join(',').trim();
          }

          if (updateInput || !locationName.trim()) {
            onLocationNameChange(formatted);
          }
        }
      } catch (e) {
        console.warn('Reverse geocoding error:', e);
      } finally {
        setReverseGeocoding(false);
      }
    },
    [locationName, onLocationNameChange]
  );

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    import('leaflet').then((mod) => {
      if (!isMounted || !mapContainerRef.current) return;
      const L = (mod.default || mod) as typeof LeafletType;
      leafletModuleRef.current = L;

      if (mapInstanceRef.current) return;

      const initLat = latitude ?? 27.7172;
      const initLng = longitude ?? 85.3240;
      const initZoom = latitude && longitude ? 15 : 12;

      const map = L.map(mapContainerRef.current, {
        center: [initLat, initLng],
        zoom: initZoom,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      mapInstanceRef.current = map;

      // Clean OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // If existing coordinates, place initial marker
      if (latitude && longitude) {
        const marker = L.marker([latitude, longitude], {
          draggable: true,
          icon: createPinIcon(L),
        }).addTo(map);
        markerRef.current = marker;

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onCoordinatesChange(pos.lat, pos.lng);
          reverseGeocode(pos.lat, pos.lng, false);
        });
      }

      // Map click handler to place / move marker
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        onCoordinatesChange(lat, lng);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], {
            draggable: true,
            icon: createPinIcon(L),
          }).addTo(map);
          markerRef.current = marker;

          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onCoordinatesChange(pos.lat, pos.lng);
            reverseGeocode(pos.lat, pos.lng, false);
          });
        }

        reverseGeocode(lat, lng, false);
      });

      setMapLoaded(true);

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 300);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Sync external coordinates changes to marker/map
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !leafletModuleRef.current) return;
    const L = leafletModuleRef.current;
    const map = mapInstanceRef.current;

    if (latitude && longitude) {
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        const marker = L.marker([latitude, longitude], {
          draggable: true,
          icon: createPinIcon(L),
        }).addTo(map);
        markerRef.current = marker;

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onCoordinatesChange(pos.lat, pos.lng);
          reverseGeocode(pos.lat, pos.lng, false);
        });
      }
    } else {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
  }, [latitude, longitude, mapLoaded, onCoordinatesChange, reverseGeocode]);

  // Pan to preset or search target
  const panToTarget = (lat: number, lng: number, zoom = 15, name?: string) => {
    onCoordinatesChange(lat, lng);
    if (name) {
      onLocationNameChange(name);
    }
    if (mapInstanceRef.current && leafletModuleRef.current) {
      mapInstanceRef.current.setView([lat, lng], zoom);
      const L = leafletModuleRef.current;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          draggable: true,
          icon: createPinIcon(L),
        }).addTo(mapInstanceRef.current);
        markerRef.current = marker;

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onCoordinatesChange(pos.lat, pos.lng);
          reverseGeocode(pos.lat, pos.lng, false);
        });
      }
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
    }
  };

  // Search Address via Nominatim
  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim() || locationName.trim();
    if (!query) return;

    try {
      setSearching(true);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=5&countrycodes=np,in,us,gb`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSearchResults(data);
        const top = data[0];
        panToTarget(parseFloat(top.lat), parseFloat(top.lon), 15);
        if (!locationName.trim()) {
          onLocationNameChange(top.display_name.split(',').slice(0, 3).join(',').trim());
        }
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Detect My Current Location
  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        panToTarget(lat, lng, 16);
        reverseGeocode(lat, lng, true);
      },
      (err) => {
        setLocatingUser(false);
        console.warn('Geolocation error:', err);
        alert('Could not retrieve your location. Please ensure location permissions are granted.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Clear pin
  const handleClearPin = () => {
    onCoordinatesChange(null, null);
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Text input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Workplace Location & Address <span className="text-rose-500">*</span>
          </label>
          {latitude && longitude ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Map Pinned ({latitude.toFixed(4)}, {longitude.toFixed(4)})</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Pin workplace on map below for candidate discovery
            </span>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <input
            type="text"
            required
            value={locationName}
            onChange={(e) => onLocationNameChange(e.target.value)}
            placeholder="e.g. Baneshwor, Kathmandu, Nepal or Remote Worldwide"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none text-xs sm:text-sm font-medium transition"
          />
        </div>
      </div>

      {/* 2. Map Control Toolbar: Search & Quick Actions */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Map address search */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchAddress();
                }
              }}
              placeholder="Search place on map (e.g. Putalisadak, Lakeside Pokhara)..."
              className="w-full pl-9 pr-20 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <button
              type="button"
              onClick={() => handleSearchAddress()}
              disabled={searching}
              className="absolute right-1 top-1 bottom-1 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              <span>{searching ? 'Locating...' : 'Find'}</span>
            </button>
          </div>

          {/* Current Location Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locatingUser}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer shrink-0 shadow-2xs"
            title="Use current GPS location"
          >
            <Crosshair className={`w-3.5 h-3.5 text-sky-600 ${locatingUser ? 'animate-spin' : ''}`} />
            <span>{locatingUser ? 'Detecting...' : 'My Location'}</span>
          </button>

          {/* Clear pin button */}
          {latitude && longitude && (
            <button
              type="button"
              onClick={handleClearPin}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-xs font-semibold border border-rose-200/80 dark:border-rose-900/60 transition cursor-pointer shrink-0"
              title="Remove map pin"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Pin</span>
            </button>
          )}
        </div>

        {/* Search Results Dropdown Preview */}
        {searchResults.length > 0 && (
          <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 block">
              Matching Map Locations (Click to pinpoint):
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const lat = parseFloat(result.lat);
                    const lon = parseFloat(result.lon);
                    panToTarget(lat, lon, 16, result.display_name.split(',').slice(0, 3).join(',').trim());
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-sky-50 dark:hover:bg-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-300 transition cursor-pointer"
                >
                  <span className="truncate pr-2">{result.display_name}</span>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold shrink-0">
                    Pin Here
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick City Presets Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Compass className="w-3 h-3" />
            <span>Popular Hubs:</span>
          </span>
          {CITY_PRESETS.map((city) => (
            <button
              key={city.name}
              type="button"
              onClick={() => panToTarget(city.lat, city.lng, 14, `${city.name}, Nepal`)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-sky-950/60 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200/80 dark:border-slate-700/80 transition cursor-pointer"
            >
              {city.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              onLocationNameChange('Remote (Worldwide)');
              handleClearPin();
            }}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
          >
            Remote / Online
          </button>
        </div>
      </div>

      {/* 3. Interactive Leaflet Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-950">
        <div
          ref={mapContainerRef}
          className="w-full h-72 sm:h-80 z-0 cursor-crosshair"
          style={{ minHeight: '280px' }}
        />

        {/* Loading overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xs">
            <div className="w-7 h-7 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium mt-2">Initializing Map...</span>
          </div>
        )}

        {/* Bottom Helper Bar */}
        <div className="absolute bottom-2 left-2 right-2 z-[400] pointer-events-none flex items-center justify-between">
          <div className="pointer-events-auto bg-slate-900/80 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[11px] flex items-center gap-2 shadow-lg">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>
              {reverseGeocoding
                ? 'Looking up street address...'
                : latitude && longitude
                ? 'Click or drag pin to adjust precise office location'
                : 'Click anywhere on the map to pin job location'}
            </span>
          </div>

          {latitude && longitude && (
            <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 shadow-sm hidden sm:block">
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

