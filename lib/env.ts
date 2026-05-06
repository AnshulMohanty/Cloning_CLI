export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}
