export const geoJsonFromLngLat = ({ lng, lat }) => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [lng, lat],
  },
  properties: {
    accuracy: null,
  },
});

export const geoJsonFromPosition = ({ coords }) => ({
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [coords.longitude, coords.latitude],
  },
  properties: {
    accuracy: coords.accuracy,
  },
});

export const requestWakeLock = async () => {
  try {
    if (navigator.wakeLock) {
      await navigator.wakeLock.request('screen');
    }
  } catch (e) {
    console.error(`${e.name}, ${e.message}`);
  }
};
