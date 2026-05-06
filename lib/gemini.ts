import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey, getGeminiModel } from "@/lib/env";
import { createFallbackWebsiteFiles } from "@/lib/fallbackTemplate";
import { buildGenerationPrompt } from "@/lib/generationPrompt";
import { validateGeneratedWebsiteFiles } from "@/lib/validator";
import type {
  ExtractedSections,
  GeneratedWebsiteFiles,
  GenerationResult,
  ScreenshotResult
} from "@/lib/types";

type GenerateWebsiteParams = {
  userInput: string;
  resolvedUrl?: string;
  extractedSections?: ExtractedSections;
  screenshot?: ScreenshotResult;
};

function stripMarkdownFences(value: string): string {
  const trimmed = value.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function extractFirstJsonObject(value: string): string {
  const firstBrace = value.indexOf("{");
  if (firstBrace === -1) {
    throw new Error("Gemini response did not contain a JSON object.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = firstBrace; index < value.length; index += 1) {
    const char = value[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      depth += 1;
    }

    if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return value.slice(firstBrace, index + 1);
      }
    }
  }

  throw new Error("Gemini response JSON object was incomplete.");
}

function parseGeneratedFiles(rawText: string): GeneratedWebsiteFiles {
  const withoutFences = stripMarkdownFences(rawText);
  let parsed: unknown;

  try {
    parsed = JSON.parse(withoutFences);
  } catch {
    parsed = JSON.parse(extractFirstJsonObject(withoutFences));
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as GeneratedWebsiteFiles).html !== "string" ||
    typeof (parsed as GeneratedWebsiteFiles).css !== "string" ||
    typeof (parsed as GeneratedWebsiteFiles).js !== "string"
  ) {
    throw new Error("Gemini JSON must contain string fields: html, css, js.");
  }

  return parsed as GeneratedWebsiteFiles;
}

function readableErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown Gemini generation error.";

  try {
    const parsed = JSON.parse(message) as { error?: { message?: string } };
    return parsed.error?.message ?? message;
  } catch {
    return message;
  }
}

export async function generateWebsiteWithGemini(
  params: GenerateWebsiteParams
): Promise<GeneratedWebsiteFiles> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildGenerationPrompt(params);
  const contents =
    params.screenshot?.imageBase64
      ? [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: params.screenshot.mimeType ?? "image/png",
                  data: params.screenshot.imageBase64
                }
              }
            ]
          }
        ]
      : prompt;
  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents,
    config: {
      temperature: 0.2,
      responseMimeType: "application/json"
    }
  });

  const rawText = response.text;

  if (!rawText) {
    throw new Error("Gemini returned an empty response.");
  }

  return parseGeneratedFiles(rawText);
}

export async function generateWebsiteFiles(
  params: GenerateWebsiteParams
): Promise<GenerationResult> {
  const fallbackFiles = createFallbackWebsiteFiles(params);
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return {
      success: true,
      files: fallbackFiles,
      source: "fallback",
      message: "GEMINI_API_KEY is not configured."
    };
  }

  try {
    const geminiFiles = await generateWebsiteWithGemini(params);
    const validation = validateGeneratedWebsiteFiles(
      geminiFiles,
      params.extractedSections,
      params.screenshot
    );

    if (validation.valid) {
      const usedScreenshot = Boolean(params.screenshot?.imageBase64);

      return {
        success: true,
        files: geminiFiles,
        source: "gemini",
        message: usedScreenshot
          ? `Gemini generated valid files with ${getGeminiModel()} using the inline screenshot plus extracted structure/design tokens.`
          : `Gemini generated valid files with ${getGeminiModel()} using extracted structure/design tokens.`
      };
    }

    const wrongTheme = validation.errors.some((error) => error.toLowerCase().includes("wrong theme"));

    return {
      success: true,
      files: fallbackFiles,
      source: "fallback",
      message: wrongTheme
        ? `Gemini output failed validation: wrong theme. Used fallback template based on extracted design tokens. ${validation.errors.join(" ")}`
        : `Gemini output failed validation. Used fallback template based on extracted design tokens. ${validation.errors.join(" ")}`
    };
  } catch (error) {
    return {
      success: true,
      files: fallbackFiles,
      source: "fallback",
      message: readableErrorMessage(error)
    };
  }
}
