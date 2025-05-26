mkdir -p ./aiqtoolkit/.tmp/logs
rm -f ./aiqtoolkit/.tmp/logs/*
cp ./Dockerfile-aiqtoolkit ./aiqtoolkit/.tmp/Dockerfile
cp env-aiqtoolkit-ui ./aiqtoolkit/external/aiqtoolkit-opensource-ui/.env
docker compose down
docker compose up --build -d
docker compose exec aiqtoolkit bash -c "aiq --version"
docker compose exec aiqtoolkit bash -c "echo \$NVIDIA_API_KEY"
docker compose exec aiqtoolkit bash -c "echo \$OPENAI_API_KEY"