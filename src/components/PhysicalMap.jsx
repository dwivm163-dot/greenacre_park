import React from 'react';
import ParkMap from './ParkMap.jsx';
import useMapDragging from '../hooks/useMapDragging.js';

export default function PhysicalMap({ objects, onMove, selectedId, onSelect }) {
  const interaction = useMapDragging({ objects, onMove, selectedId, onSelect });
  return <ParkMap kind="physical" title="Physical Map" objects={objects} interaction={interaction} selectedId={selectedId} onSelect={onSelect} />;
}
