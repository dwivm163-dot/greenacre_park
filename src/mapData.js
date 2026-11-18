import { createInitialObjects } from './parkLayout.js';
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

export { canvas } from './parkLayout.js';
export const backgrounds = manifest.backgrounds;
export const initialObjects = createInitialObjects(manifest);
