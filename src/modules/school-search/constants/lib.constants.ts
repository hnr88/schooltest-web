import L from 'leaflet';

export const SINGLE_SCHOOL_FOCUS_ZOOM = 14;

export const MULTI_SCHOOL_MAX_FIT_ZOOM = 12;

export const MARKER_PIN_HTML = `<div class="school-map-marker__pin" aria-hidden="true">
    <div class="school-map-marker__inner">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="17" height="17">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    </div>
  </div>`;

export const SCHOOL_MAP_ICON = new L.DivIcon({
  className: 'school-map-marker',
  html: MARKER_PIN_HTML,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

export const SCHOOL_MAP_ICON_ACTIVE = new L.DivIcon({
  className: 'school-map-marker school-map-marker--active',
  html: MARKER_PIN_HTML,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

export const SCHOOL_MAP_ICON_SELECTED = new L.DivIcon({
  className: 'school-map-marker school-map-marker--selected',
  html: MARKER_PIN_HTML,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

export const SCHOOL_MAP_ICON_SELECTED_ACTIVE = new L.DivIcon({
  className: 'school-map-marker school-map-marker--selected school-map-marker--active',
  html: MARKER_PIN_HTML,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});
