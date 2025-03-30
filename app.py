import asyncio
import os
from dotenv import load_dotenv

from src.gitsummarize.clients.github import GithubClient

load_dotenv()

gh = GithubClient(os.getenv("GITHUB_TOKEN"))


async def main():
    directory_structure = await gh.get_directory_structure_from_url("https://github.com/fastapi/fastapi")
    with open("tmp/directory_structure.txt", "w") as f:
        f.write(directory_structure)
    
    all_content = await gh.get_all_content("fastapi", "fastapi")
    with open("tmp/all_content.txt", "w") as f:
        f.write(all_content)




if __name__ == "__main__":
    asyncio.run(main())