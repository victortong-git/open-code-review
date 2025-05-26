#!/bin/bash
# Copy static markdown files to public directory
# filepath: /docker/review-ui/frontend/scripts/copy-static-files.sh

# Create directories if they don't exist
mkdir -p ./public/static

# Copy static markdown files
cp ./src/pages/static/*.md ./public/static/

echo "Static files copied successfully."
