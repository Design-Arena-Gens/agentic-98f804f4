## Manus Agent

Autonomous research analyst that plans investigations, performs deep web reconnaissance, extracts critical evidence, and synthesizes executive-grade reports. Built with Next.js (App Router + Tailwind) and ready for Windows 11 desktop or Vercel deployment.

## Prerequisites

- Node.js 18+
- npm 9+
- API access:
  - `OPENAI_API_KEY` – used for planning, summarising, and report drafting (compatible with GPT‑4o family or drop-in replacements using the OpenAI Chat Completions API).
  - `TAVILY_API_KEY` – web search and document discovery.

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and populate the variables with your keys.

## Local Development

```bash
npm install
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000).

### Desktop Packaging (Windows 11)

Run the app locally in a browser or wrap it using tools like Microsoft Edge WebView2 / Progressive Web App packaging / Electron. The UI is fully responsive and keyboard-accessible.

## Production Build

```bash
npm run build
npm start
```

## Deployment (Vercel)

The project is optimised for Vercel:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-98f804f4
```

Ensure the following environment variables are configured in Vercel:

- `OPENAI_API_KEY`
- `TAVILY_API_KEY`
- (Optional) `OPENAI_MODEL` – override the default `gpt-4o-mini`.

## Key Features

- Prompt-to-plan orchestration with transparent step-by-step trace.
- Tavily-powered discovery and scraping with automated highlight extraction.
- Executive summaries and detailed deliverables with citation trail.
- One-click Markdown export for offline reporting.
- Responsive, keyboard-first interface with dark UI optimised for long research sessions.
