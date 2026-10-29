import React, { useMemo } from 'react';
import { analyzeAtmosphere } from '../sensoryModel.js';

export default function AtmosphereProfile({ objects, time }) {
  const profile=useMemo(()=>analyzeAtmosphere(objects,time),[objects,time]);
  return <section className="atmosphere-profile" aria-labelledby="atmosphere-title">
    <div className="section-heading"><h2 id="atmosphere-title">FIG. 03 / ATMOSPHERIC READING</h2><span>Live interpretation</span></div>
    <h3 data-atmosphere-classification>{profile.classification}</h3>
    <p className="atmosphere-description">{profile.description}</p>
    <div className="atmosphere-scores">{Object.entries(profile.scores).map(([label,score])=><div className="atmosphere-score" key={label}>
      <div><span>{label}</span><span>{score}/100</span></div>
      <meter aria-label={label} min="0" max="100" value={score}>{score}</meter>
    </div>)}</div>
    <p className="model-note">An artistic, speculative interpretation—not a measured or scientifically validated assessment. Scores consider the complete environment, including hidden layers.</p>
    <details className="model-rules"><summary>How this interpretation works</summary>
      <p>Seating distances suggest social concentration. The selected time sets visitor activity. Proximity to the waterfall, stream, entrance, trees, and pergola determines sound exposure and shelter. Overlapping sound and conversation fields add sensory intensity; shade, soft water, and dispersed gathering support restfulness.</p>
      <p>Noise combines waterfall exposure (48%), traffic (34%), visitor activity (10%), and activity × seating density (8%). Social activity combines a 12% baseline, visitor activity (43%), and seating density (45%). Calm rewards shade, softer water, and distributed destinations, while subtracting concentrated activity and stronger sound. Sensory intensity combines noise (40%), social activity (35%), and competing sensory overlap (25%).</p>
      <p>Classification priority: chaotic when intensity ≥66, density ≥65%, and competing overlap ≥40%; noisy when noise ≥48; social when social activity ≥64 and density ≥22%; calm when calm ≥50 and social activity &lt;58; otherwise balanced. Thresholds use unrounded scores; indicators show rounded values. These are interpretive thresholds for this small park.</p>
    </details>
  </section>;
}
