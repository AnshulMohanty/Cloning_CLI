import * as cheerio from "cheerio";
import type { WebsiteFetchResult } from "@/lib/types";

const HTML_LIMIT = 300000;
const CSS_LIMIT = 150000;
const FETCH_TIMEOUT_MS = 10000;
const CSS_FETCH_TIMEOUT_MS = 8000;
const MAX_STYLESHEETS = 5;

export async function fetchWebsiteHTML(url: string): Promise<WebsiteFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9"
      },
      redirect: "follow",
      signal: controller.signal
    });

    const finalUrl = response.url || url;

    if (!response.ok) {
      return {
        success: false,
        url: finalUrl,
        message: `Fetch failed with HTTP ${response.status}.`
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    const html = (await response.text()).slice(0, HTML_LIMIT);

    return {
      success: true,
      url: finalUrl,
      html,
      message: contentType.includes("text/html")
        ? "HTML fetched successfully."
        : "Response fetched successfully, but content type was not text/html."
    };
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";

    return {
      success: false,
      url,
      message: isAbort
        ? "Fetch timed out after 10 seconds."
        : `Fetch failed: ${error instanceof Error ? error.message : "Unknown error."}`
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchLinkedStylesheets(html: string, baseUrl: string): Promise<string[]> {
  const $ = cheerio.load(html);
  const stylesheetUrls = $("link[rel~='stylesheet'][href]")
    .map((_, element) => $(element).attr("href"))
    .get()
    .filter((href): href is string => Boolean(href))
    .map((href) => {
      try {
        return new URL(href, baseUrl).toString();
      } catch {
        return null;
      }
    })
    .filter((url): url is string => Boolean(url))
    .slice(0, MAX_STYLESHEETS);

  const stylesheets = await Promise.all(stylesheetUrls.map((url) => fetchStylesheet(url)));
  return stylesheets.filter((stylesheet): stylesheet is string => Boolean(stylesheet));
}

async function fetchStylesheet(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CSS_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        accept: "text/css,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9"
      },
      redirect: "follow",
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    return (await response.text()).slice(0, CSS_LIMIT);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
