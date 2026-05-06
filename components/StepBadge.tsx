import type { AgentStepType } from "@/lib/types";

type StepBadgeProps = {
  type: AgentStepType;
};

const badgeStyles: Record<AgentStepType, string> = {
  START: "border-slate-500/35 bg-slate-500/10 text-slate-200",
  THINK: "border-sky-700/40 bg-sky-950/35 text-sky-200",
  TOOL: "border-amber-700/35 bg-amber-950/25 text-amber-200",
  OBSERVE: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  OUTPUT: "border-slate-300/35 bg-slate-100/10 text-slate-100",
  ERROR: "border-red-400/35 bg-red-500/10 text-red-200"
};

export function StepBadge({ type }: StepBadgeProps) {
  return (
    <span
      className={`inline-flex h-6 min-w-[4.75rem] items-center justify-center rounded border px-2 font-mono text-[11px] font-semibold ${badgeStyles[type]}`}
    >
      {type}
    </span>
  );
}
