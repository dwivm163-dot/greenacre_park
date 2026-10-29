import React from 'react';
import { canvas } from '../mapData.js';
import { buildMovementRoutes } from '../movementRoutes.js';

export default React.memo(function AmbienceMovement({ objects, visible = true }) {
  const paths = buildMovementRoutes(objects, canvas);
  return <svg className="ambience-movement" data-sensory-layer="movement" style={{ visibility: visible ? 'visible' : 'hidden' }} viewBox={`0 0 ${canvas.width} ${canvas.height}`} aria-hidden="true">
    <defs><marker id="movement-route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M1 1 L9 5 L1 9 L3 5 Z" fill="#823cca" /></marker></defs>
    <g fill="none" stroke="#faf7ed" strokeOpacity=".65" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">{paths.map(path => <path key={path.id} d={path.d} />)}</g>
    <g fill="none" stroke="#823cca" strokeWidth="2" strokeDasharray="1.5 7" strokeLinecap="round" strokeLinejoin="round">{paths.map(path => <path key={path.id} data-route-id={path.id} d={path.d} markerEnd="url(#movement-route-arrow)" />)}</g>
  </svg>;
});
