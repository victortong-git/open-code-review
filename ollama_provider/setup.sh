#!/bin/bash

# SPDX-FileCopyrightText: Copyright (c) 2024-2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OLLAMA_URL=${OLLAMA_URL:-"http://192.168.8.21:11434"}
MODEL_NAME=${MODEL_NAME:-"gpt-oss:20b"}
BACKUP_DIR="./backup_$(date +%Y%m%d_%H%M%S)"

# Helper functions
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Check if we're in the right directory
check_environment() {
    section "Checking Environment"
    
    if [ ! -f "provider/ollama_llm.py" ]; then
        error "ollama_llm.py not found. Are you running from the ollama_provider directory?"
        exit 1
    fi
    
    if [ ! -d "/workspace" ]; then
        error "NeMo Agent Toolkit workspace not found at /workspace"
        error "This script should be run inside a NAT container"
        exit 1
    fi
    
    log "Environment checks passed"
}

# Backup existing files
backup_files() {
    section "Creating Backup"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup register.py if it exists
    if [ -f "/workspace/.venv/lib/python3.12/site-packages/nat/llm/register.py" ]; then
        cp "/workspace/.venv/lib/python3.12/site-packages/nat/llm/register.py" "$BACKUP_DIR/register.py.backup"
        log "Backed up register.py"
    fi
    
    # Backup LangChain plugin if it exists
    LANGCHAIN_PLUGIN="/workspace/.venv/lib/python3.12/site-packages/nat/plugins/langchain/llm.py"
    if [ -f "$LANGCHAIN_PLUGIN" ]; then
        cp "$LANGCHAIN_PLUGIN" "$BACKUP_DIR/langchain_llm.py.backup"
        log "Backed up LangChain plugin"
    fi
    
    # Backup LlamaIndex plugin if it exists
    LLAMAINDEX_PLUGIN="/workspace/.venv/lib/python3.12/site-packages/nat/plugins/llama_index/llm.py"
    if [ -f "$LLAMAINDEX_PLUGIN" ]; then
        cp "$LLAMAINDEX_PLUGIN" "$BACKUP_DIR/llamaindex_llm.py.backup"
        log "Backed up LlamaIndex plugin"
    fi
    
    log "Backup created in $BACKUP_DIR"
}

# Install Python dependencies
install_dependencies() {
    section "Installing Dependencies"
    
    log "Installing Python packages..."
    uv pip install -r requirements.txt
    
    log "Dependencies installed successfully"
}

# Install Ollama provider
install_provider() {
    section "Installing Ollama Provider"
    
    # Copy provider file
    TARGET_DIR="/workspace/.venv/lib/python3.12/site-packages/nat/llm"
    cp provider/ollama_llm.py "$TARGET_DIR/"
    log "Copied ollama_llm.py to $TARGET_DIR"
    
    # Update register.py
    REGISTER_FILE="$TARGET_DIR/register.py"
    if [ -f "$REGISTER_FILE" ]; then
        # Check if already registered
        if grep -q "ollama_llm" "$REGISTER_FILE"; then
            warn "Ollama provider already registered in register.py"
        else
            # Add import line
            sed -i '/from . import openai_llm/i from . import ollama_llm' "$REGISTER_FILE"
            log "Updated register.py with Ollama provider import"
        fi
    else
        error "register.py not found at $REGISTER_FILE"
        exit 1
    fi
}

# Install LangChain client
install_langchain_client() {
    section "Installing LangChain Client"
    
    LANGCHAIN_FILE="/workspace/.venv/lib/python3.12/site-packages/nat/plugins/langchain/llm.py"
    
    if [ -f "$LANGCHAIN_FILE" ]; then
        # Check if already installed
        if grep -q "OllamaModelConfig" "$LANGCHAIN_FILE"; then
            warn "Ollama LangChain client already installed"
        else
            # Add import
            sed -i '/from nat.llm.openai_llm import OpenAIModelConfig/a from nat.llm.ollama_llm import OllamaModelConfig' "$LANGCHAIN_FILE"
            
            # Add client function (append to end)
            cat >> "$LANGCHAIN_FILE" << 'EOF'


@register_llm_client(config_type=OllamaModelConfig, wrapper_type=LLMFrameworkEnum.LANGCHAIN)
async def ollama_langchain(llm_config: OllamaModelConfig, builder: Builder):

    from langchain_ollama import ChatOllama

    client = ChatOllama(**llm_config.model_dump(exclude={"type"}, by_alias=True))

    if isinstance(llm_config, RetryMixin):
        client = patch_with_retry(client,
                                  retries=llm_config.num_retries,
                                  retry_codes=llm_config.retry_on_status_codes,
                                  retry_on_messages=llm_config.retry_on_errors)

    yield client
EOF
            log "Added Ollama LangChain client"
        fi
    else
        warn "LangChain plugin not found at $LANGCHAIN_FILE"
    fi
}

# Install LlamaIndex client
install_llamaindex_client() {
    section "Installing LlamaIndex Client"
    
    LLAMAINDEX_FILE="/workspace/.venv/lib/python3.12/site-packages/nat/plugins/llama_index/llm.py"
    
    if [ -f "$LLAMAINDEX_FILE" ]; then
        # Check if already installed
        if grep -q "OllamaModelConfig" "$LLAMAINDEX_FILE"; then
            warn "Ollama LlamaIndex client already installed"
        else
            # Add import
            sed -i '/from nat.llm.openai_llm import OpenAIModelConfig/a from nat.llm.ollama_llm import OllamaModelConfig' "$LLAMAINDEX_FILE"
            
            # Add client function (append to end)
            cat >> "$LLAMAINDEX_FILE" << 'EOF'


@register_llm_client(config_type=OllamaModelConfig, wrapper_type=LLMFrameworkEnum.LLAMA_INDEX)
async def ollama_llama_index(llm_config: OllamaModelConfig, builder: Builder):

    from llama_index.llms.ollama import Ollama

    kwargs = llm_config.model_dump(exclude={"type"}, by_alias=True)

    if ("base_url" in kwargs and kwargs["base_url"] is None):
        del kwargs["base_url"]

    llm = Ollama(**kwargs)

    if isinstance(llm_config, RetryMixin):
        llm = patch_with_retry(llm,
                               retries=llm_config.num_retries,
                               retry_codes=llm_config.retry_on_status_codes,
                               retry_on_messages=llm_config.retry_on_errors)

    yield llm
EOF
            log "Added Ollama LlamaIndex client"
        fi
    else
        warn "LlamaIndex plugin not found at $LLAMAINDEX_FILE"
    fi
}

# Verify NAT installation (pip-installed, no need to reinstall)
verify_nat_installation() {
    section "Verifying NAT Installation"
    
    log "Checking NAT installation and Ollama provider registration..."
    nat --version
    nat info components -t llm_provider | grep -q "ollama" && log "Ollama provider successfully registered!" || warn "Ollama provider registration may have failed"
}

# Test installation
test_installation() {
    section "Testing Installation"
    
    log "Running validation tests..."
    python examples/test_example.py --ollama-url "$OLLAMA_URL" --model-name "$MODEL_NAME"
    
    if [ $? -eq 0 ]; then
        log "Installation test passed!"
    else
        warn "Installation test had some issues. Check the output above."
    fi
}

# Rollback function
rollback() {
    section "Rolling Back Changes"
    
    if [ -d "$BACKUP_DIR" ]; then
        # Restore backups
        if [ -f "$BACKUP_DIR/register.py.backup" ]; then
            cp "$BACKUP_DIR/register.py.backup" "/workspace/.venv/lib/python3.12/site-packages/nat/llm/register.py"
            log "Restored register.py"
        fi
        
        if [ -f "$BACKUP_DIR/langchain_llm.py.backup" ]; then
            cp "$BACKUP_DIR/langchain_llm.py.backup" "/workspace/.venv/lib/python3.12/site-packages/nat/plugins/langchain/llm.py"
            log "Restored LangChain plugin"
        fi
        
        if [ -f "$BACKUP_DIR/llamaindex_llm.py.backup" ]; then
            cp "$BACKUP_DIR/llamaindex_llm.py.backup" "/workspace/.venv/lib/python3.12/site-packages/nat/plugins/llama_index/llm.py"
            log "Restored LlamaIndex plugin"
        fi
        
        # Remove provider file
        rm -f "/workspace/.venv/lib/python3.12/site-packages/nat/llm/ollama_llm.py"
        log "Removed Ollama provider"
        
        # Note: NeMo Agent Toolkit is pip-installed, no need to reinstall
        log "NeMo Agent Toolkit rollback completed"
        
        log "Rollback completed"
    else
        error "No backup directory found"
    fi
}

# Usage information
usage() {
    cat << EOF
NVIDIA NeMo Agent Toolkit Ollama Provider Setup

Usage: $0 [OPTIONS] [COMMAND]

Commands:
  install   - Install Ollama provider (default)
  test      - Run tests only
  rollback  - Restore from backup
  help      - Show this help

Options:
  --ollama-url URL    - Ollama server URL (default: $OLLAMA_URL)
  --model-name NAME   - Model name to test (default: $MODEL_NAME)
  --no-test          - Skip test after installation
  --backup-only      - Create backup only, don't install

Environment Variables:
  OLLAMA_URL    - Ollama server URL
  MODEL_NAME    - Model name for testing

Examples:
  ./setup.sh                                    # Install with defaults
  ./setup.sh --ollama-url http://localhost:11434  # Use local Ollama
  ./setup.sh test                               # Run tests only
  ./setup.sh rollback                           # Restore backup

EOF
}

# Main installation function
install_all() {
    log "Starting Ollama provider installation..."
    
    check_environment
    backup_files
    install_dependencies
    install_provider
    install_langchain_client
    install_llamaindex_client
    verify_nat_installation
    
    if [ "$SKIP_TEST" != "true" ]; then
        test_installation
    fi
    
    section "Installation Complete"
    log "Ollama provider has been installed successfully!"
    log "Configuration examples available in examples/ directory"
    log "Backup created in $BACKUP_DIR"
    echo
    log "Next steps:"
    echo "  1. Update your config.yml with Ollama settings"
    echo "  2. Test with: nat run --config_file examples/config_openai_compatible.yml --input 'test'"
    echo "  3. See README.md for detailed usage instructions"
}

# Parse command line arguments
COMMAND="install"
SKIP_TEST="false"
BACKUP_ONLY="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        --ollama-url)
            OLLAMA_URL="$2"
            shift 2
            ;;
        --model-name)
            MODEL_NAME="$2"
            shift 2
            ;;
        --no-test)
            SKIP_TEST="true"
            shift
            ;;
        --backup-only)
            BACKUP_ONLY="true"
            shift
            ;;
        install|test|rollback|help)
            COMMAND="$1"
            shift
            ;;
        -h|--help)
            COMMAND="help"
            shift
            ;;
        *)
            error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Execute command
case $COMMAND in
    install)
        if [ "$BACKUP_ONLY" = "true" ]; then
            check_environment
            backup_files
        else
            install_all
        fi
        ;;
    test)
        cd examples
        python test_example.py --ollama-url "$OLLAMA_URL" --model-name "$MODEL_NAME"
        ;;
    rollback)
        rollback
        ;;
    help)
        usage
        ;;
    *)
        error "Unknown command: $COMMAND"
        usage
        exit 1
        ;;
esac