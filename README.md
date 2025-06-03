# 🧠 GitSummarize

<img width="1293" alt="Image" src="https://github.com/user-attachments/assets/c4469d82-fac1-4a47-82a5-00a8efe223c4" />

<div align="center">

## **Generate beautiful, world-class documentation from any GitHub repository — instantly.**

Just replace `hub` with `summarize` in any GitHub URL to generate a live, interactive documentation hub.

https://gitsummarize.com/
</div>

---

## 🚀 Features

GitSummarize analyzes any GitHub repo (public or private) and generates:

- 📄 **System-level architecture overviews**
- 📁 **Per-directory and file summaries**
- 🧠 **Natural language descriptions of purpose, flow, and structure**
- 🔗 **Business Logic and Rules Extraction**
- 📊 **Architecture diagrams and flows**

It’s perfect for onboarding, exploring unfamiliar codebases, and writing technical documentation — all powered by Gemini.

---

## 🧰 Tech Stack

| Area       | Stack |
|------------|-------|
| **Frontend** | Next.js, TypeScript, Tailwind CSS, ShadCN |
| **Backend**  | FastAPI, Python, Server Actions |
| **Database** | PostgreSQL (Supabase) |
| **AI**       | Gemini 2.5 Pro |
| **Analytics**| PostHog |
| **Hosting**  | Vercel (Frontend), Render (Backend) |

---

## 🤔 Why GitSummarize?

We wanted to contribute to open-source projects but found it difficult to understand massive codebases quickly.

GitSummarize automates the hardest part: figuring out *what the code does* and *how it's structured* — giving you useful documentation and high level overview of the codebase.

---

## 🧪 Local Development / Self-Hosting

1. **Clone the repo**
   ```bash
   git clone https://github.com/antarixxx/gitsummarize
   cd gitsummarize
   ```

2. Create a new `.env` file and copy the contents of `.env.template` to it. Fill values

3. **Run the Next.js Project**
    ```bash
    npm run dev
    ```

    You can now access the website at `localhost:3000`.


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

Shoutout to [GitIngest](https://gitingest.com/) and [GitDiagram](https://gitdiagram.com/) for the inspiration and styling.

## 📈 Rate Limits

We are currently hosting it for free with rate limits though this is somewhat likely to change in the future based on Gemini's API policies.

## 🤔 Future Steps

- Expand documentation to cover more topics (Setup, Onboarding Guide)
- Add Architecture Diagrams

## 🛠️ Development Setup

### Quick Start with Docker

The easiest way to get started is using Docker:

```bash
# Clone the repository
git clone https://github.com/antarixxx/gitsummarize.git
cd gitsummarize

# Start development environment
make dev

# Or manually
./deploy.sh deploy dev
```

### Local Development

#### Backend Setup
```bash
cd backend

# Install uv (Python package manager)
pip install uv

# Install dependencies
uv sync

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Run development server
uv run dev
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Available Commands

```bash
# Docker commands
make dev          # Start development environment
make prod         # Start production environment
make test         # Run all tests
make lint         # Run linting
make clean        # Clean up containers

# Backend commands (with uv)
uv run dev        # Start backend with hot reload
uv run test       # Run backend tests
uv run lint       # Lint backend code
uv run format     # Format backend code
uv run typecheck  # Type check backend code

# Frontend commands
npm run dev       # Start frontend with hot reload
npm run build     # Build for production
npm run test      # Run frontend tests
npm run lint      # Lint frontend code
```

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=antarixxx/gitsummarize&type=Date)](https://www.star-history.com/#antarixxx/gitsummarize&Date)
