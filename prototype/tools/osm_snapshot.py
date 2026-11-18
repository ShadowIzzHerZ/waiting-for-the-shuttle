# Downloads the LPU campus (outline, buildings, roads, green areas) from the public OpenStreetMap API
# and writes map/campus-osm.js, which index.html loads as window.OSM (same shape as Overpass "out geom").
# Run from prototype/: python3 tools/osm_snapshot.py
# Data (c) OpenStreetMap contributors, ODbL.
import json, urllib.request

API = "https://api.openstreetmap.org/api/0.6"
BBOX = "75.688,31.238,75.724,31.264"
REL = 21599790  # OSM relation for the LPU campus

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "campus-cart-prototype/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return json.load(r)

m, rel = get(f"{API}/map.json?bbox={BBOX}"), get(f"{API}/relation/{REL}/full.json")
nodes, ways = {}, {}
for e in m["elements"] + rel["elements"]:
    if e["type"] == "node": nodes[e["id"]] = e
    elif e["type"] == "way": ways[e["id"]] = e
geom = lambda w: [[round(nodes[i]["lon"], 7), round(nodes[i]["lat"], 7)] for i in w["nodes"] if i in nodes]  # [lng, lat]

r = next(e for e in rel["elements"] if e["type"] == "relation" and e["id"] == REL)
out = [{"type": "relation", "id": REL, "members": [
    {"type": "way", "role": x["role"], "geometry": geom(ways[x["ref"]])} for x in r["members"] if x["type"] == "way" and x["ref"] in ways]}]
for w in ways.values():
    t = w.get("tags") or {}
    if not (t.get("building") or t.get("highway") or t.get("leisure") or t.get("landuse")): continue
    g = geom(w)
    if len(g) != len(w["nodes"]): continue  # cut by the box edge
    keep = {k: t[k] for k in ("building", "highway", "leisure", "landuse", "name", "ref", "height", "building:levels", "amenity") if k in t}
    out.append({"type": "way", "id": w["id"], "tags": keep, "geometry": g})

assert len(out) > 50, "too little data"
with open("map/campus-osm.js", "w") as f:
    f.write("// (c) OpenStreetMap contributors, ODbL. Made by tools/osm_snapshot.py\nwindow.OSM=" + json.dumps({"elements": out}, separators=(",", ":")) + ";\n")
print(len(out), "elements,", sum(1 for e in out if e.get("tags", {}).get("building")), "buildings,", sum(1 for e in out if e.get("tags", {}).get("highway")), "roads")
