/* ── SSE Helpers ─────────────────────────────────────── */

export function sseEvent(event: string, data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function sseComment(comment: string): Uint8Array {
  return new TextEncoder().encode(`: ${comment}\n\n`);
}

export function createSSEStream(): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(sseEvent("connected", { ts: Date.now() }));
    },
  });
}

/* ── Client-side SSE parser (async generator) ──────── */

export interface SSEMessage {
  event: string;
  data: string;
}

export async function* parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<SSEMessage, void, unknown> {
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "message";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          const data = line.slice(6);
          yield { event: currentEvent, data };
          currentEvent = "message";
        } else if (line === "") {
          currentEvent = "message";
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
