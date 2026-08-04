import L from 'leaflet';

export function isMarkerCluster(layer: unknown): layer is { getBounds: () => L.LatLngBounds } {
  return (
    typeof layer === 'object' &&
    layer !== null &&
    'getBounds' in layer &&
    typeof (layer as { getBounds?: unknown }).getBounds === 'function'
  );
}
