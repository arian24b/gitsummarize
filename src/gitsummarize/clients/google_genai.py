from google import genai
from google.genai import types

from gitsummarize.prompts.business_logic import BUSINESS_SUMMARY_PROMPT
from gitsummarize.prompts.technical_documentation import TECHNICAL_DOCUMENTATION_PROMPT


class GoogleGenAI:
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)

    async def get_business_summary(
        self, directory_structure: str, codebase: str
    ) -> str:
        prompt = BUSINESS_SUMMARY_PROMPT.format(
            directory_structure=directory_structure, codebase=codebase
        )
        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-pro-exp-03-25",
            # model="gemini-1.5-pro",
            contents=self._truncate_text(prompt, 500_000),
        )
        return response.text

    async def get_technical_documentation(
        self, directory_structure: str, codebase: str
    ) -> str:
        prompt = TECHNICAL_DOCUMENTATION_PROMPT.format(
            directory_structure=directory_structure, codebase=codebase
        )
        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-pro-exp-03-25",
            # model="gemini-1.5-pro",
            contents=self._truncate_text(prompt, 500_000),
        )
        return response.text

    # TODO: TPM for free tier is 1M, so we need to truncate the text. Can relax this later.
    def _truncate_text(self, text: str, max_tokens: int) -> str:
        return text[: int(max_tokens * 3.3)]
