#!/usr/bin/env bash
# Build the frontend and sync it into cmd/server/static so the Go server
# embeds the current UI. Run from the repo root.
set -euo pipefail

cd frontend
npm run build
cd ..

echo "Syncing frontend/dist -> cmd/server/static"
rm -rf cmd/server/static/*
cp -r frontend/dist/* cmd/server/static/

echo "Done. Rebuild the server binary to embed the new UI:"
echo "  go build -o bin/arena-server ./cmd/server"
