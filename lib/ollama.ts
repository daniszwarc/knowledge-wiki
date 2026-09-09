import OpenAI from "openai";

export function getBaseUrl(): string {
  return (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/v1$/, "");
}

export function isAzureGateway(baseUrl: string): boolean {
  return baseUrl.includes("azure-api.net");
}

function getClient() {
  return new OpenAI({
    baseURL: getBaseUrl() + "/v1",
    apiKey: process.env.LLM_API_KEY ?? "ollama",
  });
}

export async function chat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  systemPrompt: string,
  model?: string
): Promise<ReadableStream<Uint8Array>> {
  const baseUrl = getBaseUrl();
  const encoder = new TextEncoder();

  if (isAzureGateway(baseUrl)) {
    // Azure OpenAI Responses API: different endpoint, request, and stream event shape
    const apiKey = process.env.LLM_API_KEY ?? "";
    const input = [{ role: "system", content: systemPrompt }, ...messages];

    const res = await fetch(`${baseUrl}/v1/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        model: model ?? process.env.OLLAMA_CHAT_MODEL ?? "apiwiki-luna",
        input,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Chat failed: ${res.status} ${await res.text()}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice("data:".length).trim();
            if (data === "[DONE]") continue;
            try {
              const event = JSON.parse(data);
              if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
                controller.enqueue(encoder.encode(event.delta));
              }
            } catch {
              // ignore malformed/partial SSE lines
            }
          }
        }
        controller.close();
      },
    });
  }

  const client = getClient();
  const isRemote = (process.env.LLM_API_KEY ?? "ollama") !== "ollama"

  const params: any = {
    model: model ?? process.env.OLLAMA_CHAT_MODEL ?? "qwen3.6",
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    stream: true as const,
    ...(isRemote && {
      chat_template_kwargs: {
        enable_thinking: false
      }
    })
  }
  const stream = await client.chat.completions.create(params) as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });
}

export async function embed(text: string): Promise<number[]> {
  const baseUrl = getBaseUrl();
  const apiKey = process.env.LLM_API_KEY ?? "ollama"

  if (isAzureGateway(baseUrl)) {
    const model = process.env.OLLAMA_EMBED_MODEL ?? "text-embedding-3-small"
    const res = await fetch(`${baseUrl}/v1/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        model,
        input: [text],
      }),
    })
    if (!res.ok) throw new Error(`Embed failed: ${res.status} ${await res.text()}`)
    const data = await res.json()
    return data.data[0].embedding
  }

  const model = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text"
  const isRemote = apiKey !== "ollama" && !baseUrl.includes("localhost")

  if (isRemote) {
    // Use OpenAI-compatible /v1/embeddings with encoding_format: "float"
    const res = await fetch(`${baseUrl}/v1/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [text],
        encoding_format: "float",
      }),
    })
    if (!res.ok) throw new Error(`Embed failed: ${res.status} ${await res.text()}`)
    const data = await res.json()
    return data.data[0].embedding
  } else {
    // Use native Ollama /api/embed endpoint
    const res = await fetch(`${baseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: text }),
    })
    if (!res.ok) throw new Error(`Embed failed: ${res.status} ${await res.text()}`)
    const data = await res.json()
    const vector = data.embeddings?.[0] ?? data.embedding
    if (!vector || vector.length === 0) throw new Error("Empty embedding returned")
    return vector
  }
}
