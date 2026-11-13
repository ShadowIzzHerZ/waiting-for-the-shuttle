# Cart tracker prototype

A single-file web app (`index.html`) that runs in any phone browser. No install and no internet needed: the map, the road network and our timing data are all inside the file.

**It is a simulation.** Cart movement is generated from our stopwatch data. It is not live cart tracking.

## What it does
- Preset ends A (Main Gate) and B (Block 58 end). Carts leave both ends; the time between departures is drawn from our 73 stopwatch gaps.
- 65% of carts leave full. Some empty carts pick up students on the way and turn full (a ring flashes when that happens).
- About 30% of carts take a different path. Carts follow the traced campus roads only and curve round corners.
- Your position (GPS button, or long-press the map) and a destination (tap a road). Empty carts that will pass you and go on to your destination are bright and show a countdown; full carts and carts going the other way or on another path are dimmed.
- A "next empty cart" countdown, the ride time to your destination, and the stretch of road it will drive, drawn as a dotted blue line.
- Drag to pan, pinch to zoom, "Fit map" to see the whole campus again. Speed button: 12x, 36x or 1x real time. Pause button.

## Run it
From this folder: `python3 server.py`, then open `http://localhost:8000`. `server.py` serves the folder and saves drawings; plain `python3 -m http.server` shows the app but cannot save.

On a phone over USB debugging: `adb reverse tcp:8000 tcp:8000`, then open `http://localhost:8000` in Chrome. Chrome's menu has **Install app** (it is a PWA: `manifest.webmanifest`, `sw.js`).

## Android app
`../android` is a WebView wrapper around the same files.
1. Copy `index.html`, `map/` and `drawings/drawing.js` into `../android/app/src/main/assets/`
2. In `../android`: `gradle assembleDebug`
3. `adb install -r app/build/outputs/apk/debug/app-debug.apk`

The APK is debug-signed: fine for sideloading, not for the Play Store.

## Drawing the cart route
Open `http://localhost:8000/draw.html`. Mark A, B and stop 54, draw the paths, press Save. Carts then run A -> 54 -> B and back on the drawn paths only; 54 is a via stop, not an end. Paths join where one ends within 25 map pixels of another. With no drawing, the app uses the built-in road network.

## Files
- `index.html` the app
- `draw.html` the route drawing tool; `server.py` the local server that saves it
- `drawings/drawing.json` the saved route; `drawings/drawing.js` the same data as a script the app loads
- `map/lpu.jpg` the campus map at 1080 x 744, the pixel grid all coordinates use; `map/lpu@3x.jpg` the same map at 3x for the drawing tool (the app embeds this file); `map/net.json` the built-in road network (pixel coordinates), from `tools/net.py`

## Known limits
- Times shown are simulated time. At 12x they count down 12 times faster than a real clock.
- Cart speed (4 m/s) and the A to B road length (1400 m) are estimates, not measured values.
- The GPS anchors in `index.html` (`GPS` constant) are approximate and need measured values. GPS only places you along the main A to B road. Some browsers block GPS for a file opened directly; use the `localhost` steps above if that happens.
- The map is a drawing, not to scale. Three short links (near Block 21, the central plaza, and the Block 2 plaza) cross paved ground where the map does not show a continuous road; they are drawn dashed. Near Block 7 the road runs behind the building in the drawing, so carts pass over its corner for a moment.
- Roads that are dead ends for an A to B trip (Indoor stadium, Gate 2, Block 1) are in `net.json` but carts do not use them.

## Credit
Campus map: "LPU isometric map design" by Takur Akhil Teja Talla, https://www.behance.net/gallery/105159145/LPU-isometric-map-design (all rights reserved by the designer; used here for a student project).
