# SPDX-FileCopyrightText: Copyright (c) 2024-2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
LangChain client integration for Ollama provider.

This file should be integrated into the existing LangChain plugin file:
/workspace/packages/nvidia_nat_langchain/src/aiq/plugins/langchain/llm.py

Add the import and function below to the existing file.
"""

from aiq.builder.builder import Builder
from aiq.builder.framework_enum import LLMFrameworkEnum
from aiq.cli.register_workflow import register_llm_client
from aiq.data_models.retry_mixin import RetryMixin
from aiq.llm.ollama_llm import OllamaModelConfig
from aiq.utils.exception_handlers.automatic_retries import patch_with_retry


@register_llm_client(config_type=OllamaModelConfig, wrapper_type=LLMFrameworkEnum.LANGCHAIN)
async def ollama_langchain(llm_config: OllamaModelConfig, builder: Builder):
    """Register Ollama client for LangChain framework."""
    
    from langchain_ollama import ChatOllama

    client = ChatOllama(**llm_config.model_dump(exclude={"type"}, by_alias=True))

    if isinstance(llm_config, RetryMixin):
        client = patch_with_retry(client,
                                  retries=llm_config.num_retries,
                                  retry_codes=llm_config.retry_on_status_codes,
                                  retry_on_messages=llm_config.retry_on_errors)

    yield client