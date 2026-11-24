#!/usr/bin/env zsh
# Records a motion scene scrolling under the glass in the iOS simulator, then splits the video into
# frames for motion.py. Usage: record.sh <out-dir> <scene> [icon]
#   record.sh shots motion-light        writes <out-dir>/ios/<scene>.mov and <scene>/NNNN.png
# Env: SIM (default "GlassTints"), BUILD=0 skips the build. Run capture.sh once first, or BUILD=1.
set -euo pipefail

cd "${0:A:h}"
out=${1:?out dir}; scene=${2:?scene}; icon=${3:-0}
sim=${SIM:-GlassTints}
app=build/Build/Products/Debug-iphonesimulator/GlassLive.app
bundle=com.imomadjid.dev.GlassLive
read scheme run <<<$(python3 -c "
import json
s=next(s for s in json.load(open('Scenes/scenes.json'))['scenes'] if s['name']=='$scene')
m=s['motion']; print(s['scheme'], m['hold'] + (m['height'] - 874) / m['speed'] + 1)")

if [[ ${BUILD:-1} == 1 ]]; then
  xcodegen generate -q
  xcodebuild -project GlassLive.xcodeproj -scheme GlassLive -derivedDataPath build \
    -destination "platform=iOS Simulator,name=$sim" -quiet build
fi
xcrun simctl boot "$sim" 2>/dev/null || true
xcrun simctl bootstatus "$sim" -b >/dev/null
xcrun simctl install "$sim" "$app"
xcrun simctl ui "$sim" appearance $scheme
mkdir -p "$out/ios/$scene"
movie="$out/ios/$scene.mov"
xcrun simctl terminate "$sim" $bundle 2>/dev/null || true
xcrun simctl io "$sim" recordVideo --codec=h264 --force "$movie" 2>/dev/null &
recorder=$!
sleep 1
xcrun simctl launch "$sim" $bundle -scene "$scene" -icon $icon >/dev/null
sleep $run
kill -INT $recorder
wait $recorder || true
rm -rf "$out/ios/$scene" && mkdir -p "$out/ios/$scene"
ffmpeg -loglevel fatal -i "$movie" -fps_mode passthrough "$out/ios/$scene/%04d.png"
echo "$movie: $(ls "$out/ios/$scene" | wc -l | tr -d ' ') frames"
