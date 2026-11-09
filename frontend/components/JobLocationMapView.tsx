'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, ExternalLink, Building2 } from 'lucide-react';
import type * as LeafletType from 'leaflet';

interface JobLocationMapViewProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  locationName: string;
  companyName?: string;
  jobTitle?: string;
  className?: string;
}

export default function JobLocationMapView({
  latitude,
  longitude,
  locationName,
  companyName,
  jobTitle,
  className = 'h-64 sm:h-72',
}: JobLocationMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletType.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!latitude || !longitude) return;
    let isMounted = true;

    import('leaflet').then((mod) => {
      if (!isMounted || !mapContainerRef.current) return;
      const L = (mod.default || mod) as typeof LeafletType;

      if (mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const customPin = L.divIcon({
        className: 'jagir-view-map-pin',
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

      const marker = L.marker([latitude, longitude], { icon: customPin }).addTo(map);

      const popupContent = `
        <div style="font-family: inherit; padding: 4px 2px; min-width: 160px;">
          ${companyName ? `<div style="font-weight: 700; font-size: 13px; color: #0284c7;">${companyName}</div>` : ''}
          ${jobTitle ? `<div style="font-weight: 600; font-size: 12px; margin-top: 2px;">${jobTitle}</div>` : ''}
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${locationName}</div>
        </div>
      `;
      marker.bindPopup(popupContent).openPopup();

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
  }, [latitude, longitude, locationName, companyName, jobTitle]);

  if (!latitude || !longitude) {
    return null;
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Workplace Location Map</span>
        </span>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition"
        >
          <Navigation className="w-3 h-3" />
          <span>Get Directions</span>
          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
        </a>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900">
        <div ref={mapContainerRef} className={`w-full ${className} z-0`} />

        {!mapLoaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-xs">
            <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] text-slate-500 font-medium mt-1.5">Loading Map Location...</span>
          </div>
        )}

        <div className="absolute bottom-2 left-2 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 shadow-sm flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
          <span className="truncate max-w-[220px] sm:max-w-xs">{locationName}</span>
        </div>
      </div>
    </div>
  );
}

