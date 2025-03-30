import os
from dotenv import load_dotenv
import requests

load_dotenv()
API_TOKEN = os.getenv("API_TOKEN")


def main():
    with open("tmp/repolist.txt", "r") as f:
        repos = f.readlines()
    for repo in repos:
        url = f"http://0.0.0.0:8000/summarize"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_TOKEN}",
        }
        data = {
            "repo": repo,
        }
        response = requests.post(url, headers=headers, json=data)
        print(response.json())


if __name__ == "__main__":
    main()
