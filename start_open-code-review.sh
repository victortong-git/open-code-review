mkdir -p ./logs
rm -f ./logs/*
docker compose down
docker compose up --build -d
docker compose exec nvidia-nat bash -c "nat --version"
docker compose exec nvidia-nat bash -c "echo \$NVIDIA_API_KEY"
docker compose exec nvidia-nat bash -c "echo \$OPENAI_API_KEY"
docker compose exec nvidia-nat bash -c "echo \$OLLAMA_URL"