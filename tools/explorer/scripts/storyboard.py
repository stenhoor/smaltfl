# The explorer page's storyboard, from a walk's shots: python3 storyboard.py SCRATCH WALK (e.g. b24; its phone walk WALKm)
import os, sys
from PIL import Image
S = sys.argv[1]; D = f'{S}/shots/{sys.argv[2]}'; M = D + 'm'; out = f'{S}/exppage/shots'
def find(folder, name):
    for f in sorted(os.listdir(folder)):
        if f.endswith('.png') and f[:-4].split('-', 1)[1] == name: return f'{folder}/{f}'
    raise SystemExit(f'missing {name} in {folder}')
DESK = [('s01', 'empty'), ('s02', 'read-cmdb'), ('s03', 'read-cloud'), ('s04', 'gaps-known'), ('s05', 'rules'), ('s06', 'product'), ('s07', 'day-2024-02-16'), ('s08', 'decide-2024-02-16'), ('s09', 'decide-2024-03-05'), ('s10', 'decide-2024-02-27'), ('s11', 'day-2024-03-22'), ('s12', 'end')]
PHONE = [('sp1', 'empty'), ('sp2', 'map-open'), ('sp3', 'rules'), ('sp4', 'day-2024-02-26'), ('sp5', 'decide-2024-02-16'), ('sp6', 'end')]
for k, n in DESK:
    im = Image.open(find(D, n)).convert('RGB')
    im = im.resize((1200, round(1200 * im.height / im.width))) if k in ('s08', 's09', 's10') else im.resize((1200, 750))
    im.save(f'{out}/{k}.jpg', quality=86); print(k, n, im.size)
for k, n in PHONE:
    im = Image.open(find(M, n)).convert('RGB').resize((390, 844)); im.save(f'{out}/{k}.jpg', quality=86); print(k, n, im.size)
