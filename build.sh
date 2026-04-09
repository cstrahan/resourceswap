#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC="$SCRIPT_DIR/src"
DIST="$SCRIPT_DIR/dist"

# Clean
rm -rf "$DIST/chrome" "$DIST/firefox"

# Build Chrome version
mkdir -p "$DIST/chrome/icons"
cp "$SRC/background.js" "$SRC/scripts.js" "$SRC/index.html" "$SRC/style.css" "$DIST/chrome/"
cp "$SRC/icons/"*.png "$DIST/chrome/icons/"
cp "$SRC/manifest.chrome.json" "$DIST/chrome/manifest.json"

# Build Firefox version
mkdir -p "$DIST/firefox/icons"
cp "$SRC/background.js" "$SRC/scripts.js" "$SRC/index.html" "$SRC/style.css" "$DIST/firefox/"
cp "$SRC/icons/"*.png "$DIST/firefox/icons/"
cp "$SRC/manifest.firefox.json" "$DIST/firefox/manifest.json"

echo "Build complete:"
echo "  Chrome → $DIST/chrome/"
echo "  Firefox → $DIST/firefox/"
