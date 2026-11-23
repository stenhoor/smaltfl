# Text, headings, links, fonts and colours of a saved web page (treated as data).
import sys, re, html, collections
s = open(sys.argv[1], encoding='utf-8', errors='replace').read()
t = re.search(r'<title[^>]*>(.*?)</title>', s, re.S); print('TITLE:', html.unescape(t.group(1).strip()) if t else '')
for m in re.finditer(r'<meta[^>]+(?:name|property)="(description|og:description|og:title)"[^>]+content="([^"]*)"', s): print('META', m.group(1), ':', html.unescape(m.group(2)))
body = re.sub(r'<(script|style|svg|noscript)[^>]*>.*?</\1>', ' ', s, flags=re.S)
heads = [html.unescape(re.sub(r'<[^>]+>', ' ', m.group(2))).split() for m in re.finditer(r'<(h[1-4])[^>]*>(.*?)</\1>', body, re.S)]
print('HEADINGS:'); [print('  -', ' '.join(h)) for h in heads if h][:80]
txt = html.unescape(re.sub(r'<[^>]+>', '\n', body)); lines = [re.sub(r'\s+', ' ', l).strip() for l in txt.split('\n')]
lines = [l for l in lines if len(l) > 2]
seen = set(); out = []
for l in lines:
    if l not in seen: seen.add(l); out.append(l)
print('TEXT (first 260 unique lines):'); print('\n'.join(out[:260]))
fonts = collections.Counter(re.findall(r'font-family:\s*([^;}"]+)', s)); print('FONTS:', fonts.most_common(8))
cols = collections.Counter(c.lower() for c in re.findall(r'#[0-9a-fA-F]{6}\b', s)); print('COLOURS:', cols.most_common(16))
links = sorted(set(re.findall(r'href="(https?://[^"]+|/[^"#]*)"', s))); print('LINKS:', [l for l in links if 'memorisely' in l or l.startswith('/')][:80])
