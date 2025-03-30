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

