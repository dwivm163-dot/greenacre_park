import React, { useMemo } from 'react';
import { analyzeAtmosphere } from '../sensoryModel.js';

export default function AtmosphereProfile({ objects, time, layers }) {
  const profile=useMemo(()=>analyzeAtmosphere(objects,time,layers),[objects,time,layers]);
  return <section className="atmosphere-profile" aria-labelledby="atmosphere-title">
    <div className="section-heading"><h2 id="atmosphere-title">FIG. 03 / ATMOSPHERIC READING</h2><span>Live interpretation</span></div>
    <h3 data-atmosphere-classification>{profile.classification}</h3>
    <p className="atmosphere-description">{profile.description}</p>
    <div className="atmosphere-scores">{Object.entries(profile.scores).map(([label,score])=><div className="atmosphere-score" key={label}>
      <div><span>{label}</span><span>{score}/100</span></div>
      <meter aria-label={label} min="0" max="100" value={score}>{score}</meter>
    </div>)}</div>
    <p className="model-note">An artistic, speculative interpretation—not a measured or scientifically validated assessment. Scores respond to the active sensory layers, arrangement, and time of day.</p>
    <details className="model-rules"><summary>How this interpretation works</summary>
      <p>Seating distances suggest social concentration. Time sets potential conversation and movement activity; their toggles determine which contributes. Only active sound and shade layers affect the reading. Greenery and natural scents support tranquility, especially alongside shade.</p>
      <p>The waterfall adds continuous sound while masking 80% of modeled traffic exposure. Switching it off can make traffic more intrusive; switching traffic off removes street noise entirely. Shade, flowing water, and greenery support calm, while concentrated conversations and movement add stimulation. These interactions are artistic assumptions rather than acoustic measurements.</p>
      <p>Classification priority: chaotic when intensity ≥66, density ≥65%, and competing overlap ≥40%; noisy when noise ≥48; social when social activity ≥64 and density ≥22%; calm when calm ≥50 and social activity &lt;58; otherwise balanced. Thresholds use unrounded scores; indicators show rounded values. These are interpretive thresholds for this small park.</p>
    </details>
  </section>;
}
