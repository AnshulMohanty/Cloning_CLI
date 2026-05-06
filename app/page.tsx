"use client";

import { useEffect, useMemo, useState } from "react";
import { AgentTerminal } from "@/components/AgentTerminal";
import { CodeViewer } from "@/components/CodeViewer";
import { FilePanel } from "@/components/FilePanel";
import { PreviewPanel } from "@/components/PreviewPanel";
import type {
  AgentPhase,
  AgentRunState,
  AgentStep,
  AgentStepRequest,
  AgentStepResponse,
  ExtractedSections,
  ScreenshotResult,
  VirtualFile
} from "@/lib/types";

const statusStyles: Record<AgentRunState, string> = {
  idle: "border-slate-700 bg-slate-900 text-slate-300",
  running: "border-blue-500/50 bg-blue-500/10 text-blue-100",
  complete: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  error: "border-red-500/40 bg-red-500/10 text-red-100"
};

const delay = (duration: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

export default function Home() {
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [runState, setRunState] = useState<AgentRunState>("idle");
  const [phase, setPhase] = useState<AgentPhase>("idle");
  const [userInput, setUserInput] = useState("");
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>();
  const [rawHtml, setRawHtml] = useState<string | undefined>();
  const [stylesheets, setStylesheets] = useState<string[] | undefined>();
  const [screenshot, setScreenshot] = useState<ScreenshotResult | undefined>();
  const [extractedSections, setExtractedSections] = useState<ExtractedSections | undefined>();
  const [copiedAll, setCopiedAll] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (runState !== "running") {
      return;
    }

    setElapsedSeconds(0);
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [runState]);

  const selectedFile = useMemo(
    () => files.find((file) => file.path === selectedFilePath) ?? null,
    [files, selectedFilePath]
  );

  const createClientErrorStep = (content: string): AgentStep => ({
    id: `client-error-${crypto.randomUUID()}`,
    type: "ERROR",
    content,
    timestamp: new Date().toISOString()
  });

  const clearRun = () => {
    if (runState === "running") {
      return;
    }

    setSteps([]);
    setFiles([]);
    setSelectedFilePath(null);
    setPreviewHtml(null);
    setRunState("idle");
    setPhase("idle");
    setUserInput("");
    setResolvedUrl(undefined);
    setRawHtml(undefined);
    setStylesheets(undefined);
    setScreenshot(undefined);
    setExtractedSections(undefined);
    setCopiedAll(false);
    setElapsedSeconds(0);
  };

  const copyAllFiles = async () => {
    if (files.length === 0) {
      return;
    }

    await navigator.clipboard.writeText(
      files.map((file) => `--- ${file.path} ---\n${file.content}`).join("\n\n")
    );
    setCopiedAll(true);
    window.setTimeout(() => setCopiedAll(false), 1200);
  };

  const downloadBlob = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const downloadHtml = () => {
    if (previewHtml) {
      downloadBlob(previewHtml, "generated-site.html", "text/html");
    }
  };

  const downloadProjectJson = () => {
    if (files.length > 0) {
      downloadBlob(
        JSON.stringify({ files }, null, 2),
        "generated-site.json",
        "application/json"
      );
    }
  };

  const runAgent = async () => {
    if (runState === "running") {
      return;
    }

    const request = userInput.trim() || "Clone Scaler for me";
    let currentPhase: AgentPhase = "start";
    let currentSteps: AgentStep[] = [];
    let currentFiles: VirtualFile[] = [];
    let currentResolvedUrl: string | undefined;
    let currentRawHtml: string | undefined;
    let currentStylesheets: string[] | undefined;
    let currentScreenshot: ScreenshotResult | undefined;
    let currentExtractedSections: ExtractedSections | undefined;

    setRunState("running");
    setElapsedSeconds(0);
    setPhase(currentPhase);
    setSteps([]);
    setFiles([]);
    setSelectedFilePath(null);
    setPreviewHtml(null);
    setResolvedUrl(undefined);
    setRawHtml(undefined);
    setStylesheets(undefined);
    setScreenshot(undefined);
    setExtractedSections(undefined);

    try {
      while (true) {
        const payload: AgentStepRequest = {
          userInput: request,
          phase: currentPhase,
          steps: currentSteps,
          files: currentFiles,
          resolvedUrl: currentResolvedUrl,
          rawHtml: currentRawHtml,
          stylesheets: currentStylesheets,
          screenshot: currentScreenshot,
          extractedSections: currentExtractedSections
        };

        const response = await fetch("/api/agent/step", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Agent API returned ${response.status}`);
        }

        const data = (await response.json()) as AgentStepResponse;
        currentSteps = [...currentSteps, ...data.newSteps];
        currentFiles = data.files;
        currentResolvedUrl = data.resolvedUrl ?? currentResolvedUrl;
        currentRawHtml = data.rawHtml ?? currentRawHtml;
        currentStylesheets = data.stylesheets ?? currentStylesheets;
        currentScreenshot = data.screenshot ?? currentScreenshot;
        currentExtractedSections = data.extractedSections ?? currentExtractedSections;
        currentPhase = data.nextPhase;

        setSteps(currentSteps);
        setFiles(currentFiles);
        setResolvedUrl(currentResolvedUrl);
        setRawHtml(currentRawHtml);
        setStylesheets(currentStylesheets);
        setScreenshot(currentScreenshot);
        setExtractedSections(currentExtractedSections);
        setPhase(currentPhase);

        if (data.previewHtml !== undefined) {
          setPreviewHtml(data.previewHtml);
        }

        if (currentFiles.length > 0) {
          setSelectedFilePath((currentPath) => currentPath ?? "generated-site/index.html");
        }

        if (data.isComplete || data.nextPhase === "complete") {
          setRunState("complete");
          break;
        }

        await delay(500);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown agent failure.";
      const errorStep = createClientErrorStep(`Agent run failed: ${message}`);

      currentSteps = [...currentSteps, errorStep];
      setSteps(currentSteps);
      setPhase("error");
      setRunState("error");
    }
  };

  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_0%,rgba(59,130,246,0.12),transparent_28rem),linear-gradient(180deg,#050608_0%,#080b10_100%)]">
      <div className="mx-auto flex h-full w-full max-w-[1500px] flex-col px-3 py-3 sm:px-4">
        <header className="relative mb-3 shrink-0 overflow-hidden rounded-lg border border-slate-800/90 bg-[#0a0d12]/85 px-4 py-3 shadow-panel backdrop-blur">
          {runState === "running" ? <div className="activity-line" /> : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-50 sm:text-2xl">
                Cloning_CLI
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-400">
                Website cloning agent with visual reasoning, tool calls, and live preview.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <span
                className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize ${statusStyles[runState]}`}
              >
                {runState === "running" ? "Running" : runState}
              </span>
              {runState === "running" ? (
                <span className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300">
                  Running {elapsedSeconds}s
                </span>
              ) : null}
            </div>
          </div>
          {runState === "running" ? (
            <p className="mt-2 text-xs text-slate-500">
              This can take up to 2 minutes when screenshot + Gemini generation is running.
            </p>
          ) : null}
        </header>

        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto lg:grid-cols-[minmax(0,11fr)_minmax(430px,9fr)] lg:overflow-hidden">
          <AgentTerminal
            steps={steps}
            userInput={userInput}
            setUserInput={setUserInput}
            onRun={runAgent}
            onClear={clearRun}
            runState={runState}
            elapsedSeconds={elapsedSeconds}
          />

          <aside className="grid min-h-0 gap-3 lg:grid-rows-[auto_minmax(190px,0.7fr)_auto_minmax(0,1.4fr)]">
            <div className="panel-surface flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-slate-200">Exports</span>
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={files.length === 0}
                  onClick={copyAllFiles}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
                >
                  {copiedAll ? "Copied" : "Copy All Files"}
                </button>
                <button
                  disabled={!previewHtml}
                  onClick={downloadHtml}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
                >
                  Download HTML
                </button>
                <button
                  disabled={files.length === 0}
                  onClick={downloadProjectJson}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
                >
                  Download Project JSON
                </button>
              </div>
            </div>
            <PreviewPanel previewHtml={previewHtml} />
            <FilePanel
              files={files}
              selectedFilePath={selectedFilePath}
              onSelectFile={setSelectedFilePath}
            />
            <CodeViewer file={selectedFile} />
          </aside>
        </div>
      </div>
    </main>
  );
}
