# NVIDIA AI Toolkit Ollama Provider Package

This package provides everything needed to integrate Ollama with NVIDIA AI Toolkit, enabling you to use local Ollama models instead of cloud-based services.

## 🚀 Quick Start

1. **Copy the package to your AI Toolkit project:**
   ```bash
   cp -r ollama_provider /path/to/your/aiqtoolkit/project/
   ```

2. **Run the installation script:**
   ```bash
   cd ollama_provider
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Test the installation:**
   ```bash
   ./setup.sh test
   ```

## 📦 Package Contents

```
ollama_provider/
├── setup.sh                           # Automated installation script
├── README.md                          # This file
├── requirements.txt                   # Python dependencies
├── provider/
│   └── ollama_llm.py                 # Core Ollama provider
├── clients/
│   ├── langchain_client.py           # LangChain integration
│   └── llamaindex_client.py          # LlamaIndex integration
├── examples/
│   ├── config_openai_compatible.yml  # OpenAI-compatible config
│   ├── config_native_ollama.yml      # Native Ollama config
│   └── test_example.py               # Validation test script
└── patches/
    └── register.py.patch             # Provider registration patch
```

## 🔧 Installation Methods

### Automatic Installation (Recommended)

The `setup.sh` script handles everything automatically:

```bash
# Install with default settings
./setup.sh

# Install with custom Ollama server
./setup.sh --ollama-url http://localhost:11434 --model-name llama2:13b

# Install without running tests
./setup.sh --no-test

# Create backup only (for testing)
./setup.sh --backup-only
```

### Manual Installation

If you prefer manual control:

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Copy provider file:**
   ```bash
   cp provider/ollama_llm.py /workspace/src/aiq/llm/
   ```

3. **Update registration:**
   ```bash
   # Add to /workspace/src/aiq/llm/register.py
   from . import ollama_llm
   ```

4. **Install client integrations** (see client files for details)

5. **Reinstall AI Toolkit:**
   ```bash
   cd /workspace && pip install -e .
   ```

## ⚙️ Configuration

### OpenAI-Compatible Method (Recommended)

Use Ollama's built-in OpenAI-compatible API:

```yaml
llms:
  ollama_llm:
    _type: openai
    base_url: http://192.168.8.21:11434/v1  # Note the /v1 suffix
    api_key: "not-needed"                    # Ollama doesn't need API keys
    model_name: gpt-oss:20b
    temperature: 0.0
    max_tokens: 512
```

### Native Ollama Provider Method

Use the custom Ollama provider:

```yaml
llms:
  ollama_llm:
    _type: ollama                    # Use native provider
    base_url: http://192.168.8.21:11434  # No /v1 suffix
    model_name: gpt-oss:20b
    temperature: 0.0
    max_tokens: 512
```

## 🧪 Testing and Validation

### Run Full Test Suite

```bash
python examples/test_example.py
```

### Test Specific Components

```bash
# Test with custom Ollama server
python examples/test_example.py --ollama-url http://localhost:11434

# Test with different model
python examples/test_example.py --model-name llama2:13b
```

### Manual Testing

```bash
# Check provider registration
aiq info components -t llm_provider

# Check client registration  
aiq info components -t llm_client

# Test with configuration
aiq run --config_file examples/config_openai_compatible.yml --input "Hello world"
```

## 🔄 Rollback and Recovery

### Automatic Rollback

```bash
./setup.sh rollback
```

### Manual Rollback

If you need to remove the Ollama provider:

1. Remove provider file:
   ```bash
   rm /workspace/src/aiq/llm/ollama_llm.py
   ```

2. Remove import from register.py:
   ```bash
   # Remove line: from . import ollama_llm
   ```

3. Reinstall AI Toolkit:
   ```bash
   cd /workspace && pip install -e .
   ```

## 📋 Prerequisites

- Running NVIDIA AI Toolkit container
- Access to Ollama server (local or remote)
- Ollama model downloaded and available
- Python 3.8+ with pip

### Ollama Setup

Ensure your Ollama server is running and has the required model:

```bash
# Check Ollama status
curl http://192.168.8.21:11434/api/tags

# Pull model if needed
ollama pull gpt-oss:20b

# Test OpenAI compatibility
curl http://192.168.8.21:11434/v1/models
```

## 🔍 Troubleshooting

### Common Issues

1. **"Connection refused" errors**
   - Verify Ollama server is running: `curl http://your-ollama-url:11434/api/tags`
   - Check firewall settings
   - Ensure correct IP address and port

2. **"Model not found" errors**
   - List available models: `curl http://your-ollama-url:11434/api/tags`
   - Pull required model: `ollama pull model-name`

3. **"Provider not registered" errors**
   - Run setup script: `./setup.sh`
   - Check registration: `aiq info components -t llm_provider`
   - Restart container if needed

4. **Import errors**
   - Install dependencies: `pip install -r requirements.txt`
   - Reinstall AI Toolkit: `cd /workspace && pip install -e .`

### Debug Commands

```bash
# Check Ollama connectivity
curl -X GET http://192.168.8.21:11434/api/tags

# Test OpenAI endpoint
curl -X GET http://192.168.8.21:11434/v1/models

# List AI Toolkit providers
aiq info components -t llm_provider | grep -i ollama

# List AI Toolkit clients
aiq info components -t llm_client | grep -i ollama

# Check Python dependencies
pip list | grep -E "(ollama|langchain|llama)"
```

## 📚 Usage Examples

### Basic Chat Completion

```yaml
workflow:
  _type: react_agent
  llm_name: ollama_llm
  tool_names: []

llms:
  ollama_llm:
    _type: openai
    base_url: http://192.168.8.21:11434/v1
    api_key: "not-needed"
    model_name: gpt-oss:20b
```

### Multiple Models Configuration

```yaml
llms:
  ollama_large:
    _type: openai
    base_url: http://192.168.8.21:11434/v1
    api_key: "not-needed"
    model_name: gpt-oss:20b
    
  ollama_small:
    _type: openai  
    base_url: http://192.168.8.21:11434/v1
    api_key: "not-needed"
    model_name: gemma2:2b
```

### With Custom Functions

```yaml
functions:
  my_function:
    _type: my_custom_function
    llm: ollama_llm

workflow:
  _type: react_agent
  tool_names:
    - my_function
  llm_name: ollama_llm
```

## 🔧 Advanced Configuration

### Environment Variables

Set these in your environment or shell:

```bash
export OLLAMA_URL="http://192.168.8.21:11434"
export MODEL_NAME="gpt-oss:20b"
```

### Performance Tuning

```yaml
llms:
  ollama_llm:
    _type: openai
    base_url: http://192.168.8.21:11434/v1
    api_key: "not-needed"
    model_name: gpt-oss:20b
    temperature: 0.0        # Deterministic outputs
    max_tokens: 1024        # Adjust based on use case
    top_p: 0.9             # Nucleus sampling
```

### Security Considerations

- **Network Security:** Ensure Ollama server is only accessible from trusted networks
- **Resource Management:** Monitor GPU/CPU usage with multiple concurrent requests
- **Model Validation:** Verify model integrity and sources

## 🤝 Support and Contributions

### Getting Help

1. **Check the troubleshooting section above**
2. **Run the test suite:** `python examples/test_example.py`
3. **Check AI Toolkit documentation:** [NVIDIA AI Toolkit](https://docs.nvidia.com/aiqtoolkit/)
4. **Review Ollama documentation:** [Ollama Docs](https://ollama.ai/docs)

### Contributing

To improve this package:

1. **Test thoroughly** with different models and configurations
2. **Update documentation** for new features or changes
3. **Add validation** for edge cases
4. **Optimize performance** for your specific use case

## 📜 License

This package inherits the Apache 2.0 license from NVIDIA AI Toolkit.

```
SPDX-FileCopyrightText: Copyright (c) 2024-2025, NVIDIA CORPORATION & AFFILIATES. 
All rights reserved.
SPDX-License-Identifier: Apache-2.0
```

## 🏷️ Version Information

- **Package Version:** 1.0.0
- **AI Toolkit Compatibility:** 1.1.0+
- **Ollama Compatibility:** 0.5.0+
- **Python:** 3.8+

## 📝 Changelog

### Version 1.0.0 (Initial Release)
- ✅ OpenAI-compatible integration (recommended method)
- ✅ Native Ollama provider implementation  
- ✅ LangChain and LlamaIndex client support
- ✅ Automated installation and testing
- ✅ Configuration examples and documentation
- ✅ Rollback and recovery capabilities

---

**Happy building with Ollama and NVIDIA AI Toolkit! 🚀**