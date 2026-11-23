# For each daily file and each day its rows are more than 1% off usual: which rows went and which came against the
# same weekday a week before, by the file's key, with a status and a date where the file has them
import csv, json, os, sys
S = sys.argv[1]; L = f'{S}/apps/tour/data/loads'
d = json.load(open(f'{S}/explore/build.json'))
days = [x['day'] if isinstance(x, dict) else x for x in d['days']]
out = {}
for f in d['files']:
    if f.get('every') != 'daily' or not f.get('counts'): continue
    key = f.get('key') or (f.get('key2') or [None])[0]
    if not key: continue
    for i, day in enumerate(days):
        c, u = f['counts'][i], f['usual'][i]
        if c is None or not u or abs(c - u) / u <= 0.01 or i < 7: continue
        a_fn, b_fn = f'{L}/{f["id"]}_{days[i-7]}.csv', f'{L}/{f["id"]}_{day}.csv'
        if not (os.path.exists(a_fn) and os.path.exists(b_fn)): continue
        A = list(csv.DictReader(open(a_fn, newline=''))); Bm = list(csv.DictReader(open(b_fn, newline='')))
        if not A or key not in A[0]: continue
        cols = [x for x in ['status', 'valid_to', 'due_on', 'fixed_on', 'not_after'] if x in A[0]][:2]
        ka = {r[key]: r for r in A}; kb = {r[key]: r for r in Bm}
        gone = [k for k in ka if k not in kb]; new = [k for k in kb if k not in ka]
        if not gone and not new: continue
        stat = {}
        for k in gone: s = ka[k].get('status') or ''; stat[s] = stat.get(s, 0) + 1
        out.setdefault(f['id'], {})[day] = {'base': days[i-7], 'key': key, 'cols': cols, 'gone': len(gone), 'new': len(new), 'goneBy': stat,
            'goneRows': [[k] + [ka[k].get(c, '') for c in cols] for k in gone[:12]], 'newRows': [[k] + [kb[k].get(c, '') for c in cols] for k in new[:12]]}
d['rowdiff'] = out
json.dump(d, open(f'{S}/explore/build.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print({k: len(v) for k, v in out.items()}, os.path.getsize(f'{S}/explore/build.json'))
print(json.dumps(out.get('exceptions', {}).get('2024-03-02'))[:600])
