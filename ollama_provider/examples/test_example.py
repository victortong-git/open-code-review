#!/usr/bin/env python3
# SPDX-FileCopyrightText: Copyright (c) 2024-2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

"""
Test script for Ollama provider integration.

This script validates that the Ollama provider is properly installed and configured.
"""

import subprocess
import sys
import os
import requests
import json
from typing import Dict, Any


class OllamaProviderTester:
    """Test suite for Ollama provider integration."""
    
    def __init__(self, ollama_url: str = "http://192.168.8.21:11434", model_name: str = "gpt-oss:20b"):
        self.ollama_url = ollama_url
        self.model_name = model_name
        self.results = {}
        
    def test_ollama_server_connectivity(self) -> bool:
        """Test if Ollama server is reachable."""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=10)
            if response.status_code == 200:
                models = response.json().get("models", [])
                model_names = [model.get("name", "") for model in models]
                
                print(f"✅ Ollama server is reachable at {self.ollama_url}")
                print(f"📋 Available models: {', '.join(model_names)}")
                
                if self.model_name in model_names:
                    print(f"✅ Target model '{self.model_name}' is available")
                    return True
                else:
                    print(f"❌ Target model '{self.model_name}' is not available")
                    print(f"💡 Run: ollama pull {self.model_name}")
                    return False
            else:
                print(f"❌ Ollama server returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Cannot connect to Ollama server: {e}")
            print(f"💡 Ensure Ollama is running at {self.ollama_url}")
            return False
    
    def test_openai_compatible_endpoint(self) -> bool:
        """Test OpenAI-compatible endpoint."""
        try:
            response = requests.get(f"{self.ollama_url}/v1/models", timeout=10)
            if response.status_code == 200:
                models = response.json().get("data", [])
                print(f"✅ OpenAI-compatible endpoint is working")
                print(f"📋 Models via /v1/models: {len(models)} available")
                return True
            else:
                print(f"❌ OpenAI endpoint returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ OpenAI-compatible endpoint error: {e}")
            return False
    
    def test_aiq_provider_registration(self) -> bool:
        """Test if Ollama provider is registered in AI Toolkit."""
        try:
            result = subprocess.run(
                ["aiq", "info", "components", "-t", "llm_provider"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                output = result.stdout
                if "ollama" in output.lower():
                    print("✅ Ollama provider is registered in AI Toolkit")
                    return True
                else:
                    print("❌ Ollama provider is not found in AI Toolkit")
                    print("💡 Run the setup.sh script to install the provider")
                    return False
            else:
                print(f"❌ AIQ command failed: {result.stderr}")
                return False
        except subprocess.TimeoutExpired:
            print("❌ AIQ command timed out")
            return False
        except FileNotFoundError:
            print("❌ AIQ command not found. Is AI Toolkit installed?")
            return False
        except Exception as e:
            print(f"❌ Error checking provider registration: {e}")
            return False
    
    def test_aiq_client_registration(self) -> bool:
        """Test if Ollama clients are registered."""
        try:
            result = subprocess.run(
                ["aiq", "info", "components", "-t", "llm_client"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                output = result.stdout
                has_langchain = "ollama" in output.lower() and "langchain" in output.lower()
                has_llamaindex = "ollama" in output.lower() and "llama_index" in output.lower()
                
                if has_langchain and has_llamaindex:
                    print("✅ Ollama clients are registered (LangChain and LlamaIndex)")
                    return True
                elif has_langchain or has_llamaindex:
                    framework = "LangChain" if has_langchain else "LlamaIndex"
                    print(f"⚠️  Only {framework} client is registered")
                    print("💡 Check client installation and registration")
                    return False
                else:
                    print("❌ No Ollama clients found")
                    print("💡 Install dependencies and register clients")
                    return False
            else:
                print(f"❌ AIQ client command failed: {result.stderr}")
                return False
        except Exception as e:
            print(f"❌ Error checking client registration: {e}")
            return False
    
    def test_simple_inference(self) -> bool:
        """Test simple inference with OpenAI-compatible endpoint."""
        try:
            headers = {"Content-Type": "application/json"}
            payload = {
                "model": self.model_name,
                "messages": [
                    {"role": "user", "content": "Say 'Hello from Ollama!' in exactly those words."}
                ],
                "max_tokens": 10,
                "temperature": 0.0
            }
            
            response = requests.post(
                f"{self.ollama_url}/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                print(f"✅ Simple inference test successful")
                print(f"📝 Response: {content.strip()}")
                return True
            else:
                print(f"❌ Inference test failed with status {response.status_code}")
                print(f"📄 Response: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Inference test error: {e}")
            return False
    
    def test_configuration_files(self) -> bool:
        """Test if configuration examples are valid."""
        config_files = [
            "examples/config_openai_compatible.yml",
            "examples/config_native_ollama.yml"
        ]
        
        all_valid = True
        for config_file in config_files:
            if os.path.exists(config_file):
                try:
                    import yaml
                    with open(config_file, 'r') as f:
                        config = yaml.safe_load(f)
                    
                    if "llms" in config and "workflow" in config:
                        print(f"✅ Configuration file {config_file} is valid")
                    else:
                        print(f"❌ Configuration file {config_file} is missing required sections")
                        all_valid = False
                except Exception as e:
                    print(f"❌ Error parsing {config_file}: {e}")
                    all_valid = False
            else:
                print(f"❌ Configuration file {config_file} not found")
                all_valid = False
        
        return all_valid
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all tests and return results."""
        print("🧪 Starting Ollama Provider Integration Tests")
        print("=" * 50)
        
        tests = [
            ("Ollama Server Connectivity", self.test_ollama_server_connectivity),
            ("OpenAI-Compatible Endpoint", self.test_openai_compatible_endpoint),
            ("AIQ Provider Registration", self.test_aiq_provider_registration),
            ("AIQ Client Registration", self.test_aiq_client_registration),
            ("Simple Inference Test", self.test_simple_inference),
            ("Configuration Files", self.test_configuration_files),
        ]
        
        results = {}
        for test_name, test_func in tests:
            print(f"\n🔍 Testing: {test_name}")
            try:
                results[test_name] = test_func()
            except Exception as e:
                print(f"❌ Test failed with exception: {e}")
                results[test_name] = False
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 Test Summary")
        print("=" * 50)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print(f"\n🎯 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Ollama provider is ready to use.")
        else:
            print("⚠️  Some tests failed. Check the output above for details.")
            print("💡 Run ./setup.sh to install missing components.")
        
        return results


def main():
    """Main test runner."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test Ollama provider integration")
    parser.add_argument("--ollama-url", default="http://192.168.8.21:11434", 
                       help="Ollama server URL")
    parser.add_argument("--model-name", default="gpt-oss:20b",
                       help="Ollama model name to test")
    
    args = parser.parse_args()
    
    tester = OllamaProviderTester(args.ollama_url, args.model_name)
    results = tester.run_all_tests()
    
    # Exit with error if any tests failed
    if not all(results.values()):
        sys.exit(1)


if __name__ == "__main__":
    main()