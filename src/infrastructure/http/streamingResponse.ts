import { NextRequest, NextResponse } from 'next/server';

const HEARTBEAT_INTERVAL_MS = 8_000;

export function wantsHeartbeatStream(request: NextRequest): boolean {
  if (request.headers.get('x-mindmittel-stream') === '1') {
    return true;
  }
  const accept = request.headers.get('accept') ?? '';
  return accept.includes('application/x-ndjson');
}

/**
 * Executes an async API operation while optionally streaming NDJSON heartbeat frames every 8 seconds.
 * - When `x-mindmittel-stream: 1` is sent by the browser UI, immediately flushes an initial heartbeat frame
 *   so Heroku's 30-second H12 initial-response timeout is disarmed in < 5ms and kept alive via rolling 55s windows.
 * - When called without the streaming header (e.g. unit tests or standard REST clients), returns a normal `NextResponse.json`.
 */
export async function runWithHeartbeatStream(
  request: NextRequest,
  work: () => Promise<{ status?: number; body: Record<string, unknown> }>
): Promise<NextResponse> {
  if (!wantsHeartbeatStream(request)) {
    const result = await work();
    return NextResponse.json(result.body, { status: result.status ?? 200 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const safeEnqueue = (payload: Record<string, unknown>) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        } catch {
          closed = true;
        }
      };

      // Flush first byte immediately so Heroku router never triggers H12 on initial response wait
      safeEnqueue({ type: 'heartbeat', ts: Date.now() });

      const heartbeatTimer = setInterval(() => {
        safeEnqueue({ type: 'heartbeat', ts: Date.now() });
      }, HEARTBEAT_INTERVAL_MS);

      work()
        .then((result) => {
          clearInterval(heartbeatTimer);
          safeEnqueue({
            type: 'result',
            status: result.status ?? 200,
            data: result.body,
          });
          if (!closed) {
            closed = true;
            try {
              controller.close();
            } catch {
              // Ignore close error
            }
          }
        })
        .catch((err) => {
          clearInterval(heartbeatTimer);
          safeEnqueue({
            type: 'result',
            status: 500,
            data: {
              ok: false,
              error:
                err instanceof Error ? err.message : 'Unexpected server error',
            },
          });
          if (!closed) {
            closed = true;
            try {
              controller.close();
            } catch {
              // Ignore close error
            }
          }
        });
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
