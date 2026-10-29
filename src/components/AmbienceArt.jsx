import React from 'react';
import { TIMES } from '../sensoryModel.js';

// Deterministic marks keep the drawing stable through React rerenders.
function random(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const green = ['#325e35', '#628441', '#8a9d4d', '#214e37'];
function Foliage({ cx, cy, rx, ry, seed, count = 150 }) {
  const rand = random(seed);
  return <g>
    {[0, 1, 2, 3].map(i => <ellipse key={i} cx={cx + (rand() - .5) * rx * .6} cy={cy + (rand() - .5) * ry * .5} rx={rx * (.65 + rand() * .25)} ry={ry * (.65 + rand() * .3)} fill={['#8da579', '#b0bf8e', '#91a77b', '#c3cda9'][i]} opacity=".22" transform={`rotate(${rand() * 70 - 35} ${cx} ${cy})`} />)}
    {Array.from({ length: count }, (_, i) => {
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand());
      const x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r;
      return <ellipse key={`leaf-${i}`} cx={x} cy={y} rx={.85 + rand() * 1.7} ry={1 + rand() * 2.1} fill={green[i % green.length]} opacity={.4 + rand() * .55} transform={`rotate(${rand() * 180} ${x} ${y})`} />;
    })}
  </g>;
}

function Conversation() {
  const rand = random(91);
  return <g fill="none" stroke="#ff751a">
    <circle cx="50" cy="50" r="5" fill="#ff8b13" stroke="none" />
    {[11, 19, 27, 36, 44].map((r, i) => <circle key={r} cx="50" cy="50" r={r} strokeWidth={i % 2 ? 1.6 : 2.2} strokeDasharray={i % 2 ? '1 4' : '2.4 3.6'} strokeLinecap="round" />)}
    {Array.from({ length: 42 }, (_, i) => {
      const a = rand() * Math.PI * 2, r = 45 + rand() * 15;
      return <circle key={i} cx={50 + Math.cos(a) * r} cy={50 + Math.sin(a) * r} r={.35 + rand() * .65} fill="#ffb132" stroke="none" opacity=".7" />;
    })}
  </g>;
}

function Waterfall() {
  const rand = random(22);
  return <g fill="none" stroke="#009fe0">
    {Array.from({ length: 15 }, (_, i) => {
      const rx = 21 + i * 6, ry = 35 + i * 9;
      const points = Array.from({ length: 101 }, (_, j) => {
        const a = j / 100 * Math.PI * 2;
        const wave = 1 + .085 * Math.sin(a * 3 + i * .07) + .045 * Math.cos(a * 5);
        return `${155 + Math.cos(a) * rx * wave},${211 + Math.sin(a) * ry * wave}`;
      });
      return <path key={i} d={`M${points.join(' L')} Z`} strokeWidth={i % 3 === 0 ? 2.2 : 1.2} opacity={.9 - i * .025} />;
    })}
    {Array.from({ length: 240 }, (_, i) => {
      const x = 25 + rand() * 260, y = 16 + rand() * 400;
      if (Math.hypot((x - 155) / 103, (y - 211) / 165) < 1) return null;
      return <circle key={i} cx={x} cy={y} r={.6 + rand() * 2.1} fill={i % 5 ? '#00a6e5' : 'none'} strokeWidth=".9" opacity={.2 + rand() * .6} />;
    })}
    <path d="M145 377 C170 410 118 418 98 435" strokeWidth="2" opacity=".65" />
  </g>;
}

function Stream() {
  const rand = random(77);
  const wave = x => Math.sin(x / 69) * 11 + Math.sin(x / 157) * 8;
  return <g fill="none" stroke="#00a3df">
    {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${Array.from({ length: 100 }, (_, j) => `${18 + j * 9},${49 + i * 4.5 + wave(18 + j * 9)}`).join(' L')}`} strokeWidth={i % 3 === 0 ? 2.3 : 1.1} opacity={.58 + i * .04} />)}
    {Array.from({ length: 330 }, (_, i) => {
      const x = 15 + rand() * 900;
      const y = 68 + wave(x) + (i % 2 ? 1 : -1) * (26 + rand() * 22);
      return <circle key={i} cx={x} cy={y} r={.6 + rand() * 2.2} fill={i % 7 ? '#00a3df' : 'none'} strokeWidth=".8" opacity={.18 + rand() * .55} />;
    })}
  </g>;
}

function Pergola() {
  const rand = random(98);
  return <g stroke="#91735f" strokeLinecap="round">
    {Array.from({ length: 108 }, (_, i) => {
      const x = 18 + i * 5.4;
      return <path key={i} d={`M${x} ${125 + rand() * 14} l48 -94 m-35 57 l35 -69`} strokeWidth={1 + rand() * 2.8} strokeDasharray={i % 3 ? '6 3 1 4' : '12 3'} opacity={.4 + rand() * .4} />;
    })}
  </g>;
}

function AmbienceGlyphArt({ object, time = 'Afternoon', conversationCount = 1 }) {
  let viewBox, art, kind;
  if (object.id.startsWith('tree_cluster')) {
    kind = 'tree-shade';
    viewBox = '0 0 160 310';
    const seed = Number(object.id.slice(-2)) * 19;
    art = [54, 155, 256].map((cy, i) => <g key={i} data-tree-canopy={i + 1}><Foliage cx={80} cy={cy} rx={76} ry={53} seed={seed + i} count={230} /></g>);
  } else if (object.id.includes('seating')) {
    kind = 'conversation';
    viewBox = '0 0 100 100';
    const activity = TIMES[time];
    art = conversationCount > 0 ? <g data-conversation-period={time} opacity={activity.opacity} transform={`translate(50 50) scale(${activity.scale}) translate(-50 -50)`}>
      <circle cx="50" cy="50" r="47" fill="#faf7ed" fillOpacity=".85" /><g data-conversation-cluster><Conversation /></g>
      {Array.from({length:conversationCount - 1},(_,i)=><g key={i} data-conversation-echo data-conversation-cluster opacity={.65} transform={i===0?'translate(61 5) scale(.42)':'translate(-6 62) scale(.38)'}><Conversation /></g>)}
    </g> : null;
  } else if (object.id === 'waterfall') {
    kind = 'waterfall';
    viewBox = '0 0 310 435'; art = <Waterfall />;
  } else if (object.id === 'stream') {
    kind = 'stream';
    viewBox = '0 0 930 140'; art = <Stream />;
  } else {
    kind = 'pergola-shade';
    viewBox = '0 0 630 165'; art = <Pergola />;
  }
  const group = object.id.startsWith('central_seating') ? 'central'
    : object.id.startsWith('pergola_seating') ? 'upper'
    : object.id.startsWith('terrace_seating') ? 'eastern' : undefined;
  return <svg className="ambience-glyph" data-symbol-kind={kind} data-seating-group={group} viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true">{art}</svg>;
}

export const AmbienceGlyph = React.memo(AmbienceGlyphArt);

function Sunlight({ x, y, angle = 0, size = 1 }) {
  const rand = random(x + y);
  return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`} stroke="#efb638" fill="#efb638" opacity=".64">
    {Array.from({ length: 13 }, (_, i) => {
      const a = (i * 8 - 48) * Math.PI / 180;
      const length = 40 + rand() * 43;
      return <path key={i} d={`M${Math.sin(a) * 23} ${-Math.cos(a) * 23} L${Math.sin(a) * length} ${-Math.cos(a) * length}`} strokeWidth={1 + rand() * 1.8} />;
    })}
    {Array.from({ length: 28 }, (_, i) => {
      const a = (rand() * 110 - 55) * Math.PI / 180, r = 86 + rand() * 40;
      return <circle key={`dot${i}`} cx={Math.sin(a) * r} cy={-Math.cos(a) * r} r={1 + rand() * 1.4} stroke="none" />;
    })}
  </g>;
}

function Fragrance({ x, y }) {
  return <g transform={`translate(${x} ${y})`} fill="#f36183">
    {[0, 90, 180, 270].map(a => <ellipse key={a} cx="0" cy="-7" rx="2.3" ry="4.3" transform={`rotate(${a})`} />)}
    <circle r="1.8" />
  </g>;
}

function AmbienceAtmosphereArt({ layers }) {
  const rand = random(2026);
  return <>
    <svg className="ambience-atmosphere" viewBox="0 0 1658 949" aria-hidden="true">
      <defs>
        <filter id="paper-grain"><feTurbulence type="fractalNoise" baseFrequency=".76" numOctaves="3" seed="7" /><feColorMatrix type="saturate" values="0" /></filter>
      </defs>
      <g opacity=".85" data-sensory-layer="greenery" visibility={layers.greenery ? 'visible' : 'hidden'}>
        <Foliage cx={301} cy={312} rx={34} ry={114} seed={12} count={250} />
        <Foliage cx={305} cy={564} rx={32} ry={111} seed={13} count={220} />
        <Foliage cx={1171} cy={180} rx={100} ry={65} seed={15} count={340} />
        <Foliage cx={910} cy={433} rx={35} ry={138} seed={16} count={280} />
      </g>
      <g stroke="#ed4169" fill="#ed4169" data-sensory-layer="traffic" visibility={layers.traffic ? 'visible' : 'hidden'}>
        {[195, 309, 423, 574, 689].map((y, i) => <path key={y} d={`M161 ${y} l-21 23 28 18 -29 23 24 18`} fill="none" strokeWidth="3.5" strokeLinejoin="round" />)}
        {Array.from({ length: 450 }, (_, i) => <circle key={i} cx={105 + rand() * 112} cy={175 + rand() * 600} r={.6 + rand() * 1.5} stroke="none" opacity={.3 + rand() * .6} />)}
      </g>
      <g fill="none" stroke="#947b65" opacity=".5" strokeWidth="2.1" strokeDasharray="4 4">
        {Array.from({ length: 32 }, (_, i) => <path key={i} d={`M247 ${191 + i * 15} l38 -39`} />)}
      </g>
      <g fill="#a9b78b" opacity=".15" data-sensory-layer="trees" visibility={layers.trees ? 'visible' : 'hidden'}>
        <ellipse cx="578" cy="452" rx="157" ry="119" transform="rotate(-15 578 452)" />
        <ellipse cx="751" cy="536" rx="103" ry="86" />
      </g>
      <Sunlight x={390} y={269} angle={-23} size={.8} />
      <Sunlight x={795} y={330} angle={15} size={.7} />
      <Sunlight x={964} y={203} angle={38} size={.7} />
      <Sunlight x={465} y={636} angle={-100} size={.6} />
      <Sunlight x={851} y={602} angle={110} size={.65} />
      <g data-sensory-layer="greenery" visibility={layers.greenery ? 'visible' : 'hidden'}>{[[391, 371], [866, 338], [865, 536], [971, 609], [1077, 238], [570, 269]].map(([x, y]) => <Fragrance key={x} x={x} y={y} />)}</g>
      <g fill="#245650" fontFamily="system-ui, sans-serif" fontSize="11" letterSpacing="1.5">
        <text x="78" y="465">ENTRANCE</text><text x="78" y="483">FROM STREET</text>
        <path d="M180 478 h43 l-10 -6 m10 6 -10 6" fill="none" stroke="#245650" strokeWidth="2" />
      </g>
      <rect className="paper-grain" width="1658" height="949" filter="url(#paper-grain)" opacity=".045" />
    </svg>
  </>;
}

export const AmbienceAtmosphere = React.memo(AmbienceAtmosphereArt);

export function LegendSymbol({ kind }) {
  let art;
  if (kind === 'people') art = <g transform="translate(1 1) scale(.36)"><Conversation /></g>;
  else if (kind === 'foliage') art = <><g fill="#a4b186">{[18, 14, 10, 6].map(r => <ellipse key={r} cx="20" cy="20" rx={r} ry={r * .8} opacity=".2" />)}</g><Foliage cx={20} cy={20} rx={16} ry={16} seed={13} count={65} /></>;
  else if (kind === 'street') art = <><path d="M24 3 L11 17 L27 18 L12 35" fill="none" stroke="#ed4169" strokeWidth="2.5" /><g fill="#ed4169">{Array.from({ length: 28 }, (_, i) => <circle key={i} cx={5 + (i * 17 % 31)} cy={4 + (i * 11 % 32)} r=".7" />)}</g></>;
  else if (kind === 'movement') art = <path d="M3 32 C12 8 27 29 35 8 M29 9 L36 7 L34 14" fill="none" stroke="#823cca" strokeWidth="1.7" strokeDasharray="2 3" />;
  else if (kind === 'shade') art = <g stroke="#94735f" strokeWidth="1.7">{[0, 7, 14, 21, 28].map(x => <path key={x} d={`M${x} 33 l14 -26`} />)}</g>;
  else if (kind === 'sunlight') art = <g transform="translate(20 34) scale(.29)"><Sunlight x={0} y={0} /></g>;
  else if (kind === 'waterfall') art = <g transform="translate(5 0) scale(.1 .09)"><Waterfall /></g>;
  else if (kind === 'water') art = <g transform="translate(0 5) scale(.042 .23)"><Stream /></g>;
  else art = <><Fragrance x={12} y={13} /><Fragrance x={28} y={27} /></>;
  return <svg viewBox="0 0 40 40" aria-hidden="true">{art}</svg>;
}

