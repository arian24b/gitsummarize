import asyncio
import os
from dotenv import load_dotenv

from src.gitsummarize.clients.github import GithubClient
from src.gitsummarize.clients.google_genai import GoogleGenAI
load_dotenv()

gh = GithubClient(os.getenv("GITHUB_TOKEN"))
google_genai = GoogleGenAI(os.getenv("GEMINI_API_KEY"))

async def main():
    directory_structure = await gh.get_directory_structure_from_url("https://github.com/pallets/flask")
    with open("tmp/directory_structure.txt", "w") as f:
        f.write(directory_structure)
    
    all_content = await gh.get_all_content_from_url("https://github.com/pallets/flask")
    with open("tmp/all_content.txt", "w") as f:
        f.write(all_content)

    await gh.download_repository_zip("octocat", "Hello-World")

    # business_summary = google_genai.get_business_summary(directory_structure, all_content)
    # with open("tmp/business_summary.txt", "w") as f:
    #     f.write(business_summary)

    technical_documentation = google_genai.get_technical_documentation(directory_structure, all_content)
    with open("tmp/technical_documentation.txt", "w") as f:
        f.write(technical_documentation)


if __name__ == "__main__":
    asyncio.run(main())