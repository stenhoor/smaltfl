# Contact sheets: frames of a video, 3 across, each labelled with its file name and time (5 s apart).
#   sheet.py FRAMES_DIR OUT_PREFIX  -> OUT_PREFIX-1.jpg, -2.jpg ... (9 frames a sheet)
import sys, os
from PIL import Image, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]
files = sorted(f for f in os.listdir(src) if f.endswith('.jpg'))
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
except Exception: font = ImageFont.load_default()
TW, COLS, PAD, LAB = 500, 3, 12, 28
for s in range(0, len(files), 9):
    group = files[s:s + 9]
    tiles = []
    for f in group:
        im = Image.open(os.path.join(src, f)).convert('RGB'); im = im.resize((TW, round(im.height * TW / im.width)), Image.LANCZOS); tiles.append((f, im))
    th = max(t.height for _, t in tiles); rows = (len(tiles) + COLS - 1) // COLS
    sheet = Image.new('RGB', (COLS * TW + (COLS - 1) * PAD, rows * (th + LAB) + (rows - 1) * PAD), 'white'); d = ImageDraw.Draw(sheet)
    for i, (f, t) in enumerate(tiles):
        c, r = i % COLS, i // COLS; X, Y = c * (TW + PAD), r * (th + LAB + PAD)
        n = int(f[1:3]); sec = (n - 1) * 5
        d.text((X + 4, Y + 4), f'{f}  ·  {sec // 60}:{sec % 60:02d}', fill=(190, 0, 50), font=font); sheet.paste(t, (X, Y + LAB))
    p = f'{out}-{s // 9 + 1}.jpg'; sheet.save(p, quality=86); print(p, sheet.size)
