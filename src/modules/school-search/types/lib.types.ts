export type MapResultFocusTarget =
  | { type: 'school'; key: string; center: [number, number]; zoom: number }
  | {
      type: 'bounds';
      key: string;
      bounds: [[number, number], [number, number]];
      maxZoom: number;
    };
