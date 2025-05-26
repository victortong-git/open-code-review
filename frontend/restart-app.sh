#!/bin/bash
# filepath: /docker/review-ui/frontend/restart-app.sh

# Copy static files
echo "Copying static files..."
./scripts/copy-static-files.sh

# Restart the application
echo "Restarting the application..."
npm run dev
