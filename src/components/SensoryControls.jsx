import React from 'react';
import { TIMES, LAYERS } from '../sensoryModel.js';
import { LegendSymbol } from './AmbienceArt.jsx';

export function TimeControls({ time, onChange }) {
  return <div className="time-controls">
    <span className="control-label">Time of day</span>
    <div className="time-segments" role="group" aria-label="Time of day">{Object.keys(TIMES).map(period=><button type="button" key={period} aria-label={period} aria-pressed={time===period} onClick={()=>onChange(period)}>{period}</button>)}</div>
    <span className="visitor-count" data-visitors={TIMES[time].visitors}>{TIMES[time].visitors} illustrative visitors · {TIMES[time].intensity.toLowerCase()} conversation activity</span>
  </div>;
}
const symbols={traffic:'street',waterfall:'waterfall',stream:'water',conversations:'people',movement:'movement',trees:'foliage',pergola:'shade',greenery:'fragrance'};
const descriptions={traffic:'Traffic + urban sound',waterfall:'Continuous sound + cool air',stream:'A gentle, rhythmic sound',conversations:'Social energy around seating',movement:'Paths through the landscape',trees:'Leafy shade + quiet retreat',pergola:'Shelter beneath the structure',greenery:'Natural scents + vegetation'};
export function LayerControls({ layers, onChange }) {
  return <section className="sensory-key layer-controls" aria-labelledby="key-title">
    <div className="section-heading"><h2 id="key-title">FIG. 04 / SENSORY KEY</h2><span>Select to show / hide</span></div>
    <div className="layer-options">{Object.entries(LAYERS).map(([key,label])=><label key={key} className={layers[key]?'layer-row':'layer-row is-hidden'}>
      <LegendSymbol kind={symbols[key]} />
      <span className="layer-copy"><span className="layer-name">{label}</span><span className="layer-description">{descriptions[key]}</span></span>
      <input type="checkbox" aria-label={label} checked={layers[key]} onChange={()=>onChange(key)} />
    </label>)}</div>
    <p className="key-note">Read the landscape in layers. Visibility changes what you examine, not the environment being interpreted.</p>
    <div className="key-annotation"><span>Visible arrangement</span><span aria-hidden="true">↔</span><span>Invisible atmosphere</span></div>
  </section>;
}
