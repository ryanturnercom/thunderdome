# Turner's Thunderdome

> Multiple Models Enter, One Model Leaves

An internal web app for prompt engineers to run prompts against multiple LLMs in parallel, view streaming responses, and get AI-powered comparison analysis.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment file:
   ```bash
   cp .env.example .env
   ```

3. Add your API keys to `.env`

4. Run development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, shadcn/ui, Tailwind CSS v4
- **Auth**: iron-session
- **APIs**: OpenAI, Anthropic, Google AI (Gemini)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| AUTH_PASSWORD | Yes | Shared password for access |
| SESSION_SECRET | Yes | 32+ character secret for sessions |
| OPENAI_API_KEY | No* | OpenAI API key |
| ANTHROPIC_API_KEY | No* | Anthropic API key |
| GOOGLE_AI_API_KEY | No* | Google AI API key |

*At least one provider API key is required for the app to function.

## Project Structure

```
src/
  app/
    layout.tsx      # Root layout with header/footer
    page.tsx        # Main page (arena)
    api/            # Route handlers
  components/
    ui/             # shadcn/ui components
    header.tsx      # Site header
    footer.tsx      # Site footer
  lib/
    env.ts          # Environment variable utilities
    utils.ts        # General utilities
public/
  logo.png          # Thunderdome logo
```
