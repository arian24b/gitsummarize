from pydantic import BaseModel


class RepoMetadata(BaseModel):
    num_stars: int
    num_forks: int
    language: str | None
    description: str | None
