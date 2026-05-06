import { NextResponse } from "next/server";
import { getNextDeterministicAgentStep } from "@/lib/agentPhases";
import type { AgentPhase, AgentStep, AgentStepRequest, VirtualFile } from "@/lib/types";

const agentPhases: AgentPhase[] = [
  "idle",
  "start",
  "think_resolve_url",
  "tool_resolve_url",
  "observe_resolve_url",
  "think_fetch",
  "tool_fetch",
  "observe_fetch",
  "think_screenshot",
  "tool_screenshot",
  "observe_screenshot",
  "think_extract",
  "tool_extract",
  "observe_extract",
  "think_generate",
  "tool_write_files",
  "observe_write_files",
  "output",
  "complete",
  "error"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAgentPhase(value: unknown): value is AgentPhase {
  return typeof value === "string" && agentPhases.includes(value as AgentPhase);
}

function isStepArray(value: unknown): value is AgentStep[] {
  return Array.isArray(value);
}

function isFileArray(value: unknown): value is VirtualFile[] {
  return Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function createErrorStep(content: string): AgentStep {
  return {
    id: `error-${crypto.randomUUID()}`,
    type: "ERROR",
    content,
    timestamp: new Date().toISOString()
  };
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isRecord(body) || typeof body.userInput !== "string" || !isAgentPhase(body.phase)) {
      return NextResponse.json(
        {
          nextPhase: "error",
          newSteps: [createErrorStep("Invalid agent step request.")],
          files: [],
          previewHtml: null,
          isComplete: true
        },
        { status: 400 }
      );
    }

    const input: AgentStepRequest = {
      userInput: body.userInput,
      phase: body.phase,
      steps: isStepArray(body.steps) ? body.steps : [],
      files: isFileArray(body.files) ? body.files : [],
      resolvedUrl: typeof body.resolvedUrl === "string" ? body.resolvedUrl : undefined,
      rawHtml: typeof body.rawHtml === "string" ? body.rawHtml : undefined,
      stylesheets: isStringArray(body.stylesheets) ? body.stylesheets : undefined,
      screenshot: isRecord(body.screenshot)
        ? (body.screenshot as AgentStepRequest["screenshot"])
        : undefined,
      extractedSections: isRecord(body.extractedSections)
        ? (body.extractedSections as AgentStepRequest["extractedSections"])
        : undefined
    };

    return NextResponse.json(await getNextDeterministicAgentStep(input));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";

    return NextResponse.json(
      {
        nextPhase: "error",
        newSteps: [createErrorStep(`Agent step failed: ${message}`)],
        files: [],
        previewHtml: null,
        isComplete: true
      },
      { status: 500 }
    );
  }
}
