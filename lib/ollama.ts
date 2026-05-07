import OpenAI from "openai";

function getClient() {
  return new OpenAI({
    baseURL: (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/v1$/, '') + "/v1",
    apiKey: process.env.LLM_API_KEY ?? "ollama",
  });
}

export async function chat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  systemPrompt: string,
  model?: string
): Promise<ReadableStream<Uint8Array>> {
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
  const baseUrl = (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/v1$/, '')
  const model = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text"
  const apiKey = process.env.LLM_API_KEY ?? "ollama"
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
