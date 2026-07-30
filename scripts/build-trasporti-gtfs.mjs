/**
 * Estrae da GTFS Regione Toscana (rt-oraritb) i dati rilevanti per San Vincenzo.
 * Output: public/data/trasporti-gtfs-sv.json
 *
 * Uso: node scripts/build-trasporti-gtfs.mjs
 */
import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public/data/trasporti-gtfs-sv.json");

const LAT = 43.085;
const LON = 10.54;
const BUS_RADIUS_KM = 8;
const TRAIN_RADIUS_KM = 12;

const URLS = {
  autolinee: "https://regionetoscana.smartregion.toscana.it/mobility/artifacts/gtfs",
  trenitalia:
    "https://dati.toscana.it/dataset/8bb8f8fe-fe7d-41d0-90dc-49f2456180d1/resource/4f85393b-357d-443d-8378-65de4198505f/download/trenitalia.gtfs",
};

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const p = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * p) / 2) ** 2 +
    Math.cos(lat1 * p) *
      Math.cos(lat2 * p) *
      Math.sin(((lon2 - lon1) * p) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok || !res.body) throw new Error(`Download failed ${url}: ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

function runPython(zipDir) {
  const script = `
import zipfile, csv, io, math, json, collections
from datetime import datetime, timezone
from pathlib import Path

LAT, LON = ${LAT}, ${LON}
BUS_R, TRAIN_R = ${BUS_RADIUS_KM}, ${TRAIN_RADIUS_KM}
zip_dir = Path(${JSON.stringify(zipDir)})

def haversine(lat1, lon1, lat2, lon2):
  R=6371; p=math.pi/180
  a=math.sin((lat2-lat1)*p/2)**2 + math.cos(lat1*p)*math.cos(lat2*p)*math.sin((lon2-lon1)*p/2)**2
  return 2*R*math.asin(math.sqrt(a))

def open_member(zf, name):
  names={n.lower().split('/')[-1]:n for n in zf.namelist()}
  return io.TextIOWrapper(zf.open(names[name.lower()]), encoding='utf-8-sig', newline='')

def dict_reader(zf, name):
  return csv.DictReader(open_member(zf, name))

with zipfile.ZipFile(zip_dir/'autolinee.zip') as zf:
  stops=[]
  for s in dict_reader(zf,'stops.txt'):
    try:
      lat=float(s['stop_lat']); lon=float(s['stop_lon'])
    except Exception:
      continue
    d=haversine(LAT,LON,lat,lon)
    if d<=BUS_R:
      stops.append({'stop_id': s['stop_id'], 'name': s.get('stop_name'), 'lat': lat, 'lon': lon, 'dist_km': round(d,2), 'code': s.get('stop_code') or None})
  stops.sort(key=lambda x:x['dist_km'])
  stop_ids={s['stop_id'] for s in stops}
  trip_ids=set()
  departures=collections.defaultdict(list)
  with open_member(zf,'stop_times.txt') as f:
    for row in csv.DictReader(f):
      sid=row['stop_id']
      if sid not in stop_ids: continue
      tid=row['trip_id']; trip_ids.add(tid)
      if len(departures[sid]) < 40:
        t=row.get('departure_time') or row.get('arrival_time')
        if t: departures[sid].append({'time': t, 'trip_id': tid})
  route_ids=set(); trip_meta={}
  for t in dict_reader(zf,'trips.txt'):
    if t['trip_id'] in trip_ids:
      route_ids.add(t['route_id'])
      trip_meta[t['trip_id']]={'route_id': t['route_id'], 'headsign': t.get('trip_headsign') or None}
  routes=[]
  for r in dict_reader(zf,'routes.txt'):
    if r['route_id'] in route_ids:
      routes.append({'route_id': r['route_id'], 'short_name': r.get('route_short_name') or '', 'long_name': r.get('route_long_name') or '', 'type': r.get('route_type'), 'color': r.get('route_color') or None})
  routes.sort(key=lambda x: (x['short_name'], x['long_name']))
  stop_out=[]
  for s in stops:
    deps=[]
    for d in departures.get(s['stop_id'], [])[:12]:
      tm=trip_meta.get(d['trip_id'], {})
      rid=tm.get('route_id')
      rn=next((x for x in routes if x['route_id']==rid), None)
      deps.append({'time': d['time'], 'route': (rn or {}).get('short_name') or rid, 'headsign': tm.get('headsign')})
    route_names=sorted({d['route'] for d in deps if d.get('route')})
    stop_out.append({**s, 'routes_sample': route_names, 'departures_sample': deps[:8]})
  bus={'agency':'Autolinee Toscane','source':'https://regionetoscana.smartregion.toscana.it/mobility/artifacts/gtfs','radius_km':BUS_R,'stops':stop_out,'routes':routes,'stats':{'stops':len(stop_out),'routes':len(routes),'trips':len(trip_ids)}}

with zipfile.ZipFile(zip_dir/'trenitalia.zip') as zf:
  stops=[]
  for s in dict_reader(zf,'stops.txt'):
    try:
      lat=float(s['stop_lat']); lon=float(s['stop_lon'])
    except Exception:
      continue
    d=haversine(LAT,LON,lat,lon)
    name=s.get('stop_name') or ''
    if d<=TRAIN_R or 'vincenzo' in name.lower():
      stops.append({'stop_id': s['stop_id'], 'name': name, 'lat': lat, 'lon': lon, 'dist_km': round(d,2)})
  stops.sort(key=lambda x:x['dist_km'])
  target_ids={s['stop_id'] for s in stops if 'vincenzo' in s['name'].lower() or s['dist_km']<=2.5}
  trip_ids=set(); stop_events=[]
  for row in dict_reader(zf,'stop_times.txt'):
    if row['stop_id'] not in target_ids: continue
    trip_ids.add(row['trip_id'])
    arr=row.get('arrival_time') or None
    dep=row.get('departure_time') or None
    stop_events.append({'stop_id': row['stop_id'], 'arrival_time': arr, 'departure_time': dep, 'trip_id': row['trip_id']})
  trip_meta={}; route_ids=set()
  for t in dict_reader(zf,'trips.txt'):
    if t['trip_id'] in trip_ids:
      route_ids.add(t['route_id'])
      trip_meta[t['trip_id']]={
        'route_id': t['route_id'],
        'headsign': t.get('trip_headsign') or None,
        'trip_short_name': t.get('trip_short_name') or None,
        'direction_id': t.get('direction_id') or None,
      }
  routes=[]
  for r in dict_reader(zf,'routes.txt'):
    if r['route_id'] in route_ids:
      routes.append({'route_id': r['route_id'], 'short_name': r.get('route_short_name') or '', 'long_name': r.get('route_long_name') or '', 'type': r.get('route_type')})
  def enrich(ev, time_field, role):
    tm=trip_meta.get(ev['trip_id'], {})
    rid=tm.get('route_id')
    rn=next((x for x in routes if x['route_id']==rid), None)
    t=ev.get(time_field) or ev.get('departure_time') or ev.get('arrival_time')
    if not t: return None
    return {
      'stop_id': ev['stop_id'],
      'time': t,
      'arrival_time': ev.get('arrival_time'),
      'departure_time': ev.get('departure_time'),
      'role': role,
      'route': (rn or {}).get('short_name') or (rn or {}).get('long_name') or rid,
      'headsign': tm.get('headsign'),
      'trip_short_name': tm.get('trip_short_name'),
    }
  deps=[]; arrs=[]
  for ev in stop_events:
    d=enrich(ev,'departure_time','departure')
    a=enrich(ev,'arrival_time','arrival')
    if d: deps.append(d)
    if a: arrs.append(a)
  def sample_rows(rows, limit=60):
    rows=sorted(rows, key=lambda x: x['time'] or '')
    seen=set(); out=[]
    for e in rows:
      k=(e['time'], e.get('headsign'), e.get('route'), e.get('role'))
      if k in seen: continue
      seen.add(k); out.append(e)
      if len(out)>=limit: break
    return out
  dep_sample=sample_rows(deps)
  arr_sample=sample_rows(arrs)
  train={'agency':'Trenitalia','source':'https://dati.toscana.it/dataset/rt-oraritb','stops':stops,'routes':routes,'departures_sample':dep_sample,'arrivals_sample':arr_sample,'stats':{'stops':len(stops),'routes':len(routes),'departures_listed':len(dep_sample),'arrivals_listed':len(arr_sample)}}

out={'generated_at': datetime.now(timezone.utc).isoformat(), 'center':{'lat':LAT,'lon':LON}, 'dataset':'https://dati.toscana.it/dataset/rt-oraritb', 'bus':bus, 'train':train}
print(json.dumps(out, ensure_ascii=False, separators=(',',':')))
`;
  const r = spawnSync("python3", ["-c", script], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) {
    throw new Error(r.stderr || "python extract failed");
  }
  return r.stdout;
}

async function main() {
  const dir = path.join(tmpdir(), `gtfs-sv-${Date.now()}`);
  await mkdir(dir, { recursive: true });
  console.log("Download Autolinee Toscane GTFS…");
  await download(URLS.autolinee, path.join(dir, "autolinee.zip"));
  console.log("Download Trenitalia GTFS…");
  await download(URLS.trenitalia, path.join(dir, "trenitalia.zip"));
  console.log("Estrazione San Vincenzo…");
  const json = runPython(dir);
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, json);
  console.log("Scritto", OUT, `(${Buffer.byteLength(json)} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
