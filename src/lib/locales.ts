export interface Locale {
  id:            string;
  name:          string;
  center:        [number, number];  // [lat, lon]
  zoom:          number;
  boundingBoxes: [[number, number], [number, number]][];  // [[swLat, swLon], [neLat, neLon]]
}

export const LOCALES: Locale[] = [
  {
    id:           'uk',
    name:         'United Kingdom',
    center:       [56.5, -3.5],
    zoom:         6,
    boundingBoxes: [[[49.0, -8.0], [62.0, 2.0]]],
  },
  {
    id:           'senegal',
    name:         'Senegal Coast',
    center:       [14.5, -17.0],
    zoom:         7,
    boundingBoxes: [[[8.0, -28.0], [32.0, -8.0]]],
  },
  {
    id:           'persian_gulf',
    name:         'Persian Gulf',
    center:       [26.0, 52.0],
    zoom:         7,
    boundingBoxes: [[[22.0, 48.0], [30.5, 57.0]]],
  },
];

export const DEFAULT_LOCALE = LOCALES[0];
