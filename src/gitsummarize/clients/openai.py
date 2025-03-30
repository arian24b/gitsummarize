from openai import AsyncOpenAI

from gitsummarize.clients.ai_client_abc import AIBaseClient
from gitsummarize.prompts.business_logic import BUSINESS_SUMMARY_PROMPT
from gitsummarize.prompts.technical_documentation import TECHNICAL_DOCUMENTATION_PROMPT


class OpenAIClient(AIBaseClient):
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def get_business_summary(
        self, directory_structure: str, codebase: str
    ) -> str:
        prompt = BUSINESS_SUMMARY_PROMPT.format(
            directory_structure=directory_structure, codebase=codebase
        )
        response = await self.client.chat.completions.create(
            model="o3-mini",
            messages=[
                {"role": "user", "content": self._truncate_text(prompt, 200_000, 4.1)}
            ],
        )
        return response.choices[0].message.content

    async def get_technical_documentation(
        self, directory_structure: str, codebase: str
    ) -> str:
        prompt = TECHNICAL_DOCUMENTATION_PROMPT.format(
            directory_structure=directory_structure, codebase=codebase
        )
        response = await self.client.chat.completions.create(
            model="o3-mini",
            messages=[
                {"role": "user", "content": self._truncate_text(prompt, 200_000, 4.1)}
            ],
        )
        return response.choices[0].message.content
