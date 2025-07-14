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
├── .env_example                          # Environment template
├── .gitignore                            # Git ignore rules
├── 00-setup_aiqtoolkit.sh               # AIQ Toolkit setup script
├── docker-compose.yml                   # Main Docker configuration
├── docker-compose_aiqtoolkit.yml        # AIQ Toolkit Docker Compose
├── Dockerfile-aiqtoolkit                 # AIQ Toolkit Dockerfile
├── env-aiqtoolkit-ui                     # AIQ Toolkit UI environment config
├── package.json                          # Root package configuration
├── README.md                             # Project documentation
├── restart.sh                            # Application restart script
├── run_example.sh                        # Example run script
├── run_migrations.sh                     # Database initialization script
├── run_opencodereview.sh                 # OpenCodeReview run script
├── start_open-code-review.sh             # Start all services
├── stop_open-code-review.sh              # Stop all services
├── aiqtoolkit-ui/                        # NVIDIA NeMo Agent Toolkit UI
│   ├── Dockerfile
│   └── env-setup.sh
├── backend/                              # Node.js backend
│   ├── .gitignore                        # Backend git ignore
│   ├── .sequelizerc                      # Sequelize config
│   ├── Dockerfile
│   ├── jest.config.js                    # Jest test configuration
│   ├── package.json                      # Backend dependencies
│   ├── tsconfig.json                     # TypeScript configuration
│   ├── config/                           # Configuration files
│   ├── models/                           # Database models
│   ├── projects/                         # Project data
│   └── src/                              # Source code
├── frontend/                             # React.js frontend
│   ├── .gitignore                        # Frontend git ignore
│   ├── .stylelintrc.json                 # Stylelint configuration
│   ├── API_DOCUMENTATION.md              # API documentation
│   ├── Dockerfile
│   ├── README.md                         # Frontend documentation
│   ├── eslint.config.js                  # ESLint configuration
│   ├── index.html                        # Main HTML file
│   ├── package.json                      # Frontend dependencies
│   ├── postcss.config.cjs                # PostCSS configuration
│   ├── postcss.config.js                 # PostCSS configuration (JS)
│   ├── restart-app.sh                    # Frontend restart script
│   ├── tailwind.config.cjs               # Tailwind CSS configuration
│   ├── tailwind.config.js                # Tailwind CSS configuration (JS)
│   ├── tsconfig.app.json                 # App TypeScript configuration
│   ├── tsconfig.json                     # TypeScript configuration
│   ├── tsconfig.node.json                # Node TypeScript configuration
│   ├── vite.config.ts                    # Vite configuration
│   ├── public/                           # Static assets
│   ├── scripts/                          # Build scripts
│   └── src/                              # Source code
├── my-agents/                            # Custom OpenCodeReview agents
│   └── open_code_review/                 # Code review agent
└── projects/                             # Project uploads folder
    ├── owasp-sample-code/                # OWASP sample project
    └── vulnerable-project/               # Sample vulnerable project
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
[![Demo Video](https://img.youtube.com/vi/3yBqN369ZBE/0.jpg)](https://youtu.be/3yBqN369ZBE)

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

## 2025 July Update

### Major New Features

#### 🤖 Local LLM Support with Ollama
OpenCodeReview now supports **Local LLM deployment** through Ollama integration, enabling you to run AI code analysis entirely on your own infrastructure without external API dependencies.

**Key Benefits:**
- **Complete Privacy**: No data leaves your network
- **Cost Control**: No per-token API charges
- **Custom Models**: Use any Ollama-supported model
- **Offline Operation**: Works without internet connectivity

**Supported LLM Providers:**
- **OpenAI**: Cloud-based GPT models (gpt-4o, gpt-4o-mini)
- **NVIDIA**: NIM models via NVIDIA's API (meta/llama-3.1-8b-instruct)
- **Ollama**: Local models (gemma3:4b, llama3.1, codellama, etc.)

**Configuration Example:**
```bash
# Local Ollama Setup
LLM_PROVIDER=ollama
OLLAMA_URL=http://192.168.1.100
OLLAMA_PORT=11434
OLLAMA_MODEL=gemma3:4b
OLLAMA_API_KEY=EMPTY
```

#### 🔍 AI QA Review for Finding Validation
New **AI QA Review** functionality that uses AI as a Senior IT Security Consultant to perform quality assurance on security findings, significantly reducing false positives.

**AI QA Review Features:**
- **Automated False Positive Detection**: AI analyzes findings against actual source code
- **Expert-Level Analysis**: Uses security consultant-level prompts and reasoning
- **Status Validation**: Automatically updates finding status (confirmed, false_positive, needs_review)
- **Detailed Reasoning**: Stores AI's analysis and reasoning for each review
- **One-Click Review**: Simple button in FindingDetail page with real-time processing

**QA Review Process:**
1. AI examines the security finding details
2. Compares against actual source code context
3. Provides confidence assessment (high/medium/low)
4. Delivers professional recommendation with detailed analysis
5. Updates finding status and stores reasoning

#### 📊 Selective Code Review Approach
Enhanced code analysis workflow with **Selective Review** capability, allowing users to choose specific security review types instead of running comprehensive analysis.

**Review Options:**
- **Comprehensive Review**: All OWASP 2021 Top 10 categories (default)
- **Selective Review**: User-defined review types for targeted analysis

**Selective Review Benefits:**
- **Faster Analysis**: Focus on specific vulnerability categories
- **Resource Efficiency**: Reduced computation time and API costs
- **Targeted Assessment**: Choose relevant security categories for your context
- **Flexible Workflow**: Mix and match review types as needed

**Available Review Categories:**
- A01:2021 – Broken Access Control
- A02:2021 – Cryptographic Failures
- A03:2021 – Injection
- A04:2021 – Insecure Design
- A05:2021 – Security Misconfiguration
- A06:2021 – Vulnerable and Outdated Components
- A07:2021 – Identification and Authentication Failures
- A08:2021 – Software and Data Integrity Failures
- A09:2021 – Security Logging and Monitoring Failures
- A10:2021 – Server-Side Request Forgery (SSRF)
- General Security Review

### Enhanced User Experience
- **Real-time Progress Tracking**: Live updates during AI analysis
- **Improved Error Handling**: Better feedback and recovery mechanisms
- **Enhanced WebSocket Integration**: Reliable real-time communication
- **Streamlined UI/UX**: More intuitive workflow for code review process

### Technical Improvements
- **Multi-Provider LLM Architecture**: Flexible executor pattern for different AI providers
- **Database Schema Enhancements**: Added QA review fields and improved finding management
- **Enhanced Logging**: Comprehensive analysis tracking and debugging capabilities
- **Rate Limiting Optimization**: Improved API request management and performance