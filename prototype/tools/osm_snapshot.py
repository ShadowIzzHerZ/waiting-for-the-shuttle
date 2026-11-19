# Downloads the LPU campus (outline, buildings, roads, green areas, water, parking) from the public OpenStreetMap API
# and writes map/campus-osm.js, which index.html loads as window.OSM (same shape as Overpass "out geom").
# Run from prototype/: python3 tools/osm_snapshot.py
# Data (c) OpenStreetMap contributors, ODbL.
import json, subprocess

API = "https://api.openstreetmap.org/api/0.6"
BBOX = "75.686,31.236,75.724,31.270"  # campus plus about 1 km, for the faded roads around it
REL = 21599790  # OSM relation for the LPU campus
KEEP = ("building", "highway", "leisure", "landuse", "natural", "amenity")  # a way is kept if it has one of these
TAGS = ("building", "highway", "leisure", "landuse", "natural", "amenity", "sport", "name", "ref", "height", "building:levels")

# Buildings missing from OpenStreetMap, traced by Dushyant Pal for lpu-wayfinder (make-campus-snapshot.mjs). [lng, lat] rings.
EXTRA_BUILDINGS = [
    ("Block 7 (Pharmacy)", [[75.7067341,31.2569429],[75.7071633,31.2569429],[75.7071633,31.2567136],[75.7067341,31.2567136],[75.7067341,31.2569429]]),
    ("Block 6 (Architecture)", [[75.7072437,31.2569246],[75.7076997,31.2569246],[75.7076997,31.2566127],[75.7072437,31.2566127],[75.7072437,31.2569246]]),
    ("Block 8", [[75.7066805,31.2566586],[75.7072437,31.2566586],[75.7072437,31.2564293],[75.7066805,31.2564293],[75.7066805,31.2566586]]),
    ("Courtyard building north-east of block 13", [[75.7059026,31.255214],[75.7064122,31.255214],[75.7064122,31.2548472],[75.7059026,31.2548472],[75.7059026,31.255214]]),
    ("Grey building beside the girls hostels", [[75.705967,31.2570392],[75.7062245,31.2570392],[75.7062245,31.2566357],[75.705967,31.2566357],[75.705967,31.2570392]]),
]

def get(url):  # curl, not urllib: it uses the system's trusted certificates
    return json.loads(subprocess.run(["curl", "-sSf", "-m", "120", "-A", "campus-cart-prototype/1.0", url], capture_output=True, check=True).stdout)

def stitch(segs):  # join open ways that share end points into closed rings
    rings, pool = [], [s[:] for s in segs]
    while pool:
        cur = pool.pop(0)
        while cur[0] != cur[-1]:
            for i, s in enumerate(pool):
                if cur[-1] == s[0]: cur += s[1:]; break
                if cur[-1] == s[-1]: cur += s[-2::-1]; break
            else: break
            pool.pop(i)
        if len(cur) > 3 and cur[0] == cur[-1]: rings.append(cur)
    return rings

m, rel = get(f"{API}/map.json?bbox={BBOX}"), get(f"{API}/relation/{REL}/full.json")
nodes, ways, rels = {}, {}, []
for e in m["elements"] + rel["elements"]:
    if e["type"] == "node": nodes[e["id"]] = e
    elif e["type"] == "way": ways[e["id"]] = e
    elif e["type"] == "relation": rels.append(e)
geom = lambda w: [[round(nodes[i]["lon"], 7), round(nodes[i]["lat"], 7)] for i in w["nodes"] if i in nodes]  # [lng, lat]
pick = lambda t: {k: t[k] for k in TAGS if k in t}

r = next(e for e in rels if e["id"] == REL)
out = [{"type": "relation", "id": REL, "members": [
    {"type": "way", "role": x["role"], "geometry": geom(ways[x["ref"]])} for x in r["members"] if x["type"] == "way" and x["ref"] in ways]}]
for w in ways.values():
    t = w.get("tags") or {}
    if not any(t.get(k) for k in KEEP): continue
    g = geom(w)
    if len(g) == len(w["nodes"]): out.append({"type": "way", "id": w["id"], "tags": pick(t), "geometry": g}); continue
    if not t.get("highway"): continue  # an area cut by the box edge: skip it
    run = []  # a road cut by the box edge: keep each stretch that is inside the box
    for i in w["nodes"] + [None]:
        if i in nodes: run.append([round(nodes[i]["lon"], 7), round(nodes[i]["lat"], 7)]); continue
        if len(run) > 1: out.append({"type": "way", "id": w["id"], "tags": pick(t), "geometry": run})
        run = []
# multipolygon buildings and areas: each outer ring becomes its own closed way (inner courtyards are left filled)
seen = {REL}
for e in rels:
    t = e.get("tags") or {}
    if e["id"] in seen or t.get("type") != "multipolygon" or not any(t.get(k) for k in KEEP): continue
    seen.add(e["id"])
    outer = [geom(ways[x["ref"]]) for x in e["members"] if x["type"] == "way" and x["role"] == "outer" and x["ref"] in ways]
    for i, ring in enumerate(stitch(outer)):
        out.append({"type": "way", "id": -(e["id"] * 10 + i), "tags": pick(t), "geometry": ring})
for i, (note, ring) in enumerate(EXTRA_BUILDINGS):
    out.append({"type": "way", "id": -(i + 1), "tags": {"building": "yes", "note": note}, "geometry": ring})

assert len(out) > 50, "too little data"
assert stitch([[[0, 0], [1, 0]], [[1, 1], [1, 0]], [[1, 1], [0, 0]]]) == [[[0, 0], [1, 0], [1, 1], [0, 0]]]  # self-check
with open("map/campus-osm.js", "w") as f:
    f.write("// (c) OpenStreetMap contributors, ODbL. Made by tools/osm_snapshot.py\nwindow.OSM=" + json.dumps({"elements": out}, separators=(",", ":")) + ";\n")
cnt = lambda k: sum(1 for e in out if (e.get("tags") or {}).get(k))
print(len(out), "elements,", cnt("building"), "buildings,", cnt("highway"), "roads,", cnt("natural"), "natural,", cnt("amenity"), "amenity")
