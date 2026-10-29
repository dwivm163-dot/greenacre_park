import React, { useCallback, useState } from 'react';
import PhysicalMap from './components/PhysicalMap.jsx';
import AmbienceMap from './components/AmbienceMap.jsx';
import { initialObjects } from './mapData.js';
import { defaultLayers } from './sensoryModel.js';
import { TimeControls, LayerControls } from './components/SensoryControls.jsx';
import AtmosphereProfile from './components/AtmosphereProfile.jsx';

export default function App() {
  const [objects, setObjects] = useState(() => initialObjects.map(object => ({ ...object })));
  const [selectedId, setSelectedId] = useState(null);
  const [time, setTime] = useState('Afternoon');
  const [layers, setLayers] = useState(defaultLayers);
  const toggleLayer = key => setLayers(current => ({ ...current, [key]: !current[key] }));
  const moveObject = useCallback((id, position) => {
    setObjects(current => current.map(object => object.id === id ? { ...object, ...position } : object));
  }, []);
  const reset = () => {
    setSelectedId(null);
    setTime('Afternoon');
    setLayers(defaultLayers());
    setObjects(initialObjects.map(object => ({ ...object })));
  };
  return (
    <main>
      <header className="publication-header">
        <div className="masthead"><span>An interactive study of urban space</span><span>Greenacre Park / New York City / 2026</span></div>
        <div className="project-heading">
          <h1>Construct Your <em>Own Escape</em></h1>
          <p>Rearrange the visible.<br />{' '}Transform the invisible.</p>
        </div>
      </header>
      <div className="experiment-toolbar">
        <p className="interaction-instruction">Drag elements in the physical map to reshape the atmosphere.</p>
        <button className="reset-map" type="button" onClick={reset}>Reset Arrangement <span aria-hidden="true">↗</span></button>
      </div>
      <TimeControls time={time} onChange={setTime} />
      <div className="maps-scroll">
        <div className="maps">
          <PhysicalMap objects={objects} onMove={moveObject} selectedId={selectedId} onSelect={setSelectedId} />
          <AmbienceMap objects={objects} time={time} layers={layers} />
          <AtmosphereProfile objects={objects} time={time} />
          <LayerControls layers={layers} onChange={toggleLayer} />
        </div>
      </div>
      <footer className="publication-footer"><span>Construct Your Own Escape</span><span>A speculative cartography of everyday retreat</span><span>Greenacre Park · 2026</span></footer>
    </main>
  );
}
