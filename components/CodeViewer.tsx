"use client";

import { useState } from "react";
import type { VirtualFile } from "@/lib/types";

type CodeViewerProps = {
  file: VirtualFile | null;
};

export function CodeViewer({ file }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!file) {
      return;
    }

    await navigator.clipboard.writeText(file.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const downloadFile = () => {
    if (!file) {
      return;
    }

    const blob = new Blob([file.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.path.split("/").pop() ?? "generated-file.txt";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  return (
    <section className="panel-surface flex min-h-[280px] flex-col rounded-lg lg:h-full lg:min-h-0">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/90 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-slate-100">Code Viewer</h2>
          {file ? (
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
              <p className="truncate font-mono text-xs text-slate-500">{file.path}</p>
              <span className="rounded border border-slate-800 bg-slate-950 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                {file.language}
              </span>
              <span className="font-mono text-[11px] text-slate-600">
                {file.content.length} chars
              </span>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            disabled={!file}
            onClick={copyCode}
            className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            disabled={!file}
            onClick={downloadFile}
            className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
          >
            Download File
          </button>
        </div>
      </div>
      {file ? (
        <pre className="terminal-scroll min-h-0 flex-1 overflow-auto rounded-b-lg bg-[#05070a] p-4 font-mono text-xs leading-6 text-slate-300">
          <code>{file.content}</code>
        </pre>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-b-lg bg-[#05070a] p-6 font-mono">
          <p className="text-center text-sm leading-6 text-slate-500">
            Select a file to inspect generated code.
          </p>
        </div>
      )}
    </section>
  );
}
