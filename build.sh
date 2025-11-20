#!/bin/bash
set -e

# Install dependencies
bun install --frozen-lockfile || bun install

# Build
bun run build

echo "Deployment successful!"
