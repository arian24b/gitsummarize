import asyncio
import base64
from itertools import batched
import logging
from textwrap import dedent
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
        return await self.get_all_content(owner, repo)

    async def get_directory_structure_from_url(self, gh_url: str) -> str:
        owner, repo = self._parse_gh_url(gh_url)
        return await self.get_directory_structure(owner, repo)

    async def get_all_content(
        self, owner: str, repo: str, max_file_size_bytes: int = 50 * 1024
    ) -> str:
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

        tree = self._get_filtered_tree(data, max_file_size_bytes)

        semaphore = asyncio.Semaphore(5)

        async def fetch_with_semaphore(item):
            async with semaphore:
                return await self._get_content(item["url"], item["path"])

        tasks = [fetch_with_semaphore(item) for item in tree]
        results = await asyncio.gather(*[task for task in tasks if task is not None])

        return "\n\n".join(results)

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

    def _get_filtered_tree(self, data: dict, max_file_size_bytes: int) -> list[dict]:
        return [
            item
            for item in data["tree"]
            if item["type"] == "blob" and item["size"] <= max_file_size_bytes
            and item["path"].endswith(tuple(VALID_FILE_EXTENSIONS))
        ]

    async def _get_content(self, blob_url: str, path: str) -> str | None:
        async with aiohttp.ClientSession() as session:
            async with session.get(blob_url, headers=self.headers) as response:
                data = await response.json()
        try:
            decoded_content = base64.b64decode(data["content"]).decode("utf-8")
        except UnicodeDecodeError as e:  # TODO: Handle binary files
            logger.error(f"Error decoding content: {e}")
            return None

        return dedent(
            f"""
            =============================================================================
            File: {path}
            =============================================================================
            {decoded_content}\n
            """
        )

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
