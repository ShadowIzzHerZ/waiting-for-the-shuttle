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

## Run it on a phone with USB debugging
1. On the phone: Settings > Developer options > turn on USB debugging. Connect to the computer.
2. On the computer, in this folder: `python3 -m http.server 8000`
3. `adb reverse tcp:8000 tcp:8000`
4. On the phone open Chrome and go to `http://localhost:8000`

Or just open `index.html` directly in a desktop browser, or copy the file to the phone and open it there.

## Files
- `index.html` the app
- `map/lpu.jpg` the campus map; `map/net.json` the road network traced by hand over it (pixel coordinates)
- `map/net_check.jpg` the network drawn over the map, for checking it by eye
- `tools/net.py` the network source: edit the points there, run `python3 tools/net.py` from this folder, then paste the new `map/net.json` into `DATA.net` in `index.html`

## Known limits
- Times shown are simulated time. At 12x they count down 12 times faster than a real clock.
- Cart speed (4 m/s) and the A to B road length (1400 m) are estimates, not measured values.
- The GPS anchors in `index.html` (`GPS` constant) are approximate and need measured values. GPS only places you along the main A to B road. Some browsers block GPS for a file opened directly; use the `localhost` steps above if that happens.
- The map is a drawing, not to scale. Three short links (near Block 21, the central plaza, and the Block 2 plaza) cross paved ground where the map does not show a continuous road; they are drawn dashed. Near Block 7 the road runs behind the building in the drawing, so carts pass over its corner for a moment.
- Roads that are dead ends for an A to B trip (Indoor stadium, Gate 2, Block 1) are in `net.json` but carts do not use them.
