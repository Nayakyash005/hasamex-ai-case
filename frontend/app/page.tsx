"use client";

import { useState, type ChangeEvent } from "react";

import { api, type QAResponse, type UploadResponse } from "../lib/api";

const interviewQuestions = [
  "Current adoption of robotic surgery in the market?",
  "Main barriers?",
  "Importance of hospital budgets and ROI?",
  "Importance of surgeon training and clinical outcomes?",
  "Adoption trend over the next 3–5 years?",
  "Typical hospital decision-making timeline for a new robotic system?",
];

const comparisonThemes = [
  {
    title: "Capital cost and ROI remain the central gating factor",
    evidence: [
      {
        quote:
          "The biggest issue is still capital budget approval. Hospitals may like the technology clinically, but purchasing committees need a strong economic case before approving a system.",
        expert: "Dr. Jean Martin",
        market: "France",
        timestamp: "01:20",
      },
      {
        quote:
          "Cost is the first barrier. These are large capital purchases, and hospital finances are under pressure.",
        expert: "Anna Keller",
        market: "Germany",
        timestamp: "01:10",
      },
      {
        quote:
          "Funding is important, but I would say training capacity is just as important.",
        expert: "Dr. Emily Carter",
        market: "United Kingdom",
        timestamp: "01:05",
      },
    ],
  },
  {
    title: "Training and utilisation are critical for adoption",
    evidence: [
      {
        quote:
          "Hospitals want several surgeons trained so utilisation is high enough.",
        expert: "Dr. Jean Martin",
        market: "France",
        timestamp: "03:10",
      },
      {
        quote:
          "If the hospital buys a system but only one surgeon is comfortable using it, utilisation will be poor.",
        expert: "Anna Keller",
        market: "Germany",
        timestamp: "03:05",
      },
      {
        quote:
          "You can buy a system, but if you cannot train enough surgeons and theatre staff, adoption stalls.",
        expert: "Dr. Emily Carter",
        market: "United Kingdom",
        timestamp: "01:05",
      },
    ],
  },
  {
    title: "Adoption is increasing, but unevenly by hospital and market",
    evidence: [
      {
        quote:
          "Adoption is growing, but it is still concentrated in larger academic hospitals and private centres with stronger capital budgets.",
        expert: "Dr. Jean Martin",
        market: "France",
        timestamp: "00:18",
      },
      {
        quote:
          "It is growing, but adoption is quite uneven. Large university hospitals are much more advanced, while many smaller hospitals are still waiting.",
        expert: "Anna Keller",
        market: "Germany",
        timestamp: "00:16",
      },
      {
        quote:
          "Adoption is increasing, and in some larger NHS trusts robotic surgery is becoming standard for selected procedures.",
        expert: "Dr. Emily Carter",
        market: "United Kingdom",
        timestamp: "00:14",
      },
    ],
  },
];

type TranscriptRecord = {
  fileName: string;
  expert: string;
  role: string;
  market: string;
  status: "loading" | "success" | "error";
  chunks?: number;
  error?: string;
};

export default function Home() {
  const [transcripts, setTranscripts] = useState<TranscriptRecord[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState(
    interviewQuestions[0],
  );
  const [guideResult, setGuideResult] = useState<QAResponse | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [freeQuestion, setFreeQuestion] = useState(
    "What are the main barriers to robotic surgery adoption?",
  );
  const [freeResult, setFreeResult] = useState<QAResponse | null>(null);
  const [freeLoading, setFreeLoading] = useState(false);
  const [freeError, setFreeError] = useState<string | null>(null);

  const askGuideQuestion = async (question: string) => {
    setGuideLoading(true);
    setGuideError(null);

    try {
      const result = await api.queryQuestion(question);
      setGuideResult(result);
    } catch (error) {
      setGuideError(
        error instanceof Error ? error.message : "Unable to answer question.",
      );
      setGuideResult(null);
    } finally {
      setGuideLoading(false);
    }
  };

  const askFreeQuestion = async () => {
    if (!freeQuestion.trim()) {
      setFreeError("Please enter a question.");
      return;
    }

    setFreeLoading(true);
    setFreeError(null);

    try {
      const result = await api.queryQuestion(freeQuestion.trim());
      setFreeResult(result);
    } catch (error) {
      setFreeError(error instanceof Error ? error.message : "Query failed.");
      setFreeResult(null);
    } finally {
      setFreeLoading(false);
    }
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const fileName = file.name;
    const record: TranscriptRecord = {
      fileName,
      expert: "Processing...",
      role: "-",
      market: "-",
      status: "loading",
    };

    setTranscripts((current: TranscriptRecord[]) => {
      const existing = current.find(
        (item: TranscriptRecord) => item.fileName === fileName,
      );
      if (existing) {
        return current.map((item: TranscriptRecord) =>
          item.fileName === fileName ? { ...item, status: "loading" } : item,
        );
      }
      return [...current, record];
    });

    try {
      const result: UploadResponse = await api.uploadTranscript(file);
      setTranscripts((current: TranscriptRecord[]) =>
        current.map((item: TranscriptRecord) =>
          item.fileName === fileName
            ? {
                fileName,
                expert: result.expert,
                role: result.role,
                market: result.market,
                status: "success",
                chunks: result.chunks,
              }
            : item,
        ),
      );
    } catch (error) {
      setTranscripts((current: TranscriptRecord[]) =>
        current.map((item: TranscriptRecord) =>
          item.fileName === fileName
            ? {
                fileName,
                expert: "Upload failed",
                role: "-",
                market: "-",
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : item,
        ),
      );
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">
            Hasamex Expert Interview Analysis
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Robotic Surgery Market Intelligence
          </h1>
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Transcript Upload</h2>
                <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-700">
                  {transcripts.length} files
                </span>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-sky-400 hover:bg-sky-50">
                <span className="text-sm font-medium text-slate-700">
                  Upload transcript (.txt)
                </span>
                <span className="mt-2 text-xs text-slate-500">
                  France, Germany, or UK interview file
                </span>
                <input
                  type="file"
                  accept=".txt"
                  className="hidden"
                  onChange={handleUpload}
                />
              </label>

              <div className="mt-5 space-y-3">
                {transcripts.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No transcript uploaded yet.
                  </p>
                ) : (
                  transcripts.map((item: TranscriptRecord) => (
                    <div
                      key={item.fileName}
                      className="rounded-xl border border-slate-200 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-800">
                            {item.expert}
                          </p>
                          <p className="text-xs text-slate-500">{item.role}</p>
                          <p className="text-xs text-slate-500">
                            {item.market}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                            item.status === "success"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.status === "loading"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      {item.chunks ? (
                        <p className="mt-2 text-xs text-slate-500">
                          {item.chunks} Q&A chunks indexed
                        </p>
                      ) : null}
                      {item.error ? (
                        <p className="mt-2 text-xs text-rose-600">
                          {item.error}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>

          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">
                Interview Guide Analysis
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {interviewQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => {
                      setSelectedQuestion(question);
                      void askGuideQuestion(question);
                    }}
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      selectedQuestion === question
                        ? "border-sky-600 bg-sky-600 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300"
                    }`}
                  >
                    {question}
                  </button>
                ))}
              </div>

              {guideLoading ? (
                <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-700">
                  Loading expert answer…
                </div>
              ) : guideError ? (
                <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {guideError}
                </div>
              ) : guideResult ? (
                <div className="mt-5 space-y-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Answer
                    </p>
                    <p className="mt-3 text-base leading-7 text-slate-800">
                      {guideResult.answer}
                    </p>
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Evidence
                    </p>
                    <div className="space-y-3">
                      {guideResult.evidence.map((item, index) => (
                        <div
                          key={`${item.expert}-${item.timestamp}-${index}`}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <blockquote className="border-l-4 border-sky-500 pl-3 text-sm italic leading-7 text-slate-700">
                            “{item.quote}”
                          </blockquote>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-medium text-slate-700">
                              {item.expert}
                            </span>
                            <span>·</span>
                            <span>{item.market}</span>
                            <span>·</span>
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">
                Common Themes & Differences
              </h2>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {comparisonThemes.map((theme) => (
                  <div
                    key={theme.title}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <h3 className="text-sm font-semibold text-slate-800">
                      {theme.title}
                    </h3>
                    <div className="mt-3 space-y-3">
                      {theme.evidence.map((item) => (
                        <div
                          key={`${theme.title}-${item.expert}-${item.timestamp}`}
                          className="rounded-lg border border-slate-200 bg-white p-3"
                        >
                          <p className="text-xs leading-6 text-slate-700">
                            “{item.quote}”
                          </p>
                          <div className="mt-2 text-[11px] text-slate-500">
                            {item.expert} · {item.market} · {item.timestamp}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">
                Ask a question across all expert interviews
              </h2>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <textarea
                  value={freeQuestion}
                  onChange={(event) => setFreeQuestion(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none ring-0 transition focus:border-sky-500"
                  placeholder="What are the main barriers to robotic surgery adoption?"
                />
                <button
                  type="button"
                  onClick={() => void askFreeQuestion()}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                  disabled={freeLoading}
                >
                  {freeLoading ? "Querying…" : "Ask"}
                </button>
              </div>

              {freeError ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {freeError}
                </div>
              ) : null}

              {freeResult ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Answer
                    </p>
                    <p className="mt-3 text-base leading-7 text-slate-800">
                      {freeResult.answer}
                    </p>
                  </div>

                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Evidence
                    </p>
                    <div className="space-y-3">
                      {freeResult.evidence.map((item, index) => (
                        <div
                          key={`${item.expert}-${item.market}-${index}`}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <blockquote className="border-l-4 border-sky-500 pl-3 text-sm italic leading-7 text-slate-700">
                            “{item.quote}”
                          </blockquote>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="font-medium text-slate-700">
                              {item.expert}
                            </span>
                            <span>·</span>
                            <span>{item.market}</span>
                            <span>·</span>
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
