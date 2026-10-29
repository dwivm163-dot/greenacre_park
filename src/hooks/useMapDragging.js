import { useEffect, useRef, useState } from 'react';
import { assetUrl, canvas, initialObjects } from '../mapData.js';

// Courtyard envelope in background pixels. Fixed buildings/street lie outside.
export const usableArea = { left: 370, top: 110, right: 1295, bottom: 740 };
const cache = new Map();
function readAsset(path) {
  if (!cache.has(path)) cache.set(path, new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const surface = document.createElement('canvas');
      surface.width = image.naturalWidth; surface.height = image.naturalHeight;
      const context = surface.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, surface.width, surface.height);
      let left = surface.width, top = surface.height, right = 0, bottom = 0;
      const alpha = new Uint8Array(surface.width * surface.height);
      for (let y = 0; y < surface.height; y++) for (let x = 0; x < surface.width; x++) {
        const value = data[(y * surface.width + x) * 4 + 3];
        alpha[y * surface.width + x] = value;
        if (value >= 8) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1); }
      }
      resolve({ width: surface.width, height: surface.height, alpha, left, top, right, bottom });
    };
    image.onerror = () => reject(new Error(`Cannot read ${path}`));
    image.src = assetUrl(path);
  }));
  return cache.get(path);
}

function imageBox(object, asset) {
  const width = object.width * canvas.width, height = object.height * canvas.height;
  const scale = Math.min(width / asset.width, height / asset.height);
  const w = object.id === 'stream' ? width : asset.width * scale;
  const h = object.id === 'stream' ? height : asset.height * scale;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}

export function constrainPosition(object, x, y, asset) {
  if (!asset) return { x: object.x, y: object.y };
  const box = imageBox(object, asset);
  const left = box.x + asset.left / asset.width * box.width;
  const right = box.x + asset.right / asset.width * box.width;
  const top = box.y + asset.top / asset.height * box.height;
  const bottom = box.y + asset.bottom / asset.height * box.height;
  return {
    x: Math.max(Math.max(0, (usableArea.left - left) / canvas.width), Math.min(x, Math.min(1 - object.width, (usableArea.right - right) / canvas.width))),
    y: Math.max(Math.max(0, (usableArea.top - top) / canvas.height), Math.min(y, Math.min(1 - object.height, (usableArea.bottom - bottom) / canvas.height))),
  };
}

export default function useMapDragging({ objects, onMove, selectedId, onSelect }) {
  const canvasRef = useRef(null), drag = useRef(null);
  const [assets, setAssets] = useState({});
  const [hoveredId, setHoveredId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  useEffect(() => {
    let active = true;
    Promise.all(initialObjects.map(async object => [object.id, await readAsset(object.physicalImage)]))
      .then(entries => { if (active) setAssets(Object.fromEntries(entries)); })
      .catch(error => console.error(error));
    return () => { active = false; };
  }, []);
  const point = event => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  };
  const hitsAt = p => objects.filter(object => {
    const asset = assets[object.id];
    if (!asset) return false;
    const box = imageBox(object, asset);
    const ix = Math.floor(((p.x - object.x) * canvas.width - box.x) / box.width * asset.width);
    const iy = Math.floor(((p.y - object.y) * canvas.height - box.y) / box.height * asset.height);
    return ix >= 0 && iy >= 0 && ix < asset.width && iy < asset.height && asset.alpha[iy * asset.width + ix] >= 8;
  }).reverse().sort((a, b) => Number(b.id === selectedId) - Number(a.id === selectedId));
  const stop = () => {
    const current = drag.current;
    drag.current = null; setDraggingId(null);
    if (current && canvasRef.current.hasPointerCapture(current.pointerId)) canvasRef.current.releasePointerCapture(current.pointerId);
  };
  useEffect(() => { if (drag.current && selectedId !== drag.current.id) stop(); }, [selectedId]);
  const move = (object, x, y) => onMove(object.id, constrainPosition(object, x, y, assets[object.id]));
  return {
    canvasRef, hoveredId, draggingId,
    canvasHandlers: {
      onPointerDown(event) {
        if (event.button !== 0 || !event.isPrimary || drag.current) return;
        const p = point(event), hits = hitsAt(p);
        if (!hits.length) { onSelect(null); return; }
        const index = event.altKey ? (hits.findIndex(o => o.id === selectedId) + 1) % hits.length : 0;
        const object = hits[index];
        event.preventDefault(); onSelect(object.id); setHoveredId(object.id); setDraggingId(object.id);
        drag.current = { id: object.id, pointerId: event.pointerId, offsetX: p.x - object.x, offsetY: p.y - object.y, start: { x: object.x, y: object.y } };
        canvasRef.current.setPointerCapture(event.pointerId);
        canvasRef.current.querySelector(`[data-object-id="${object.id}"]`).focus({ preventScroll: true });
      },
      onPointerMove(event) {
        const current = drag.current, p = point(event);
        if (!current) { setHoveredId(hitsAt(p)[0]?.id ?? null); return; }
        if (event.pointerId !== current.pointerId) return;
        const object = objects.find(o => o.id === current.id);
        move(object, p.x - current.offsetX, p.y - current.offsetY);
      },
      onPointerUp(event) { if (drag.current?.pointerId === event.pointerId) stop(); },
      onPointerCancel(event) { if (drag.current?.pointerId === event.pointerId) stop(); },
      onLostPointerCapture() { drag.current = null; setDraggingId(null); },
      onPointerLeave() { if (!drag.current) setHoveredId(null); },
      onDragStart(event) { event.preventDefault(); },
      onKeyDown(event) {
        if (event.key === 'Escape') {
          if (drag.current) { onMove(drag.current.id, drag.current.start); stop(); }
          onSelect(null); return;
        }
        const object = objects.find(o => o.id === event.target.dataset.objectId);
        if (!object) return;
        const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
        if (!direction) return;
        event.preventDefault(); onSelect(object.id);
        const step = event.shiftKey ? 15 : 3;
        move(object, object.x + direction[0] * step / canvas.width, object.y + direction[1] * step / canvas.height);
      },
    },
  };
}
