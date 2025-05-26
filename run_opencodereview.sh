#!/bin/bash

docker compose exec aiqtoolkit bash -c "rm -f /workspace/.tmp/logs/*.*"
docker compose exec aiqtoolkit bash -c "aiq run --config_file my-agents/open_code_review/src/open_code_review/configs/config.yml --input 'file_id: 5, review_type: general_review'"
# docker compose exec aiqtoolkit bash -c "aiq run --config_file my-agents/open_code_review/src/open_code_review/configs/config.yml --input 'file_id: 6, review_type: owasp_2021_a01'"
# docker compose exec aiqtoolkit bash -c "aiq run --config_file my-agents/open_code_review/src/open_code_review/configs/config.yml --input 'file_id: 6, review_type: owasp_2021_a02'"
# docker compose exec aiqtoolkit bash -c "aiq run --config_file my-agents/open_code_review/src/open_code_review/configs/config.yml --input 'file_id: 6, review_type: owasp_2021_a03'"
# docker compose exec aiqtoolkit bash -c "aiq run --config_file my-agents/open_code_review/src/open_code_review/configs/config.yml --input 'file_id: 6, review_type: owasp_2021_a04'"
# docker compose exec aiqtoolkit bash -c "aiq run --config_file my-agents/open_code_review/src/open_code_review/configs/config.yml --input 'file_id: 6, review_type: owasp_2021_a05'"
# docker compose exec aiqtoolkit bash -c "aiq run --config_file my-agents/open_code_review/src/open_code_review/configs/config.yml --input 'file_id: 6, review_type: owasp_2021_a06'"
# docker compose exec aiqtoolkit bash -c "aiq run --config_file my-agents/open_code_review/src/open_code_review/configs/config.yml --input 'file_id: 6, review_type: owasp_2021_a07'"
# docker compose exec aiqtoolkit bash -c "aiq run --config_file my-agents/open_code_review/src/open_code_review/configs/config.yml --input 'file_id: 6, review_type: owasp_2021_a08'"
# docker compose exec aiqtoolkit bash -c "aiq run --config_file my-agents/open_code_review/src/open_code_review/configs/config.yml --input 'file_id: 6, review_type: owasp_2021_a09'"
# docker compose exec aiqtoolkit bash -c "aiq run --config_file my-agents/open_code_review/src/open_code_review/configs/config.yml --input 'file_id: 6, review_type: owasp_2021_a10'"
