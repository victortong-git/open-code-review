# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenCodeReview is an AI-powered source code review tool and vulnerability management system that uses NVIDIA NeMo Agent Toolkit (NAT) as its core AI engine. The application consists of multiple containerized services including a React frontend, Node.js backend, PostgreSQL database with PgVector support, and AI processing components with local Ollama support.

## Architecture

- **Frontend**: React 19 with TypeScript, Redux Toolkit, Vite, and Tailwind CSS
- **Backend**: Node.js with Express, TypeScript, Sequelize ORM
- **Database**: PostgreSQL with PgVector extension
- **AI Engine**: NVIDIA NeMo Agent Toolkit (NAT) with local Ollama support
- **MCP Server**: Python-based Model Context Protocol server
- **Deployment**: Docker Compose with isolated containers

## Development Commands

### Backend (Node.js/Express)
```bash
cd backend
npm run dev          # Start development server with nodemon
npm run build        # Compile TypeScript to JavaScript
npm run start        # Run production build
npm run test         # Run Jest tests
npm run db:migrate   # Run database migrations
npm run db:seed:all  # Seed database with test data
```

### Frontend (React/Vite)
```bash
cd frontend
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Docker Operations
```bash
./start_open-code-review.sh          # Start all services
./stop_open-code-review.sh           # Stop all services
./run_migrations.sh                  # Initialize database
./restart.sh                         # Restart application
./00-setup_nemo_agent_toolkit.sh     # Setup NeMo Agent Toolkit with Ollama support
```

### Testing
- Backend tests use Jest with supertest for API testing
- Run tests with `npm run test` in the backend directory
- Tests include database integration tests using SQLite for test environment

## Key Directories

### Backend Structure
- `src/controllers/` - Express route handlers for API endpoints
- `src/models/` - Sequelize database models (Project, File, Finding, CodeSnippet)
- `src/routes/` - API route definitions
- `src/services/` - Business logic and external service integrations
- `src/migrations/` - Database schema migrations
- `src/config/` - Configuration files and database setup

### Frontend Structure
- `src/components/` - Reusable React components
- `src/pages/` - Route-based page components
- `src/features/` - Redux Toolkit slices for state management
- `src/services/` - API client and WebSocket handling
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions for dates, exports, etc.

### AI Components
- `ollama_provider/` - Ollama provider integration for local LLM support
- `mcp_server/` - Model Context Protocol server for AI interactions
- `my-agents/open_code_review/` - Custom code review agent configuration
- `Dockerfile-nemo_agent_toolkit` - NeMo Agent Toolkit container configuration

## Database

The application uses PostgreSQL with the following core models:
- **Projects**: Container for code repositories
- **Files**: Individual source code files within projects
- **Findings**: Security vulnerabilities and issues detected
- **CodeSnippets**: Code segments associated with findings

Migrations are managed through Sequelize CLI and should be run before starting the application.

## API Structure

The backend exposes REST APIs for:
- `/api/projects` - Project management
- `/api/files` - File operations and scanning
- `/api/findings` - Security findings management
- `/api/analysis` - AI-powered code analysis
- `/api/code-snippets` - Code snippet management

WebSocket connections are used for real-time analysis updates.

## Development Workflow

1. Ensure Docker and Docker Compose are installed
2. Set up environment variables (NVIDIA_API_KEY, OPENAI_API_KEY, Ollama configuration)
3. Run `./00-setup_nemo_agent_toolkit.sh` to prepare the NeMo Agent Toolkit
4. Start services with `./start_open-code-review.sh`
5. Initialize database with `./run_migrations.sh`
6. Access frontend at `http://localhost:5174`
7. Backend API available at `http://localhost:8001`
8. NeMo Agent Toolkit UI at `http://localhost:3000`

## LLM Configuration

The application supports multiple LLM providers through flexible environment-based configuration:

### Supported Providers
- **OpenAI**: Cloud-based GPT models
- **NVIDIA**: NIM models via NVIDIA's API
- **Ollama**: Local models running on your infrastructure

### Configuration
Set your preferred provider in `.env`:
```bash
LLM_PROVIDER=openai  # Options: openai, nvidia, ollama
```

### Provider-Specific Settings

**OpenAI Configuration:**
```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

**NVIDIA Configuration:**
```bash
NVIDIA_API_KEY=your_nvidia_api_key
NVIDIA_MODEL=meta/llama-3.1-8b-instruct
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

**Ollama Configuration:**
```bash
OLLAMA_URL=http://192.168.3.93
OLLAMA_PORT=11434
OLLAMA_MODEL=gemma3:4b
OLLAMA_API_KEY=EMPTY
```

**General LLM Settings:**
```bash
LLM_MAX_TOKENS=4096
LLM_TEMPERATURE=0.0
```

### Switching Providers
To switch between providers, simply change the `LLM_PROVIDER` value and ensure the corresponding provider's configuration is set. The system will automatically use the appropriate executor.

## Important Notes

- The application uses NVIDIA NeMo Agent Toolkit (NAT) as its core AI engine
- Supports multiple LLM providers: OpenAI, NVIDIA, and local Ollama infrastructure
- AI analysis is computationally intensive and may take 5-10 minutes per file
- Rate limiting is configured for API endpoints
- The system uses WebSockets for real-time analysis status updates
- All components run in isolated Docker containers with shared networks
- Local Ollama setup requires the model to be available on the specified host and port
- The `nvidia-nat` service replaces the previous `aiqtoolkit` service
- Migration from AIQ Toolkit to NeMo Agent Toolkit provides enhanced performance and local LLM support