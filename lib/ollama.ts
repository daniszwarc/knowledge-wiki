import OpenAI from "openai";

function getClient() {
  return new OpenAI({
    baseURL: (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/v1$/, '') + "/v1",
    apiKey: "ollama",
  });
}

export async function chat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  systemPrompt: string,
  model?: string
): Promise<ReadableStream<Uint8Array>> {
  const client = getClient();

  const stream = await client.chat.completions.create({
    model: model ?? process.env.OLLAMA_CHAT_MODEL ?? "qwen2.5:3b",
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    stream: true,
  });

  const encoder = new TextEncoder();

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
  const baseUrl = process.env.OLLAMA_BASE_URL?.replace(/\/v1$/, '') ?? "http://localhost:11434"
  const model = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text"
  const res = await fetch(`${baseUrl}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: text }),
  })
  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  const vector = data.embeddings?.[0] ?? data.embedding
  if (!vector || vector.length === 0) {
    throw new Error("Empty embedding returned")
  }
  return vector
}
