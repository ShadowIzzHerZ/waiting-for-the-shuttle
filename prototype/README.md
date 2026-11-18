# Cart tracker prototype

A web app (`index.html` + `app.js`) that runs in any phone browser. No install and no internet needed: the 3D campus map (`map/campus-osm.js`), the map library (`vendor/`) and our timing data are all local files.

The 3D map is ported from [lpu-wayfinder](https://github.com/dushyantpal38-ui/lpu-wayfinder) by Dushyant Pal, used with permission: OpenStreetMap buildings extruded in MapLibre, with carts running on the real campus roads.

**It is a simulation.** Cart movement is generated from our stopwatch data. It is not live cart tracking.

## What it does
- Preset ends A (Main Gate) and B (Block 58 end). Carts leave both ends; the time between departures is drawn from our 73 stopwatch gaps.
- 65% of carts leave full. Some empty carts pick up students on the way and turn full (a ring flashes when that happens).
- About 30% of carts take a different path. Carts follow the traced campus roads only and curve round corners.
- Your position (GPS button, or long-press the map) and a destination (tap a road). Empty carts that will pass you and go on to your destination are bright and show a countdown; full carts and carts going the other way or on another path are dimmed.
- A "next empty cart" countdown, the ride time to your destination, and the stretch of road it will drive, drawn as a dotted blue line.
- Drag to pan, pinch to zoom, two-finger twist to rotate, two-finger drag to tilt (desktop: right-drag). "Fit map" to see the whole campus again. 2D/3D button flattens or raises the buildings. Speed button: 12x, 36x or 1x real time. Pause button.

## Run it
From this folder: `python3 server.py`, then open `http://localhost:8000`. `server.py` serves the folder and saves drawings; plain `python3 -m http.server` shows the app but cannot save.

On a phone over USB debugging: `adb reverse tcp:8000 tcp:8000`, then open `http://localhost:8000` in Chrome. Chrome's menu has **Install app** (it is a PWA: `manifest.webmanifest`, `sw.js`).

## Android app
`../android` is a WebView wrapper around the same files.
1. Copy `index.html`, `app.js`, `map/campus-osm.js` and `vendor/` into `../android/app/src/main/assets/` (same folder layout)
2. In `../android`: `gradle assembleDebug`
3. `adb install -r app/build/outputs/apk/debug/app-debug.apk`

The APK is debug-signed: fine for sideloading, not for the Play Store.

## Stops and the map data
Stops are `STOPS` in `app.js` as `[longitude, latitude]`; each snaps to the nearest cart road. A and B are approximate, and stop 54 is not placed yet (`V:null`, carts then run A to B directly). Set 54 to its real spot to make it a via stop.

Carts use OpenStreetMap roads of the types in `CART_ROADS`; dead ends are dropped. To refresh the map data: `python3 tools/osm_snapshot.py` (writes `map/campus-osm.js`).

`draw.html`, `drawings/`, `map/lpu*.jpg`, `map/net.json` and `tools/net.py`/`roads3.py` belong to the old isometric map and are no longer used by the app.

## Files
- `index.html` the app
- `draw.html` the route drawing tool; `server.py` the local server that saves it
- `drawings/drawing.json` the saved route; `drawings/drawing.js` the same data as a script the app loads
- `map/lpu.jpg` the campus map at 1080 x 744, the pixel grid all coordinates use; `map/lpu@3x.jpg` the same map at 3x for the drawing tool (the app embeds this file); `map/net.json` the built-in road network (pixel coordinates), from `tools/net.py`

## Known limits
- Times shown are simulated time. At 12x they count down 12 times faster than a real clock.
- Cart speed is 10 to 15 km/h (each cart picks one in that range). Distances are real (from OpenStreetMap).
- The stop positions in `STOPS` are approximate. GPS places you on the nearest cart road. Some browsers block GPS for a file opened directly; use the `localhost` steps above if that happens.
- OpenStreetMap may miss some campus roads or buildings, and carts may use any road on a loop between A and B.
- Carts are drawn on the ground, so in 3D a tall building does not hide a cart behind it.

## Credit
3D campus map: ported from [lpu-wayfinder](https://github.com/dushyantpal38-ui/lpu-wayfinder) by Dushyant Pal, with permission.
Map data: © OpenStreetMap contributors, ODbL. Map library: MapLibre GL JS 4.7.1, BSD-3-Clause.
Campus map: "LPU isometric map design" by Takur Akhil Teja Talla, https://www.behance.net/gallery/105159145/LPU-isometric-map-design (all rights reserved by the designer; used here for a student project).
