#!/bin/sh
# Your working fix as a patch against the live prototype:  sh patch.sh APP_DIR > patch.diff
SRC="${SRC:-$(cd "$(dirname "$0")/../../app" && pwd)}"
APP="$1"; [ -n "$APP" ] || { echo "usage: patch.sh APP_DIR"; exit 2; }
for f in index.html build.js explore.js build.json model.json; do diff -u --label "explore/$f" --label "app/$f" "$SRC/$f" "$APP/$f"; done
exit 0
