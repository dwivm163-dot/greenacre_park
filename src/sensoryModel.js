export const TIMES = {
  Morning: { visitors: 4, intensity: 'Low', scale: .8, opacity: 1 },
  Afternoon: { visitors: 12, intensity: 'High', scale: 1.27, opacity: 1 },
  Evening: { visitors: 6, intensity: 'Medium', scale: 1.02, opacity: 1 },
};
// Distribute conversation clusters across all three seating areas, keeping
// assignment stable while tables move. Extra activity repeats at occupied seats.
export function conversationCounts(objects, time) {
  const groups = ['central_seating', 'pergola_seating', 'terrace_seating'].map(prefix => objects.filter(o => o.id.startsWith(prefix)));
  const seats = [];
  for (let i = 0; i < Math.max(...groups.map(g => g.length)); i++)
    for (const group of groups) if (group[i]) seats.push(group[i]);
  const counts = Object.fromEntries(seats.map(o => [o.id, 0]));
  if (seats.length) for (let i = 0; i < TIMES[time].visitors; i++) counts[seats[i % seats.length].id]++;
  return counts;
}
export const LAYERS = {
  traffic: 'Traffic Noise', waterfall: 'Waterfall Sound', stream: 'Flowing Water',
  conversations: 'Conversations', movement: 'Movement', trees: 'Tree Shade',
  pergola: 'Pergola Shade', greenery: 'Smell / Greenery',
};
export const defaultLayers = () => Object.fromEntries(Object.keys(LAYERS).map(key => [key, true]));
export function objectLayer(id) {
  if (id.startsWith('tree_cluster')) return 'trees';
  if (id.includes('seating')) return 'conversations';
  return id === 'pergola_upper' ? 'pergola' : id;
}
const clamp = n => Math.max(0, Math.min(1, n));
const mean = values => values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0;
const ratio = 1658 / 949;
const center = o => ({ x:(o.x+o.width/2)*ratio, y:o.y+o.height/2 });
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const rectDistance = (p,o,wx=1,hy=1) => {
  const c=center(o);
  return Math.hypot(Math.max(0,Math.abs(p.x-c.x)-o.width*ratio*wx/2),Math.max(0,Math.abs(p.y-c.y)-o.height*hy/2));
};

// Artistic heuristics, not acoustic measurements. Distances are normalized to
// canvas height (aspect-correct); influence radii are tuned to this small park.
export function analyzeAtmosphere(objects, time='Afternoon', layers=defaultLayers()) {
  const enabled = key => layers[key] !== false;
  const conversations = enabled('conversations') ? 1 : 0;
  const movement = enabled('movement') ? TIMES[time].visitors/12 : 0;
  const greenery = enabled('greenery') ? 1 : 0;
  // A continuous waterfall masks street noise across this small park.
  const masking = enabled('waterfall') && objects.some(o=>o.id==='waterfall') ? .8 : 0;
  const seats=objects.filter(o=>o.id.includes('seating')), points=seats.map(center);
  const trees=objects.filter(o=>enabled('trees') && o.id.startsWith('tree_cluster'));
  const pergola=objects.find(o=>enabled('pergola') && o.id==='pergola_upper');
  const waterfall=objects.find(o=>enabled('waterfall') && o.id==='waterfall'), stream=objects.find(o=>enabled('stream') && o.id==='stream');
  const activity=conversations*TIMES[time].visitors/12;
  const pairs=[];
  points.forEach((p,i)=>points.slice(i+1).forEach(q=>pairs.push(Math.exp(-((distance(p,q)/.21)**2)))));
  const neighbors=points.map((p,i)=>Math.max(0,...points.filter((_,j)=>i!==j).map(q=>Math.exp(-((distance(p,q)/.21)**2)))));
  const density=clamp(.65*mean(pairs)+.35*mean(neighbors));
  const exposures=points.map((p,i)=>{
    const fall=waterfall?Math.exp(-((rectDistance(p,waterfall,.55,.85)/.20)**2)):0;
    const flowing=stream?Math.exp(-((rectDistance(p,stream,.95,.6)/.14)**2)):0;
    const street=enabled('traffic')?Math.exp(-Math.hypot(p.x-220/949,(p.y-490/949)*.7)/.4):0;
    const traffic=street*(1-masking);
    const fields=trees.flatMap(o=>[54,155,256].map(y=>{
      const cx=(o.x+o.width/2)*ratio,cy=o.y+o.height*y/310;
      return Math.exp(-.5*(((p.x-cx)/(o.width*ratio*.48))**2+((p.y-cy)/(o.height*53/310))**2));
    }));
    if(pergola)fields.push(Math.exp(-((rectDistance(p,pergola,.9,.65)/.09)**2)));
    const shade=1-fields.reduce((uncovered,influence)=>uncovered*(1-clamp(influence)),1);
    // Competing strong sound/activity fields count more than shade + soft water.
    const social=activity*(.25+.75*neighbors[i]);
    const overlap=clamp(.45*social*(fall+traffic)+.35*fall*traffic+.20*social*(1-shade)+.12*movement*neighbors[i]*(1-shade));
    return {fall,flowing,traffic,shade,overlap};
  });
  const fall=mean(exposures.map(e=>e.fall)), flowing=mean(exposures.map(e=>e.flowing));
  const traffic=mean(exposures.map(e=>e.traffic)), shade=mean(exposures.map(e=>e.shade));
  const overlap=mean(exposures.map(e=>e.overlap));
  // Destination concentration combines seat density with closeness to shade.
  const circulation=clamp(.75*density+.25*shade*density);
  const noise=clamp(.48*fall+.90*traffic+.10*activity+.08*activity*density);
  const social=clamp(.06*conversations+.06*movement+.43*activity+.35*density*conversations+.10*density*movement);
  const calm=clamp(.24+.32*shade+.20*flowing+.12*greenery+.08*greenery*shade+.16*(1-circulation)-.28*activity*density-.24*fall-.65*traffic-.08*movement*density);
  const intensity=clamp(.40*noise+.35*social+.25*overlap);
  let classification='Balanced & Restorative';
  if(intensity>=.66&&density>=.65&&overlap>=.4)classification='Chaotic & Overstimulating';
  else if(noise>=.48)classification='Noisy & Stimulating';
  else if(social>=.64&&density>=.22)classification='Social & Lively';
  else if(calm>=.50&&social<.58)classification='Calm & Secluded';
  const observations=[
    {weight:conversations*(density>.22?density:.25),text:density>.4?'Closely gathered seating concentrates conversations and draws movement toward shared social pockets.':density>.22?'Several nearby seating groups encourage conversations to overlap.':'Separated seating offers more individual experiences and distributes gathering activity.'},
    {weight:fall,text:'Seating near the waterfall brings its stronger, continuous sound into the foreground.'},
    {weight:traffic,text:masking?'The waterfall masks some street noise, softening its intrusion near the entrance.':'Without waterfall masking, street noise is more exposed around the gathering areas.'},
    {weight:shade*.85,text:'Active shade layers shelter the seating, offering calmer places to pause.'},
    {weight:flowing*.8,text:'Nearby flowing water adds a softer rhythm around the gathering areas.'},
    {weight:greenery*.3,text:'Natural scents and greenery support a sense of tranquility.'},
    {weight:movement*.25,text:'Movement through the seating areas adds energy to the scene.'},
  ].filter(o=>o.weight>0).sort((a,b)=>b.weight-a.weight);
  const opening={Morning:'With four illustrative visitors, morning leaves room for slower, quieter encounters.',Afternoon:'With twelve illustrative visitors, afternoon brings the park’s strongest social activity.',Evening:'With six illustrative visitors, evening supports a gentler level of conversation.'}[time];
  const disabled=Object.entries(LAYERS).filter(([key])=>!enabled(key)).map(([,label])=>label.toLowerCase());
  const layerReading=disabled.length?` With ${disabled.join(', ')} switched off, the reading reflects the remaining sensory layers.`:'';
  const soundReading=enabled('traffic')&&!enabled('waterfall')?' Traffic is unmasked without the waterfall’s continuous sound.':enabled('traffic')&&masking?' The waterfall’s continuous sound masks some street traffic noise.':'';
  const natureReading=!greenery?' Without greenery and natural scents, the space loses some natural tranquility.':'';
  return {classification,description:`${conversations?opening:'Conversation is switched off; the selected time still sets potential movement activity.'} ${observations.slice(0,2).map(o=>o.text).join(' ')}${soundReading}${natureReading}${layerReading}`,
    scores:{Noise:Math.round(noise*100),'Social Activity':Math.round(social*100),Calm:Math.round(calm*100),'Sensory Intensity':Math.round(intensity*100)},
    factors:{density,activity,waterfall:fall,stream:flowing,traffic,shade,overlap,circulation,movement,greenery,masking}};
}
