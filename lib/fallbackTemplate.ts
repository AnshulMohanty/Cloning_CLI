import type { ExtractedSections, GeneratedWebsiteFiles } from "@/lib/types";

type FallbackTemplateParams = {
  userInput: string;
  resolvedUrl?: string;
  extractedSections?: ExtractedSections;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hostLabel(url?: string): string {
  if (!url) {
    return "Generated Site";
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Generated Site";
  }
}

function list(values: string[] | undefined, fallback: string[], maxItems: number): string[] {
  const usable = (values ?? []).filter(Boolean).slice(0, maxItems);
  return usable.length > 0 ? usable : fallback.slice(0, maxItems);
}

function isClearlyDarkColor(color: string | undefined): boolean {
  if (!color) {
    return false;
  }

  return /#0[0-9a-f]{2,6}\b|#111\b|#111111\b|#121212\b|#050|rgb\(\s*(?:[0-4]?\d|5\d)\s*,\s*(?:[0-4]?\d|5\d)\s*,\s*(?:[0-4]?\d|5\d)/i.test(
    color
  );
}

function safeLightColor(color: string | undefined, fallback: string): string {
  return isClearlyDarkColor(color) ? fallback : color ?? fallback;
}

export function createFallbackWebsiteFiles({
  userInput,
  resolvedUrl,
  extractedSections
}: FallbackTemplateParams): GeneratedWebsiteFiles {
  const sourceHost = hostLabel(resolvedUrl);
  const brand =
    extractedSections?.brandHint || extractedSections?.title || sourceHost || "Generated Site";
  const headline =
    extractedSections?.headings?.[0] ||
    extractedSections?.title ||
    `A refined homepage inspired by ${brand}`;
  const description =
    extractedSections?.description ||
    `A polished local fallback generated for: ${userInput || "your website clone request"}.`;
  const navLinks = list(extractedSections?.navLinks, ["Product", "Use Cases", "Pricing", "Contact"], 5);
  const ctas = list(extractedSections?.buttons, ["Get started", "Explore features"], 2);
  const cards = list(
    extractedSections?.headings?.slice(1),
    ["Clear product story", "Premium visual hierarchy", "Responsive conversion sections"],
    3
  );
  const footerLinks = list(extractedSections?.footerHints, ["Company", "Resources", "Support"], 4);
  const tokens = extractedSections?.designTokens;
  const isDark = tokens?.themeHint === "dark";
  const pageBg = isDark ? (tokens?.backgroundColor ?? "#05080d") : safeLightColor(tokens?.backgroundColor, "#ffffff");
  const textColor = isDark ? (tokens?.textColor ?? "#f8fafc") : "#111827";
  const mutedColor = isDark ? "#cbd5e1" : "#4b5563";
  const surfaceColor = isDark ? "#0f172a" : "#f8fafc";
  const panelColor = isDark ? "#111827" : "#ffffff";
  const borderColor = isDark ? "rgba(148, 163, 184, 0.2)" : "rgba(15, 23, 42, 0.12)";
  const primaryColor = tokens?.buttonBackground ?? tokens?.primaryColor ?? "#2563eb";
  const primaryTextColor = tokens?.buttonTextColor ?? "#ffffff";
  const accentColor = tokens?.accentColor ?? tokens?.primaryColor ?? "#2563eb";
  const headerBackground = isDark
    ? (tokens?.headerBackground ?? "rgba(5, 8, 13, 0.84)")
    : safeLightColor(tokens?.headerBackground, "rgba(255, 255, 255, 0.92)");
  const footerBackground = tokens?.footerBackground ?? pageBg;
  const radius = tokens?.borderRadius ?? "8px";
  const fontFamily = tokens?.fontFamily ?? "Inter, ui-sans-serif, system-ui, sans-serif";

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(brand)} Clone</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header class="site-header">
      <a class="brand-mark" href="#">${escapeHtml(brand)}</a>
      <button class="nav-toggle" type="button" aria-label="Toggle navigation">Menu</button>
      <nav class="navbar">
        ${navLinks.map((item) => `<a href="#features">${escapeHtml(item)}</a>`).join("\n        ")}
      </nav>
    </header>

    <main>
      <section class="hero-section">
        <div class="hero-content">
          <p class="eyebrow">Inspired by ${escapeHtml(sourceHost)}</p>
          <h1>${escapeHtml(headline)}</h1>
          <p>${escapeHtml(description)}</p>
          <div class="hero-actions">
            <button class="primary-cta" type="button">${escapeHtml(ctas[0])}</button>
            <a class="secondary-cta" href="#features">${escapeHtml(ctas[1] ?? "Learn more")}</a>
          </div>
        </div>
        <div class="hero-visual" aria-label="Website preview concept">
          <div class="visual-toolbar">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="visual-panel">
            <strong>${escapeHtml(brand)}</strong>
            <p>${escapeHtml(sourceHost)}</p>
            <div class="metric-row">
              <span>Fast</span>
              <span>Clean</span>
              <span>Ready</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="feature-section">
        ${cards
          .map(
            (card, index) => `<article class="feature-card">
          <span>0${index + 1}</span>
          <h2>${escapeHtml(card)}</h2>
          <p>Fallback copy shaped by extracted website structure while keeping the implementation original.</p>
        </article>`
          )
          .join("\n        ")}
      </section>
    </main>

    <footer class="site-footer">
      <strong>${escapeHtml(brand)}</strong>
      <div>
        ${footerLinks.map((item) => `<a href="#">${escapeHtml(item)}</a>`).join("\n        ")}
      </div>
    </footer>
    <script src="script.js"></script>
  </body>
</html>`;

  const css = `:root {
  color-scheme: ${isDark ? "dark" : "light"};
  --page-bg: ${pageBg};
  --text: ${textColor};
  --muted: ${mutedColor};
  --surface: ${surfaceColor};
  --panel: ${panelColor};
  --border: ${borderColor};
  --primary: ${primaryColor};
  --primary-text: ${primaryTextColor};
  --accent: ${accentColor};
  --header-bg: ${headerBackground};
  --footer-bg: ${footerBackground};
  --radius: ${radius};
  font-family: ${fontFamily};
  background: var(--page-bg);
  color: var(--text);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--page-bg);
  color: var(--text);
}

a {
  color: inherit;
  text-decoration: none;
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 22px clamp(20px, 6vw, 80px);
  border-bottom: 1px solid var(--border);
  background: var(--header-bg);
  backdrop-filter: blur(18px);
}

.brand-mark {
  font-size: 22px;
  font-weight: 850;
}

.navbar {
  display: flex;
  align-items: center;
  gap: 18px;
  color: var(--muted);
  font-size: 14px;
}

.nav-toggle {
  display: none;
}

.hero-section {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.72fr);
  align-items: center;
  gap: clamp(28px, 5vw, 72px);
  min-height: 68vh;
  padding: 78px clamp(20px, 6vw, 80px);
}

.hero-content {
  display: grid;
  gap: 22px;
}

.eyebrow {
  margin: 0;
  color: var(--accent);
  font-size: 13px;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  max-width: 860px;
  margin: 0;
  font-size: clamp(42px, 7vw, 84px);
  line-height: 0.98;
}

.hero-content p {
  max-width: 660px;
  margin: 0;
  color: var(--muted);
  font-size: 18px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 8px;
}

.primary-cta,
.secondary-cta,
.nav-toggle {
  border-radius: var(--radius);
  font-weight: 800;
}

.primary-cta {
  border: 1px solid var(--primary);
  background: var(--primary);
  color: var(--primary-text);
  padding: 13px 18px;
}

.secondary-cta {
  border: 1px solid var(--border);
  color: var(--text);
  padding: 13px 18px;
}

.hero-visual {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--panel);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.16);
  overflow: hidden;
}

.visual-toolbar {
  display: flex;
  gap: 8px;
  padding: 15px;
  border-bottom: 1px solid var(--border);
}

.visual-toolbar span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--accent);
}

.visual-panel {
  display: grid;
  gap: 18px;
  padding: 28px;
}

.visual-panel strong {
  font-size: 30px;
}

.metric-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.metric-row span {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px;
  color: var(--accent);
}

.feature-section {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 0 clamp(20px, 6vw, 80px) 80px;
}

.feature-card {
  min-height: 220px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  padding: 24px;
}

.feature-card span {
  color: var(--accent);
  font-weight: 850;
}

.feature-card h2 {
  margin: 22px 0 12px;
}

.feature-card p,
.site-footer {
  color: var(--muted);
}

.site-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 28px clamp(20px, 6vw, 80px);
  border-top: 1px solid var(--border);
  background: var(--footer-bg);
}

.site-footer div {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

@media (max-width: 820px) {
  .site-header,
  .site-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .nav-toggle {
    display: inline-flex;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    padding: 10px 13px;
  }

  .navbar {
    display: none;
    align-items: flex-start;
    flex-direction: column;
  }

  .navbar.is-open {
    display: flex;
  }

  .hero-section,
  .feature-section {
    grid-template-columns: 1fr;
  }
}`;

  const js = `const navToggle = document.querySelector(".nav-toggle");
const navbar = document.querySelector(".navbar");
const primaryCta = document.querySelector(".primary-cta");

navToggle?.addEventListener("click", () => {
  navbar?.classList.toggle("is-open");
});

primaryCta?.addEventListener("click", () => {
  primaryCta.textContent = "Generated locally";
});`;

  return { html, css, js };
}
