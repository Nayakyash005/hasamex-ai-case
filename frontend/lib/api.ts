export type Evidence = {
  quote: string;
  expert: string;
  market: string;
  timestamp: string;
};

export type QAResponse = {
  answer: string;
  evidence: Evidence[];
};

export type UploadResponse = {
  status: string;
  expert: string;
  role: string;
  market: string;
  chunks: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return (await response.json()) as T;
}

export const api = {
  uploadTranscript: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    return request<UploadResponse>("/api/transcripts/parse", {
      method: "POST",
      body: formData,
    });
  },

  queryQuestion: async (question: string): Promise<QAResponse> =>
    request<QAResponse>("/api/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    }),
};
