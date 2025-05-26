#!/bin/sh

echo "Running migrations..."

# Set the container name as it appears in docker compose ps
BACKEND_CONTAINER=review-ui-backend-1

echo "Using backend container: $BACKEND_CONTAINER"

# Check if container exists
if ! docker ps | grep -q $BACKEND_CONTAINER; then
  echo "Error: Container $BACKEND_CONTAINER not found!"
  echo "Make sure the application is running with docker compose."
  exit 1
fi

# Check environment inside container
echo "Checking environment in container..."
docker exec $BACKEND_CONTAINER sh -c "cd /usr/src/app && ls -la src/migrations/ && ls -la src/config/ && node -v && npx sequelize-cli --version"

# Run the migrations inside the container with debugging enabled
echo "Executing migration in container..."
docker exec $BACKEND_CONTAINER sh -c "cd /usr/src/app && npx ts-node ./node_modules/.bin/sequelize-cli db:migrate"

# Check the result of the migration
if [ $? -eq 0 ]; then
  echo "Migration completed successfully."
else
  echo "Migration failed. Check the logs above for more details."
  exit 1
fi

echo "Done!"
