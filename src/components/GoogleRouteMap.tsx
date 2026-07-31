import React, { useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Compass } from 'lucide-react';

interface Point {
  lat: number;
  lng: number;
}

interface GoogleRouteMapProps {
  points?: Point[];
  center?: Point;
  zoom?: number;
  height?: string;
  className?: string;
  title?: string;
  routeColor?: string;
}

// Sub-component to render the polyline onto the Google Map instance
function PolylineOverlay({ points, color = '#f97316' }: { points: Point[]; color?: string }) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    // Remove previous polyline if any
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    // Create standard Google Maps Polyline
    const polyline = new google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.95,
      strokeWeight: 5,
      map: map,
    });

    polylineRef.current = polyline;

    // Adjust camera viewport to fit route bounds if multiple points exist
    if (points.length >= 2) {
      const bounds = new google.maps.LatLngBounds();
      points.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, { top: 35, right: 35, bottom: 35, left: 35 });
    } else if (points.length === 1) {
      map.setCenter(points[0]);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, points, color]);

  return null;
}

export const GoogleRouteMap: React.FC<GoogleRouteMapProps> = ({
  points = [],
  center = { lat: -23.5874, lng: -46.6576 },
  zoom = 14,
  height = '100%',
  className = '',
  title = 'Percurso do Desafio',
  routeColor = '#f97316',
}) => {
  const apiKey =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    '';

  const hasKey = Boolean(apiKey) && apiKey !== 'YOUR_API_KEY';

  // Fallback default points around center if points array is empty
  const defaultRoutePoints: Point[] = points.length > 0 ? points : [
    { lat: center.lat - 0.005, lng: center.lng - 0.008 },
    { lat: center.lat - 0.002, lng: center.lng - 0.003 },
    { lat: center.lat + 0.003, lng: center.lng - 0.001 },
    { lat: center.lat + 0.006, lng: center.lng + 0.004 },
    { lat: center.lat + 0.002, lng: center.lng + 0.007 },
    { lat: center.lat - 0.004, lng: center.lng + 0.002 },
  ];

  const startPoint = defaultRoutePoints[0];
  const endPoint = defaultRoutePoints[defaultRoutePoints.length - 1];

  if (!hasKey) {
    // Elegant Google-Maps style vector canvas preview when API key isn't provided yet
    return (
      <div
        className={`relative w-full overflow-hidden bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col justify-between ${className}`}
        style={{ height }}
      >
        {/* Realistic Google Dark Mode Map Tile Background Texture */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-85"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)`,
          }}
        >
          {/* Street Grid Lines Overlay */}
          <svg className="w-full h-full opacity-30 stroke-zinc-700" strokeWidth="1">
            <line x1="0" y1="20%" x2="100%" y2="25%" strokeDasharray="4 4" />
            <line x1="0" y1="50%" x2="100%" y2="52%" />
            <line x1="0" y1="80%" x2="100%" y2="75%" strokeDasharray="8 4" />
            <line x1="20%" y1="0" x2="25%" y2="100%" />
            <line x1="55%" y1="0" x2="60%" y2="100%" strokeDasharray="6 6" />
            <line x1="85%" y1="0" x2="80%" y2="100%" />
            {/* Park / Green Area */}
            <path d="M 40,30 Q 120,20 180,90 T 260,140 Q 180,150 90,130 Z" fill="#065f46" opacity="0.35" stroke="#10b981" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Drawn Polyline Route on Map */}
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <svg className="w-full h-full drop-shadow-[0_0_10px_rgba(249,115,22,0.6)]" viewBox="0 0 320 180">
            {/* Route Glow */}
            <path
              d="M 30,130 C 70,110 90,140 130,80 C 170,20 230,50 290,40"
              fill="none"
              stroke={routeColor}
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Main Polyline Route */}
            <path
              d="M 30,130 C 70,110 90,140 130,80 C 170,20 230,50 290,40"
              fill="none"
              stroke={routeColor}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Start Marker */}
            <circle cx="30" cy="130" r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
            {/* Finish Marker */}
            <circle cx="290" cy="40" r="8" fill="#f97316" stroke="#ffffff" strokeWidth="2.5" />
          </svg>
        </div>

        {/* Header Overlay */}
        <div className="relative z-10 p-3 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80">
          <div className="flex items-center space-x-2 truncate">
            <span className="p-1 rounded-lg bg-orange-500/20 text-orange-400">
              <Navigation className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-white truncate">{title}</span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            GOOGLE MAPS GPS
          </span>
        </div>

        {/* Footer info & Watermark */}
        <div className="relative z-10 p-2.5 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800/80 text-[10px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-zinc-300">
              <MapPin className="w-3 h-3 text-emerald-400" />
              Início: Lat {center.lat.toFixed(3)}, Lng {center.lng.toFixed(3)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-mono">
            <span>Google Maps API</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border border-zinc-800 shadow-xl ${className}`} style={{ height }}>
      <APIProvider apiKey={apiKey} version="weekly">
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="cooperative"
          disableDefaultUI={false}
        >
          {/* Custom Route Polyline */}
          <PolylineOverlay points={defaultRoutePoints} color={routeColor} />

          {/* Start Marker */}
          {startPoint && (
            <AdvancedMarker position={startPoint} title="Início do Desafio">
              <Pin background="#10b981" glyphColor="#ffffff" borderColor="#047857" />
            </AdvancedMarker>
          )}

          {/* End Marker */}
          {endPoint && (
            <AdvancedMarker position={endPoint} title="Linha de Chegada">
              <Pin background="#f97316" glyphColor="#ffffff" borderColor="#c2410c" />
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>
    </div>
  );
};
