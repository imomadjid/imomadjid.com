#!/usr/bin/env zsh
# Lossless 3x captures of the live-glass scenes in the iOS simulator.
# Usage: capture.sh <out-dir> [scene ...]   (default: every scene in Scenes/scenes.json)
#   capture.sh shots gallery-light grid-light
# Writes <out-dir>/ref/<scene>.png with the close icon and <scene>-bare.png without it.
# Env: SIM names the simulator (default "GlassTints", an iPhone 16 Pro); BUILD=0 skips the build.
set -euo pipefail

cd "${0:A:h}"
out=${1:?out dir}; shift
scenes=(${@:-$(python3 -c "import json;print(' '.join(s['name'] for s in json.load(open('Scenes/scenes.json'))['scenes']))")})
sim=${SIM:-GlassTints}
app=build/Build/Products/Debug-iphonesimulator/GlassLive.app
bundle=com.imomadjid.dev.GlassLive

if [[ ${BUILD:-1} == 1 ]]; then
  xcodegen generate -q
  xcodebuild -project GlassLive.xcodeproj -scheme GlassLive -derivedDataPath build \
    -destination "platform=iOS Simulator,name=$sim" -quiet build
fi

xcrun simctl boot "$sim" 2>/dev/null || true
xcrun simctl bootstatus "$sim" -b >/dev/null
xcrun simctl install "$sim" "$app"
mkdir -p "$out/ref"
for scene in $scenes; do
  scheme=$(python3 -c "import json;print(next(s['scheme'] for s in json.load(open('Scenes/scenes.json'))['scenes'] if s['name']=='$scene'))")
  xcrun simctl ui "$sim" appearance $scheme
  for icon in 1 0; do
    xcrun simctl terminate "$sim" $bundle 2>/dev/null || true
    xcrun simctl launch "$sim" $bundle -scene "$scene" -icon $icon >/dev/null
    # Glass settles after its appear animation.
    sleep 2.5
    suffix=; [[ $icon == 0 ]] && suffix=-bare
    file="$out/ref/$scene$suffix.png"
    xcrun simctl io "$sim" screenshot --type=png "$file" >/dev/null 2>&1
    echo "$file"
  done
done
