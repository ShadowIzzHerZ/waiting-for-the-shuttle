# Prompt: new UI for the Campus Cart Tracker

Paste everything below the line into your design tool (Claude, v0, Figma Make, etc.).

---

Design a mobile-first UI (360-430 px wide portrait, Android phone) for a campus golf-cart tracker at Lovely Professional University. Students stand somewhere on campus and want one answer fast: **"when does the next EMPTY cart that goes where I'm going reach me, and how long is the ride?"**

## The data the screen works with
- A hand-drawn isometric campus map image fills the screen, pannable and pinch-zoomable. Carts are drawn on it.
- Route: stop **A** (Main Gate) -> stop **54** (a via stop, not an end point) -> stop **B** (Block 58 end). Carts run both directions.
- Each cart: id, direction, **empty** or **full**, live position on the road, and an ETA to the user.
- The user has a position (GPS "Where am I", or long-press the map) and a destination (tap a road/stop).
- Result card: next empty cart ETA (mm:ss), which cart and its heading, ride time to the destination, and the stretch of road it will drive (dotted line on the map).
- A short list of upcoming carts: name, empty/full chip, ETA.
- Controls: simulation speed (12x / 36x / 1x), pause, fit map, where am I.
- A visible "Simulation, not live tracking" badge.

## Design requirements
- Map is the hero (60-70% of the screen). The ETA card is a bottom sheet that is readable at a glance, with the big countdown number as the biggest element.
- Three cart states must be instantly distinguishable without relying on colour alone: **empty and coming your way** (highlighted, with countdown), **full** (muted, different shape), **other way / other path** (dimmed).
- A and B and 54 are named, always-visible stop markers.
- Thumb-reachable controls at the bottom or right edge; no tiny buttons (min 44 px touch targets).
- Works outdoors in bright sun: high contrast, large type (countdown 48 px+, body 16 px+).
- Respect safe areas (status bar, gesture bar). No text under system bars.
- Palette: deep teal #0F3D3E header/ink, amber #E08A00 / #F2A541 accent, green #12924a for "empty, coming", blue #2563eb for "you". Calm, not a generic dashboard look.
- States to design: first load (map loading), no GPS yet, GPS denied, destination not chosen, no empty cart coming, paused.

## Deliver
1. One screen: default state with a destination chosen.
2. The same screen with no destination chosen and with GPS denied.
3. The cart marker set (empty / full / dimmed) at 24-32 px.
4. Final HTML + CSS (single file, vanilla JS ok) so it can replace `prototype/index.html`. Keep the existing element ids/JS hooks if you are given the current file.
