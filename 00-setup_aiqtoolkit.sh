#!/bin/bash
#!/bin/bash
echo "Stopping all docker containers..."
docker stop $(docker ps -q)

echo "create aiqtoolkit directories..."
git clone https://github.com/NVIDIA/AIQToolkit.git aiqtoolkit
cd aiqtoolkit
git submodule update --init --recursive
cd ..

echo "Starting aiqtoolkit service..."
docker compose -f docker-compose_aiqtoolkit.yml up -d aiqtoolkit

# Wait for the service to be up and running if necessary, though exec should handle it.
# Consider adding a small sleep or a health check if issues arise.

echo "Updating aiqtoolkit..."

docker compose -f docker-compose_aiqtoolkit.yml exec aiqtoolkit bash -c "uv venv --python 3.12 /workspace/.venv"
docker compose -f docker-compose_aiqtoolkit.yml exec aiqtoolkit bash -c "git lfs install && git lfs fetch && git lfs pull"
docker compose -f docker-compose_aiqtoolkit.yml exec aiqtoolkit bash -c "uv sync --all-groups --all-extras"

docker compose exec aiqtoolkit bash -c "uv pip install -e my-agents/open_code_review"
docker compose exec aiqtoolkit bash -c "aiq --version"

docker compose -f docker-compose_aiqtoolkit.yml down

echo "Update completed."
