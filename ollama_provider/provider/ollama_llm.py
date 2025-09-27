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

from pydantic import AliasChoices
from pydantic import ConfigDict
from pydantic import Field
from pydantic import PositiveInt

from aiq.builder.builder import Builder
from aiq.builder.llm import LLMProviderInfo
from aiq.cli.register_workflow import register_llm_provider
from aiq.data_models.llm import LLMBaseConfig
from aiq.data_models.retry_mixin import RetryMixin


class OllamaModelConfig(LLMBaseConfig, RetryMixin, name="ollama"):
    """An Ollama LLM provider to be used with an LLM client."""

    model_config = ConfigDict(protected_namespaces=())

    base_url: str = Field(default="http://localhost:11434", description="Base url to the Ollama server.")
    model_name: str = Field(validation_alias=AliasChoices("model_name", "model"),
                            serialization_alias="model",
                            description="The model name for Ollama.")
    temperature: float = Field(default=0.0, description="Sampling temperature in [0, 1].")
    top_p: float = Field(default=1.0, description="Top-p for distribution sampling.")
    max_tokens: PositiveInt = Field(default=300, description="Maximum number of tokens to generate.")


@register_llm_provider(config_type=OllamaModelConfig)
async def ollama_model(llm_config: OllamaModelConfig, builder: Builder):

    yield LLMProviderInfo(config=llm_config, description="An Ollama model for use with an LLM client.")