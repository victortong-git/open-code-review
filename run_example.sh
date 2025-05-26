#docker compose exec aiqtoolkit bash -c 'aiq run --config_file=examples/agents/mixture_of_agents/configs/config.yml --input "who was Djikstra?"'
#docker compose exec aiqtoolkit bash -c 'aiq run --config_file=examples/agents/mixture_of_agents/configs/config.yml --input "Tell me UK Key Stage 2 Curriculum for Maths in detail"'


docker compose exec aiqtoolkit bash -c 'aiq run --config_file examples/email_phishing_analyzer/configs/config.yml --input "Dear [Customer], Thank you for your purchase on [Date]. We have processed a refund of $[Amount] to your account. Please provide your account and routing numbers so we can complete the transaction. Thank you, [Your Company]"'