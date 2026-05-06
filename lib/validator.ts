import type { ExtractedSections, GeneratedWebsiteFiles, ScreenshotResult } from "@/lib/types";

const FORCED_DARK_PATTERNS = [
  /background(?:-color)?\s*:\s*#0[0-9a-f]{2,6}\b/i,
  /background(?:-color)?\s*:\s*#111(?:111)?\b/i,
  /background(?:-color)?\s*:\s*#121212\b/i,
  /background(?:-color)?\s*:\s*rgb\(\s*(?:[0-4]?\d|5\d)\s*,\s*(?:[0-4]?\d|5\d)\s*,\s*(?:[0-4]?\d|5\d)\s*\)/i
];

const LIGHT_BACKGROUND_PATTERNS = [
  /background(?:-color)?\s*:\s*#fff(?:fff)?\b/i,
  /background(?:-color)?\s*:\s*white\b/i,
  /background(?:-color)?\s*:\s*rgb\(\s*(?:2[2-5]\d|255)\s*,\s*(?:2[2-5]\d|255)\s*,\s*(?:2[2-5]\d|255)\s*\)/i
];

export function validateGeneratedWebsiteFiles(
  files: GeneratedWebsiteFiles,
  extractedSections?: ExtractedSections,
  screenshot?: ScreenshotResult
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const html = files.html;
  const css = files.css;
  const js = files.js;

  if (typeof html !== "string" || typeof css !== "string" || typeof js !== "string") {
    errors.push("Generated html, css, and js must all be strings.");
  }

  if (html.length < 500) {
    errors.push("HTML output is too small.");
  }

  if (css.length < 500) {
    errors.push("CSS output is too small.");
  }

  if (/```/.test(html) || /```/.test(css) || /```/.test(js)) {
    errors.push("Generated files must not contain markdown code fences.");
  }

  if (!/<header\b/i.test(html)) {
    errors.push("HTML must contain a header element.");
  }

  if (!/hero-section/i.test(html)) {
    errors.push("HTML must contain the hero-section class.");
  }

  if (!/<footer\b/i.test(html)) {
    errors.push("HTML must contain a footer element.");
  }

  if (!/href=["']styles\.css["']/i.test(html)) {
    errors.push("HTML must link styles.css.");
  }

  if (!/src=["']script\.js["']/i.test(html)) {
    errors.push("HTML must link script.js.");
  }

  if (!/\.site-header\b/i.test(css)) {
    errors.push("CSS must include .site-header styles.");
  }

  if (!/\.hero-section\b/i.test(css)) {
    errors.push("CSS must include .hero-section styles.");
  }

  if (!/\.site-footer\b/i.test(css)) {
    errors.push("CSS must include .site-footer styles.");
  }

  if (!/display\s*:\s*(flex|grid)/i.test(css)) {
    errors.push("CSS must use flexbox or grid.");
  }

  if (!/@media/i.test(css)) {
    errors.push("CSS must include responsive @media styles.");
  }

  validateTheme(css, extractedSections, screenshot, errors);
  validateContentSpecificity(html, extractedSections, errors);

  return {
    valid: errors.length === 0,
    errors
  };
}

function validateTheme(
  css: string,
  extractedSections: ExtractedSections | undefined,
  screenshot: ScreenshotResult | undefined,
  errors: string[]
) {
  const tokens = extractedSections?.designTokens;

  if (!tokens) {
    return;
  }

  const bodyOrRootCss = extractRuleBody(css, /(?:^|,|\s)(?:body|html|:root)\b/i) ?? css.slice(0, 1600);
  const hasDarkBody = FORCED_DARK_PATTERNS.some((pattern) => pattern.test(bodyOrRootCss));
  const hasLightBody = LIGHT_BACKGROUND_PATTERNS.some((pattern) => pattern.test(bodyOrRootCss));
  const hasLightTextOnDarkBody = /color\s*:\s*#f8fafc\b/i.test(css) && hasDarkBody;

  if (tokens.themeHint === "light" && (hasDarkBody || hasLightTextOnDarkBody)) {
    errors.push("Wrong theme: extracted source theme is light, but generated CSS uses a clearly dark body/root background.");
  }

  if (screenshot?.success && tokens.themeHint === "light" && hasDarkBody) {
    errors.push("Wrong theme: screenshot-backed source appears light, but generated CSS forces a dark body/root background.");
  }

  if (tokens.themeHint === "dark" && hasLightBody && !hasDarkSection(css)) {
    errors.push("Wrong theme: extracted source theme is dark, but generated CSS uses a clearly light body/root background without dark sections.");
  }

  const expectedColors = [
    tokens.buttonBackground,
    tokens.primaryColor,
    tokens.accentColor,
    ...(tokens.rawColors ?? []).slice(0, 8)
  ].filter((color): color is string => isUsableColorToken(color));

  if (expectedColors.length > 0 && !expectedColors.some((color) => containsColorToken(css, color))) {
    errors.push("Generated CSS should include at least one extracted primary/button/accent/raw color token.");
  }

  // Font family is treated as a soft signal because many sites use CSS variables
  // or hosted font names that should not block otherwise valid output.
}

function validateContentSpecificity(
  html: string,
  extractedSections: ExtractedSections | undefined,
  errors: string[]
) {
  const normalizedHtml = normalizeText(html);
  const sourceNav = meaningfulContent(extractedSections?.navLinks ?? []);
  const sourceButtons = meaningfulContent(extractedSections?.buttons ?? []);
  const sourceHeadings = meaningfulContent([
    ...(extractedSections?.heroText ?? []),
    ...(extractedSections?.headings ?? [])
  ]);

  if (sourceHeadings.length > 0 && /build better with/i.test(html)) {
    errors.push("Generated HTML is too generic: it uses placeholder headline copy despite extracted headings being available.");
  }

  if (/awesome\s+[^<]{0,80}dashboard mockup here/i.test(html)) {
    errors.push("Generated HTML is too generic: it uses an awesome dashboard mockup placeholder.");
  }

  if (
    sourceNav.length > 0 &&
    ["product", "solutions", "pricing"].every((item) => normalizedHtml.includes(item)) &&
    !sourceNav.slice(0, 4).some((item) => normalizedHtml.includes(normalizeText(item)))
  ) {
    errors.push("Generated HTML is too generic: it uses default nav links instead of extracted navigation.");
  }

  if (/dashboard mockup here|visual placeholder|placeholder visual/i.test(html)) {
    errors.push("Generated HTML contains placeholder visual text.");
  }

  if (sourceNav.length > 0 && !containsSomeSourceText(normalizedHtml, sourceNav, 5)) {
    errors.push("Generated HTML should include some extracted navigation text.");
  }

  if (sourceButtons.length > 0 && !containsSomeSourceText(normalizedHtml, sourceButtons, 5)) {
    errors.push("Generated HTML should include at least one extracted CTA/button text.");
  }

  if (sourceHeadings.length > 0 && !containsSomeSourceText(normalizedHtml, sourceHeadings, 6)) {
    errors.push("Generated HTML should include some extracted heading or hero text.");
  }
}

function extractRuleBody(css: string, selectorPattern: RegExp): string | null {
  const rulePattern = /([^{}]+)\{([^{}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = rulePattern.exec(css)) !== null) {
    if (selectorPattern.test(match[1])) {
      return match[2];
    }
  }

  return null;
}

function hasDarkSection(css: string): boolean {
  return FORCED_DARK_PATTERNS.some((pattern) => pattern.test(css));
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsColorToken(css: string, color: string): boolean {
  const normalizedCss = normalizeToken(css);
  const normalizedColor = normalizeToken(color.replace(/!important/g, "").trim());

  if (!normalizedColor) {
    return false;
  }

  return normalizedCss.includes(normalizedColor);
}

function isUsableColorToken(color: string | undefined): color is string {
  if (!color) {
    return false;
  }

  const normalized = color.trim().toLowerCase();

  return (
    normalized.length > 0 &&
    !["transparent", "inherit", "initial", "unset", "currentcolor"].includes(normalized)
  );
}

function meaningfulContent(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeText(value);

    if (normalized.length < 3 || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(value);
  }

  return result;
}

function containsSomeSourceText(
  normalizedHtml: string,
  values: string[],
  maxItems: number
): boolean {
  return values.slice(0, maxItems).some((item) => {
    const normalized = normalizeText(item);

    return normalized.length >= 3 && normalizedHtml.includes(normalized);
  });
}
