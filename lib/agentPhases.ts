import { randomUUID } from "crypto";
import { extractWebsiteSections } from "@/lib/extractor";
import { generateWebsiteFiles } from "@/lib/gemini";
import { buildPreviewHtml } from "@/lib/preview";
import { resolveWebsiteUrl } from "@/lib/urlResolver";
import { captureWebsiteScreenshot } from "@/lib/screenshot";
import { fetchLinkedStylesheets, fetchWebsiteHTML } from "@/lib/websiteFetcher";
import type {
  AgentPhase,
  AgentStep,
  AgentStepRequest,
  AgentStepResponse,
  VirtualFile
} from "@/lib/types";

function createStep(
  phase: AgentPhase,
  type: AgentStep["type"],
  content: string,
  details?: Pick<AgentStep, "toolName" | "toolInput" | "toolOutput">
): AgentStep {
  return {
    id: `${phase}-${type.toLowerCase()}-${randomUUID()}`,
    type,
    content,
    timestamp: new Date().toISOString(),
    ...details
  };
}

function response(
  input: AgentStepRequest,
  nextPhase: AgentPhase,
  newSteps: AgentStep[],
  updates: Partial<Omit<AgentStepResponse, "nextPhase" | "newSteps" | "isComplete">> = {},
  isComplete = false
): AgentStepResponse {
  return {
    nextPhase,
    newSteps,
    files: updates.files ?? input.files,
    resolvedUrl: updates.resolvedUrl ?? input.resolvedUrl,
    rawHtml: updates.rawHtml ?? input.rawHtml,
    stylesheets: updates.stylesheets ?? input.stylesheets,
    screenshot: updates.screenshot ?? input.screenshot,
    extractedSections: updates.extractedSections ?? input.extractedSections,
    previewHtml: updates.previewHtml,
    isComplete
  };
}

function safeHostname(url?: string): string {
  if (!url) {
    return "Generated Site";
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Generated Site";
  }
}

function fallbackHtml(url: string): string {
  const hostname = safeHostname(url);

  return `<!doctype html>
<html lang="en">
  <head>
    <title>${hostname} landing page</title>
    <meta name="description" content="Fallback structural hints for ${hostname}." />
  </head>
  <body>
    <header>
      <a class="brand">${hostname}</a>
      <nav>
        <a>Product</a>
        <a>Solutions</a>
        <a>Pricing</a>
        <a>Contact</a>
      </nav>
    </header>
    <main>
      <h1>Build better with ${hostname}</h1>
      <h2>Fast onboarding</h2>
      <h2>Powerful workflows</h2>
      <button>Get started</button>
      <a>Book a demo</a>
    </main>
    <footer>
      <a>Company</a>
      <a>Resources</a>
      <a>Support</a>
    </footer>
  </body>
</html>`;
}

function toVirtualFiles(files: { html: string; css: string; js: string }): VirtualFile[] {
  return [
    {
      path: "generated-site/index.html",
      language: "html",
      content: files.html
    },
    {
      path: "generated-site/styles.css",
      language: "css",
      content: files.css
    },
    {
      path: "generated-site/script.js",
      language: "javascript",
      content: files.js
    }
  ];
}

export async function getNextDeterministicAgentStep(
  input: AgentStepRequest
): Promise<AgentStepResponse> {
  switch (input.phase) {
    case "idle":
    case "start":
      return response(input, "think_resolve_url", [
        createStep("start", "START", `User asked: ${input.userInput || "Clone a website for me"}`)
      ]);

    case "think_resolve_url":
      return response(input, "tool_resolve_url", [
        createStep("think_resolve_url", "THINK", "I need to resolve the requested website target.")
      ]);

    case "tool_resolve_url":
      return response(input, "observe_resolve_url", [
        createStep("tool_resolve_url", "TOOL", "resolveWebsiteUrl(userInput)", {
          toolName: "resolveWebsiteUrl",
          toolInput: { userInput: input.userInput }
        })
      ]);

    case "observe_resolve_url": {
      const resolvedUrl = resolveWebsiteUrl(input.userInput);

      return response(
        input,
        "think_fetch",
        [
          createStep("observe_resolve_url", "OBSERVE", `Resolved target URL: ${resolvedUrl}`, {
            toolOutput: { resolvedUrl }
          })
        ],
        { resolvedUrl }
      );
    }

    case "think_fetch":
      return response(input, "tool_fetch", [
        createStep("think_fetch", "THINK", "I need to fetch the target website HTML.")
      ]);

    case "tool_fetch": {
      const resolvedUrl = input.resolvedUrl ?? resolveWebsiteUrl(input.userInput);

      return response(
        input,
        "observe_fetch",
        [
          createStep("tool_fetch", "TOOL", `fetchWebsiteHTML("${resolvedUrl}")`, {
            toolName: "fetchWebsiteHTML",
            toolInput: { url: resolvedUrl }
          })
        ],
        { resolvedUrl }
      );
    }

    case "observe_fetch": {
      const resolvedUrl = input.resolvedUrl ?? resolveWebsiteUrl(input.userInput);
      const fetchResult = await fetchWebsiteHTML(resolvedUrl);
      const rawHtml =
        fetchResult.success && fetchResult.html ? fetchResult.html : fallbackHtml(fetchResult.url);
      const stylesheets =
        fetchResult.success && fetchResult.html
          ? await fetchLinkedStylesheets(rawHtml, fetchResult.url)
          : [];
      const content = fetchResult.success
        ? `Fetched HTML from ${fetchResult.url}.`
        : `${fetchResult.message} Using fallback HTML for deterministic extraction.`;

      return response(
        input,
        "think_screenshot",
        [
          createStep("observe_fetch", "OBSERVE", content, {
            toolOutput: {
              success: fetchResult.success,
              url: fetchResult.url,
              message: fetchResult.message,
              bytes: rawHtml.length,
              stylesheets: stylesheets.length
            }
          })
        ],
        { resolvedUrl: fetchResult.url, rawHtml, stylesheets }
      );
    }

    case "think_screenshot":
      return response(input, "tool_screenshot", [
        createStep(
          "think_screenshot",
          "THINK",
          "I need a rendered screenshot so the clone can match the real visual layout and theme."
        )
      ]);

    case "tool_screenshot": {
      const resolvedUrl = input.resolvedUrl ?? resolveWebsiteUrl(input.userInput);

      return response(
        input,
        "observe_screenshot",
        [
          createStep("tool_screenshot", "TOOL", `captureWebsiteScreenshot("${resolvedUrl}")`, {
            toolName: "captureWebsiteScreenshot",
            toolInput: { url: resolvedUrl }
          })
        ],
        { resolvedUrl }
      );
    }

    case "observe_screenshot": {
      const resolvedUrl = input.resolvedUrl ?? resolveWebsiteUrl(input.userInput);
      const screenshot = await captureWebsiteScreenshot(resolvedUrl);
      const content = screenshot.success
        ? "Captured website screenshot for visual reference."
        : `Screenshot capture failed, continuing with HTML/CSS extraction only: ${screenshot.message}`;

      return response(
        input,
        "think_extract",
        [
          createStep("observe_screenshot", "OBSERVE", content, {
            toolOutput: {
              success: screenshot.success,
              provider: screenshot.provider,
              imageUrl: screenshot.imageUrl,
              mimeType: screenshot.mimeType,
              hasBase64: Boolean(screenshot.imageBase64),
              message: screenshot.message
            }
          })
        ],
        { resolvedUrl, screenshot }
      );
    }

    case "think_extract":
      return response(input, "tool_extract", [
        createStep("think_extract", "THINK", "I should extract compact structural hints from the HTML.")
      ]);

    case "tool_extract":
      return response(input, "observe_extract", [
        createStep("tool_extract", "TOOL", "extractWebsiteSections(rawHtml, resolvedUrl)", {
          toolName: "extractWebsiteSections",
          toolInput: {
            sourceUrl: input.resolvedUrl,
            htmlAvailable: Boolean(input.rawHtml),
            stylesheets: input.stylesheets?.length ?? 0
          }
        })
      ]);

    case "observe_extract": {
      const sourceUrl = input.resolvedUrl ?? resolveWebsiteUrl(input.userInput);
      const sections = extractWebsiteSections({
        html: input.rawHtml ?? fallbackHtml(sourceUrl),
        sourceUrl,
        stylesheets: input.stylesheets
      });
      const theme = sections.designTokens?.themeHint ?? "unknown";
      const colorCount = sections.designTokens?.rawColors.length ?? 0;

      return response(
        input,
        "think_generate",
        [
          createStep(
            "observe_extract",
            "OBSERVE",
            `Extracted structure and design tokens: theme=${theme}, nav=${sections.navLinks.length}, headings=${sections.headings.length}, colors=${colorCount}.`,
            {
            toolOutput: {
              title: sections.title,
              brandHint: sections.brandHint,
              themeHint: theme,
              navLinks: sections.navLinks.length,
              headings: sections.headings.length,
              buttons: sections.buttons.length,
              footerHints: sections.footerHints.length,
              colors: colorCount
            }
            }
          )
        ],
        { extractedSections: sections, resolvedUrl: sourceUrl }
      );
    }

    case "think_generate":
      return response(input, "tool_write_files", [
        createStep(
          "think_generate",
          "THINK",
          "I can now generate website files from the extracted hints."
        )
      ]);

    case "tool_write_files":
      return response(input, "observe_write_files", [
        createStep("tool_write_files", "TOOL", "generateWebsiteFiles(extractedSections)", {
          toolName: "generateWebsiteFiles",
          toolInput: {
            userInput: input.userInput,
            resolvedUrl: input.resolvedUrl,
            screenshot: input.screenshot
              ? {
                  success: input.screenshot.success,
                  provider: input.screenshot.provider,
                  imageUrl: input.screenshot.imageUrl,
                  hasBase64: Boolean(input.screenshot.imageBase64),
                  mimeType: input.screenshot.mimeType
                }
              : undefined,
            paths: [
              "generated-site/index.html",
              "generated-site/styles.css",
              "generated-site/script.js"
            ]
          }
        })
      ]);

    case "observe_write_files": {
      const sourceUrl = input.resolvedUrl ?? resolveWebsiteUrl(input.userInput);
      const sections =
        input.extractedSections ??
        extractWebsiteSections({
          html: input.rawHtml ?? fallbackHtml(sourceUrl),
          sourceUrl,
          stylesheets: input.stylesheets
        });
      const generation = await generateWebsiteFiles({
        userInput: input.userInput,
        resolvedUrl: sourceUrl,
        extractedSections: sections,
        screenshot: input.screenshot
      });
      const files = toVirtualFiles(generation.files);
      const previewHtml = buildPreviewHtml(files);
      const content =
        generation.source === "gemini"
          ? "Generated website files using Gemini with screenshot reasoning + extracted structure and passed validation."
          : `Used fallback template based on extracted structure and design tokens. ${generation.message}`;

      return response(
        input,
        "output",
        [
          createStep("observe_write_files", "OBSERVE", content, {
            toolOutput: {
              source: generation.source,
              message: generation.message,
              files: files.map((file) => file.path),
              sourceUrl
            }
          })
        ],
        { files, previewHtml, extractedSections: sections, resolvedUrl: sourceUrl }
      );
    }

    case "output":
      return response(
        input,
        "complete",
        [
          createStep(
            "output",
            "OUTPUT",
            "Website generation loop complete. Preview and generated files are ready."
          )
        ],
        {},
        true
      );

    case "complete":
      return response(input, "complete", [], {}, true);

    case "error":
      return response(input, "error", [], {}, true);

    default:
      return response(
        input,
        "error",
        [createStep("error", "ERROR", "Unknown agent phase encountered.")],
        {},
        true
      );
  }
}
