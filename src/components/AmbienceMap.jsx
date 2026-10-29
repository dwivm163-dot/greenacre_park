import React from 'react';
import ParkMap from './ParkMap.jsx';

export default function AmbienceMap({ objects, time, layers, onToggleLayer }) {
  return <ParkMap kind="ambience" title="Ambience Map" objects={objects} time={time} layers={layers} onToggleLayer={onToggleLayer} />;
}
