import asyncio
from itertools import batched
from gitsummarize.clients.github import GithubClient

from dotenv import load_dotenv
import os

from gitsummarize.clients.openai import OpenAIClient

load_dotenv()
openai_client = OpenAIClient(os.getenv("OPENAI_API_KEY"))


async def main():
    gh = GithubClient(os.getenv("GITHUB_TOKEN"))
    # Get up to 500 popular repositories
    repos = await gh.get_popular_repos(num_repos=1000)    
    non_resource_repos = await filter_resource_repos(repos)
    print(non_resource_repos)


async def filter_resource_repos(repos: list[dict]) -> list[dict]:
    non_resource_repos = []
    for repos_batch in batched(repos, 100):
        tasks = [openai_client.get_is_resource_repo(str(repo)) for repo in repos_batch]
        results = await asyncio.gather(*tasks)
        for i, result in enumerate(results):
            if not result.is_resource_repo:
                non_resource_repos.append(repos_batch[i])
    return non_resource_repos



if __name__ == "__main__":
    asyncio.run(main())
