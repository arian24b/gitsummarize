import asyncio
from gitsummarize.clients import supabase
from gitsummarize.clients.github import GithubClient
import os

gh = GithubClient(os.getenv("GITHUB_TOKEN"))
supabase = supabase.SupabaseClient(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ADMIN_KEY"))

async def main():
    repo_urls = supabase.get_all_repo_urls()
    for repo_url in repo_urls:
        metadata = await gh.get_repo_metadata_from_url(repo_url)
        supabase.upsert_repo_metadata(repo_url, metadata)


if __name__ == "__main__":
    asyncio.run(main())
