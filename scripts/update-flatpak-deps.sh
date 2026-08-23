#!/bin/bash
set -e

echo "Flattening package-lock.json..."
python3 scripts/flatten-lockfile.py > flatpak/package-lock.flatpak.json

echo "Running flatpak-node-generator..."
flatpak-node-generator npm flatpak/package-lock.flatpak.json -o flatpak/node-modules.json

echo "Done! The flatpak dependencies have been successfully updated."
