# Cart tracker prototype

A single-file web app (`index.html`) that runs in any phone browser. No install needed.

## What it does
- Preset paths A (Main Gate) and B (Hostel block); carts leave both ends using gaps from our stopwatch data
- 65% of carts leave full; some empty carts pick up students on the way and turn full
- Some carts take a different path; all carts follow campus roads only
- Your position (GPS or long-press the map) and a tapped destination: carts heading your way along your route are bright, the rest are dimmed
- ETA for each cart and the next empty cart, with the route stretch drawn on the map

## Run it on a phone with USB debugging
1. On the phone: Settings > Developer options > turn on USB debugging. Connect to the computer.
2. On the computer, in this folder: `python3 -m http.server 8000`
3. `adb reverse tcp:8000 tcp:8000`
4. On the phone open Chrome and go to `http://localhost:8000`

Or just open `index.html` directly in a desktop browser.

## Notes
- Cart movement is simulated from our timing data (12x speed). It is not live cart data.
- The GPS anchors in `index.html` (`GPS` constant) are approximate and need real values for accuracy.
- Road network was traced by hand over the LPU map (`map/net.json`).
