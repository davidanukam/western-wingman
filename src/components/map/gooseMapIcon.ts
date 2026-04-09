/** Data URL for MapLibre symbol layer — dark goose on light halo for contrast on the map */
export const GOOSE_MARKER_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
  <circle cx="28" cy="28" r="26" fill="white" stroke="rgba(0,0,0,0.12)" stroke-width="2"/>
  <g fill="#111827" transform="translate(10,12)">
    <ellipse cx="16" cy="18" rx="9" ry="6.5"/>
    <circle cx="25" cy="12" r="5.5"/>
    <path d="M30.5 11.5 L36 9.5 L34.5 13.5 Z"/>
    <path d="M8 16 Q4 14 3 18 Q5 21 9 20" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round"/>
  </g>
</svg>
`.trim());

export const GOOSE_MARKER_DATA_URL = `data:image/svg+xml;charset=utf-8,${GOOSE_MARKER_SVG}`;
