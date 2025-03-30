import os
from dotenv import load_dotenv
import requests

from gitsummarize.clients.supabase import SupabaseClient

load_dotenv()
API_TOKEN = os.getenv("API_TOKEN")


def main():
    supabase = SupabaseClient(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_ANON_KEY"))

    with open("tmp/repolist.txt", "r") as f:
        repos = f.readlines()
    for repo in repos:
        repo_summary = supabase.check_repo_url_exists(repo)
        if repo_summary:
            print(f"Repo {repo} already exists")
            continue
        else:
            print(f"Summarizing repo {repo}")

        url = f"http://0.0.0.0:8000/summarize"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_TOKEN}",
        }
        data = {
            "repo_url": repo,
        }

        response = requests.post(url, headers=headers, json=data)
        print(response.json())


if __name__ == "__main__":
    main()
