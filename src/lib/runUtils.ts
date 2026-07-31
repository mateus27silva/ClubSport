import { GpsPoint } from '../types';

/**
 * Calculates distance between two GPS coordinates using Haversine formula (in KM)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
  return R * c;
}

/**
 * Converts pace in seconds per km to min/km string format (e.g., "5:08 /km")
 */
export function formatPace(paceSeconds: number): string {
  if (!isFinite(paceSeconds) || paceSeconds <= 0 || paceSeconds > 3600) return '--:-- /km';
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.floor(paceSeconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs} /km`;
}

/**
 * Formats duration in seconds to HH:MM:SS or MM:SS
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
  return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * Generates an SVG polyline path string normalized into a viewBox canvas (300x160)
 */
export function generateSvgPathFromPoints(points: GpsPoint[], width = 320, height = 160): string {
  if (!points || points.length < 2) {
    return 'M 30 110 L 80 80 L 140 100 L 220 50 L 280 90';
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 0.0001;
  const lngRange = maxLng - minLng || 0.0001;

  const padding = 24;
  const effectiveWidth = width - padding * 2;
  const effectiveHeight = height - padding * 2;

  const svgPoints = points.map((p) => {
    const x = padding + ((p.lng - minLng) / lngRange) * effectiveWidth;
    // Y is inverted in SVG coordinate space
    const y = height - (padding + ((p.lat - minLat) / latRange) * effectiveHeight);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M ${svgPoints.join(' L ')}`;
}

/**
 * Generates standard GPX XML content string for export
 */
export function generateGpxString(title: string, points: GpsPoint[]): string {
  const startTimeISO = points.length > 0 ? new Date(points[0].timestamp).toISOString() : new Date().toISOString();

  let trkpts = '';
  points.forEach((p) => {
    const isoTime = new Date(p.timestamp).toISOString();
    const ele = p.alt ?? 780;
    const hr = p.heartRate ? `<gpxtrx:hr>${p.heartRate}</gpxtrx:hr>` : '';

    trkpts += `
      <trkpt lat="${p.lat}" lon="${p.lng}">
        <ele>${ele}</ele>
        <time>${isoTime}</time>
        ${hr ? `<extensions><gpxtrx:TrackPointExtension>${hr}</gpxtrx:TrackPointExtension></extensions>` : ''}
      </trkpt>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="ClubSport GPS Tracking System"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:gpxtrx="http://www.garmin.com/xmlschemas/GpxExtensions/v3">
  <metadata>
    <name>${title}</name>
    <time>${startTimeISO}</time>
  </metadata>
  <trk>
    <name>${title}</name>
    <trkseg>${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

/**
 * Triggers a file download for a GPX activity
 */
export function downloadGpxFile(title: string, points: GpsPoint[]) {
  const gpxContent = generateGpxString(title, points);
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ClubSport_${title.replace(/\s+/g, '_')}_${Date.now()}.gpx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
