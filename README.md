# OpenCodeReview - Technical Documentation

## Architecture Overview

The OpenCodeReview application utilizes a modern, containerized architecture with separate components for frontend, backend, AI processing, and data storage.

## Technology Stack

- **Frontend**: React.js - Provides the interactive user interface
- **Backend**: Node.js with Express - Handles API requests and business logic
- **Database**: PostgreSQL with PG Vector support - Stores application data with vector capabilities
- **AIQ Toolkit**: Nvidia AIQ Toolkit - Powers code analysis and review features
- **AIQ Toolkit-UI**: Nvidia AIQ Toolkit UI - Provides visualization for AI operations
- **Deployment**: Docker - Ensures consistent environment across deployments

## System Architecture

```
All components run in isolated Docker containers for maintainability and scalability.

+-------------+         +-------------+         +-----------------+
|  Frontend   |<------->|  Backend    |<------->|  AIQ Toolkit    |
|  (React)    |  HTTP/  | (Node.js/   |  HTTP/  | (Python FastAPI)|
|             |  WS     | Express)    |  WS     |                 |
+-------------+         +-------------+         +-----------------+
                              |
                              v
                        +-------------+
                        |  Database   |
                        | (PostgreSQL)|
                        |             |
                        +-------------+
```

### Network Configuration
- **Backend API & WebSockets**: Port 8001
- **AIQ Toolkit API & WebSockets**: Port 8000
- **Frontend**: Port 5174

## Project Structure

```
.
├── aiqtoolkit/                      # Nvidia AIQ Toolkit
│   └── my-agents/
│       └── code-reviewer/           # Custom agent for Open Code Review
├── aiqtoolkit-ui/                   # Nvidia AIQ Toolkit UI
├── frontend/                        # React.js frontend
├── backend/                         # Node.js backend
├── projects/                        # Project folder for user uploads
├── pgsql_data/                      # PostgreSQL data folder
├── docker-compose.yml               # Docker configuration
├── README.md                        # Project documentation
├── restart.sh                       # Deployment script
├── run_aiq_hello_world.sh          # Testing utility
├── run_code_review_test.sh         # Testing utility
├── run-migrations.sh               # Database initialization script
├── update_aiqtoolkit.sh           # AIQ Toolkit build script
└── .env                            # Environment configuration
```

## Deployment Instructions

### Prerequisites
- Docker and Docker Compose installed
- Minimum 8GB RAM and 4 CPU cores recommended
- API keys configured in `.env` file
- Docker image nvcr.io/nvidia/base/ubuntu, you should have login and access to this image

### Installation Steps
1. Create a directory: `/hackathon/`
2. Save the downloaded application tgz file to `/hackathon/` and extract it by running:
   ```bash
   tar -xvzf <filename>.tgz
   ```
   Make sure download both part 1 and part 2 files.
   Part 1 is aiqtoolkit and aiqtoolkit-ui.
   Part 2 is the OpenCodeReview Platform Stack.
   a folder named `opencode-review` will be created.
   cd into the `opencode-review` folder.
   run update_aiqtoolkit.sh. This is used to setup aiqtoolkit.
4. Edit .env file to set your API keys. NVIDIA_API_KEY and OPENAI_API_KEY are required.
5. Execute the deployment script: `./restart.sh`. docker login is required to run this script for docker image nvcr.io/nvidia/base/ubuntu.
6. Access the application at `http://localhost:5174`

Setting up AIQ Toolkit may need some technical knowledges. If you have problem setting it up, please contact me to get another full package file.
This file is too large to host in my GitHub. So, I cannot post the file here.
You can download the packaged file from [open-code-review_2025-05-21_full_img.tgz](https://3c-kingdom.com/opencodereview/tgz/open-code-review_2025-05-21_full_img.tgz)

# How to Setup the Environment (Video)
[![Setup Video](https://img.youtube.com/vi/wxGG2Ra0ljI/0.jpg)](https://youtu.be/wxGG2Ra0ljI)

# Short Demo Video
[![Demo Video](https://img.youtube.com/vi/W-IZSS-T_6U/0.jpg)](https://youtu.be/W-IZSS-T_6U)

## OpenCodeReview Home and Blog Pages
- [OpenCodeReview HomePage](http://3c-kingdom.com/opencodereview/)
- [OpenCodeReview Blog Page](http://3c-kingdom.com/opencodereview/blog.html)

### Important Notes
- This is a proof-of-concept implementation intended for local development environments
- The application has been tested on CentOS 9 with Docker
- External network access is required to access to build.nvidia.com and OpenAI API. This POC build can use Cloud LLM service ONLY.
- AI Code Analysis takes time and may require multiple attempts to get a good result. It takees about 5-10 minutes to analyze a file in this POC build. Performance tuning have not been done yet in this POC build.
- For the POC demo reason, duplicated findings wiil be added to the database when you assess the same file multiple times. This is not the case in the post-hackathon version. The post-hackathon version will be able to detect the duplicated findings by using duplicate finding detection AI agent and tool.
- Known Bug: Incorrect finding level for file which does not have any security issues. The finding level should be "No Security Issues" but it is "Low" in the POC build. This will be fixed in the post-hackathon version.
- Apologies for not having enough time to setup a better source control repo for this Nvidia Hackathon Build.


