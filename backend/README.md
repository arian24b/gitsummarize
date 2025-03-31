# gitsummarize backend

## Setup

Make sure that you have `cd`-ed into `backend`.

1. Create a new Python environment (Python 3.13 or above) using `conda`, `venv`, `pipx`, etc.
2. Install Poetry: `pip install poetry==2.1.2`.
3. Install dependencies: `poetry install`.
4. Create a new `.env` file and copy the contents of `.env.template` to it.
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
