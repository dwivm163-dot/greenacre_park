import React from 'react';
import { assetUrl, backgrounds, canvas } from '../mapData.js';
import { AmbienceAtmosphere, AmbienceGlyph } from './AmbienceArt.jsx';
import AmbienceMovement from './AmbienceMovement.jsx';
import { objectLayer, TIMES, conversationCounts } from '../sensoryModel.js';

export default function ParkMap({ kind, title, objects, interaction, selectedId, onSelect, time, layers, onToggleLayer }) {
  const counts = kind === 'ambience' ? conversationCounts(objects, time) : {};
  return (
    <figure className={`map-panel ${kind}-panel`} aria-labelledby={`${kind}-title`}>
      <figcaption id={`${kind}-title`}>
        <span className="figure-label">{kind === 'physical' ? 'FIG. 01 / THE PHYSICAL' : 'FIG. 02 / THE SENSORY'}</span>
        <span className="figure-caption">{kind === 'physical' ? 'Drag to rearrange the landscape.' : 'Observe the invisible consequences.'}</span>
      </figcaption>
      <div className={`map-canvas${interaction?.hoveredId ? ' has-hover' : ''}${interaction?.draggingId ? ' is-dragging' : ''}`} ref={interaction?.canvasRef} {...interaction?.canvasHandlers} title={kind === 'physical' ? 'Drag to move. Alt-click to select overlapping objects. Tab to select; arrow keys to move.' : undefined} style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}>
        <div className="map-scene">
        <img className="map-background" src={assetUrl(backgrounds[kind])} alt={`${title} fixed background`} draggable={false} />
        {kind === 'ambience' && <AmbienceAtmosphere layers={layers} />}
        {objects.map((object) => (
          <div
            className={`map-object${selectedId === object.id ? ' is-selected' : ''}${interaction?.hoveredId === object.id ? ' is-hovered' : ''}`}
            key={object.id}
            data-object-id={object.id}
            data-sensory-layer={kind === 'ambience' ? objectLayer(object.id) : undefined}
            tabIndex={kind === 'physical' ? 0 : undefined}
            role={kind === 'physical' ? 'button' : undefined}
            aria-label={kind === 'physical' ? `Move ${object.id.replaceAll('_', ' ')}. Drag or use arrow keys; Shift for larger steps. Alt-click to select overlapping objects.` : undefined}
            aria-pressed={kind === 'physical' ? selectedId === object.id : undefined}
            onFocus={kind === 'physical' ? () => onSelect(object.id) : undefined}
            style={{
              visibility: kind === 'ambience' && !layers[objectLayer(object.id)] ? 'hidden' : undefined,
              left: `${object.x * 100}%`,
              top: `${object.y * 100}%`,
              width: `${object.width * 100}%`,
              height: `${object.height * 100}%`,
            }}
          >
            <img
              src={assetUrl(object[`${kind}Image`])}
              alt={`${object.id.replaceAll('_', ' ')}${kind === 'ambience' ? ' ambience' : ''}`}
              draggable={false}
              style={kind === 'ambience' && object.id.includes('seating') ? { transform: `scale(${TIMES[time].scale / 1.27})`, opacity: counts[object.id] ? TIMES[time].opacity * .25 : 0 } : undefined}
            />
            {kind === 'ambience' && <AmbienceGlyph object={object} time={time} conversationCount={counts[object.id]} />}
          </div>
        ))}
        {kind === 'ambience' && <AmbienceMovement objects={objects} visible={layers.movement} />}
        </div>
      </div>
    </figure>
  );
}
