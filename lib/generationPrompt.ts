import type { ExtractedSections } from "@/lib/types";
import type { ScreenshotResult } from "@/lib/types";

type BuildGenerationPromptParams = {
  userInput: string;
  resolvedUrl?: string;
  extractedSections?: ExtractedSections;
  screenshot?: ScreenshotResult;
};

export function buildGenerationPrompt({
  userInput,
  resolvedUrl,
  extractedSections,
  screenshot
}: BuildGenerationPromptParams): string {
  const sections = extractedSections ?? {
    navLinks: [],
    headings: [],
    buttons: [],
    footerHints: []
  };

  return `You are generating a small static website clone for an AI agent dashboard.

Return strict JSON only. No markdown. No code fences. No explanation.

Required JSON shape:
{
  "html": "...",
  "css": "...",
  "js": "..."
}

User request:
${userInput}

Resolved source URL:
${resolvedUrl ?? "unknown"}

Screenshot reference:
${screenshot?.success && screenshot.imageBase64
  ? "A rendered website screenshot is attached as an inline image. Treat it as the primary visual reference."
  : screenshot?.success
    ? `Screenshot URL was captured but no inline image is attached: ${screenshot.imageUrl ?? "unavailable"}`
    : "No screenshot image is available. Use extracted structure and design tokens only."}

Extracted website hints and design tokens:
${JSON.stringify(
  {
    title: sections.title,
    description: sections.description,
    brandHint: sections.brandHint,
    sourceUrl: sections.sourceUrl,
    navLinks: sections.navLinks,
    headings: sections.headings,
    buttons: sections.buttons,
    footerHints: sections.footerHints,
    headerText: sections.headerText,
    heroText: sections.heroText,
    footerText: sections.footerText,
    imageUrls: sections.imageUrls,
    classHints: sections.classHints,
    designTokens: sections.designTokens
  },
  null,
  2
)}

Visual reasoning instructions:
- You are generating a simplified landing-page clone from a real website screenshot and extracted structure.
- The screenshot is the primary visual reference when attached.
- The extracted text, links, buttons, headings, and footer hints are the content reference.
- The extracted design tokens are the supporting style reference.
- Internally reason from the screenshot before producing files, but never include reasoning in the final response.
- Use the screenshot to infer light/dark theme, background color, header placement, nav alignment, logo/text placement, hero layout, heading size/weight, CTA button style, spacing density, card/section layout, and footer style.
- Combine screenshot observations with extracted text/links/buttons and design tokens.
- Match the overall theme, background color, header layout, nav placement, logo/text placement, hero layout, heading scale/weight, CTA colors/style, spacing density, cards/sections, and footer style.
- Do not create a generic SaaS template unless the screenshot itself looks like that.
- Do not output reasoning text, markdown, or commentary. The final answer must be JSON only.

Non-negotiable visual theme rules:
- Do not invent a new visual theme. Match the extracted source theme.
- Do not default to dark mode.
- If designTokens.themeHint is "light", the generated page must be light.
- If designTokens.themeHint is "dark", the generated page must be dark.
- If designTokens.themeHint is "unknown", use a clean neutral light theme unless extracted colors strongly suggest a dark source.
- Use extracted designTokens where available: backgroundColor, textColor, primaryColor, secondaryColor, accentColor, buttonBackground, buttonTextColor, headerBackground, footerBackground, fontFamily, borderRadius, rawColors.

Required HTML structure:
- Include header.site-header.
- Include nav.navbar.
- Include main.
- Include section.hero-section.
- Include div.hero-content.
- Include div.hero-visual or div.hero-card.
- Include footer.site-footer.
- Include nav links from extracted navLinks when available.
- Include hero content from heroText/headings when available.
- Include CTA buttons from extracted buttons when available.
- Include footer links/text from footerHints/footerText when available.
- Link styles.css and script.js from index.html.

Required CSS:
- Define extracted colors as CSS variables in :root.
- Use flexbox and/or grid.
- Include a responsive @media query.
- Header should visually match the extracted header theme.
- Buttons should use extracted button/primary/accent colors.
- Avoid random gradients unless extracted class/color hints suggest gradients.
- If source is light, body background must be light and text must be dark.
- If source is dark, body background must be dark and text must be light.
- Keep the layout clean and similar to a real landing page.

Required JS:
- Small safe JavaScript only.
- Mobile nav toggle if elements exist.
- Smooth scroll or a small CTA interaction is acceptable.

Return JSON only.`;
}
