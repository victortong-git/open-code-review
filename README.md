# OpenCodeReview - AI-Powered Security Analysis Platform

**OpenCodeReview** is an advanced AI-powered source code review tool and vulnerability management system that leverages **NVIDIA NeMo Agent Toolkit (NAT)** for intelligent security analysis and code assessment.

## 🎯 Core Mission

Transform traditional code review processes with **intelligent AI automation**, providing enterprise-grade security analysis without requiring AI expertise from development teams.

## 🏗️ AI-Driven Architecture

**Core AI Engine**: NVIDIA NeMo Agent Toolkit orchestrates sophisticated AI workflows through:

### **🤖 Intelligent Workflow Orchestration**
1. **Code Acquisition**: Automated source code retrieval and processing
2. **Security Analysis**: AI-powered OWASP Top 10 2021 vulnerability assessment
3. **Finding Management**: Automated vulnerability record creation and classification
4. **QA Validation**: AI-powered false positive detection and confidence scoring

### **🔧 Multi-Provider Flexibility**
- **Cloud LLMs**: OpenAI GPT models, NVIDIA NIM API access
- **Local Deployment**: Ollama integration for on-premises privacy
- **Dynamic Switching**: Runtime provider configuration without code changes

### **📊 Advanced Features**
- **Selective Review**: Choose specific OWASP categories for targeted analysis
- **AI QA Review**: Automated false positive detection with confidence scoring
- **Real-time Updates**: WebSocket-powered live analysis progress
- **Multi-Format Export**: Comprehensive reporting in various formats

## 🌟 Why Choose OpenCodeReview?

### **🚀 September 2025 Enhanced Benefits**
- **✅ Zero AI Expertise Required**: Expert security analysis prompts pre-configured and embedded
- **✅ Enterprise-Ready**: Modern NAT architecture with improved reliability and performance
- **✅ Maximum Flexibility**: Multi-provider LLM support (OpenAI, NVIDIA, Local Ollama)
- **✅ Enhanced Privacy**: Complete local deployment option with Ollama integration
- **✅ Future-Proof Design**: Built on NVIDIA's latest agent framework technology
- **✅ Intelligent Validation**: AI-powered QA review reduces false positives significantly
- **✅ Cost Optimization**: Choose between premium cloud models or free local alternatives  

![File Page](https://3c-kingdom.com/opencodereview/assets/file_page.png)

![Project Dashboard](https://3c-kingdom.com/opencodereview/assets/project_dashboard.png)

![Finding Page](https://3c-kingdom.com/opencodereview/assets/finding_page.png)

## Architecture Overview

The OpenCodeReview application utilizes a modern, containerized architecture with separate components for frontend, backend, AI processing, and data storage.

## Technology Stack

- **Frontend**: React 19 with TypeScript - Modern interactive user interface with Redux Toolkit and Tailwind CSS
- **Backend**: Node.js with Express & TypeScript - Handles API requests, business logic, and Sequelize ORM
- **Database**: PostgreSQL with PgVector extension - Stores application data with vector search capabilities
- **AI Engine**: NVIDIA NeMo Agent Toolkit (NAT) - Advanced AI orchestration and code analysis engine
- **LLM Providers**: Multi-provider support (OpenAI, NVIDIA, Ollama) - Flexible AI model integration
- **MCP Server**: Model Context Protocol server - Enhanced AI communication layer
- **Deployment**: Docker Compose - Containerized microservices architecture with isolated networks

## System Architecture

```
All components run in isolated Docker containers with secure networking and service isolation.

┌─────────────────────────────────────────────────────────────────────────┐
│                          OpenCodeReview Architecture                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐   HTTP/WS    ┌─────────────┐                          │
│  │  Frontend   │◄─────────────►│  Backend    │                          │
│  │  (React)    │   Port 5174  │ (Node.js/   │                          │
│  │  Vite+TS    │              │  Express)   │                          │
│  └─────────────┘              └─────────────┘                          │
│                                       │                                 │
│                                       │ HTTP                            │
│                                       ▼                                 │
│                               ┌─────────────┐                          │
│    ┌─────────────┐   HTTP     │   Database  │                          │
│    │ MCP Server  │◄───────────┤ PostgreSQL  │                          │
│    │  (Python)   │Port 8002   │  + PgVector │                          │
│    │ Port 8002   │            └─────────────┘                          │
│    └─────────────┘                    ▲                                │
│            │                          │                                │
│            │ Protocol                 │ SQL/ORM                        │
│            ▼                          │                                │
│  ┌─────────────────────────────────────────────────────────────────────┤
│  │              NeMo Agent Toolkit (NAT)                               │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │
│  │  │   FastAPI   │   │   Agents    │   │    Tools    │              │
│  │  │   Server    │   │   Engine    │   │  Functions  │              │
│  │  │ Port 8000   │   │             │   │             │              │
│  │  └─────────────┘   └─────────────┘   └─────────────┘              │
│  │                                                                     │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │
│  │  │    NAT UI   │   │ Multi-LLM   │   │ Code Review │              │
│  │  │   (React)   │   │  Providers  │   │   Agents    │              │
│  │  │ Port 3000   │   │             │   │             │              │
│  │  └─────────────┘   └─────────────┘   └─────────────┘              │
│  └─────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  External Connections:                                                  │
│  • OpenAI API (gpt-4o, gpt-4o-mini)                                   │
│  • NVIDIA NIM API (llama models)                                       │
│  • Local Ollama Server (when configured)                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Data Flow:
1. User uploads code → Frontend → Backend → Database
2. User triggers analysis → Backend → NAT via HTTP
3. NAT processes with LLM → Creates findings → Database
4. Real-time updates → WebSocket → Frontend
5. QA Review → NAT → Updates findings status
```

### Network Configuration
- **Frontend (React)**: Port 5174 - Main user interface
- **Backend API & WebSockets**: Port 8001 - REST API and real-time updates
- **NeMo Agent Toolkit**: Port 8000 - AI processing and analysis engine
- **NAT UI**: Port 3000 - AI operations visualization interface
- **MCP Server**: Port 8002 - Model Context Protocol communication
- **Database**: Port 5435 - PostgreSQL with PgVector

## Project Structure

```
.
├── .env_example                          # Environment template
├── .gitignore                            # Git ignore rules
├── 00-setup_nemo_agent_toolkit.sh       # NeMo Agent Toolkit setup script
├── docker-compose.yml                   # Main Docker configuration
├── docker-compose_nemo_agent_toolkit.yml # NeMo Agent Toolkit Docker Compose
├── Dockerfile-nemo_agent_toolkit         # NeMo Agent Toolkit Dockerfile
├── package.json                          # Root package configuration
├── README.md                             # Project documentation
├── restart.sh                            # Application restart script
├── run_example.sh                        # Example run script
├── run_migrations.sh                     # Database initialization script
├── run_opencodereview.sh                 # OpenCodeReview run script
├── start_open-code-review.sh             # Start all services
├── stop_open-code-review.sh              # Stop all services
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
│       ├── controllers/                  # API route handlers
│       ├── routes/                       # Express route definitions
│       ├── services/                     # Business logic and integrations
│       │   └── natClient.ts              # NeMo Agent Toolkit client
│       ├── models/                       # Sequelize database models
│       └── migrations/                   # Database schema migrations
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
│       ├── components/                   # Reusable React components
│       ├── pages/                        # Route-based page components
│       ├── features/                     # Redux Toolkit slices
│       ├── services/                     # API client and WebSocket handling
│       ├── hooks/                        # Custom React hooks
│       └── utils/                        # Utility functions
├── my-agents/                            # NeMo Agent Toolkit custom agents
│   └── open_code_review/                 # OpenCodeReview agent implementation
│       ├── pyproject.toml                # Python project configuration
│       └── src/open_code_review/         # Agent source code
│           ├── configs/                  # Agent configuration files
│           │   └── config.yml            # Multi-provider LLM configuration
│           ├── tools/                    # Custom agent tools
│           └── workflows/                # Agent workflow definitions
├── mcp_server/                           # Model Context Protocol server
│   ├── Dockerfile                        # MCP server container
│   ├── requirements.txt                  # Python dependencies
│   └── src/                              # MCP server implementation
└── projects/                             # Project uploads folder
    ├── owasp-sample-code/                # OWASP sample project
    └── vulnerable-project/               # Sample vulnerable project
```

## LLM Configuration and Model Recommendations

OpenCodeReview supports **multi-provider LLM architecture** with flexible configuration through environment variables. The system automatically selects the appropriate LLM client based on your chosen provider.

### 🔧 Configuration Overview

Configure your preferred LLM provider in the `.env` file:

```bash
# Choose provider: openai, nvidia, or ollama
LLM_PROVIDER=openai

# Provider-specific settings (configure based on your choice)
LLM_MAX_TOKENS=4096
LLM_TEMPERATURE=0.0
```

### 🌐 Cloud LLM Providers

#### **OpenAI (Recommended for Beginners)**
✅ **Best Choice**: Reliable, well-tested, and supports all features

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

**Recommended Models:**
- `gpt-4o` - Best quality, higher cost
- `gpt-4o-mini` - Good balance of quality and cost ⭐ **Default**
- `gpt-4-turbo` - Alternative premium option

#### **NVIDIA NIM (Advanced Users)**
✅ **Enterprise**: Access to latest NVIDIA-hosted models

```bash
LLM_PROVIDER=nvidia
NVIDIA_API_KEY=your_nvidia_api_key
NVIDIA_MODEL=meta/llama-3.1-8b-instruct
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

**Recommended Models:**
- `meta/llama-3.1-8b-instruct` - Fast, function calling supported ⭐ **Recommended**
- `meta/llama-3.1-70b-instruct` - Higher quality, slower
- `microsoft/phi-3-medium-4k-instruct` - Efficient alternative

### 🏠 Local LLM Setup (Ollama)

#### **Prerequisites for Local Setup**
1. **Ollama Server**: Install and run Ollama on your network
2. **Function Calling Support**: ⚠️ **Critical** - Model must support tools/function calling
3. **Sufficient Resources**: 8GB+ VRAM recommended for quality models

#### **Ollama Configuration**
```bash
LLM_PROVIDER=ollama
OLLAMA_URL=http://192.168.1.100  # Your Ollama server IP
OLLAMA_PORT=11434
OLLAMA_MODEL=your_model_name
OLLAMA_API_KEY=EMPTY
```

#### **Compatible Ollama Models**
⚠️ **Function Calling Requirement**: Not all Ollama models support the tools/function calling required by NeMo Agent Toolkit.

**✅ Verified Compatible Models:**
- `llama3.1:8b` - Good balance of performance and resources
- `qwen2.5:7b` - Excellent code analysis capabilities
- `codestral:22b` - Specialized for code review (requires more resources)

**❌ Known Incompatible Models:**
- `gemma3:4b` - Does not support function calling
- `phi3:3.8b` - Limited tool support
- Most older or smaller models

#### **Testing Model Compatibility**
Before configuring, test if your model supports function calling:
```bash
curl -X POST http://your.ollama.host:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "your_model_name",
    "messages": [{"role": "user", "content": "Hello"}],
    "tools": [{"type": "function", "function": {"name": "test"}}]
  }'
```

If you receive a `400` error mentioning "does not support tools", the model is incompatible.

### 🔄 Switching Between Providers

To switch providers, simply update the `LLM_PROVIDER` environment variable and restart the NAT service:

```bash
# Update .env file
LLM_PROVIDER=your_new_provider

# Restart NAT service only
docker compose restart nvidia-nat
```

### 📊 Performance Comparison

| Provider | Setup Complexity | Cost | Performance | Privacy | Function Calling |
|----------|------------------|------|-------------|---------|------------------|
| OpenAI   | Easy            | Paid | High        | Cloud   | ✅ Full Support  |
| NVIDIA   | Medium          | Paid | High        | Cloud   | ✅ Full Support  |
| Ollama   | Hard            | Free | Variable    | Local   | ⚠️ Model Dependent |

### 🎯 Recommendations by Use Case

- **Getting Started**: OpenAI `gpt-4o-mini`
- **Enterprise/Production**: NVIDIA NIM `meta/llama-3.1-8b-instruct`
- **Privacy/Offline**: Ollama `llama3.1:8b` (with proper hardware)
- **Best Quality**: OpenAI `gpt-4o` or NVIDIA `meta/llama-3.1-70b-instruct`

## Deployment Instructions

### Prerequisites
- Docker and Docker Compose installed
- Minimum 8GB RAM and 4 CPU cores recommended
- API keys configured in `.env` file (see LLM Configuration section)
- Docker image `nvcr.io/nvidia/base/ubuntu` access (NVIDIA account required)
- Internet connectivity for pulling Docker images and AI model access

### Installation Steps
1. **Clone Repository:**
   ```bash
   git clone https://github.com/victortong-git/open-code-review.git
   cd open-code-review/
   ```

2. **Configure Environment:**
   ```bash
   cp .env_example .env
   # Edit .env file with your preferred LLM provider and API keys
   ```

3. **Setup NeMo Agent Toolkit:**
   ```bash
   ./00-setup_nemo_agent_toolkit.sh
   ```
   This builds the NeMo Agent Toolkit Docker container with all dependencies.

4. **Choose Your LLM Provider:**
   Edit `.env` file to configure your preferred provider:

   **For OpenAI (Recommended for beginners):**
   ```bash
   LLM_PROVIDER=openai
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=gpt-4o-mini
   ```

   **For NVIDIA NIM:**
   ```bash
   LLM_PROVIDER=nvidia
   NVIDIA_API_KEY=your_nvidia_api_key
   NVIDIA_MODEL=meta/llama-3.1-8b-instruct
   ```

   **For Local Ollama:**
   ```bash
   LLM_PROVIDER=ollama
   OLLAMA_URL=http://your.ollama.host
   OLLAMA_MODEL=your_model_name
   ```
   ⚠️ **Note:** Ensure your chosen model supports function calling (required by NAT)

5. **Start Application Services:**
   ```bash
   ./start_open-code-review.sh
   ```
   This starts all containerized services: frontend, backend, database, and NeMo Agent Toolkit.

6. **Initialize Database:**
   ```bash
   ./run_migrations.sh
   ```
   Creates database schema and loads initial data.

7. **Access Application:**
   - **Frontend**: `http://localhost:5174` (Main application interface)
   - **Backend API**: `http://localhost:8001` (REST API and WebSocket)
   - **NAT UI**: `http://localhost:3000` (NeMo Agent Toolkit management)
   - **MCP Server**: `http://localhost:8002` (Model Context Protocol)

### Verification
After setup, verify the installation by:
1. Checking all services are running: `docker compose ps`
2. Testing AI functionality on a sample file
3. Monitoring logs for any errors: `docker compose logs -f`

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### **1. Function Calling Not Supported Error**
**Error**: `"model does not support tools" (status code: 400)`

**Cause**: Your chosen LLM model doesn't support function calling required by NeMo Agent Toolkit.

**Solutions**:
- **Quick Fix**: Switch to OpenAI provider:
  ```bash
  # Update .env file
  LLM_PROVIDER=openai
  OPENAI_API_KEY=your_key

  # Restart NAT service
  docker compose restart nvidia-nat
  ```
- **Ollama Users**: Use compatible models like `llama3.1:8b` instead of `gemma3:4b`
- **Test Model**: Use the curl command in LLM Configuration section to verify compatibility

#### **2. Services Not Starting**
**Error**: Containers failing to start or exiting immediately

**Diagnosis**:
```bash
# Check service status
docker compose ps

# View specific service logs
docker compose logs nvidia-nat
docker compose logs backend
docker compose logs frontend
```

**Common Causes**:
- **Missing Environment Variables**: Ensure `.env` file is properly configured
- **Port Conflicts**: Check if ports 5174, 8001, 8000, 3000, 8002, 5435 are available
- **Docker Image Issues**: Try rebuilding: `docker compose build --no-cache`

#### **3. AI Analysis Timeout or Fails**
**Symptoms**: Analysis never completes or returns errors

**Solutions**:
1. **Check NAT Service**:
   ```bash
   docker compose logs nvidia-nat
   curl http://localhost:8000/health  # Should return OK
   ```

2. **Verify LLM Provider Connection**:
   ```bash
   # Test API key (OpenAI example)
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

3. **Increase Timeouts**: Edit backend configuration if needed
4. **Check Rate Limits**: NVIDIA and OpenAI have rate limiting

#### **4. Database Connection Issues**
**Error**: Backend can't connect to PostgreSQL

**Solutions**:
```bash
# Check database service
docker compose logs postgres

# Test database connection
docker compose exec postgres psql -U postgres -d opencodereview -c "SELECT 1;"

# Rebuild database if needed
docker compose down -v
docker compose up -d postgres
./run_migrations.sh
```

#### **5. Frontend Can't Connect to Backend**
**Symptoms**: API calls failing, empty data

**Solutions**:
- **Check Backend Status**: `curl http://localhost:8001/api/health`
- **CORS Issues**: Ensure backend CORS is configured for localhost:5174
- **Network Issues**: Verify containers are on same Docker network

#### **6. Local Ollama Connection Issues**
**Error**: Can't connect to Ollama server

**Solutions**:
- **Network Access**: Ensure Ollama host is reachable: `ping your.ollama.host`
- **Firewall**: Check if port 11434 is open
- **Model Availability**: Verify model is pulled: `ollama list`
- **URL Format**: Use `http://` prefix in OLLAMA_URL

### **Debug Mode**
Enable verbose logging for detailed troubleshooting:

```bash
# Add to .env file
DEBUG=true
LOG_LEVEL=debug

# Restart services
docker compose restart
```

### **Getting Help**
1. **Check Logs**: Always start with `docker compose logs -f`
2. **Service Health**: Use health check endpoints where available
3. **Community Support**: Report issues on GitHub repository
4. **Documentation**: Refer to component-specific documentation in respective directories

### **Performance Optimization**
- **Resource Allocation**: Ensure sufficient RAM (8GB+) and CPU (4+ cores)
- **Model Selection**: Smaller models (gpt-4o-mini) for faster responses
- **Local Setup**: Use local Ollama for better performance and privacy
- **Caching**: Clear Docker cache periodically: `docker system prune`

# How to Setup the Environment (Video) (Outdated)
[![Setup Video](https://img.youtube.com/vi/wxGG2Ra0ljI/0.jpg)](https://youtu.be/wxGG2Ra0ljI)

# Short Demo Video
[![Demo Video](https://img.youtube.com/vi/3yBqN369ZBE/0.jpg)](https://youtu.be/3yBqN369ZBE)

## OpenCodeReview Home and Blog Pages
- [OpenCodeReview HomePage](http://3c-kingdom.com/opencodereview/)
- [OpenCodeReview Blog Page](http://3c-kingdom.com/opencodereview/blog.html)

## ⚠️ Migration and Deprecation Notices

### **🔄 September 2025 Migration Complete**
OpenCodeReview has successfully migrated from **AIQ Toolkit → NeMo Agent Toolkit (NAT)**.

**✅ Migration Status**: **COMPLETE** - All users should use the new NAT-based installation process.

### **⛔ Deprecated Components (No Longer Supported)**
- `./00-setup_aiqtoolkit.sh` → **Use**: `./00-setup_nemo_agent_toolkit.sh`
- `docker-compose_aiqtoolkit.yml` → **Use**: `docker-compose_nemo_agent_toolkit.yml`
- `Dockerfile-aiqtoolkit` → **Use**: `Dockerfile-nemo_agent_toolkit`
- `aiqtoolkit-ui/` directory → **Replaced by**: Native NAT UI (Port 3000)

### **🚨 Breaking Changes from AIQ Toolkit**
1. **Environment Variables**:
   - Old: `AIQ_*` variables → New: `LLM_PROVIDER`, `NVIDIA_*`, `OPENAI_*`, `OLLAMA_*`
2. **Service Names**:
   - Old: `aiqtoolkit` service → New: `nvidia-nat` service
3. **API Endpoints**:
   - Old: `aiqClient.ts` → New: `natClient.ts`
4. **Function Calling Requirement**:
   - **Critical**: LLM models MUST support function calling (not all Ollama models supported)

### **📝 Current Status and Important Notes**

#### **🏗️ Architecture Status**
- **Production Ready**: Enterprise-grade NAT architecture with enhanced reliability
- **Multi-Platform Tested**: CentOS 9, Ubuntu 20.04+, macOS (Docker Desktop)
- **Container Orchestration**: Full Docker Compose with service isolation and health checks

#### **🌐 Network Requirements**
- **Cloud Providers**: Internet access required for OpenAI API and NVIDIA NIM
- **Local Deployment**: Fully offline operation available with Ollama setup
- **Hybrid Support**: Mix cloud and local LLMs based on your requirements

#### **⚡ Performance Characteristics**
- **Analysis Time**: 2-8 minutes per file (improved from original 5-10 minutes)
- **Concurrent Processing**: Multiple file analysis supported
- **Resource Requirements**: 8GB RAM minimum, 4+ CPU cores recommended
- **Rate Limiting**: Built-in API rate limiting and retry mechanisms

#### **🔍 Quality Improvements**
- **AI QA Review**: Automated false positive detection reduces manual validation
- **Enhanced Accuracy**: Modern LLM models provide better vulnerability detection
- **Duplicate Detection**: Intelligent finding deduplication (resolved from POC limitations)
- **Confidence Scoring**: AI-powered confidence levels for each finding

#### **🛡️ Security and Privacy**
- **API Key Security**: Environment-based configuration, no keys committed to repository
- **Local Processing**: Complete on-premises deployment option with Ollama
- **Data Privacy**: No external data transmission when using local LLM providers
- **Audit Trail**: Comprehensive logging for security compliance

### **📋 Migration Guide for Existing Users**

**If upgrading from AIQ Toolkit version:**

1. **Backup Current Setup**:
   ```bash
   docker compose down
   cp .env .env.backup
   ```

2. **Update Repository**:
   ```bash
   git pull origin main
   ```

3. **Run New Setup**:
   ```bash
   ./00-setup_nemo_agent_toolkit.sh
   ```

4. **Update Environment**:
   ```bash
   cp .env_example .env
   # Configure your preferred LLM provider
   ```

5. **Start New Services**:
   ```bash
   ./start_open-code-review.sh
   ./run_migrations.sh
   ```

### **🚧 Known Limitations**
- **Function Calling Models**: Not all local models support required function calling
- **Large File Processing**: Files >10MB may require chunking for optimal analysis
- **API Rate Limits**: Cloud providers have usage limits (see troubleshooting section)

## 2025 September Update - NeMo Agent Toolkit Migration

### 🚀 Major Infrastructure Upgrade: AIQ Toolkit → NeMo Agent Toolkit

OpenCodeReview has undergone a **complete migration** from the deprecated AIQ Toolkit to the modern **NVIDIA NeMo Agent Toolkit (NAT)**, delivering significant improvements in performance, reliability, and functionality.

#### Key Migration Benefits
- **Enhanced Architecture**: Modern agent-based framework with improved error handling
- **Better Performance**: Optimized AI orchestration and execution pipeline
- **Multi-Provider Flexibility**: Seamless switching between OpenAI, NVIDIA, and local Ollama
- **Function Calling Support**: Proper tool integration for advanced AI capabilities
- **Local LLM Compatibility**: Improved support for on-premises AI deployment
- **Future-Proof Design**: Built on NVIDIA's latest agent toolkit technology

#### 🔧 Technical Improvements
- **New Service Architecture**: `nvidia-nat` service replaces deprecated `aiqtoolkit` service
- **Enhanced Configuration**: Dynamic LLM provider selection with environment variables
- **Improved API Integration**: New `natClient.ts` with better error handling and timeouts
- **Docker Optimization**: Streamlined container builds and deployment process
- **Database Schema Updates**: Enhanced finding management with QA review capabilities

#### ⚠️ Important Function Calling Requirement
**Critical for Local Models**: Not all local models support function calling (tool usage) required by NAT.

**Recommended Configurations:**
- ✅ **OpenAI**: `gpt-4o-mini`, `gpt-4o` (Full function calling support)
- ✅ **NVIDIA**: `meta/llama-3.1-8b-instruct` (Function calling supported)
- ⚠️ **Ollama**: Model-dependent (many models like `gemma3:4b` do **not** support function calling)

#### 🛠️ Migration for Existing Users
Existing OpenCodeReview installations will continue to work, but users are encouraged to update:

1. **New Setup Script**: Use `./00-setup_nemo_agent_toolkit.sh` instead of the old AIQ setup
2. **Environment Configuration**: Update `.env` file with new NAT-compatible settings
3. **Model Compatibility**: Verify your chosen LLM model supports function calling
4. **Service References**: All backend services now use the enhanced NAT integration

#### 📊 Performance Improvements
- **Faster Analysis**: Optimized AI workflow reduces analysis time
- **Better Reliability**: Enhanced error handling and recovery mechanisms
- **Real-time Updates**: Improved WebSocket integration for live progress tracking
- **Memory Efficiency**: Optimized container resource usage

#### 🔒 Enhanced Security
- **API Key Management**: Improved environment variable handling and validation
- **Container Isolation**: Better Docker network security and service isolation
- **Error Logging**: Enhanced debugging capabilities while protecting sensitive data

---

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