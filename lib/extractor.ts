import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";
import type { DesignTokens, ExtractedSections } from "@/lib/types";

const CTA_WORDS = [
  "start",
  "try",
  "book",
  "demo",
  "contact",
  "signup",
  "sign up",
  "get",
  "join",
  "learn",
  "explore",
  "download",
  "pricing",
  "open",
  "apply",
  "enroll",
  "login",
  "sign in"
];

const NAMED_COLORS = [
  "white",
  "black",
  "red",
  "blue",
  "green",
  "gray",
  "grey",
  "orange",
  "yellow",
  "navy",
  "teal",
  "cyan",
  "pink",
  "brown"
];

type ExtractWebsiteSectionsParams = {
  html: string;
  sourceUrl?: string;
  stylesheets?: string[];
};

function cleanText(value: string, maxLength = 120): string {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function unique(values: string[], maxItems: number): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const value of values) {
    const text = cleanText(value);
    const key = text.toLowerCase();

    if (!text || seen.has(key)) {
      continue;
    }

    seen.add(key);
    cleaned.push(text);

    if (cleaned.length >= maxItems) {
      break;
    }
  }

  return cleaned;
}

function sourceDomain(sourceUrl?: string): string | undefined {
  if (!sourceUrl) {
    return undefined;
  }

  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function titleBrand(title?: string): string | undefined {
  if (!title) {
    return undefined;
  }

  const firstChunk = title.split(/[-|:]/)[0];
  return cleanText(firstChunk, 60) || undefined;
}

function resolveUrl(value: string | undefined, sourceUrl?: string): string | null {
  if (!value || value.startsWith("data:")) {
    return null;
  }

  try {
    return new URL(value, sourceUrl).toString();
  } catch {
    return null;
  }
}

function firstSrcFromSrcset(srcset: string | undefined): string | undefined {
  return srcset?.split(",")[0]?.trim().split(/\s+/)[0];
}

function getRegionTexts($: cheerio.CheerioAPI, selector: string, maxItems: number): string[] {
  return unique(
    $(`${selector} a, ${selector} button, ${selector} p, ${selector} span, ${selector} li, ${selector} h1, ${selector} h2, ${selector} h3`)
      .map((_, element) => $(element).text())
      .get(),
    maxItems
  );
}

function getHeroRegion($: cheerio.CheerioAPI): cheerio.Cheerio<AnyNode> {
  const selectors = [
    'main section[class*="hero" i]',
    '[class*="hero" i]',
    '[class*="banner" i]',
    '[class*="landing" i]',
    "main section:first"
  ];

  for (const selector of selectors) {
    const region = $(selector).first();
    if (region.length > 0) {
      return region;
    }
  }

  const h1Parent = $("h1").first().closest("section, div, main");
  return h1Parent.length > 0 ? h1Parent : $("main").first();
}

function getClasses($: cheerio.CheerioAPI, selectors: string[]): string[] {
  const classNames: string[] = [];

  for (const selector of selectors) {
    $(selector).each((_, element) => {
      const classValue = $(element).attr("class");
      if (classValue) {
        classNames.push(...classValue.split(/\s+/));
      }
    });
  }

  return unique(classNames, 30);
}

function getImageUrls(
  $: cheerio.CheerioAPI,
  sourceUrl: string | undefined,
  heroRegion: cheerio.Cheerio<AnyNode>
): string[] {
  const urls: string[] = [];
  const collect = (_: number, element: Element) => {
    const image = $(element);
    const width = Number(image.attr("width") ?? 0);
    const height = Number(image.attr("height") ?? 0);

    if ((width > 0 && width <= 2) || (height > 0 && height <= 2)) {
      return;
    }

    const src = image.attr("src") ?? image.attr("data-src") ?? firstSrcFromSrcset(image.attr("srcset"));
    const resolved = resolveUrl(src, sourceUrl);

    if (resolved && !resolved.includes("1x1") && !resolved.includes("pixel")) {
      urls.push(resolved);
    }
  };

  heroRegion.find("img").each(collect);
  $("main img").each(collect);

  return unique(urls, 8);
}

function extractCssRules(css: string): Array<{ selector: string; body: string }> {
  const rules: Array<{ selector: string; body: string }> = [];
  const rulePattern = /([^{}@][^{}]*)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = rulePattern.exec(css)) !== null) {
    rules.push({
      selector: match[1].trim(),
      body: match[2].trim()
    });
  }

  return rules;
}

function declarationValue(body: string, property: string): string | undefined {
  const match = body.match(new RegExp(`${property}\\s*:\\s*([^;]+)`, "i"));
  return match ? cleanText(match[1], 120) : undefined;
}

function collectColors(text: string): string[] {
  const colors: string[] = [];
  const patterns = [
    /#[0-9a-f]{3,8}\b/gi,
    /rgba?\([^)]+\)/gi,
    /hsla?\([^)]+\)/gi,
    new RegExp(`\\b(${NAMED_COLORS.join("|")})\\b`, "gi")
  ];

  for (const pattern of patterns) {
    colors.push(...(text.match(pattern) ?? []));
  }

  return colors;
}

function colorBrightness(color: string): number | null {
  const normalized = color.trim().toLowerCase();
  const named: Record<string, [number, number, number]> = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    gray: [128, 128, 128],
    grey: [128, 128, 128],
    red: [220, 38, 38],
    blue: [37, 99, 235],
    green: [22, 163, 74],
    orange: [249, 115, 22],
    yellow: [234, 179, 8],
    navy: [15, 23, 42],
    teal: [20, 184, 166],
    cyan: [6, 182, 212],
    pink: [236, 72, 153],
    brown: [120, 53, 15]
  };

  let rgb: [number, number, number] | null = null;

  if (normalized in named) {
    rgb = named[normalized];
  } else if (/^#[0-9a-f]{3}$/i.test(normalized)) {
    rgb = [
      parseInt(normalized[1] + normalized[1], 16),
      parseInt(normalized[2] + normalized[2], 16),
      parseInt(normalized[3] + normalized[3], 16)
    ];
  } else if (/^#[0-9a-f]{6}/i.test(normalized)) {
    rgb = [
      parseInt(normalized.slice(1, 3), 16),
      parseInt(normalized.slice(3, 5), 16),
      parseInt(normalized.slice(5, 7), 16)
    ];
  } else {
    const rgbMatch = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      rgb = [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
    }
  }

  if (!rgb) {
    return null;
  }

  return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
}

function themeFromColors(backgrounds: string[], allColors: string[]): DesignTokens["themeHint"] {
  const backgroundBrightness = backgrounds
    .map(colorBrightness)
    .filter((value): value is number => value !== null);

  if (backgroundBrightness.length > 0) {
    const light = backgroundBrightness.filter((value) => value >= 180).length;
    const dark = backgroundBrightness.filter((value) => value <= 85).length;

    if (light > dark) {
      return "light";
    }

    if (dark > light) {
      return "dark";
    }

    if (light > 0 && dark > 0) {
      return "mixed";
    }
  }

  const brightness = allColors.map(colorBrightness).filter((value): value is number => value !== null);
  if (brightness.length === 0) {
    return "unknown";
  }

  const light = brightness.filter((value) => value >= 180).length;
  const dark = brightness.filter((value) => value <= 85).length;

  if (light > 0 && dark > 0) {
    return "mixed";
  }

  if (light > dark) {
    return "light";
  }

  if (dark > light) {
    return "dark";
  }

  return "unknown";
}

function extractDesignTokens(
  $: cheerio.CheerioAPI,
  stylesheets: string[] | undefined
): DesignTokens {
  const inlineStyles = $("[style]")
    .map((_, element) => $(element).attr("style") ?? "")
    .get();
  const cssText = [...inlineStyles, ...(stylesheets ?? [])].join("\n");
  const rules = extractCssRules(cssText);
  const rawColors = unique(collectColors(cssText), 20);
  const backgroundColors: string[] = [];
  let fontFamily: string | undefined;
  let borderRadius: string | undefined;
  let buttonBackground: string | undefined;
  let buttonTextColor: string | undefined;
  let headerBackground: string | undefined;
  let footerBackground: string | undefined;
  let backgroundColor: string | undefined;
  let textColor: string | undefined;

  for (const rule of rules) {
    const selector = rule.selector.toLowerCase();
    const background = declarationValue(rule.body, "background(?:-color)?");
    const color = declarationValue(rule.body, "color");
    const radius = declarationValue(rule.body, "border-radius");
    const font = declarationValue(rule.body, "font-family");

    if (background) {
      backgroundColors.push(...collectColors(background));
    }

    if (!fontFamily && font) {
      fontFamily = font;
    }

    if (!borderRadius && radius) {
      borderRadius = radius;
    }

    if (/(^|\s|,)body\b|html|:root/.test(selector)) {
      backgroundColor ??= collectColors(background ?? "")[0];
      textColor ??= collectColors(color ?? "")[0];
    }

    if (/button|btn|cta|primary/.test(selector)) {
      buttonBackground ??= collectColors(background ?? "")[0];
      buttonTextColor ??= collectColors(color ?? "")[0];
    }

    if (/header|navbar|nav/.test(selector)) {
      headerBackground ??= collectColors(background ?? "")[0];
    }

    if (/footer/.test(selector)) {
      footerBackground ??= collectColors(background ?? "")[0];
    }
  }

  return {
    backgroundColor,
    textColor,
    primaryColor: buttonBackground ?? rawColors[0],
    secondaryColor: rawColors[1],
    accentColor: rawColors[2],
    buttonBackground,
    buttonTextColor,
    headerBackground,
    footerBackground,
    fontFamily,
    borderRadius,
    themeHint: themeFromColors(backgroundColors, rawColors),
    rawColors
  };
}

export function extractWebsiteSections({
  html,
  sourceUrl,
  stylesheets
}: ExtractWebsiteSectionsParams): ExtractedSections {
  const $ = cheerio.load(html);
  const title = cleanText($("title").first().text(), 120) || undefined;
  const description =
    cleanText($('meta[name="description"]').first().attr("content") ?? "", 180) || undefined;
  const heroRegion = getHeroRegion($);

  const navLinks = unique(
    $("header a, nav a")
      .map((_, element) => $(element).text())
      .get(),
    12
  );

  const headings = unique(
    $("h1, h2, h3")
      .map((_, element) => $(element).text())
      .get(),
    18
  );

  const buttons = unique(
    $("button, a")
      .map((_, element) => $(element).text())
      .get()
      .filter((text) => {
        const normalized = cleanText(text).toLowerCase();
        return normalized.length <= 80 && CTA_WORDS.some((word) => normalized.includes(word));
      }),
    12
  );

  const footerHints = unique(
    $("footer a, footer p, footer li, footer span")
      .map((_, element) => $(element).text())
      .get(),
    16
  );

  const headerBrand =
    cleanText(
      $(
        'header [class*="logo" i], header [class*="brand" i], nav [class*="logo" i], nav [class*="brand" i], header a:first'
      )
        .first()
        .text(),
      60
    ) || undefined;

  const heroText = unique(
    heroRegion
      .find("h1, h2, h3, p, a, button, span")
      .map((_, element) => $(element).text())
      .get(),
    16
  );

  return {
    title,
    description,
    navLinks,
    headings,
    buttons,
    footerHints,
    brandHint: headerBrand ?? titleBrand(title) ?? sourceDomain(sourceUrl),
    sourceUrl,
    imageUrls: getImageUrls($, sourceUrl, heroRegion),
    headerText: getRegionTexts($, "header, nav", 12),
    heroText,
    footerText: getRegionTexts($, "footer", 16),
    classHints: getClasses($, [
      "header",
      "header *",
      "nav",
      "nav *",
      "footer",
      "footer *",
      '[class*="hero" i]',
      '[class*="hero" i] *',
      '[class*="banner" i]',
      '[class*="banner" i] *'
    ]),
    designTokens: extractDesignTokens($, stylesheets)
  };
}
