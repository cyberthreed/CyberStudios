#!/usr/bin/env bash
# Keep the little experiments organized.
set -euo pipefail
studio="CyberStudios"
for project in "Byte" "Cy"; do
  printf '%s welcomes %s\n' "$studio" "$project"
done
