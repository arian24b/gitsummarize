# gitsummarize backend

## Setup

Make sure that you have `cd`-ed into `backend`.

1. Install uv: `pip install uv` or follow the [uv installation guide](https://docs.astral.sh/uv/getting-started/installation/).
2. Install dependencies: `uv sync`.
3. Create a new `.env` file and copy the contents of `.env.example` to it.
5. Add your GitHub API key to `.env`.
6. Create a new Supabase project with a table with the following columns:
    ```psql
    id uuid
    repo_url text
    business_summary text
    technical_documentation text
    created_at timestamptz
    ```
7. Add Supabase keys to `.env`.
8. Add Gemini API keys to `.env`. You can add as many keys as you want.
9. Set `API_TOKEN` in `.env` to anything you want (preferably something secure).

## Running
Again, make sure that you have `cd`-ed into `backend`.

Run `fastapi run app.py`. Go to `http://0.0.0.0:8000/docs` to see the OpenAPI documentation.
