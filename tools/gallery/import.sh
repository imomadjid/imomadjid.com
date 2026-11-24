#!/usr/bin/env bash
# Imports Gallery photos from the Drive folder into src/assets/gallery/.
#
# Usage: tools/gallery/import.sh DSCF0123.JPG DSCF0456.HIF ...
#
# Each photo becomes <stem>-240.webp, -640.webp and -1600.webp, rotated upright and stripped of
# all metadata (EXIF can carry GPS). photos.json records every imported photo's size for layout.
# Needs rclone with the `mhmmadjid@gmail.com:` remote, ImageMagick with HEIF, and jq.
# GALLERY_SRC=<dir> reads already downloaded originals from <dir> instead of Drive.
set -euo pipefail

remote='mhmmadjid@gmail.com:'
folder='1TDF3sLA1AKQpWCLlGqE9t6TLMQNIliLG'
root="$(cd "$(dirname "$0")/../.." && pwd)"
out="$root/src/assets/gallery"
manifest="$out/photos.json"

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <Drive filename>..." >&2
  exit 1
fi

mkdir -p "$out"
[ -f "$manifest" ] || echo '{}' >"$manifest"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

src_dir="${GALLERY_SRC:-$work/src}"
if [ -z "${GALLERY_SRC:-}" ]; then
  printf '%s\n' "$@" >"$work/files.txt"
  # Report rclone's own error, such as an expired token, rather than a missing file below.
  if ! rclone copy "$remote" "$src_dir" --drive-root-folder-id "$folder" \
    --files-from "$work/files.txt" --transfers 8 2>"$work/rclone.log"; then
    grep -v NOTICE "$work/rclone.log" >&2 || true
    echo "rclone could not download from Drive" >&2
    exit 1
  fi
  grep -v NOTICE "$work/rclone.log" >&2 || true
fi

for file in "$@"; do
  src="$src_dir/$file"
  if [ ! -f "$src" ]; then
    echo "Missing on Drive: $file" >&2
    exit 1
  fi
  stem="$(echo "${file%.*}" | tr '[:upper:]' '[:lower:]')"
  for width in 240 640 1600; do
    magick "$src" -auto-orient -colorspace sRGB -resize "${width}x${width}>" -strip \
      -quality 80 -define webp:method=6 "$out/$stem-$width.webp"
  done
  size="$(magick identify -format '%w %h' "$out/$stem-1600.webp")"
  w="${size% *}"
  h="${size#* }"
  jq --arg k "$stem" --argjson w "$w" --argjson h "$h" '.[$k] = {width: $w, height: $h}' \
    "$manifest" >"$work/manifest.json"
  jq -S . "$work/manifest.json" >"$manifest"
  echo "$stem ${w}x$h"
done
