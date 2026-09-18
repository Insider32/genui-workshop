#!/bin/sh
# Jump to a workshop checkpoint: discards local edits and generated outputs,
# checks out the tag, and installs its (matching) dependencies.
#   pnpm checkpoint phase-3-start
set -e
if [ -z "$1" ]; then
  echo "usage: pnpm checkpoint <tag>"
  echo "tags:"; git tag --list 'phase-*' | sed 's/^/  /'
  exit 1
fi
git checkout -f "$1"
pnpm install
echo
echo "Now at $1. Guide: docs/$(echo "$1" | sed -E 's/^(phase-[0-9]).*/\1/').md"
