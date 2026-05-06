"use client";

import { useEffect, useState } from "react";

type PreviewPanelProps = {
  previewHtml: string | null;
};

export function PreviewPanel({ previewHtml }: PreviewPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  const openPreview = () => {
    if (!previewHtml) {
      return;
    }

    const blob = new Blob([previewHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  return (
    <section className="panel-surface flex min-h-[260px] flex-col overflow-hidden rounded-lg lg:h-full lg:min-h-0">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800/90 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-700" />
            <span className="h-2 w-2 rounded-full bg-slate-700" />
            <span className="h-2 w-2 rounded-full bg-slate-600" />
          </div>
          <div className="ml-2 min-w-0 flex-1 font-mono text-xs text-slate-500">
            Live Preview
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            disabled={!previewHtml}
            onClick={openPreview}
            className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
          >
            New Tab
          </button>
          <button
            disabled={!previewHtml}
            onClick={() => setIsFullscreen(true)}
            className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
          >
            Fullscreen
          </button>
        </div>
      </div>
      {previewHtml ? (
        <iframe
          title="Generated website preview"
          srcDoc={previewHtml}
          sandbox="allow-scripts"
          className="min-h-0 flex-1 border-0 bg-white"
        />
      ) : (
        <div className="muted-grid flex min-h-0 flex-1 items-center justify-center p-6">
          <p className="max-w-64 text-center text-sm leading-6 text-slate-500">
            Preview will appear after generation.
          </p>
        </div>
      )}
      {isFullscreen && previewHtml ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-slate-700 bg-[#090c11] shadow-panel">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-3">
              <span className="font-mono text-xs text-slate-400">Live Preview</span>
              <button
                onClick={() => setIsFullscreen(false)}
                className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
            <iframe
              title="Fullscreen generated website preview"
              srcDoc={previewHtml}
              sandbox="allow-scripts"
              className="min-h-0 flex-1 border-0 bg-white"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
