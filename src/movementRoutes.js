// Pure geometry: normalized object state -> a small, deterministic route network.
// No randomness, stored trail state, or obstacle avoidance is involved.
export function buildMovementRoutes(objects, canvas) {
  const center = object => ({
    x: (object.x + object.width / 2) * canvas.width,
    y: (object.y + object.height / 2) * canvas.height,
  });
  const average = (members, fallback) => {
    if (!members.length) return fallback;
    const points = members.map(center);
    return { x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length };
  };
  const group = prefix => objects.filter(o => o.id.startsWith(prefix));
  const objectCenter = (id, fallback) => {
    const object = objects.find(o => o.id === id);
    return object ? center(object) : fallback;
  };
  const offset = (p, x, y) => ({ x: p.x + x, y: p.y + y });
  const entrance = { x: 220, y: 490 };
  const grove = offset(average(group('tree_cluster'), { x: 635, y: 440 }), -145, 0);
  const central = group('central_seating');
  const north = offset(average(central.slice(0, 2), { x: 638, y: 397 }), 0, 67);
  const south = offset(average(central.slice(2), { x: 638, y: 517 }), 0, 72);
  const upperSeats = average(group('pergola_seating'), { x: 730, y: 190 });
  const pergola = objectCenter('pergola_upper', upperSeats);
  // Both the pergola and its independently movable seats influence this anchor.
  const upper = { x: upperSeats.x * .65 + pergola.x * .35, y: upperSeats.y * .65 + pergola.y * .35 + 56 };
  const east = offset(average(group('terrace_seating'), { x: 1035, y: 460 }), -85, 0);
  const waterfall = offset(objectCenter('waterfall', { x: 1185, y: 503 }), -95, 15);
  const stream = offset(objectCenter('stream', { x: 820, y: 679 }), 0, -65);
  const definitions = [
    { id: 'grove-to-pergola', points: [entrance, offset(grove, -5, -35), north, upper], bend: -19 },
    { id: 'grove-to-eastern-seating', points: [entrance, offset(grove, 15, 20), south, east], bend: 22 },
    { id: 'seating-to-waterfall', points: [entrance, offset(grove, -20, -5), north, offset(east, -15, -65), waterfall], bend: -11 },
    { id: 'grove-to-stream', points: [entrance, offset(grove, -30, 60), south, stream], bend: 17 },
  ];
  return definitions.map(route => ({ ...route, d: flowingPath(route.points, route.bend) }));
}

// Interpolating cubic curves share tangents at every spatial anchor. Small,
// deterministic tangent rotations give each route its own flowing character.
export function flowingPath(points, bend) {
  const format = p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  const tangents = points.map((point, i) => {
    const before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 1)];
    const angle = Math.sin(i * 1.7) * bend * .006;
    const x = (after.x - before.x) / 6, y = (after.y - before.y) / 6;
    return { x: x * Math.cos(angle) - y * Math.sin(angle), y: x * Math.sin(angle) + y * Math.cos(angle) };
  });
  let d = `M${format(points[0])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const b = points[i], c = points[i + 1];
    const control1 = { x: b.x + tangents[i].x, y: b.y + tangents[i].y };
    const control2 = { x: c.x - tangents[i + 1].x, y: c.y - tangents[i + 1].y };
    d += ` C${format(control1)} ${format(control2)} ${format(c)}`;
  }
  return d;
}
