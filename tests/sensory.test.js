import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeAtmosphere, TIMES, defaultLayers, conversationCounts } from '../src/sensoryModel.js';
const seat=(id,x,y)=>({id:`central_seating_${id}`,x:x-.025,y:y-.04,width:.05,height:.08});
const environment=[
 {id:'waterfall',x:.67,y:.3,width:.15,height:.4},
 {id:'stream',x:.25,y:.7,width:.5,height:.1},
 {id:'tree_cluster_01',x:.35,y:.3,width:.1,height:.35},
 {id:'tree_cluster_02',x:.5,y:.3,width:.1,height:.35},
 {id:'tree_cluster_03',x:.65,y:.3,width:.1,height:.35},
 {id:'pergola_upper',x:.3,y:.15,width:.4,height:.15},
];
const clustered=Array.from({length:11},(_,i)=>seat(i,.52+(i%3)*.015,.5+Math.floor(i/3)*.015));
const dispersed=Array.from({length:11},(_,i)=>seat(i,.26+(i%4)*.15,.22+Math.floor(i/4)*.22));
const analyze=(seats,time='Afternoon',env=environment)=>analyzeAtmosphere([...env,...seats],time);
test('visitor values and default visibility are exact',()=>{assert.deepEqual(Object.values(TIMES).map(t=>t.visitors),[4,12,6]);assert.equal(Object.keys(defaultLayers()).length,8);assert(Object.values(defaultLayers()).every(Boolean));});
test('clustering increases social concentration; dispersion reduces it',()=>{const a=analyze(clustered),b=analyze(dispersed);assert(a.factors.density>b.factors.density);assert(a.scores['Social Activity']>b.scores['Social Activity']);assert.notEqual(a.description,b.description);});
test('waterfall and street proximity increase their respective exposures',()=>{const nearFall=analyze(clustered.map(o=>({...o,x:.72,y:.44})));const far=analyze(clustered.map(o=>({...o,x:.3,y:.2})));assert(nearFall.factors.waterfall>far.factors.waterfall);const nearStreet=analyze(clustered.map(o=>({...o,x:.24,y:.45})));assert(nearStreet.factors.traffic>nearFall.factors.traffic);assert.match(nearFall.description,/waterfall/);assert.match(nearStreet.description,/street/);});
test('adding nearby tree and pergola shade improves shelter and calm',()=>{const seats=Array.from({length:11},(_,i)=>seat(i,.4,.36));const a=analyze(seats,'Morning');const b=analyze(seats,'Morning',environment.filter(o=>!o.id.startsWith('tree')&&!o.id.startsWith('pergola')));assert(a.factors.shade>b.factors.shade);assert(a.scores.Calm>b.scores.Calm);});
test('time changes activity and description without any position mutation',()=>{const before=structuredClone(dispersed);const m=analyze(dispersed,'Morning'),a=analyze(dispersed),e=analyze(dispersed,'Evening');assert(a.scores['Social Activity']>e.scores['Social Activity']);assert(e.scores['Social Activity']>m.scores['Social Activity']);assert.notEqual(m.description,a.description);assert.deepEqual(dispersed,before);});
test('all scores are finite, bounded, deterministic; hidden layers are not model inputs',()=>{for(const time of Object.keys(TIMES))for(const seats of [clustered,dispersed,[]]){const profile=analyze(seats,time);assert(Object.values(profile.scores).every(n=>Number.isFinite(n)&&n>=0&&n<=100));assert.deepEqual(profile,analyze(seats,time));}assert.equal(analyzeAtmosphere.length,1);});
test('a concentrated water-side afternoon can become chaotic; quieter arrangements differ',()=>{const chaotic=analyze(clustered.map(o=>({...o,x:.72,y:.44})));assert.equal(chaotic.classification,'Chaotic & Overstimulating');assert.notEqual(chaotic.classification,analyze(dispersed,'Morning').classification);});
test('all five interpretations are reachable through arrangement and time',()=>{
 const fallSeats=clustered.map(o=>({...o,x:.72,y:.44}));
 const shelter=[{id:'pergola_upper',x:.15,y:.1,width:.8,height:.7}];
 const found=new Set([
  analyze(dispersed,'Morning',shelter),analyze(dispersed,'Evening',[]),
  analyze(clustered,'Afternoon',[]),analyze(fallSeats,'Morning',environment.filter(o=>o.id==='waterfall')),
  analyze(fallSeats,'Afternoon',environment.filter(o=>o.id==='waterfall')),
 ].map(p=>p.classification));
 assert.deepEqual([...found].sort(),['Balanced & Restorative','Calm & Secluded','Chaotic & Overstimulating','Noisy & Stimulating','Social & Lively'].sort());
});
test('strong waterfall exposure is noisier than a soft stream at the same seating',()=>{
 const seats=clustered.map(o=>({...o,x:.72,y:.44}));
 const fall=environment.find(o=>o.id==='waterfall');
 const a=analyze(seats,'Morning',[fall]);
 const b=analyze(seats,'Morning',[{...fall,id:'stream'}]);
 assert(a.scores.Noise>b.scores.Noise);assert(b.scores.Calm>a.scores.Calm);
});

test('conversation cluster totals match visitors and cover all seating areas',()=>{
 const seats=['central_seating','pergola_seating','terrace_seating'].flatMap((prefix,g)=>Array.from({length:g===2?3:4},(_,i)=>({id:`${prefix}_${i+1}`})));
 for(const [time,{visitors}] of Object.entries(TIMES)){
  const counts=conversationCounts(seats,time);
  assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),visitors);
  for(const prefix of ['central_seating','pergola_seating','terrace_seating'])assert(Object.entries(counts).some(([id,n])=>id.startsWith(prefix)&&n>0));
  assert.deepEqual(counts,conversationCounts(seats.map(o=>({...o,x:.5})),time));
 }
});
