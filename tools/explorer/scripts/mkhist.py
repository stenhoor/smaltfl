# Each daily file's 184 days of history, compact, for trying a rule on them: rows a day, blanks by column (only columns
# blank on some day), coded columns' counts by value, and a key's repeats a day
import json, os, sys
S = sys.argv[1]; H = f'{S}/apps/tour/data'; out = f'{S}/explore/hist'; os.makedirs(out, exist_ok=True)
d = json.load(open(f'{S}/explore/build.json'))
tot = 0
for f in d['files']:
    p = f'{H}/history.{f["id"]}.json'
    if f.get('every') != 'daily' or not os.path.exists(p): continue
    h = json.load(open(p)); rows = h['rows']; cols = h['columns']; pres = h.get('present') or []; n = len(rows)
    blank = {}
    for j, c in enumerate(cols):
        b = [(rows[i] - pres[i][j]) if (i < len(pres) and pres[i] and pres[i][j] is not None and rows[i] is not None) else 0 for i in range(n)]
        if any(b): blank[c] = b
    vals = {}
    for c, x in (h.get('values') or {}).items():
        if len(x['values']) > 24: continue
        v = [json.loads(s) if s != 'null' else None for s in x['values']]
        if 'counts' in x:
            cnt = [[(x['counts'][i][k] if x['counts'][i] and k < len(x['counts'][i]) else 0) for i in range(n)] for k in range(len(v))]
            vals[c] = {'v': v, 'c': cnt}
        else:
            vals[c] = {'v': v, 'first': x['first'], 'last': x['last'], 'n': x['days']}
    rec = (h.get('gate') or {}).get('reconcile') or []
    dup = [((r.get('rows') or 0) - (r.get('keys') or 0)) if r else 0 for r in rec] if rec else None
    o = {'from': h['days'][0], 'days': n, 'rows': rows, 'blank': blank, 'vals': vals, **({'dup': dup} if dup else {})}
    s = json.dumps(o, separators=(',', ':')); open(f'{out}/{f["id"]}.json', 'w').write(s); tot += len(s)
    print(f['id'], len(s))
print('total', tot)
