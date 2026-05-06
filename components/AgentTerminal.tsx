"use client";

import { useEffect, useRef } from "react";
import { StepBadge } from "@/components/StepBadge";
import type { AgentRunState, AgentStep } from "@/lib/types";

type AgentTerminalProps = {
  steps: AgentStep[];
  userInput: string;
  setUserInput: (value: string) => void;
  onRun: () => void;
  onClear: () => void;
  runState: AgentRunState;
  elapsedSeconds: number;
};

export function AgentTerminal({
  steps,
  userInput,
  setUserInput,
  onRun,
  onClear,
  runState,
  elapsedSeconds
}: AgentTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRunning = runState === "running";
  const canClear = !isRunning && (steps.length > 0 || userInput.length > 0);

  useEffect(() => {
    const log = scrollRef.current;

    if (!log) {
      return;
    }

    log.scrollTo({
      top: log.scrollHeight,
      behavior: "smooth"
    });
  }, [steps]);

  return (
    <section className="panel-surface flex min-h-[560px] flex-col overflow-hidden rounded-lg lg:h-full lg:min-h-0">
      {isRunning ? <div className="activity-line" /> : null}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-800/90 px-4 py-3">
        <div>
          <h2 className="text-sm font-medium text-slate-100">Agent Terminal</h2>
          <p className="mt-1 text-xs text-slate-500">Execution trace</p>
        </div>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <>
              <span className="rounded-md border border-blue-500/35 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-100">
                Running
              </span>
              <span className="font-mono text-xs text-slate-500">{elapsedSeconds}s</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden p-3">
        <div
          ref={scrollRef}
          className="terminal-scroll h-full overflow-y-auto rounded-md border border-slate-800 bg-[#05070a] p-3 font-mono"
        >
          {steps.length === 0 ? (
            <div className="rounded-md border border-slate-800/80 bg-slate-950/50 p-4 text-sm leading-6 text-slate-500">
              <div className="text-slate-300">$ Clone Scaler Academy website</div>
              <div className="mt-1">Waiting for agent run...</div>
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map((step) => (
                <StepRow key={step.id} step={step} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-800/90 bg-[#0a0d12] p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={userInput}
            disabled={isRunning}
            onChange={(event) => setUserInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !isRunning) {
                event.preventDefault();
                onRun();
              }
            }}
            placeholder="Clone Scaler Academy website"
            className="h-10 flex-1 rounded-md border border-slate-800 bg-[#070a0f] px-3 font-mono text-sm text-slate-300 outline-none transition placeholder:text-slate-600 focus:border-blue-500/60 disabled:cursor-not-allowed disabled:text-slate-500"
          />
          <div className="flex gap-2">
            <button
              disabled={isRunning}
              onClick={onRun}
              className="h-10 flex-1 rounded-md border border-blue-500/35 bg-blue-500/10 px-4 text-sm font-medium text-blue-100 shadow-sm transition hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/70 disabled:text-slate-400 sm:flex-none"
            >
              {isRunning ? "Running..." : "Run Agent"}
            </button>
            <button
              disabled={!canClear}
              onClick={onClear}
              className="h-10 flex-1 rounded-md border border-slate-700 bg-slate-900 px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600 sm:flex-none"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function StepRow({ step }: { step: AgentStep }) {
  const isTool = step.type === "TOOL";
  const isError = step.type === "ERROR" || hasFailureOutput(step.toolOutput);
  const isObserve = step.type === "OBSERVE";
  const rowStyle = isError
    ? "border-red-500/30 bg-red-500/[0.055]"
    : isTool
      ? "border-amber-500/20 bg-amber-500/[0.045]"
      : isObserve
        ? "border-emerald-500/20 bg-emerald-500/[0.04]"
        : "border-slate-800/70 bg-slate-950/45";

  return (
    <div className={`grid gap-3 rounded-md border p-2.5 text-sm sm:grid-cols-[auto_1fr] ${rowStyle}`}>
      <StepBadge type={step.type} />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 flex-1 break-words leading-5 text-slate-300">{step.content}</p>
          {isObserve ? (
            <span
              className={`rounded border px-2 py-0.5 font-sans text-[11px] font-medium ${
                isError
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {isError ? "Failed" : "OK"}
            </span>
          ) : null}
        </div>

        {step.toolName ? (
          <div className="mt-1.5 inline-flex max-w-full items-center gap-2 rounded border border-slate-800 bg-[#070a0f] px-2 py-0.5">
            <span className="font-sans text-[10px] uppercase tracking-wide text-slate-500">tool</span>
            <span className="truncate text-xs text-slate-300">{step.toolName}</span>
          </div>
        ) : null}

        {step.toolInput !== undefined || step.toolOutput !== undefined ? (
          <div className="mt-1.5 grid gap-1.5">
            {step.toolInput !== undefined ? <ToolSummary label="input" value={step.toolInput} /> : null}
            {step.toolOutput !== undefined ? (
              <ToolSummary label="output" value={step.toolOutput} tone={isError ? "error" : "default"} />
            ) : null}
          </div>
        ) : null}

        <time className="mt-1.5 block text-[11px] text-slate-600">
          {new Date(step.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
          })}
        </time>
      </div>
    </div>
  );
}

function ToolSummary({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: unknown;
  tone?: "default" | "error";
}) {
  return (
    <div className="rounded border border-slate-800 bg-[#05070a] px-2.5 py-1.5">
      <div className="mb-1 font-sans text-[10px] uppercase tracking-wide text-slate-600">{label}</div>
      <pre
        className={`max-h-20 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-4 ${
          tone === "error" ? "text-red-200" : "text-slate-400"
        }`}
      >
        {summarizeValue(value)}
      </pre>
    </div>
  );
}

function summarizeValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function hasFailureOutput(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as { success?: unknown }).success === false
  );
}
