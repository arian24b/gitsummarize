class GitHubAccessError(Exception):
    def __init__(self, owner: str, repo: str):
        self.message = f"Failed to access GitHub repository {owner}/{repo}"
        super().__init__(self.message)


class GitHubRateLimitError(GitHubAccessError):
    def __init__(self, owner: str, repo: str):
        self.message = f"GitHub rate limit exceeded for repository {owner}/{repo}"
        super().__init__(owner, repo)


class GitHubNotFoundError(GitHubAccessError):
    def __init__(self, owner: str, repo: str):
        self.message = f"Repository {owner}/{repo} not found"
        super().__init__(owner, repo)


class GitHubTreeError(GitHubAccessError):
    def __init__(self, owner: str, repo: str):
        self.message = f"Failed to get tree for repository {owner}/{repo}"
        super().__init__(owner, repo)
