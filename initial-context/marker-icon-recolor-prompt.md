This is a Vite + React + TypeScript app (Bicing bike-station map) using the Google Maps JS API (`google.maps.Marker`, not Leaflet). Marker icons live at `src/assets/icons/markers/` as 20 separate SVG files named `{bikes|docks}-{big|small}-{orange|red|green|black|gray}.svg`, plus 3 unrelated `bookmark-*.svg` files (leave those alone).

**Current wiring** (read these first):
- `src/components/Icons/ResourceIcons.ts` — imports all 20 files via Vite's `?url` suffix (`vite-svg-loader` plugin, already configured in `vite.config.ts`) into a nested lookup object `icons[resourceType][size][color]`.
- `src/components/Icons/Icons.helpers.ts` — `getStationMarkerIcon(station, resourceShown, bikeTypeFilter, mapZoom)` computes `size` (`'big'|'small'` from a zoom threshold) and `color` (one of 5, from bike/dock count thresholds + station status) and returns `icons[resourceShown][size][color]`, a URL string.
- `src/components/MapCanvas/MapCanvas.tsx` — calls `getStationMarkerIcon(...)` and passes the returned string straight into `new google.maps.Marker({ icon: markerIcon, ... })` / `marker.setIcon(markerIcon)`. This file should NOT need to change — it just consumes a URL string.

**What I found on inspecting the SVGs:** within each shape+size family (e.g. `bikes-big-*`), the 4 non-gray colors are byte-identical path geometry — only two fill colors differ: the main circle fill (`orange=#FF9900`, `red=#DD0033`, `green=#AACC22`, `black=#222222`) and a constant ring/pointer fill (`#404040`) shared by all four. The `gray` variant is a genuine "empty/zero" state, not just another color: at "big" size it adds one or more extra `<line>` strike elements (`bikes-big-gray` has one long diagonal line; `docks-big-gray` has two shorter line segments in opposite corners) and changes the ring/pointer fill to `#808080` (main fill `#BBBBBB`). At "small" size, gray has NO extra line — it's already a pure fill swap identical in structure to the other 4 colors.

**Task: replace the 20 static SVG files with 4 recolorable templates, rendered at runtime.**

1. Create 4 template SVGs (delete the 16 solid-color originals afterward, keep nothing named `*-gray.svg` as a separate file anymore):
   - `bikes-big.svg`, `bikes-small.svg`, `docks-big.svg`, `docks-small.svg`
   - Base each on one existing color variant of that shape+size, then replace the main circle's fill with `{{MAIN}}` and the ring/pointer's fill (and the polygon's `stroke` attribute, add one if not present) with `{{RING}}`.
   - For the `*-big.svg` templates only, add the line element(s) from the corresponding `*-big-gray.svg` file, with `stroke="{{LINE}}"` (copy exact coordinates/count from the gray source: 1 line for bikes, 2 for docks). Do NOT add line elements to the `*-small.svg` templates — they never had them.

2. Rewrite `ResourceIcons.ts` to:
   - Import the 4 templates via `?raw` (see `src/components/Icons/CustomSvgIcon.tsx` for the existing `?raw` import pattern used elsewhere in this codebase).
   - Define a palette table: `{ orange: {main:'#FF9900', ring:'#404040', line:'none'}, red: {main:'#DD0033', ring:'#404040', line:'none'}, green: {main:'#AACC22', ring:'#404040', line:'none'}, black: {main:'#222222', ring:'#404040', line:'none'}, gray: {main:'#BBBBBB', ring:'#808080', line:'#808080'} }`.
   - Export a function, e.g. `getMarkerIconUrl(resourceType, size, color)`, that does `.replace(/{{MAIN}}/g, ...)`, `.replace(/{{RING}}/g, ...)`, `.replace(/{{LINE}}/g, ...)` (the small templates simply won't contain `{{LINE}}`, so that replace is a no-op there) on the right template, wraps the result as `` `data:image/svg+xml,${encodeURIComponent(svg)}` ``, and **caches the result in a `Map` keyed by `${resourceType}-${size}-${color}`** so the string-build/encode work happens once per combination (max 20 entries) rather than once per marker per render — this matters because ~500 station markers call this on every zoom/filter/station-data update.

3. Update `Icons.helpers.ts`'s `getStationMarkerIcon` to call `getMarkerIconUrl(resourceShown, size, color)` instead of the old object lookup. Its return type stays `string`, so `MapCanvas.tsx` needs no changes.

4. Verify visually: run the dev server, load the map, and confirm bikes and docks markers render correctly at both zoom levels (small/big threshold) for all 5 states — orange/red/green/black/gray — including that the gray "empty" markers still show their strike line and darker ring, matching the current production look pixel-for-pixel. Also check the map at the zoom-threshold boundary to make sure size switching still works.
