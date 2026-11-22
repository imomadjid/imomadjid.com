#!/usr/bin/env zsh
# 3x headless Chrome capture of /dev/glass from the running dev server (bun run dev).
# Usage: shoot.sh <work-dir>   writes <work-dir>/web/shot.png
# Chrome never exits while the dev server holds HMR open, so it is killed after 30s.
set -uo pipefail
dir=${1:?work dir}; mkdir -p "$dir/web"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --hide-scrollbars --force-device-scale-factor=3 --window-size=1900,4200 --timeout=8000 \
  --user-data-dir="$dir/web/chrome-profile" --screenshot="$dir/web/shot.png" \
  "${URL:-http://localhost:3000/dev/glass}" >/dev/null 2>&1 &
chrome=$!
( sleep 30; kill $chrome 2>/dev/null ) &
wait $chrome 2>/dev/null
echo "$dir/web/shot.png"
