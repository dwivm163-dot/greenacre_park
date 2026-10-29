import manifest from '../Greenacre_Park_Assets_v3/manifest.json';
import physicalBackground from '../background.png';
import physicalStream from '../stream.png';
import physicalWaterfall from '../waterfall.png';

const physicalReplacements = {
  'physical/park_base.png': physicalBackground,
  'physical/stream.png': physicalStream,
  'physical/waterfall.png': physicalWaterfall,
};

// Vite resolves and fingerprints the original PNGs without modifying them.
const images = import.meta.glob('../Greenacre_Park_Assets_v3/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function assetUrl(path) {
  const url = physicalReplacements[path] ?? images[`../Greenacre_Park_Assets_v3/${path}`];
  if (!url) throw new Error(`Missing map image: ${path}`);
  return url;
}

// Use the replacement background's native dimensions as the common coordinate
// system so object positions refer to the artwork, without letterboxing offsets.
export const canvas = { width: 1658, height: 949 };
export const backgrounds = manifest.backgrounds;

// Placement boxes in background pixels, measured against the courtyard areas.
// Images retain their original transparent padding. The stream is compressed
// vertically by the renderer to fit the long, shallow canal.
const placements = {
  tree_cluster_01: [420, 285, 160, 310],
  tree_cluster_02: [555, 285, 160, 310],
  tree_cluster_03: [690, 285, 160, 310],
  pergola_upper: [400, 125, 630, 165],
  central_seating_01: [525, 355, 90, 84],
  central_seating_02: [660, 355, 90, 84],
  central_seating_03: [525, 475, 90, 84],
  central_seating_04: [660, 475, 90, 84],
  pergola_seating_01: [445, 148, 90, 84],
  pergola_seating_02: [605, 148, 90, 84],
  pergola_seating_03: [765, 148, 90, 84],
  pergola_seating_04: [925, 148, 90, 84],
  terrace_seating_01: [990, 333, 90, 84],
  terrace_seating_02: [990, 418, 90, 84],
  terrace_seating_03: [990, 503, 90, 84],
  waterfall: [1030, 285, 310, 435],
  stream: [355, 609, 930, 140],
};

// Both maps consume the same normalized top-left placement boxes.
export const initialObjects = manifest.movableAssets.map((object) => ({
  ...object,
  x: placements[object.id] ? placements[object.id][0] / canvas.width : object.x / 100,
  y: placements[object.id] ? placements[object.id][1] / canvas.height : object.y / 100,
  width: placements[object.id] ? placements[object.id][2] / canvas.width : object.width / 100,
  height: placements[object.id] ? placements[object.id][3] / canvas.height : object.height / 100,
}));
