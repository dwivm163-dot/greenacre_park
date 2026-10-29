# Construct Your Own Escape — Greenacre Park

A single-page React/Vite reconstruction of the supplied layered maps.

## Run

Use Node.js 22 (or another Vite 6 compatible version):

```sh
npm install
npm run dev
```

`npm run build` creates the production app in `dist`; `npm run preview` serves it.

## GitHub Pages

In the repository's **Settings → Pages → Build and deployment**, set **Source**
to **GitHub Actions**. Push the source files, `vite.config.js`, and
`.github/workflows/deploy.yml` to `main`. The workflow installs dependencies,
builds the app, and publishes `dist` automatically. The expected URL is
https://dwivm163-dot.github.io/greenacre_park/.

The root `index.html` is a development entry point and cannot be served directly
by GitHub Pages because it loads JSX source. Keep `dist` ignored: the workflow
uploads the generated build separately. Relative production asset paths allow
the build to work at the repository URL. For another static host, upload the
contents of `dist` after running `npm run build`.

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

`App.jsx` owns the shared object-position state. `PhysicalMap` handles pointer interaction; both maps render the same normalized positions. Reset Arrangement restores the original placement array, Afternoon time, all visible sensory layers, and the derived default atmosphere profile.

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
