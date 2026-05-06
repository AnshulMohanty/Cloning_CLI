export type AgentStepType =
  | "START"
  | "THINK"
  | "TOOL"
  | "OBSERVE"
  | "OUTPUT"
  | "ERROR";

export type AgentStep = {
  id: string;
  type: AgentStepType;
  content: string;
  toolName?: string;
  toolInput?: unknown;
  toolOutput?: unknown;
  timestamp: string;
};

export type VirtualFile = {
  path: string;
  content: string;
  language: "html" | "css" | "javascript" | "text";
};

export type AgentRunState = "idle" | "running" | "complete" | "error";

export type AgentPhase =
  | "idle"
  | "start"
  | "think_resolve_url"
  | "tool_resolve_url"
  | "observe_resolve_url"
  | "think_fetch"
  | "tool_fetch"
  | "observe_fetch"
  | "think_screenshot"
  | "tool_screenshot"
  | "observe_screenshot"
  | "think_extract"
  | "tool_extract"
  | "observe_extract"
  | "think_generate"
  | "tool_write_files"
  | "observe_write_files"
  | "output"
  | "complete"
  | "error";

export type DesignTokens = {
  backgroundColor?: string;
  textColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  buttonBackground?: string;
  buttonTextColor?: string;
  headerBackground?: string;
  footerBackground?: string;
  fontFamily?: string;
  borderRadius?: string;
  themeHint?: "light" | "dark" | "mixed" | "unknown";
  rawColors: string[];
};

export type ExtractedSections = {
  title?: string;
  description?: string;
  navLinks: string[];
  headings: string[];
  buttons: string[];
  footerHints: string[];
  brandHint?: string;
  sourceUrl?: string;
  imageUrls?: string[];
  headerText?: string[];
  heroText?: string[];
  footerText?: string[];
  classHints?: string[];
  designTokens?: DesignTokens;
};

export type AgentStepRequest = {
  userInput: string;
  phase: AgentPhase;
  steps: AgentStep[];
  files: VirtualFile[];
  resolvedUrl?: string;
  rawHtml?: string;
  stylesheets?: string[];
  screenshot?: ScreenshotResult;
  extractedSections?: ExtractedSections;
};

export type AgentStepResponse = {
  nextPhase: AgentPhase;
  newSteps: AgentStep[];
  files: VirtualFile[];
  resolvedUrl?: string;
  rawHtml?: string;
  stylesheets?: string[];
  screenshot?: ScreenshotResult;
  extractedSections?: ExtractedSections;
  previewHtml?: string | null;
  isComplete: boolean;
};

export type WebsiteFetchResult = {
  success: boolean;
  url: string;
  html?: string;
  message: string;
};

export type ScreenshotResult = {
  success: boolean;
  provider: "microlink" | "none";
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  message: string;
};

export type GeneratedWebsiteFiles = {
  html: string;
  css: string;
  js: string;
};

export type GenerationResult = {
  success: boolean;
  files: GeneratedWebsiteFiles;
  source: "gemini" | "fallback";
  message: string;
};
