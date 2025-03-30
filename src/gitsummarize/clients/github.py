import asyncio
import base64
from itertools import batched
import logging
from pathlib import Path
from textwrap import dedent
import zipfile
import aiohttp
from typing import Dict, List

from gitsummarize.constants.constants import VALID_FILE_EXTENSIONS
from gitsummarize.exceptions.exceptions import (
    GitHubAccessError,
    GitHubNotFoundError,
    GitHubRateLimitError,
    GitHubTreeError,
)

logger = logging.getLogger(__name__)


class GithubClient:
    def __init__(self, token: str):
        self.token = token
        self.headers = {"Authorization": f"Bearer {self.token}"}

    async def get_all_content_from_url(self, gh_url: str) -> str:
        owner, repo = self._parse_gh_url(gh_url)
        zip_path = await self.download_repository_zip(owner, repo)
        return await self.get_all_content_from_zip(zip_path)

    async def get_directory_structure_from_url(self, gh_url: str) -> str:
        owner, repo = self._parse_gh_url(gh_url)
        return await self.get_directory_structure(owner, repo)

    async def get_all_content_from_zip(self, path: Path) -> str:
        with zipfile.ZipFile(path, "r") as zip_ref:
            valid_files = [
                file
                for file in zip_ref.namelist()
                if file.endswith(VALID_FILE_EXTENSIONS)
            ]

            formatted_content = []
            for file in valid_files:
                try:
                    decoded_content = zip_ref.read(file).decode("utf-8")
                except UnicodeDecodeError:
                    logger.warning(f"Failed to decode content for file: {file}")
                    continue
                formatted_content.append(
                    self._get_formatted_content(
                        self._get_file_name_from_zip_name(file),
                        decoded_content,
                    )
                )

            return "\n\n".join(formatted_content)

    async def download_repository_zip(self, owner: str, repo: str) -> Path:
        url = f"https://api.github.com/repos/{owner}/{repo}/zipball"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers) as response:
                with open(f"/tmp/{repo}.zip", "wb") as f:
                    f.write(await response.content.read())
        return Path(f"/tmp/{repo}.zip")

    async def get_directory_structure(self, owner: str, repo: str) -> str:
        """Get the directory structure of a repository in a tree-like format."""
        default_branch = await self._get_default_branch(owner, repo)
        latest_commit = await self._get_latest_commit(owner, repo, default_branch)
        tree_sha = await self._get_tree_sha(owner, repo, latest_commit)

        url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers) as response:
                await self._raise_for_status(owner, repo, response)
                try:
                    data = await response.json()
                except Exception as e:
                    logger.error(f"Error parsing JSON response: {e}")
                    raise GitHubTreeError(owner, repo)

        # Build directory structure
        structure = self._build_directory_structure(data["tree"])
        return self._format_directory_structure(structure)

    async def get_popular_repos(self, num_repos: int = 1000) -> list[dict]:
        items = []
        page = 1
        per_page = min(100, num_repos)  # GitHub max per page is 100
        remaining = num_repos

        while remaining > 0:
            current_per_page = min(per_page, remaining)
            url = f"https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&page={page}&per_page={current_per_page}"

            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=self.headers) as response:
                    await self._raise_for_status("search", "repositories", response)
                    data = await response.json()

                    if not data.get("items"):
                        break

                    items.extend(data["items"])
                    if len(data["items"]) < current_per_page:
                        break

                    remaining -= len(data["items"])
                    page += 1

                    if len(items) >= num_repos:
                        break
                    print(f"Fetched {len(items)} repos so far")
                    await asyncio.sleep(1)

        return items[:num_repos]  # Ensure we don't return more than requested

    def _parse_gh_url(self, gh_url: str) -> tuple[str, str]:
        """Parse a GitHub URL into owner, repo, and path."""
        # Remove the protocol part if present
        gh_url = gh_url.replace("https://", "").replace("http://", "")

        # Split by '/' and take the last two parts
        parts = gh_url.split("/")
        if len(parts) < 2:
            raise ValueError("Invalid GitHub URL")
        owner = parts[-2]
        repo = parts[-1]
        return owner, repo

    def _get_file_name_from_zip_name(self, zip_name: str) -> str:
        zip_name = zip_name.split("/")
        root_dir = zip_name[0]
        return "-".join(root_dir.split("-")[1:-1]) + "/" + "/".join(zip_name[1:])

    async def _raise_for_status(
        self, owner: str, repo: str, response: aiohttp.ClientResponse
    ):
        if response.status == 404:
            raise GitHubNotFoundError(owner, repo)
        elif response.status in (429, 403):
            raise GitHubRateLimitError(owner, repo)
        elif response.status != 200:
            raise GitHubAccessError(owner, repo)

    async def _get_default_branch(self, owner: str, repo: str) -> str:
        url = f"https://api.github.com/repos/{owner}/{repo}"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers) as response:
                data = await response.json()
                return data["default_branch"]

    async def _get_latest_commit(self, owner: str, repo: str, branch: str) -> str:
        url = f"https://api.github.com/repos/{owner}/{repo}/commits/{branch}"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers) as response:
                data = await response.json()
                return data["sha"]

    async def _get_tree_sha(self, owner: str, repo: str, commit_sha: str) -> str:
        url = f"https://api.github.com/repos/{owner}/{repo}/commits/{commit_sha}"
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=self.headers) as response:
                data = await response.json()
                return data["commit"]["tree"]["sha"]

    def _build_directory_structure(self, tree: List[Dict]) -> Dict:
        """Build a nested dictionary representing the directory structure."""
        structure = {}
        for item in tree:

            path_parts = item["path"].split("/")
            current = structure
            for i, part in enumerate(path_parts[:-1]):
                if part not in current:
                    current[part] = {}
                current = current[part]
            if path_parts[-1]:  # Don't add empty string for root
                current[path_parts[-1]] = item
        return structure

    def _format_directory_structure(
        self, structure: Dict, prefix: str = "", is_last: bool = True
    ) -> str:
        """Format the directory structure into a tree-like string."""
        if not isinstance(structure, dict):
            return ""

        lines = []
        items = sorted(structure.items())
        for i, (name, value) in enumerate(items):
            is_last_item = i == len(items) - 1
            connector = "└── " if is_last_item else "├── "
            if isinstance(value, dict) and value["type"] == "tree":
                # Directory
                lines.append(f"{prefix}{connector}{name}/")
                new_prefix = prefix + ("    " if is_last_item else "│   ")
                lines.append(
                    self._format_directory_structure(value, new_prefix, is_last_item)
                )
            elif isinstance(value, dict) and value["type"] == "blob":
                lines.append(f"{prefix}{connector}{name}")

        return "\n".join(lines)

    def _get_formatted_content(self, path: str, content: str) -> str:
        return dedent(
            f"""
=============================================================================
File: {path}
=============================================================================
{content}
"""
        )
