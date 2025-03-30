from google import genai
from google.genai import types

from gitsummarize.prompts.business_logic import BUSINESS_SUMMARY_PROMPT
from gitsummarize.prompts.technical_documentation import TECHNICAL_DOCUMENTATION_PROMPT


class GoogleGenAI:
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)

    def get_business_summary(self, directory_structure: str, codebase: str) -> str:
        prompt = BUSINESS_SUMMARY_PROMPT.format(
            directory_structure=directory_structure, codebase=codebase
        )
        response = self.client.models.generate_content(
            model="gemini-2.5-pro-exp-03-25",
            # model="gemini-2.0-flash",
            contents=prompt,
        )
        return response.text
    
    def get_technical_documentation(self, directory_structure: str, codebase: str) -> str:
        prompt = TECHNICAL_DOCUMENTATION_PROMPT.format(
            directory_structure=directory_structure, codebase=codebase
        )
        response = self.client.models.generate_content(
            model="gemini-2.5-pro-exp-03-25",
            contents=prompt,
        )
        return response.text
