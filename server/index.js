import express from 'express';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { Server } from 'socket.io';
import { createInitialObjects } from '../src/parkLayout.js';
import { defaultLayers, LAYERS, TIMES } from '../src/sensoryModel.js';

const manifest = JSON.parse(readFileSync(new URL('../Greenacre_Park_Assets_v3/manifest.json', import.meta.url)));
const origins = (process.env.CLIENT_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',').map(origin => origin.trim()).filter(Boolean);
const app = express();
const server = createServer(app);
export const io = new Server(server, {
  cors: { origin: origins },
  // WebSocket upgrades also need the origin check.
  allowRequest: (request, accept) => accept(null, !request.headers.origin || origins.includes(request.headers.origin)),
  maxHttpBufferSize: 8192,
});
app.get('/health', (_request, response) => response.json({ status: 'ok' }));

const defaultPark = () => ({ objects: createInitialObjects(manifest), time: 'Afternoon', layers: defaultLayers() });
let park = defaultPark();
const visitors = new Map();
const locks = new Map();
let visitorNumber = 0;
let activityNumber = 0;
let activity = [];
const colors = ['#984432', '#316858', '#62518e', '#985514', '#306b89', '#993c69'];

function record(visitor, action) {
  activity = [{ id: ++activityNumber, name: visitor.name, color: visitor.color, action }, ...activity].slice(0, 5);
  io.emit('park:activity', activity);
}

function publishLocks() {
  io.emit('park:locks', Object.fromEntries([...locks].map(([id, lock]) => [id, lock.owner])));
}

function objectAction(id) {
  if (id === 'waterfall') return 'relocated the waterfall';
  if (id === 'stream') return 'moved the stream';
  if (id === 'pergola_upper') return 'moved the pergola';
  return id.startsWith('tree') ? 'moved a tree' : 'moved a seating group';
}

io.on('connection', socket => {
  const number = ++visitorNumber;
  const usedColors = new Set([...visitors.values()].map(other => other.color));
  let hue = (number * 137.508) % 360;
  while (usedColors.has(`hsl(${hue} 62% 33%)`)) hue = (hue + 1) % 360;
  const visitor = { id: socket.id, name: `Visitor ${number}`, color: colors.find(color => !usedColors.has(color)) ?? `hsl(${hue} 62% 33%)`, cursor: null };
  visitors.set(socket.id, visitor);
  // A fresh snapshot is sent on every connection, including after reconnection.
  socket.emit('park:snapshot', { park, activity, id: socket.id });
  io.emit('park:visitors', [...visitors.values()]);
  publishLocks();

  const findObject = id => park.objects.find(object => object.id === id);
  const finish = (id, lock) => {
    locks.delete(id);
    const object = findObject(id);
    if (object.x !== lock.x || object.y !== lock.y) record(visitor, objectAction(id));
    publishLocks();
  };

  // Socket.IO preserves event order. A start must claim ownership before any
  // drag updates are accepted. Reject starts based on an outdated grab position.
  socket.on('park:grab', (payload, reply) => {
    const { id, x, y } = payload ?? {};
    const object = findObject(id);
    const accepted = Boolean(object && !locks.has(id) && object.x === x && object.y === y);
    if (accepted) {
      locks.set(id, { owner: socket.id, x, y });
      publishLocks();
    }
    if (typeof reply === 'function') reply(accepted);
  });

  socket.on('park:move', payload => {
    const { id, x, y, dragging, min, max } = payload ?? {};
    const object = findObject(id);
    const lock = locks.get(id);
    if (!object || !Number.isFinite(x) || !Number.isFinite(y)) return;
    if (dragging ? lock?.owner !== socket.id : Boolean(lock)) return;
    let targetX = x;
    let targetY = y;
    if (!dragging) {
      // Apply keyboard steps to the latest position, even during rapid key repeat.
      if (![min?.x, min?.y, max?.x, max?.y].every(Number.isFinite)) return;
      targetX = Math.max(min.x, Math.min(object.x + x, max.x));
      targetY = Math.max(min.y, Math.min(object.y + y, max.y));
    }
    const nextX = Math.max(0, Math.min(targetX, 1 - object.width));
    const nextY = Math.max(0, Math.min(targetY, 1 - object.height));
    if (object.x === nextX && object.y === nextY) return;
    Object.assign(object, { x: nextX, y: nextY });
    io.emit('park:object', { id, x: nextX, y: nextY });
    if (!dragging) record(visitor, objectAction(id));
  });

  socket.on('park:release', id => {
    const lock = locks.get(id);
    if (lock?.owner === socket.id) finish(id, lock);
  });
  socket.on('park:time', time => {
    if (typeof time !== 'string' || !Object.hasOwn(TIMES, time) || park.time === time) return;
    park.time = time;
    io.emit('park:time', time);
    record(visitor, `changed the time to ${time.toLowerCase()}`);
  });
  socket.on('park:layer', key => {
    if (typeof key !== 'string' || !Object.hasOwn(LAYERS, key)) return;
    park.layers[key] = !park.layers[key];
    io.emit('park:layers', park.layers);
    record(visitor, `turned ${park.layers[key] ? 'on' : 'off'} ${LAYERS[key].toLowerCase()}`);
  });
  socket.on('park:reset', () => {
    if (locks.size) return;
    park = defaultPark();
    io.emit('park:reset', park);
    record(visitor, 'reset the arrangement');
  });
  socket.on('park:cursor', point => {
    if (point !== null && (!Number.isFinite(point?.x) || !Number.isFinite(point?.y) ||
      point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1)) return;
    visitor.cursor = point === null ? null : { x: point.x, y: point.y };
    const update = { id: socket.id, cursor: visitor.cursor };
    if (point === null) socket.broadcast.emit('park:cursor', update);
    else socket.broadcast.volatile.emit('park:cursor', update);
  });

  socket.on('disconnect', () => {
    // Keep the last accepted position and free everything owned by this socket.
    for (const [id, lock] of locks) if (lock.owner === socket.id) finish(id, lock);
    visitors.delete(socket.id);
    io.emit('park:visitors', [...visitors.values()]);
  });
});

server.listen(process.env.PORT || 3001, '0.0.0.0', () => {
  console.log(`Greenacre Park listening on port ${server.address().port}`);
});
