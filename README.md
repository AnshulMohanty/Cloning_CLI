# Cloning_CLI

A dark Cursor-style workspace that turns a website prompt into generated `HTML`, `CSS`, and `JS` files. The app resolves a target URL, fetches website HTML/CSS, captures a Microlink screenshot, extracts structural and design-token hints, makes one multimodal Gemini generation attempt, validates the result, and falls back to a local template when needed.

## Features

- Fixed developer-tool dashboard with an agent terminal, live preview, file selector, and code viewer.
- URL resolution from prompts like `Clone Scaler Academy website` or `Clone https://stripe.com`.
- Real website HTML fetching and Cheerio-based structure extraction.
- Automatic Microlink public screenshot capture for visual grounding.
- One Gemini multimodal call per agent run for `index.html`, `styles.css`, and `script.js`.
- Screenshot plus extracted HTML/CSS text, layout, color, typography, and theme hints are used together in the same generation call.
- Validation for generated files before rendering.
- Local fallback template if Gemini is unavailable, misconfigured, or returns invalid output.
- Virtual generated files only, with copy and download actions.
- Live preview iframe, fullscreen preview modal, and open-in-new-tab support.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Cheerio
- Google Gemini via `@google/genai`
- Vercel-ready, no database, no authentication

## Agent Loop

The agent runs as a deterministic server-driven phase loop:

1. Resolve the target URL from the user prompt.
2. Fetch the target website HTML with timeout and redirect handling.
3. Capture a rendered screenshot with Microlink when enabled.
4. Extract compact structure, text, linked-CSS hints, colors, typography, and theme tokens with Cheerio.
5. Call Gemini exactly once with the screenshot image when available plus extracted data to generate `html`, `css`, and `js`.
6. Validate the generated website files.
7. Use the local fallback template if Gemini fails or validation fails.
8. Convert output into virtual files.
9. Build and render the live preview.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create `.env` from `.env.example`:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
SCREENSHOT_PROVIDER=microlink
```

If `GEMINI_API_KEY` is missing, Gemini is temporarily unavailable, screenshot capture fails, or validation rejects the generated output, the app still works using the local fallback template.

## Deploy To Vercel

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Add `GEMINI_API_KEY`, `GEMINI_MODEL`, and `SCREENSHOT_PROVIDER` in Vercel project settings.
4. Deploy.

## Demo Prompt

```text
Clone Scaler Academy website
```

Other examples:

```text
Clone https://stripe.com
Create a simple clone of Notion homepage
Clone Zerodha landing page
```

## Assignment Mapping

- Agent loop and reasoning: terminal phases show URL resolution, fetching, extraction, generation, validation, and output.
- Tool calls: each tool phase is represented in the trace.
- Generated HTML/CSS/JS: files are shown in the code viewer and can be copied or downloaded.
- Header/Hero/Footer: generated and fallback templates include these sections.
- GitHub repo: project is structured for review and deployment.
- YouTube demo: dashboard is demo-ready with live preview and fullscreen mode.
- Code quality/documentation: typed modules, clean component boundaries, README, and environment example.

## Safety Notes

- The app does not execute generated shell commands.
- Generated outputs are virtual files in browser/server state.
- API keys are read only on the server and are never exposed to client components.
- Gemini is called at most once per agent run.
- Fallback generation keeps the app reliable when Gemini fails.
