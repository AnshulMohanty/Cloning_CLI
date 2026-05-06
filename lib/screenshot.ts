import type { ScreenshotResult } from "@/lib/types";

const SCREENSHOT_TIMEOUT_MS = 15000;
const MAX_IMAGE_BYTES = 1_500_000;

export async function captureWebsiteScreenshot(url: string): Promise<ScreenshotResult> {
  if (process.env.SCREENSHOT_PROVIDER !== "microlink") {
    return {
      success: false,
      provider: "none",
      message: "Screenshot provider disabled."
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCREENSHOT_TIMEOUT_MS);

  try {
    const apiUrl = new URL("https://api.microlink.io/");
    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("screenshot", "true");
    apiUrl.searchParams.set("meta", "false");

    const response = await fetch(apiUrl.toString(), {
      signal: controller.signal,
      headers: {
        accept: "application/json"
      }
    });

    if (!response.ok) {
      return {
        success: false,
        provider: "microlink",
        message: `Microlink request failed with HTTP ${response.status}.`
      };
    }

    const payload = (await response.json()) as unknown;
    const imageUrl = extractScreenshotUrl(payload);

    if (!imageUrl) {
      return {
        success: false,
        provider: "microlink",
        message: "Microlink did not return a screenshot URL."
      };
    }

    return await fetchScreenshotImage(imageUrl);
  } catch (error) {
    const isAbort = error instanceof Error && error.name === "AbortError";

    return {
      success: false,
      provider: "microlink",
      message: isAbort
        ? "Screenshot capture timed out after 15 seconds."
        : `Screenshot capture failed: ${error instanceof Error ? error.message : "Unknown error."}`
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractScreenshotUrl(payload: unknown): string | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  const data = payload.data;
  if (isRecord(data)) {
    const screenshot = data.screenshot;

    if (isRecord(screenshot) && typeof screenshot.url === "string") {
      return screenshot.url;
    }

    if (typeof screenshot === "string") {
      return screenshot;
    }
  }

  const screenshot = payload.screenshot;
  if (isRecord(screenshot) && typeof screenshot.url === "string") {
    return screenshot.url;
  }

  return undefined;
}

async function fetchScreenshotImage(imageUrl: string): Promise<ScreenshotResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCREENSHOT_TIMEOUT_MS);

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        accept: "image/png,image/jpeg,image/webp,image/*"
      }
    });

    if (!response.ok) {
      return {
        success: true,
        provider: "microlink",
        imageUrl,
        message: "Captured screenshot URL using Microlink, but image download failed."
      };
    }

    const mimeType = response.headers.get("content-type") ?? "image/png";
    const contentLength = Number(response.headers.get("content-length") ?? 0);

    if (contentLength > MAX_IMAGE_BYTES) {
      return {
        success: true,
        provider: "microlink",
        imageUrl,
        mimeType,
        message: "Captured screenshot URL using Microlink. Image was too large to inline."
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return {
        success: true,
        provider: "microlink",
        imageUrl,
        mimeType,
        message: "Captured screenshot URL using Microlink. Image was too large to inline."
      };
    }

    return {
      success: true,
      provider: "microlink",
      imageUrl,
      imageBase64: buffer.toString("base64"),
      mimeType,
      message: "Captured screenshot using Microlink."
    };
  } catch {
    return {
      success: true,
      provider: "microlink",
      imageUrl,
      message: "Captured screenshot URL using Microlink, but image download failed."
    };
  } finally {
    clearTimeout(timeout);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
