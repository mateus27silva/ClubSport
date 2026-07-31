// Location & Proximity Utilities based on Google Maps Nearby Search patterns

export interface RegionPreset {
  id: string;
  name: string;
  lat: number;
  lng: number;
  stateCountry: string;
  isGps?: boolean;
}

export const REGION_PRESETS: RegionPreset[] = [
  {
    id: 'sao_paulo',
    name: 'São Paulo, SP, Brasil',
    lat: -23.55052,
    lng: -46.633308,
    stateCountry: 'São Paulo, Brasil'
  },
  {
    id: 'rio_de_janeiro',
    name: 'Rio de Janeiro, RJ, Brasil',
    lat: -22.906847,
    lng: -43.172896,
    stateCountry: 'Rio de Janeiro, Brasil'
  },
  {
    id: 'belo_horizonte',
    name: 'Belo Horizonte, MG, Brasil',
    lat: -19.916681,
    lng: -43.934493,
    stateCountry: 'Minas Gerais, Brasil'
  },
  {
    id: 'curitiba',
    name: 'Curitiba, PR, Brasil',
    lat: -25.4284,
    lng: -49.2733,
    stateCountry: 'Paraná, Brasil'
  },
  {
    id: 'brasilia',
    name: 'Brasília, DF, Brasil',
    lat: -15.7975,
    lng: -47.8919,
    stateCountry: 'Distrito Federal, Brasil'
  },
  {
    id: 'porto_alegre',
    name: 'Porto Alegre, RS, Brasil',
    lat: -30.0346,
    lng: -51.2177,
    stateCountry: 'Rio Grande do Sul, Brasil'
  },
  {
    id: 'salvador',
    name: 'Salvador, BA, Brasil',
    lat: -12.9777,
    lng: -38.5016,
    stateCountry: 'Bahia, Brasil'
  },
  {
    id: 'recife',
    name: 'Recife, PE, Brasil',
    lat: -8.0476,
    lng: -34.8770,
    stateCountry: 'Pernambuco, Brasil'
  },
  {
    id: 'florianopolis',
    name: 'Florianópolis, SC, Brasil',
    lat: -27.5954,
    lng: -48.5480,
    stateCountry: 'Santa Catarina, Brasil'
  },
  {
    id: 'san_francisco',
    name: 'San Francisco, CA, EUA',
    lat: 37.7749,
    lng: -122.4194,
    stateCountry: 'California, EUA'
  },
  {
    id: 'new_york',
    name: 'Nova York, NY, EUA',
    lat: 40.7128,
    lng: -74.0060,
    stateCountry: 'New York, EUA'
  },
  {
    id: 'lisboa',
    name: 'Lisboa, Portugal',
    lat: 38.7223,
    lng: -9.1393,
    stateCountry: 'Lisboa, Portugal'
  },
  {
    id: 'gps_auto',
    name: 'Minha Localização Atual (GPS Automático)',
    lat: -23.55052,
    lng: -46.633308,
    stateCountry: 'GPS Automático',
    isGps: true
  }
];

export const DEFAULT_REGION = REGION_PRESETS[0]; // São Paulo by default

/**
 * Calculates Haversine distance in KM between two geographic coordinates
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Format distance string nicely (e.g., "a 850m de você" or "a 3.2 km de você")
 */
export function formatDistanceString(distKm?: number): string {
  if (distKm === undefined || distKm === null || isNaN(distKm)) return '';
  if (distKm < 1) {
    return `a ${Math.round(distKm * 1000)}m de você`;
  }
  return `a ${distKm.toFixed(1)} km de você`;
}

/**
 * Resolve coordinates from selected region string or GPS location
 */
export function resolveLocationCoords(
  regionName?: string,
  gpsCoords?: { lat: number; lng: number } | null
): { lat: number; lng: number; name: string } {
  if (regionName?.includes('GPS') && gpsCoords) {
    return {
      lat: gpsCoords.lat,
      lng: gpsCoords.lng,
      name: 'Minha Localização Atual'
    };
  }

  const found = REGION_PRESETS.find(
    (p) => p.name.toLowerCase() === regionName?.toLowerCase() || p.id === regionName
  );

  if (found) {
    return { lat: found.lat, lng: found.lng, name: found.name };
  }

  // Fallback to São Paulo or provided GPS
  return gpsCoords
    ? { lat: gpsCoords.lat, lng: gpsCoords.lng, name: 'Minha Localização' }
    : { lat: DEFAULT_REGION.lat, lng: DEFAULT_REGION.lng, name: DEFAULT_REGION.name };
}

/**
 * Attaches calculated distance to items with lat/lng and optionally filters by max radius
 */
export function processNearbyItems<T extends { lat?: number; lng?: number; calculatedDistanceKm?: number }>(
  items: T[],
  userCoords: { lat: number; lng: number },
  maxRadiusKm?: number | 'All'
): T[] {
  const processed: T[] = items.map((item) => {
    if (item.lat !== undefined && item.lng !== undefined) {
      const dist = calculateDistanceKm(userCoords.lat, userCoords.lng, item.lat, item.lng);
      return { ...item, calculatedDistanceKm: dist } as T;
    }
    return item;
  });

  if (!maxRadiusKm || maxRadiusKm === 'All') {
    return processed;
  }

  const radiusNum = typeof maxRadiusKm === 'number' ? maxRadiusKm : parseFloat(maxRadiusKm as string);
  if (isNaN(radiusNum)) return processed;

  return processed.filter((item) => {
    if (item.calculatedDistanceKm === undefined) return true; // keep items without location
    return item.calculatedDistanceKm <= radiusNum;
  });
}
