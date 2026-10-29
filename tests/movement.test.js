import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildMovementRoutes, flowingPath } from '../src/movementRoutes.js';

// Asset manifest supplies the complete set of paired object identities.
const manifest = JSON.parse(readFileSync(new URL('../Greenacre_Park_Assets_v3/manifest.json', import.meta.url), 'utf8'));
const canvas = { width: 1658, height: 949 };
const objects = manifest.movableAssets.map(o => ({ ...o, x:o.x/100, y:o.y/100, width:o.width/100, height:o.height/100 }));
const initial = buildMovementRoutes(objects, canvas);

test('four open, distinct routes start at the fixed entrance and visit meaningful anchors', () => {
  assert.equal(initial.length, 4);
  assert.equal(new Set(initial.map(r => r.d)).size, 4);
  for (const route of initial) {
    assert.equal(route.points[0].x, 220); assert.equal(route.points[0].y, 490);
    assert(route.points.length >= 4);
    assert(route.d.startsWith('M220.00 490.00 C'));
    assert(!/[ZALQ]/.test(route.d));
    assert(route.points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)));
  }
  assert(initial.some(r => r.id.includes('pergola')));
  assert(initial.some(r => r.id.includes('waterfall')));
  assert(initial.some(r => r.id.includes('stream')));
});

test('every one of the 17 object positions influences at least one route', () => {
  assert.equal(objects.length, 17);
  for (const object of objects) {
    const moved = objects.map(o => o.id === object.id ? {...o,x:o.x+.04,y:o.y-.03} : o);
    const routes = buildMovementRoutes(moved,canvas);
    assert.notDeepEqual(routes.map(r=>r.d),initial.map(r=>r.d),object.id);
    assert(routes.every(r=>r.d.startsWith('M220.00 490.00 C')));
  }
});

test('reset is deterministic and geometry does not mutate shared object state', () => {
  const snapshot=structuredClone(objects);
  for(let i=0;i<10;i++)assert.deepEqual(buildMovementRoutes(objects,canvas),initial);
  assert.deepEqual(objects,snapshot);
});

test('coincident anchors produce valid finite paths without division by zero', () => {
  assert(!/NaN|Infinity/.test(flowingPath(Array(4).fill({x:220,y:490}),19)));
});
