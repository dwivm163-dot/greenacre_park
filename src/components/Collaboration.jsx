import React from 'react';
import './collaboration.css';

export function Presence({ id, visitors }) {
  const self = visitors.find(visitor => visitor.id === id);
  return (
    <div className="park-presence" role="status">
      {self && <span className="visitor-dot" style={{ backgroundColor: self.color }} />}
      {id ? `${visitors.length} online${self ? ` · ${self.name} (you)` : ''}` : 'Connecting to shared park…'}
    </div>
  );
}

export function RemoteCursors({ visitors, visitorId }) {
  return visitors.filter(visitor => visitor.id !== visitorId && visitor.cursor).map(visitor => (
    <div className="remote-cursor" key={visitor.id} aria-hidden="true" style={{
      left: `${visitor.cursor.x * 100}%`,
      top: `${visitor.cursor.y * 100}%`,
      '--visitor-color': visitor.color,
    }}>
      <span>{visitor.name}</span>
    </div>
  ));
}

export function ActivityFeed({ activity }) {
  return (
    <section className="park-activity" aria-labelledby="activity-title">
      <h2 id="activity-title">Recent park activity</h2>
      {activity.length === 0 && <p>No changes yet.</p>}
      <ol aria-label="Latest changes">
        {activity.map(entry => <li key={entry.id}><span style={{ color: entry.color }}>{entry.name}</span> {entry.action}</li>)}
      </ol>
    </section>
  );
}
