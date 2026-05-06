# Cloning_CLI

A Next.js-based website cloning agent dashboard that accepts a website prompt, resolves the target URL, fetches page data, captures a screenshot, extracts structure/design hints, and generates a simplified HTML/CSS/JS landing-page clone with live preview.

## Live Demo

https://cloning-cli.vercel.app/

## Screenshots

![Dashboard idle / initial state](docs/images/dashboard-idle.png)

![Agent run completed with generated files](docs/images/dashboard-result.png)

![Generated Scaler-style preview](docs/images/generated-preview.png)

## Features

- Cursor-style agent dashboard
- Visible `START` / `THINK` / `TOOL` / `OBSERVE` / `OUTPUT` loop
- URL resolution from natural language prompts
- Website HTML/CSS extraction
- Screenshot capture via Microlink
- Screenshot + extracted structure grounded generation
- Generates `index.html`, `styles.css`, and `script.js`
- Live preview and fullscreen preview
- Code viewer for generated files
- Copy/download exports
- Local fallback if model generation fails

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Vercel
- Microlink screenshot API
- LLM provider integration

The current implementation can use a configured multimodal LLM through environment variables. The generation layer is provider-swappable and can be adapted for Gemini, GPT, Claude/Anthropic, or other multimodal-capable models.

## How It Works

1. User enters a website cloning prompt.
2. The app resolves the target website URL.
3. The backend fetches HTML and linked CSS.
4. The backend captures a rendered screenshot.
5. The extractor collects nav links, headings, buttons, footer hints, and design tokens.
6. The LLM generates `HTML`, `CSS`, and `JS` in one generation step.
7. The validator checks structure and theme consistency.
8. A local fallback template is used if generation fails.
9. The dashboard renders the live preview and generated files.

## Agent Loop

```text
START
THINK: Resolve target website
TOOL: resolveWebsiteUrl
OBSERVE: URL resolved
THINK: Fetch page data
TOOL: fetchWebsiteHTML
OBSERVE: HTML fetched
THINK: Capture screenshot
TOOL: captureWebsiteScreenshot
OBSERVE: Screenshot captured
THINK: Generate files
TOOL: generateWebsiteFiles
OBSERVE: Files generated
OUTPUT: Preview ready
```

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```bash
GEMINI_API_KEY=
GEMINI_MODEL=
SCREENSHOT_PROVIDER=microlink
```

`GEMINI_MODEL` is used by the current implementation. The generation layer can be adapted for other multimodal providers without changing the dashboard flow.

## Production Build

```bash
npm run build
```

## Deployment

The app is deployed on Vercel.

To deploy your own version:

1. Push the repo to GitHub.
2. Import it into Vercel.
3. Add the required environment variables.
4. Deploy.

## Demo Prompt

```text
Clone Scaler Academy website
```

## Assignment Mapping

| Requirement | Implementation |
| --- | --- |
| Conversational CLI-style agent | Terminal-style dashboard |
| Agent reasoning loop | `START` / `THINK` / `TOOL` / `OBSERVE` / `OUTPUT` trace |
| Tool usage | URL resolver, fetcher, screenshot capture, extractor, generator |
| Output files | HTML, CSS, JS virtual files |
| Scaler landing page clone | Demo prompt generates a Scaler-inspired page |
| Preview | Live iframe preview |
| GitHub/Vercel readiness | Next.js app with production build |
| Documentation | README and screenshots |

## Limitations

- The generated result is a simplified landing-page clone, not a pixel-perfect reproduction.
- Some websites block scraping, CSS fetching, or screenshot capture.
- Dynamic content may not fully reproduce.
- Output quality depends on extracted data, screenshot availability, and the selected model.

## Safety / Design Notes

- No shell execution
- No database
- No authentication
- API keys stay server-side
- Generated files are virtual and downloadable
