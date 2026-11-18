# Construct Your Own Escape — Greenacre Park

An interactive React map of Greenacre Park. Visitors can reshape one shared park and see how their choices change its atmosphere.

## Run locally

With Node.js 22, run these commands in the repository root:

```sh
npm ci
cp .env.example .env.local
npm start
```

In a second terminal, run `npm run dev` and open **http://localhost:5173**. The
Express and Socket.IO server listens on port 3001 by default. Vite reads
`VITE_SOCKET_URL` when it starts. Leaving that value blank runs the original
standalone experience. A configured frontend keeps the latest view visible while
reconnecting and resumes editing once it receives the current shared state.

To test from two devices on the same network, run
`npm run dev -- --host 0.0.0.0 --strictPort`. Replace `localhost` in
`.env.local` with the host computer's LAN IP. Start the backend with
`CLIENT_ORIGINS=http://YOUR_LAN_IP:5173 npm start` and open that same exact
frontend URL on both devices. Use a comma-separated list if you also want to
allow localhost. Restart Vite after editing `.env.local`.

## Test collaboration

1. Open the frontend in two windows. Each should show a different visitor name
   and color, and both should report two online.
2. Move your pointer over the physical map and look for the labeled cursor in
   the other window. Drag a tree and check that both maps and the atmospheric
   reading follow the shared arrangement. Try grabbing the same tree in the
   second window while the first visitor still holds it.
3. Change the time and toggle a sensory layer. Check both windows for matching
   controls, atmosphere, and recent activity.
4. Close the editor window mid-drag. The last accepted position stays in place,
   the object becomes available again, and the visitor disappears. Open a new
   window to verify that it joins the current park. Use Reset Arrangement to
   restore the park for all windows once nobody is dragging.

With Google Chrome installed, `npm run test:collaboration` launches its own
backend and frontend and exercises the shared experience in independent browser
contexts. Run `npm run test:interaction`, `npm run test:routes`,
`npm run test:model`, and `npm run build` for the existing regression checks
and production bundle.

## How synchronization works

`src/parkLayout.js` provides the same manifest-based defaults to the server and
frontend. `server/index.js` sends the current park and activity history when
each visitor connects. The server checks drag ownership before accepting
movement. Different visitors can drag different objects simultaneously.
During a drag it broadcasts accepted positions. On release or disconnect it
frees the object and records a single activity entry if the object moved.
Escape restores the grab position before release. Reset waits until there are
no active drag locks.

`src/hooks/useSharedPark.js` applies snapshots and updates with React's
`useState`, and attaches and removes Socket.IO listeners in `useEffect`.
The maps and Atmosphere Profile still derive their renderings from the same
object positions, time, and sensory toggles. Physical dragging still uses the
original alpha-aware hit testing and courtyard bounds. Cursor updates are
throttled, map-relative, and drawn on a pointer-transparent overlay. A
reconnecting visitor receives the current park and a new temporary identity.

### Assignment state map

| State | Data |
| --- | --- |
| Shared on the server | Park objects and their properties, time, sensory layer visibility, per-object drag ownership, visitor names/colors/cursors, and the last five activity entries |
| Local in the browser | Selection and hover, pointer capture and drag offset, keyboard focus, open details and tooltips, viewport, and connection status |
| Derived in React | Sensory glyphs, movement paths, conversation counts, and Atmosphere Profile scores |

All visitors join one park on a single server instance. The park and its
recent activity live in memory and reset when the server process restarts.
Browsers independently derive matching atmosphere from shared inputs.

## Deploy to Render and GitHub Pages

### Render backend

1. Create a **Web Service** linked to this repository. Select Node and leave the
   root directory at the repository root so the server can read the manifest.
2. Set **Build Command** to `npm ci --omit=dev`, **Start Command** to
   `npm start`, and **Health Check Path** to `/health`. Use one instance.
3. Set `NODE_VERSION` to `22.x` and `CLIENT_ORIGINS` to
   `https://dwivm163-dot.github.io` for this repository. Use the origin of your
   own Pages site if different. Origins contain the scheme and host, with no
   repository path or trailing slash. Render supplies `PORT`.
4. Deploy and open `https://YOUR-SERVICE.onrender.com/health`. It should return
   `{"status":"ok"}`.

[Render Express guide](https://render.com/docs/deploy-node-express-app) ·
[Render WebSocket support](https://render.com/docs/websocket) ·
[Render Node version settings](https://render.com/docs/node-version)

### GitHub Pages frontend

1. Under **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
2. Under **Settings → Secrets and variables → Actions → Variables**, add a
   repository variable named `VITE_SOCKET_URL` with your Render HTTPS URL
   (for example, `https://YOUR-SERVICE.onrender.com`).
3. Push the project to `main` or dispatch the existing **Deploy to GitHub Pages**
   workflow after pushing. It builds and publishes `dist` with the configured
   backend URL. Keep `dist` ignored. Vite's relative asset paths support the
   repository subpath.
4. Open the deployed Pages URL in two windows and repeat the collaboration test.

[GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) ·
[GitHub Actions variables](https://docs.github.com/en/actions/concepts/workflows-and-actions/variables)

## Assets and placement

- Physical background: `background.png` at the project root. Physical water layers use the root `stream.png` and `waterfall.png`; `src/mapData.js` overrides the original manifest image paths with these imports.
- Ambience background: `Greenacre_Park_Assets_v3/ambience/ambience_base.png`.
- The 17 physical/ambience PNG pairs are identified by `Greenacre_Park_Assets_v3/manifest.json`: three tree clusters, eleven seating sets, an upper pergola, waterfall, and stream.
- `src/mapData.js` defines placement boxes measured against the replacement background and converts them to normalized coordinates. Both maps receive the same object array and use identical 1658 × 949 canvas proportions. Tree clusters and seating are centered in the courtyard rectangles; the waterfall fills the right-hand open area, and the stream spans the bottom edge.
- PNGs preserve transparency and internal padding. All layers except the stream use proportional containment. The stream deliberately uses a wider, shallower aspect ratio to fit the bottom canal without shortening its length. Manifest order controls stacking; seating sits above the pergola and trees.
- Backgrounds use proportional containment. The physical background fills its native 1658 × 949 canvas; the ambience background is centered without stretching.
- Street noise and entrance shading are already in the ambience background. Legacy `fixedAmbienceOverlays` are intentionally omitted: street noise would be duplicated, and the water effects are represented by the independent waterfall/stream pairs.
- Above 760px, maps use equal columns. On mobile they stack physical map, sensory map, atmospheric reading, then sensory key, without horizontal overflow.

The supplied README describes the base illustration as preliminary and the manifest describes placements as approximate. The manifest supplies the object identities; the revised layout is fitted to the replacement background without modifying the illustrations. The preview JPGs are references only, never flattened map substitutes. Four pergola seating symbols are absent from the supplied ambience preview JPG but are rendered here because all 17 manifest pairs are required.

`App.jsx` consumes the park state from `useSharedPark`. `PhysicalMap` handles pointer interaction; both maps render the same normalized positions. Reset Arrangement restores the original placement array, Afternoon time, all visible sensory layers, and the derived default atmosphere profile.

## Verification

Production build passed. Headless Chrome checks at 1600, 900, and 390 px viewport widths confirmed 36 loaded images, 17 object layers per map, matching normalized placement boxes and canvas ratios, all layers within the canvas, and no browser errors. A desktop screenshot was also visually reviewed.

## Ambience art direction

`src/components/AmbienceArt.jsx` adds an original SVG interpretation of the visual reference: stippled foliage, orange conversation rings, blue water contours and droplets, diagonal shade marks, dotted purple routes, sunlight fans, fragrance marks, and a subtle paper texture. The supplied PNGs remain as underlayers; each of the 17 enhanced symbols is rendered inside the same normalized object box used by the physical map. The physical artwork and placement data are unchanged by this styling pass.

The eight-category sensory key sits directly beneath the ambience canvas, aligned with the atmospheric reading below the physical map. Fixed atmosphere marks and suggested routes are artistic annotations, rather than measured environmental data. Randomized drawing marks are seeded so they remain stable between renders. Background atmosphere stays fixed while the movement paths respond to shared object positions.

### Ambience prominence and correspondence

The ambience scene uses a uniform 1.18× presentation zoom, with a small viewport offset to reduce unused margins. This camera transform applies to its background, atmosphere, and every paired object together; normalized object coordinates remain identical between maps. Physical-map dragging updates shared object data without applying the ambience camera transform to stored positions.

Tree shade includes three individually marked canopies per cluster (nine total). Conversation symbols have enlarged rings and light backings for readability over foliage and pergola hatching. The central, upper, and eastern seating groups contain four, four, and three symbols respectively. All 17 ambience glyphs remain attached to their corresponding object containers.

Browser checks at 1600, 900, and 390 px confirmed these counts, matching normalized coordinates, equally sized canvases, fully visible object containers, and no missing images or browser errors. A before/after physical-map screenshot comparison found only minor browser rasterization differences (at most one RGB level per channel); its artwork, dimensions, and placement data are unchanged.

### Seating movement paths

`src/components/AmbienceMovement.jsx` draws six open, curved dotted approaches toward the upper, central, and eastern seating clusters. There are no enclosing loops or arcs around individual conversation symbols. The previous six static approaches have been replaced by four dynamic entrance-origin routes, calculated from shared object positions. These are suggested movement paths, without obstacle avoidance.

## Drag interaction

- Drag any of the 17 physical illustrations with a mouse, trackpad, or pointer. Pointer capture keeps movement continuous outside an object's original box. The corresponding ambience layer updates immediately.
- Hover and selection outlines identify the active object. Transparent image pixels pass through to underlying objects. Alt-click cycles overlapping illustrations; Tab also reaches every object. Arrow keys move the focused object by 3 background pixels, or 15 with Shift. Escape cancels an active drag.
- Image dimensions and aspect ratios remain unchanged. Bounds use each PNG's visible alpha extent within the courtyard envelope (x 370–1295, y 110–740 in the 1658 × 949 background), accounting for contain-fit padding and the existing shallow stream fit. Fixed architecture and planting artwork remain part of the background. Bounds do not perform obstacle avoidance around individual planting beds.
- Reset Arrangement restores the exact starting positions. Layout resizing preserves normalized positions. Drag grab offsets and pointer coordinates use the physical canvas's current displayed bounds.
- The ambience camera, background decorations, and legend remain fixed. The four dotted movement paths recalculate immediately as object positions change. Memoized SVG artwork avoids rebuilding unrelated sensory illustrations during a drag.

## Interaction tests

With Google Chrome installed, run:

```sh
npm run test:interaction
```

The Playwright checks start and stop their own Vite test server on port 4174. They verify independent dragging and real-time matching of all 17 pairs, unchanged image dimensions and backgrounds, dynamic trails, reset, resizing during/after dragging, keyboard movement, pointer cancellation/capture, fully overlapping-object selection, and courtyard limits. `npm run build` verifies the production bundle.

## Dynamic movement trails

`src/movementRoutes.js` derives four organic routes from the fixed entrance, the three tree clusters, central seating pairs, all upper seating and the pergola, eastern seating, the waterfall, and the stream. Group averages keep the network sparse; moving any of the 17 objects affects at least one route. Each route starts at (220, 490) in the existing 1658 × 949 coordinate system.

The curves interpolate spatial anchors with shared Bézier tangents and deterministic, gently rotated handles. Reset reproduces the exact initial path data. There is no random animation, independent trail state, or collision-avoidance routing. The non-interactive SVG uses the existing purple dashed strokes and small end arrows, inside the existing ambience camera transform. No static purple trails are embedded in `ambience_base.png`; the old SVG routes are replaced, rather than overlaid.

Run `npm run test:routes` for route geometry, influence of every object, deterministic reset, and coincident-anchor checks. The browser interaction suite also asserts route updates before pointer release, route reset, and unchanged geometry across viewport resizing.

## Time, sensory layers, and atmosphere

The default time is Afternoon (12 illustrative visitors, high conversation activity). Morning uses 4 visitors and smaller/lighter rings; Evening uses 6 visitors and moderate rings. `TIMES` in `src/sensoryModel.js` controls scale and opacity. Conversation clusters now total 4 / 12 / 6 to match the illustrative visitor values. Stable assignments alternate between central, upper, and eastern seating; Afternoon adds a second overlapping cluster to one seat. These are simulation values, not attendance measurements. Time changes never change object positions.

The always-visible clickable Sensory Key controls traffic, waterfall sound, flowing water, conversations, movement, tree shade, pergola shade, and smell/greenery independently. Both the PNG underlayer and enhanced SVG of each movable object share its visibility. Hidden movement geometry continues updating. Fixed scent/foliage marks form the greenery layer. The faint red marks baked into the original ambience background are masked over its leftmost 11%; the independently controlled traffic SVG supplies the visible red marks. The source image is unchanged, and fixed entrance shading remains visible.

`src/sensoryModel.js` is a pure deterministic model driven by shared positions,
time, and all eight sensory toggles. Disabled layers stop contributing to the
reading without removing physical objects. Distances use aspect-correct normalized
coordinates; scores are clamped to 0–100.

- Active waterfall sound masks 80% of street exposure across the small park,
  while proximity to the waterfall still adds its own sound. Turning it off
  exposes traffic; removing traffic eliminates street exposure.
- Conversations and movement independently contribute social activity and
  competing sensory overlap, scaled by time and seating concentration.
- Tree and pergola toggles independently control their shade fields. Greenery
  adds tranquility and strengthens the restorative contribution of shade.
- Flowing water adds calm when active and near seating. Density still derives
  from the physical arrangement, including when activity layers are disabled.
- Noise combines waterfall exposure (48%), masked traffic exposure (90%),
  conversation activity (10%), and concentrated conversation (8%). Social activity
  combines active conversation and movement with seating density. Calm rewards
  shade, greenery, soft water, and distributed destinations, and subtracts sound
  and concentrated activity. Sensory intensity combines noise (40%), social
  activity (35%), and competing overlap (25%).

Classification priority: Chaotic & Overstimulating when intensity ≥66, concentration ≥65%, and overlap ≥40%; Noisy & Stimulating when noise ≥48; Social & Lively when social ≥64 and concentration ≥22%; Calm & Secluded when calm ≥50 and social <58; otherwise Balanced & Restorative. Thresholds use unrounded scores; displayed indicators are rounded. Descriptions select the strongest spatial contributors and identify the selected time/activity. All five classes are covered by scenario tests.

These are artistic heuristics, not validated acoustics, measured attendance, weather, or a prediction of human behavior. Sound footprints, shade coverage, and circulation are simplified proximity fields; there is no sound propagation through architecture, sun-angle simulation, or collision-based pedestrian simulation. Only active sensory layers contribute to the model; the physical arrangement remains available for spatial calculations.

Run `npm run test:model` for scoring scenarios, layer interactions, and all 256 toggle combinations. `npm run test:interaction` now also checks time/count/intensity changes, all eight independent toggles, physical-map independence and live model responses to sensory toggles, hidden-object movement and live route updates, responsive controls, and the expanded reset defaults.

## Editorial interface

The publication layout uses the warm paper / forest ink / terracotta palette, locally hosted Cormorant Garamond and DM Sans, a compact masthead, numbered figures, and fine dividing rules. Font files and their SIL Open Font Licenses live in `src/assets/fonts/`; no font CDN or new dependency is required.

`App.jsx` places the physical map, sensory map, atmospheric reading, and sensory key as four children of the same CSS grid. Desktop has two equally sized columns and two aligned rows. At 760px and below, CSS stacks the existing components in reading order without remounting them or changing state. `ParkMap.jsx` now renders just the map figure. The reusable `LegendSymbol` artwork supplies the eight clickable checkbox rows in `SensoryControls.jsx`, replacing the former separate legend and collapsible controls. The atmosphere model, drag hook, position data, ambience camera, and all illustration assets are unchanged.

The reset button is labeled Reset Arrangement. Time controls retain the original visitors, conversation intensity/counts, and state. Full-row checkbox labels support mouse, touch, and keyboard. Selected layers retain their sensory colors; disabled rows are muted and struck through.

Browser checks cover layout at 1600, 1024, 900, 760, 390, and 320px, equal map dimensions, aligned desktop lower sections, mobile section order, no document overflow, loaded fonts, all 17 independent drags, overlap selection, live synchronization and trails, sensory controls, atmosphere updates, reset, and native mobile touch dragging. Run `npm run test:interaction` to repeat them.

## Physical map framing

The physical scene uses a uniform 1.22× zoom anchored at its top-left corner.
The viewport keeps the original 1658:949 ratio and clips excess buildings at the
right and bottom while preserving the left road and traffic. Background and all
movable illustrations share the transform; source images, placement coordinates,
and illustration proportions are unchanged. Pointer coordinates use the zoomed
scene bounds so dragging remains aligned after zoom and responsive resizing.
The internal “GREENACRE PARK / AMBIENCE” SVG title has been removed from the
sensory map; its figure caption remains above the map.
