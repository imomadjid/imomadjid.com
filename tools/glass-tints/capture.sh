#!/usr/bin/env zsh
# Lossless 3x captures of the tint fixture in the iOS simulator.
# Usage: capture.sh <out-dir> <tints> <alpha> <backdrop> [effect|prominent]
#   capture.sh shots red-500,blue-600 0.5 grey effect
# Env: SIM names the simulator (default "GlassTints"); BUILD=0 skips the build.
set -euo pipefail

cd "${0:A:h}"
out=${1:?out dir}; tints=${2:?tints}; alpha=${3:?alpha}; backdrop=${4:?backdrop}
style=${5:-effect}
sim=${SIM:-GlassTints}
app=build/Build/Products/Debug-iphonesimulator/GlassTints.app
bundle=com.imomadjid.dev.GlassTints

if [[ ${BUILD:-1} == 1 ]]; then
  [[ -d GlassTints.xcodeproj ]] || xcodegen generate -q
  xcodebuild -project GlassTints.xcodeproj -scheme GlassTints -derivedDataPath build \
    -destination "platform=iOS Simulator,name=$sim" -quiet build
fi

xcrun simctl bootstatus "$sim" -b >/dev/null
case $backdrop in dark | black) scheme=dark ;; *) scheme=light ;; esac
xcrun simctl ui "$sim" appearance $scheme
xcrun simctl install "$sim" "$app"
xcrun simctl terminate "$sim" $bundle 2>/dev/null || true
xcrun simctl launch "$sim" $bundle -capture "$tints" -alpha "$alpha" -backdrop "$backdrop" \
  -style "$style" >/dev/null
# Glass settles after its appear animation.
sleep 2

mkdir -p "$out"
file="$out/${style}-${backdrop}-${alpha}-${tints//,/_}.png"
xcrun simctl io "$sim" screenshot --type=png "$file" >/dev/null 2>&1
echo "$file"
