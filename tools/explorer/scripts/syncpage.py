# The page's copy of the explorer: the same files, with a way back to the page in the bar (a mark alone on a phone).
import os, shutil, sys
S = sys.argv[1]; src = os.path.join(S, 'explore'); dst = os.path.join(S, 'exppage', 'explore')
for f in ['explore.js', 'model.json', 'big.json', 'build.js', 'build.json']: shutil.copyfile(os.path.join(src, f), os.path.join(dst, f))
if not os.path.isdir(os.path.join(dst, 'rows')): shutil.copytree(os.path.join(src, 'rows'), os.path.join(dst, 'rows'))
if os.path.isdir(os.path.join(dst, 'seeds')): shutil.rmtree(os.path.join(dst, 'seeds'))
shutil.copytree(os.path.join(src, 'seeds'), os.path.join(dst, 'seeds'))
ht = open(os.path.join(src, 'index.html')).read()
css = (".backpill { font-size: 12px; font-weight: 500; color: var(--action); background: var(--action-wash); border-radius: 999px; padding: 4px 10px; text-decoration: none; white-space: nowrap; }\n"
       ".backpill:hover { text-decoration: underline; } .backpill .bs { display: none; }\n"
       "@media (max-width: 760px) { .backpill { padding: 4px 9px; } .backpill .bl { display: none; } .backpill .bs { display: inline; } }\n")
anchor = ".est { font-weight: 600; }\n"
assert ht.count(anchor) == 1; ht = ht.replace(anchor, anchor + css)
logo = '<span class="logo">sm<b>alt</b>fl</span>'
assert ht.count(logo) == 1; ht = ht.replace(logo, logo + '<a class="backpill" href="../index.html" aria-label="Back to the page"><span aria-hidden="true">‹</span> <span class="bl">Back to the page</span></a>')
ht = ht.replace('<span class="bs">', '<span class="bs">')
open(os.path.join(dst, 'index.html'), 'w').write(ht)
print('synced', sorted(os.listdir(dst)))
