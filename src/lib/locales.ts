export interface Locale {
  id:     string;
  name:   string;
  center: [number, number];  // [lat, lon]
  zoom:   number;
}

export const LOCALES: Locale[] = [
  { id: 'uk',      name: 'United Kingdom', center: [56.5, -3.5],  zoom: 6 },
  { id: 'senegal',      name: 'Senegal Coast',  center: [14.5, -17.0], zoom: 7 },
  { id: 'persian_gulf', name: 'Persian Gulf',   center: [26.0, 52.0],  zoom: 7 },
];

export const DEFAULT_LOCALE = LOCALES[0];
