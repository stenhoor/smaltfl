#!/bin/sh
# Copy the live prototype (no backups) to DEST, to make a working fix in:  sh copyapp.sh DEST
set -e
SRC="${SRC:-$(cd "$(dirname "$0")/../../app" && pwd)}"
DEST="$1"; [ -n "$DEST" ] || { echo "usage: copyapp.sh DEST"; exit 2; }
mkdir -p "$DEST"
for f in index.html build.js explore.js build.json model.json big.json; do cp "$SRC/$f" "$DEST/$f"; done
for d in seeds rows hist; do [ -d "$SRC/$d" ] && cp -r "$SRC/$d" "$DEST/"; done
echo "copied the prototype to $DEST"
