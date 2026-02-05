/**
 * SSE 스트리밍 응답 유틸리티
 */

export function createSSEResponse(headers: Record<string, string> = {}): {
  response: Response;
  writer: WritableStreamDefaultWriter<Uint8Array>;
  encoder: TextEncoder;
} {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...headers,
    },
  });

  return { response, writer, encoder };
}

export async function sendSSEEvent(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  event: string,
  data: any
): Promise<void> {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  await writer.write(encoder.encode(message));
}

export async function sendSSEData(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
  data: any
): Promise<void> {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  await writer.write(encoder.encode(message));
}

export async function closeSSE(
  writer: WritableStreamDefaultWriter<Uint8Array>
): Promise<void> {
  await writer.close();
}
