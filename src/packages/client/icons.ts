import { html } from 'lit';

// Media-control icons (Material Design paths, 24×24 viewBox). They use
// `fill="currentColor"` so they inherit the button's text color, and carry no
// intrinsic size — size them via CSS (`button svg { width/height }`).
const icon = (path: string) => html`
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d=${path}></path>
  </svg>
`;

export const playIcon = icon('M8 5v14l11-7z');
export const pauseIcon = icon('M6 19h4V5H6v14zm8-14v14h4V5h-4z');
export const prevIcon = icon('M6 6h2v12H6zm3.5 6l8.5 6V6z');
export const nextIcon = icon('M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z');
