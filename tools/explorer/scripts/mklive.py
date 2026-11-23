# The replay's days (Feb 1 to the last day of the build's days) for each daily file, from the tour's own files: rows,
# blanks by column, coded columns' counts by value. Added to each file's history, and the whole embedded in build.json
import csv, json, os, sys
S = sys.argv[1]; L = f'{S}/apps/tour/data/loads'; HD = f'{S}/explore/hist'
d = json.load(open(f'{S}/explore/build.json'))
days = [x['day'] if isinstance(x, dict) else x for x in d['days']]
allh = {}
for f in d['files']:
    p = f'{HD}/{f["id"]}.json'
    if not os.path.exists(p): continue
    h = json.load(open(p)); coded = set(h['vals'].keys())
    rows, blank, vals = [], {}, {}
    for k, day in enumerate(days):
        fn = f'{L}/{f["id"]}_{day}.csv'
        if not os.path.exists(fn): rows.append(None); continue
        with open(fn, newline='') as fh:
            r = list(csv.DictReader(fh))
        rows.append(len(r))
        cols = r[0].keys() if r else []
        for c in cols:
            b = sum(1 for x in r if (x.get(c) or '').strip() == '')
            if b: blank.setdefault(c, [0] * len(days))[k] = b
            if c in coded:
                cnt = {}
                for x in r:
                    v = (x.get(c) or '').strip()
                    if v == '': continue
                    cnt[v] = cnt.get(v, 0) + 1
                vc = vals.setdefault(c, {})
                for v, n in cnt.items(): vc.setdefault(v, [0] * len(days))[k] = n
    live = {'from': days[0], 'days': len(days), 'rows': rows, 'blank': blank, 'vals': {c: {'v': list(vc.keys()), 'c': list(vc.values())} for c, vc in vals.items()}}
    h['live'] = live
    json.dump(h, open(p, 'w'), separators=(',', ':'))
    allh[f['id']] = h
    print(f['id'], 'live days', sum(1 for x in rows if x is not None), 'blank cols', list(blank.keys())[:5])
d['hist'] = allh
json.dump(d, open(f'{S}/explore/build.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('build.json', os.path.getsize(f'{S}/explore/build.json'))
