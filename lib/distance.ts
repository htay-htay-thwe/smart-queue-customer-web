export type Coordinates = { latitude: number; longitude: number };
export const MAX_QUEUE_DISTANCE_KM = 1;
export function distanceKm(a: Coordinates, b: Coordinates) {
  const rad = (n: number) => n * Math.PI / 180;
  const dLat = rad(b.latitude - a.latitude), dLon = rad(b.longitude - a.longitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
export function shopCoordinates(shop: any): Coordinates | null {
  const values = shop?.address?.location?.coordinates;
  if (!Array.isArray(values) || values.length < 2) return null;
  const longitude = Number(values[0]), latitude = Number(values[1]);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}
