import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { initialObjects } from '../mapData.js';
import { defaultLayers } from '../sensoryModel.js';

const serverUrl = import.meta.env.VITE_SOCKET_URL?.trim();
const initialPark = () => ({ objects: initialObjects, time: 'Afternoon', layers: defaultLayers() });

export default function useSharedPark() {
  const socket = useRef(null);
  const ready = useRef(false);
  const lastCursor = useRef(0);
  const cursorVisible = useRef(false);
  const [park, setPark] = useState(initialPark);
  const [id, setId] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [locks, setLocks] = useState({});
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    if (!serverUrl) return;
    const connection = io(serverUrl, { autoConnect: false });
    socket.current = connection;
    // Install listeners before connecting so the initial snapshot cannot race setup.
    const listeners = {
      'park:snapshot': snapshot => {
        setPark(snapshot.park);
        setActivity(snapshot.activity);
        setId(snapshot.id);
        ready.current = true;
      },
      'park:object': ({ id, x, y }) => setPark(current => ({
        ...current,
        objects: current.objects.map(object => object.id === id ? { ...object, x, y } : object),
      })),
      'park:time': time => setPark(current => ({ ...current, time })),
      'park:layers': layers => setPark(current => ({ ...current, layers })),
      'park:reset': setPark,
      'park:locks': setLocks,
      'park:activity': setActivity,
      'park:visitors': setVisitors,
      'park:cursor': ({ id, cursor }) => setVisitors(current => current.map(visitor =>
        visitor.id === id ? { ...visitor, cursor } : visitor)),
      disconnect: () => {
        ready.current = false;
        cursorVisible.current = false;
        setId(null);
        setVisitors([]);
        setLocks({});
      },
    };

    for (const [event, handler] of Object.entries(listeners)) connection.on(event, handler);
    connection.connect();
    return () => {
      for (const [event, handler] of Object.entries(listeners)) connection.off(event, handler);
      ready.current = false;
      socket.current = null;
      connection.disconnect();
    };
  }, []);

  // Do not queue edits while offline. Reconnecting starts from a new snapshot.
  const send = (event, ...args) => {
    const connection = socket.current;
    if (!ready.current || !connection?.connected) return false;
    connection.emit(event, ...args);
    return true;
  };

  const onMove = (id, position, dragging = false) => {
    if (serverUrl) send('park:move', { id, ...position, dragging });
    else setPark(current => ({
      ...current,
      objects: current.objects.map(object => object.id === id ? { ...object, ...position } : object),
    }));
  };

  const interaction = {
    onMove,
    onNudge: (object, delta, { min, max }) => {
      if (serverUrl) send('park:move', { id: object.id, ...delta, min, max });
      else setPark(current => ({
        ...current,
        objects: current.objects.map(item => item.id === object.id ? {
          ...item,
          x: Math.max(min.x, Math.min(item.x + delta.x, max.x)),
          y: Math.max(min.y, Math.min(item.y + delta.y, max.y)),
        } : item),
      }));
    },
    onGrab: (object, confirm) => !serverUrl || send('park:grab', { id: object.id, x: object.x, y: object.y }, confirm),
    onRelease: id => send('park:release', id),
    canEdit: objectId => !serverUrl || Boolean(id && !locks[objectId]),
    session: serverUrl ? id : 'local',
    onCursor: point => {
      if (!serverUrl || !ready.current || !socket.current?.connected) return;
      if (point === null) {
        if (cursorVisible.current) send('park:cursor', null);
        cursorVisible.current = false;
        return;
      }
      const now = performance.now();
      if (cursorVisible.current && now - lastCursor.current < 32) return;
      cursorVisible.current = true;
      lastCursor.current = now;
      socket.current.volatile.emit('park:cursor', point);
    },
  };

  return {
    ...park, id, visitors, locks, activity, interaction,
    collaborative: Boolean(serverUrl),
    canReset: !serverUrl || Boolean(id && !Object.keys(locks).length),
    changeTime: time => serverUrl ? send('park:time', time) : setPark(current => ({ ...current, time })),
    toggleLayer: key => serverUrl ? send('park:layer', key) : setPark(current => ({
      ...current, layers: { ...current.layers, [key]: !current.layers[key] },
    })),
    reset: () => serverUrl ? send('park:reset') : setPark(initialPark()),
  };
}
