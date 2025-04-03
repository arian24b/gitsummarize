from gitsummarize.model.repo_metadata import RepoMetadata
from supabase import create_client, Client


class SupabaseClient:
    def __init__(self, url: str, key: str):
        self.client = create_client(supabase_url=url, supabase_key=key)

    def insert_repo_summary(self, repo_url: str, business_summary: str, technical_documentation: str):
        self.client.table("repo_summaries").insert({
            "repo_url": repo_url,
            "business_summary": business_summary,
            "technical_documentation": technical_documentation
        }).execute()

    def check_repo_url_exists(self, repo_url: str) -> str | None:
        response = self.client.table("repo_summaries").select("repo_url").eq("repo_url", repo_url).execute()
        if len(response.data) == 0:
            return None
        return response.data[0]

    def get_all_repo_urls(self) -> list[str]:
        response = self.client.table("repo_summaries").select("repo_url").execute()
        return [row["repo_url"] for row in response.data]

    def upsert_repo_metadata(self, repo_url: str, metadata: RepoMetadata):
        self.client.table("repo_metadata").upsert({
            "repo_url": repo_url,
            "num_stars": metadata.num_stars,
            "num_forks": metadata.num_forks,
            "language": metadata.language,
            "description": metadata.description
        }, on_conflict="repo_url").execute()
