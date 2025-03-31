import re
from aiohttp import ClientError
from google import genai
from google.genai import types

from gitsummarize.clients.ai_client_abc import AIBaseClient
from gitsummarize.prompts.business_logic import BUSINESS_SUMMARY_PROMPT
from gitsummarize.prompts.technical_documentation import TECHNICAL_DOCUMENTATION_PROMPT

ALLOWED_INPUT_TOKENS_COUNT = 1_048_576
TIMEOUT = 1000 * 60 * 20  # 20 minutes


class GoogleGenAI(AIBaseClient):
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)

    async def get_business_summary(
        self, directory_structure: str, codebase: str
    ) -> str:
        prompt = BUSINESS_SUMMARY_PROMPT.format(
            directory_structure=directory_structure, codebase=codebase
        )
        truncated_prompt = self._truncate_text(prompt, 800_000)
        try:
            response = await self.client.aio.models.generate_content(
                model="gemini-2.5-pro-exp-03-25",
                contents=truncated_prompt,
                config=types.GenerateContentConfig(
                    http_options=types.HttpOptions(
                        timeout=TIMEOUT,
                    ),
                ),
            )
        except Exception as e:
            if e.code == 400 and e.status == "INVALID_ARGUMENT":
                truncated_prompt = self._truncate_text_from_error(truncated_prompt, e)
                response = await self.client.aio.models.generate_content(
                    model="gemini-2.5-pro-exp-03-25",
                    contents=truncated_prompt,
                    config=types.GenerateContentConfig(
                        http_options=types.HttpOptions(
                            timeout=TIMEOUT,
                        ),
                    ),
                )
            else:
                raise e
        return response.text

    async def get_technical_documentation(
        self, directory_structure: str, codebase: str
    ) -> str:
        prompt = TECHNICAL_DOCUMENTATION_PROMPT.format(
            directory_structure=directory_structure, codebase=codebase
        )
        truncated_prompt = self._truncate_text(prompt, 800_000)
        try:
            response = await self.client.aio.models.generate_content(
                model="gemini-2.5-pro-exp-03-25",
                contents=truncated_prompt,
                config=types.GenerateContentConfig(
                    http_options=types.HttpOptions(
                        timeout=TIMEOUT,
                    ),
                ),
            )
        except Exception as e:
            if e.code == 400 and e.status == "INVALID_ARGUMENT":
                truncated_prompt = self._truncate_text_from_error(truncated_prompt, e)
                response = await self.client.aio.models.generate_content(
                    model="gemini-2.5-pro-exp-03-25",
                    contents=truncated_prompt,
                    config=types.GenerateContentConfig(
                        http_options=types.HttpOptions(
                            timeout=TIMEOUT,
                        ),
                    ),
                )
            else:
                raise e

        return response.text

    def _truncate_text_from_error(self, prompt: str, error: ClientError) -> str:
        input_tokens_count = self._extract_input_tokens_count_from_error(error)
        difference = input_tokens_count - ALLOWED_INPUT_TOKENS_COUNT
        if difference > 0:
            prompt = prompt[: -(difference * 4)]
        return prompt

    def _extract_input_tokens_count_from_error(self, error: ClientError) -> int:
        regex = r"The input token count \((\d+)\) exceeds the maximum number"
        match = re.search(regex, error.message)
        if match:
            return int(match.group(1))
        return 0
