from openai import AsyncOpenAI
from pydantic import BaseModel

from gitsummarize.clients.ai_client_abc import AIBaseClient
from gitsummarize.prompts.business_logic import BUSINESS_SUMMARY_PROMPT
from gitsummarize.prompts.resource_repo import RESOURCE_REPO_PROMPT
from gitsummarize.prompts.technical_documentation import TECHNICAL_DOCUMENTATION_PROMPT


class IsResourceRepo(BaseModel):
    is_resource_repo: bool
    reason: str


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

    async def get_is_resource_repo(self, repo_info: str) -> IsResourceRepo:
        prompt = RESOURCE_REPO_PROMPT.format(repo_info=repo_info)
        response = await self.client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format=IsResourceRepo,
        )
        return response.choices[0].message.parsed
