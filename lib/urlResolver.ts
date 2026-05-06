const knownSites = [
  { key: "scaler academy", url: "https://www.scaler.com/academy" },
  { key: "scaler", url: "https://www.scaler.com/academy" },
  { key: "stripe", url: "https://stripe.com" },
  { key: "notion", url: "https://www.notion.so" },
  { key: "zerodha", url: "https://zerodha.com" },
  { key: "github", url: "https://github.com" }
];

const removablePhrases = [
  "landing page",
  "for me",
  "homepage",
  "website",
  "simple",
  "clone",
  "create",
  "make",
  "build",
  "copy",
  "of",
  "the",
  "a",
  "an"
];

export function resolveWebsiteUrl(userInput: string): string {
  const input = userInput.trim();

  const fullUrl = input.match(/https?:\/\/[^\s"'<>]+/i)?.[0];
  if (fullUrl) {
    return fullUrl;
  }

  const domain = input.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s"'<>]*)?/i)?.[0];
  if (domain) {
    return `https://${domain}`;
  }

  const normalizedInput = input.toLowerCase();
  const knownSite = knownSites.find((site) => normalizedInput.includes(site.key));
  if (knownSite) {
    return knownSite.url;
  }

  let cleaned = normalizedInput;
  for (const phrase of removablePhrases) {
    cleaned = cleaned.replace(new RegExp(`\\b${phrase}\\b`, "gi"), " ");
  }

  const meaningfulWord = cleaned
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .find((word) => word.length > 1);

  if (meaningfulWord) {
    return `https://www.${meaningfulWord}.com`;
  }

  return "https://www.scaler.com/academy";
}
