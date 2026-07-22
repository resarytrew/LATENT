import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ProviderError } from '@/features/providers/model/types';
import { getServerProvider } from '@/features/providers/server/registry';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  worldId: z.string(),
  prompt: z.string().min(1),
  systemPrompt: z.string(),
  modelConfig: z.object({
    provider: z.enum(['mock', 'openai-compatible']),
    model: z.string(),
    temperature: z.number(),
    topP: z.number(),
    maxOutputTokens: z.number(),
    seed: z.number().optional(),
    frequencyPenalty: z.number(),
    presencePenalty: z.number()
  })
});

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid generation request.', details: parsed.error.flatten() }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const startedAt = Date.now();
      try {
        const provider = getServerProvider(parsed.data.modelConfig.provider);
        controller.enqueue(encoder.encode(sse('provider', { providerId: provider.id })));
        let index = 0;
        for await (const chunk of provider.stream({ ...parsed.data, abortSignal: request.signal })) {
          if (chunk.warning) controller.enqueue(encoder.encode(sse('warning', { message: chunk.warning })));
          if (chunk.text) {
            controller.enqueue(encoder.encode(sse('chunk', { index, text: chunk.text, tokenIndex: chunk.tokenIndex, source: chunk.source, timestamp: new Date().toISOString() })));
            index += 1;
          }
          if (chunk.usage || chunk.finishReason) {
            controller.enqueue(encoder.encode(sse('meta', { usage: chunk.usage, finishReason: chunk.finishReason, latency: Date.now() - startedAt })));
          }
        }
        controller.enqueue(encoder.encode(sse('done', { latency: Date.now() - startedAt })));
        controller.close();
      } catch (error) {
        const providerError = error instanceof ProviderError ? error : new ProviderError(error instanceof Error ? error.message : 'Unknown provider error.', 'unknown');
        controller.enqueue(encoder.encode(sse('error', { message: providerError.message, code: providerError.code, status: providerError.status })));
        controller.close();
      }
    },
    cancel() {
      // The request signal is consumed by the provider. No hidden model-state continuation is attempted.
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
