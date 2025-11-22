"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import clsx from "classnames";

type PlannedStep = {
  title: string;
  rationale: string;
  searchQuery?: string;
};

type RetrievedSource = {
  url: string;
  title: string;
  highlights: string[];
  rawContent: string;
};

type AgentRunResult = {
  plan: PlannedStep[];
  sources: RetrievedSource[];
  executiveSummary: string;
  detailedReport: string;
  metadata: {
    startedAt: string;
    finishedAt: string;
    totalTokens?: number;
  };
};

type AgentState =
  | { status: "idle" }
  | { status: "working" }
  | { status: "error"; message: string }
  | { status: "complete"; result: AgentRunResult };

export function AgentWorkspace() {
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<AgentState>({ status: "idle" });
  const [isDownloading, setIsDownloading] = useState(false);

  const lastResult =
    state.status === "complete" ? state.result : undefined;

  const hasHistory = state.status === "complete";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) return;

    setState({ status: "working" });

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Agent failed to respond.");
      }

      setState({ status: "complete", result: payload as AgentRunResult });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown failure occurred.";
      setState({ status: "error", message });
    }
  };

  const reset = () => {
    setState({ status: "idle" });
  };

  const downloadReport = async () => {
    if (!lastResult) return;
    setIsDownloading(true);
    try {
      const lines = [
        `# Manus Research Report`,
        "",
        `**Started:** ${new Date(lastResult.metadata.startedAt).toLocaleString()}`,
        `**Completed:** ${new Date(lastResult.metadata.finishedAt).toLocaleString()}`,
        lastResult.metadata.totalTokens
          ? `**Total Tokens:** ${lastResult.metadata.totalTokens}`
          : null,
        "",
        "## Executive Summary",
        lastResult.executiveSummary,
        "",
        "## Detailed Report",
        lastResult.detailedReport,
        "",
        "## Sources",
        ...lastResult.sources.map(
          (source, index) =>
            `${index + 1}. [${source.title}](${source.url})\n   - ${source.highlights.join(
              "\n   - ",
            )}`,
        ),
      ]
        .filter(Boolean)
        .join("\n");

      const blob = new Blob([lines], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `manus-report-${Date.now()}.md`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  const statusLabel = useMemo(() => {
    if (state.status === "working") {
      return "Researching across the web…";
    }
    if (state.status === "complete") {
      return "Research finished";
    }
    if (state.status === "error") {
      return "Error";
    }
    return "Ready";
  }, [state.status]);

  const renderCompletedPanel = () => {
    if (state.status !== "complete") return null;

    const result = state.result;

    return (
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-2 text-sm text-slate-200">
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Executive summary
              </h2>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">
                Snapshot
              </p>
            </div>
            <button
              type="button"
              onClick={downloadReport}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-progress disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              Export report
            </button>
          </div>
          <p className="leading-relaxed text-slate-200">
            {result.executiveSummary}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Detailed report</h2>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">
              Deliverable
            </p>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-slate-200">
            {result.detailedReport.split("\n").map((paragraph, idx) => (
              <p key={idx} className="whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-lg font-semibold text-white">Research plan</h2>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">
            Orchestration trace
          </p>
          <ol className="space-y-4">
            {result.plan.map((step, index) => (
              <li
                key={index}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                    Step {index + 1}
                  </div>
                  {step.searchQuery && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Search className="h-3.5 w-3.5 text-cyan-300" />
                      {step.searchQuery}
                    </div>
                  )}
                </div>
                <h3 className="mt-3 text-base font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-slate-300">{step.rationale}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Source library</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-cyan-200">
              {result.sources.length} documents
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {result.sources.map((source, index) => (
              <article
                key={source.url}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                    #{index + 1}
                  </span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-200 transition hover:text-cyan-100"
                  >
                    Open
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <h3 className="text-base font-semibold text-white">
                  {source.title}
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {source.highlights.map((highlight, highlightIndex) => (
                    <li key={highlightIndex} className="rounded-xl bg-white/5 p-2">
                      {highlight}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-cyan-300">
              Manus Agent
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Enterprise-grade autonomous research analyst
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-300">
              Submit an objective and Manus orchestrates multi-step research,
              traverses sources, and delivers executive-quality summaries and
              fully referenced reports.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 shadow-lg shadow-cyan-500/10">
            <p className="text-xs uppercase tracking-widest text-cyan-200">
              Current run
            </p>
            <p className="mt-2 text-lg font-medium text-white">{statusLabel}</p>
            {state.status === "working" && (
              <p className="mt-3 text-sm text-slate-400">
                Running orchestrated search, extraction, and synthesis flows…
              </p>
            )}
            {state.status === "error" && (
              <p className="mt-3 text-sm text-rose-300">{state.message}</p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10 lg:flex-row">
        <section className="w-full lg:w-[360px]">
          <form
            onSubmit={handleSubmit}
            className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-400/10"
          >
            <label className="text-xs font-medium uppercase tracking-[0.3em] text-cyan-200">
              Research objective
            </label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Define what Manus should investigate, e.g. “Evaluate the competitive landscape for generative AI video editing startups in 2024.”"
              className="min-h-[200px] flex-1 resize-none rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/30"
              required
            />

            <div className="flex flex-col gap-2 text-xs text-slate-400">
              <p>Manus will:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Propose a tactical research plan</li>
                <li>Search the open web and extract primary sources</li>
                <li>Synthesize executive and technical deliverables</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="submit"
                disabled={state.status === "working"}
                className={clsx(
                  "flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950",
                  state.status === "working" && "cursor-progress opacity-70",
                )}
              >
                {state.status === "working" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Orchestrating
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Launch research
                  </>
                )}
              </button>
              {hasHistory && (
                <button
                  type="button"
                  onClick={reset}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/60 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                  New objective
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="flex-1">
          <div className="flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl shadow-cyan-500/10">
            {state.status === "idle" && (
              <div className="flex flex-1 flex-col items-center justify-center text-center text-sm text-slate-300">
                <ArrowRight className="mb-4 h-8 w-8 text-cyan-400" />
                <p>
                  Provide a research objective to activate Manus. The agent will
                  autonomously plan, browse, extract, and synthesize findings.
                </p>
              </div>
            )}

            {state.status === "working" && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center text-sm text-slate-300">
                <Loader2 className="h-9 w-9 animate-spin text-cyan-400" />
                <div>
                  <p className="font-medium text-white">
                    Executing autonomous research run
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Planning, performing deep web reconnaissance, and compiling
                    findings…
                  </p>
                </div>
              </div>
            )}

            {state.status === "error" && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-rose-200">
                <p className="text-base font-semibold">Run failed</p>
                <p>{state.message}</p>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-rose-100 transition hover:border-rose-200"
                >
                  Reset
                </button>
              </div>
            )}

            {renderCompletedPanel()}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Manus Agent runs entirely in your workspace. Provide API keys in
            environment variables to enable autonomous browsing and synthesis.
          </p>
          <p>
            Deploy-ready for Vercel · Downloadable deliverables for Windows 11
          </p>
        </div>
      </footer>
    </div>
  );
}
