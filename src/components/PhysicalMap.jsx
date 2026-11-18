import React from 'react';
import './physical-map.css';
import ParkMap from './ParkMap.jsx';
import useMapDragging from '../hooks/useMapDragging.js';

export default function PhysicalMap({ objects, actions, selectedId, onSelect, visitors, visitorId, locks }) {
  const interaction = useMapDragging({ objects, ...actions, selectedId, onSelect });
  return <ParkMap kind="physical" title="Physical Map" objects={objects} interaction={interaction} selectedId={selectedId} onSelect={onSelect} visitors={visitors} visitorId={visitorId} locks={locks} />;
}
