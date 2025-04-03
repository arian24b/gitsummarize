import asyncio
import logging
from gitsummarize.clients import supabase
from gitsummarize.clients.github import GithubClient
import os

from gitsummarize.exceptions.exceptions import GitHubAccessError

logger = logging.getLogger(__name__)

gh = GithubClient(os.getenv("GITHUB_TOKEN"))
supabase = supabase.SupabaseClient(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ADMIN_KEY"))

async def main():
    repo_urls = supabase.get_all_repo_urls()
    for repo_url in repo_urls:
        try:
            metadata = await gh.get_repo_metadata_from_url(repo_url)
            supabase.upsert_repo_metadata(repo_url, metadata)
        except GitHubAccessError as e:
            logger.error(f"Error updating repo metadata for {repo_url}: {e}")


if __name__ == "__main__":
    asyncio.run(main())
