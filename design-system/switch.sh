#!/bin/bash
# Usage: bash design-system/switch.sh a|b
# Copies the chosen design system into design-system/active/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$1" = "a" ]; then
  rm -rf "$SCRIPT_DIR/active"
  cp -r "$SCRIPT_DIR/system-a" "$SCRIPT_DIR/active"
  echo "✅ Switched to System A (Fredoka/Urbanist/Syne — Cyber Editorial)"
elif [ "$1" = "b" ]; then
  rm -rf "$SCRIPT_DIR/active"
  cp -r "$SCRIPT_DIR/system-b" "$SCRIPT_DIR/active"
  echo "✅ Switched to System B (Baloo 2/Newsreader serif — Refined Minimalism)"
else
  echo "Usage: bash design-system/switch.sh a|b"
  echo ""
  echo "  a — System A: Fredoka · Urbanist · Syne · Cyber Editorial"
  echo "  b — System B: Baloo 2 · Fredoka · Plus Jakarta Sans · Newsreader"
  exit 1
fi
