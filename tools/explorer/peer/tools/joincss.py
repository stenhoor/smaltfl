# Resolve merge conflicts where both sides only append "/* peer:X start */ ... /* peer:X end */" CSS blocks: keep both,
# ours first. Any other conflict is left in place and reported.  joincss.py FILE
import re, sys
p = sys.argv[1]; s = open(p).read()
pat = re.compile(r'<<<<<<< [^\n]*\n(.*?)=======\n(.*?)>>>>>>> [^\n]*\n', re.S)
left = 0
def fix(m):
    global left
    a, b = m.group(1), m.group(2)
    if '/* peer:' in a and '/* peer:' in b and a.strip().endswith('end */') and b.strip().endswith('end */'):
        return a + b
    left += 1
    return m.group(0)
s2 = pat.sub(fix, s); open(p, 'w').write(s2)
print(p, 'resolved' if not left else f'{left} conflict(s) left for hand merging')
