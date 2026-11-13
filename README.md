# Waiting for the Shuttle (P05)

INT335 Design Thinking project, Lovely Professional University.
Team: Kumari Akanksha Jha (Team Lead), Soham Ghosh (Prototype lead), Sakshi (Documentation lead), Rehan (Research and Design lead).

## Problem
Students without vehicles lose a lot of time waiting for campus carts. Carts leave only when full, there are far more students than carts, and nobody can tell when the next one will come.

## Idea
A prediction app that shows cart positions and when one will reach your stop, built from our stopwatch timings, with no new hardware on the carts.

## What we did
- 21 student interviews, 9 observation sessions, 14 timed rides across 3 stops
- Median wait 5:56 and median ride 6:44 (5 rides with full records); gaps of up to 10:49 between carts

## Repository
- `docs/` checkpoint write-ups (CP2 findings, CP3 define, CP4 ideate, observation summary)
- `deck/` project presentation (`.pptx`) and its build script
- `prototype/` the cart-tracker app (`index.html`, open it in a browser or on a phone) with its map data and tools; see `prototype/README.md`

## Prototype
Preset routes A and B; carts move along campus roads (never through buildings); empty carts shown in full colour, full or opposite-direction carts dimmed; tap the map to pick a destination; GPS "where am I"; ETA estimated from collected timing data. Runs on a phone as a web app over USB debugging. ETAs are simulated from our timing data, not live cart data.
