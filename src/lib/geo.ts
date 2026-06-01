/** Haversine distance in meters between two WGS84 points */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** SW and NE corners [lng, lat] — main Western University campus + small margin */
export const WESTERN_CAMPUS_BOUNDS = {
  sw: [-81.305, 42.985] as [number, number],
  ne: [-81.235, 43.035] as [number, number],
};

/** Rough campus bounding box (Western U) for filtering demo hotspots */
export function isOnWesternCampus(lat: number, lng: number): boolean {
  const [[swLng, swLat], [neLng, neLat]] = [
    WESTERN_CAMPUS_BOUNDS.sw,
    WESTERN_CAMPUS_BOUNDS.ne,
  ];
  return lat >= swLat && lat <= neLat && lng >= swLng && lng <= neLng;
}

