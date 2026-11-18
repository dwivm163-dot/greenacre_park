import React, { useState } from 'react';
import PhysicalMap from './components/PhysicalMap.jsx';
import AmbienceMap from './components/AmbienceMap.jsx';
import useSharedPark from './hooks/useSharedPark.js';
import { ActivityFeed, Presence } from './components/Collaboration.jsx';
import { TimeControls, LayerControls } from './components/SensoryControls.jsx';
import AtmosphereProfile from './components/AtmosphereProfile.jsx';

export default function App() {
  const shared = useSharedPark();
  const { objects, time, layers, id, visitors, locks, activity, collaborative, interaction } = shared;
  const [selectedId, setSelectedId] = useState(null);
  const reset = () => {
    setSelectedId(null);
    shared.reset();
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
      <div className={collaborative ? "experiment-toolbar has-collaboration" : "experiment-toolbar"}>
        <p className="interaction-instruction">Drag elements in the physical map to reshape the atmosphere.</p>
        {collaborative && <Presence id={id} visitors={visitors} />}
        <button disabled={!shared.canReset} className="reset-map" type="button" onClick={reset}>Reset Arrangement <span aria-hidden="true">↗</span></button>
      </div>
      <TimeControls time={time} onChange={shared.changeTime} disabled={collaborative && !id} />
      <div className="maps-scroll">
        <div className="maps">
          <PhysicalMap objects={objects} actions={interaction} visitors={visitors} visitorId={id} locks={locks} selectedId={selectedId} onSelect={setSelectedId} />
          <AmbienceMap objects={objects} time={time} layers={layers} />
          <AtmosphereProfile objects={objects} time={time} layers={layers} />
          <LayerControls layers={layers} onChange={shared.toggleLayer} disabled={collaborative && !id} />
        </div>
      </div>
      {collaborative && <ActivityFeed activity={activity} />}
      <footer className="publication-footer"><span>Construct Your Own Escape</span><span>A speculative cartography of everyday retreat</span><span>Greenacre Park · 2026</span></footer>
    </main>
  );
}
