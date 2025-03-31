RESOURCE_REPO_PROMPT = """
You are a helpful assistant that determines if a repository is a codebase or just a resource repository (collection of resources).
For example, react, pytorch, etc. are codebases, but free-programmin-books, awesome-python, etc. are resource repositories.

Here is info about the repository:

{repo_info}

Please determine if this is a codebase or a resource repository.
"""
