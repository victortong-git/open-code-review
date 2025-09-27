#!/bin/bash
#!/bin/bash
echo "Stopping all docker containers..."
docker stop $(docker ps -q)

echo "Starting NeMo Agent Toolkit service..."
docker compose -f docker-compose_nemo_agent_toolkit.yml up -d nvidia-nat

# Wait for the service to be up and running if necessary, though exec should handle it.
# Consider adding a small sleep or a health check if issues arise.

echo "Setting up custom integrations..."

docker compose exec nvidia-nat bash -c "uv pip install -e my-agents/open_code_review"
docker compose exec nvidia-nat bash -c "nat --version"

echo "Setting up Ollama provider..."
docker compose exec nvidia-nat bash -c "cd ollama_provider && chmod +x setup.sh && ./setup.sh --no-test"

docker compose -f docker-compose_nemo_agent_toolkit.yml down

echo "Update completed."