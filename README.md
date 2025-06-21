# OpenCodeReview - Technical Documentation

OpenCodeReview is an AI Powered Source Code Review tool and mini software vulnerability management system.
This tool use AI LLM and NVIDIA NeMo Agent Toolkit as core engine to do the source code review.

Core AI component uses NVIDIA NeMo Agent Toolkit to perform AI Orchestration and Execution with AI agents, tools and workflow.
This project uses NVIDIA NeMo Agent Toolkit example examples/agents/mixture_of_agents as reference to setup code review workflow

This project enables traditional static management platforms to integrate intelligent AI capabilities by using NVIDIA NeMo Agent Toolkit.

## AI Agentic Workflow (Core AI Engine - NVIDIA NeMo Agent Toolkit)
AI Orchestrator run the following execution and tools
- Run tool to get Source Code
- Tell AI LLM to perform Code Review with OWASP Top 10 instructions
- Call tool to create finding records
This is the key workflow and it is flexible to add Code Quality Review and CVE search by updating this workflow.
This core AI workflow is handled by NVIDIA NeMo Agent Toolkit. 

I embeded all expert AI instruction in NeMo Agent Toolkit for code review automation.

## Why OpenCodeReview Is Beneficial?  
- **User-Friendly**: No AI prompt engineering expertise needed—expert prompt instructions are fully embedded.  
- **Highly Flexible & Customizable**: Easily update prompts, add instructions, fine-tune workflows, and adjust requirements using the NVIDIA NeMo Agent Toolkit.  
- **Continuous Improvement**: The core engine leverages LLM models and the NeMo Agent Toolkit, ensuring ongoing advancements as LLMs evolve and new features are developed.  

![File Page](https://3c-kingdom.com/opencodereview/assets/file_page.png)

![Project Dashboard](https://3c-kingdom.com/opencodereview/assets/project_dashboard.png)

![Finding Page](https://3c-kingdom.com/opencodereview/assets/finding_page.png)

## Architecture Overview

The OpenCodeReview application utilizes a modern, containerized architecture with separate components for frontend, backend, AI processing, and data storage.

## Technology Stack

- **Frontend**: React.js - Provides the interactive user interface
- **Backend**: Node.js with Express - Handles API requests and business logic
- **Database**: PostgreSQL with PG Vector support - Stores application data with vector capabilities
- **NeMo Agent Toolkit**: NVIDIA NeMo Agent Toolkit - Powers code analysis and review features
- **NeMo Agent Toolkit-UI**: NVIDIA NeMo Agent Toolkit UI - Provides visualization for AI operations
- **Deployment**: Docker - Ensures consistent environment across deployments

## System Architecture

```
All components run in isolated Docker containers for maintainability and scalability.


+-------------+         +-------------+         +-----------------------+
|  Frontend   |<------->|  Backend    |<------->|  NeMo Agent Toolkit   |
|  (React)    |  HTTP/  | (Node.js/   |  HTTP/  | (Python FastAPI)      |
|             |  WS     |  Express)   |  WS     |                       |
+-------------+         +-------------+         +-----------------------+
                               |
                               v
                        +-------------+
                        |  Database   |
                        | (PostgreSQL)|
                        +-------------+

```

### Network Configuration
- **Backend API & WebSockets**: Port 8001
- **AIQ Toolkit API & WebSockets**: Port 8000
- **Frontend**: Port 5174

## Project Structure

```
.
├── aiqtoolkit/                      # Nvidia NeMo Agent Toolkit
│   └── my-agents/
│       └── code-reviewer/           # Custom agent for Open Code Review
├── aiqtoolkit-ui/                   # Nvidia NeMo Agent Toolkit UI
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

## Recommended AI Models
In this setup, I used OpenAI gpt-4o-mini for testing. This model works OK but not great.
I recommend to use larger AI model like gpt-4o to test it or use https://build.nvidia.com/models, meta/llama-4-maverick-17b-128e-instruct, Llama 4 Maverick (17Bx128E).
You can watch the setup video part 3 to see how to change the AI Model.
This can help you to have a better code review results.

## Deployment Instructions

### Prerequisites
- Docker and Docker Compose installed
- Minimum 8GB RAM and 4 CPU cores recommended
- API keys configured in `.env` file
- Docker image nvcr.io/nvidia/base/ubuntu, you should have login and access to this image

### Installation Steps
1. Create a directory: `/hackathon/`
2. Git clone the repository:
   ```bash
   git clone https://github.com/victortong-git/open-code-review.git
   ```
3. Edit .env file to set your API keys. NVIDIA_API_KEY and OPENAI_API_KEY are required.
4. setup NeMo Agent Toolkit and NeMo Agent Toolkit UI by running the following commands:
   ```bash
   cd open-code-review/
   ./00-setup_aiqtoolkit.sh
   ```
   This will build the NeMo Agent Toolkit.
5. Start the OpenCodeReview application:
   ```bash
   ./start_open-code-review.sh
   ```
   This will start the backend, frontend, and NeMo Agent Toolkit services.
6. Migrate the database:
   ```bash
   ./run_migrations.sh
   ```
   This will create the necessary database tables and initial data.   
7. Access the application at `http://localhost:5174`


# How to Setup the Environment (Video) (Outdated)
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
- Apologies for not having enough time to setup a better source control repo for this NVIDIA Hackathon Build.
- This POC build does not have enough time to having a better source code control and git submodule setup. Next build will set the aiqtoolkit as submodule and put code reviewe agent as package for AIQ Toolkit.
- Please read my blog post for post-hackathon release and the features roadmap.
- build.nvidia.com has rate limit on API usage. OpenCodeReview uses multiple AI query to API. You may get 429 error. If that is the case, I would like to recommend you to use OpenAI API for testing.
- This repo will be frozen until the NVIDIA Hackathon results announcement on 17 Jun 2025. (Updated resumed.)
- This repo has been updated to use updated setup script.