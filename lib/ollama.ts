import OpenAI from "openai";

function getClient() {
  return new OpenAI({
    baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
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
  const client = getClient();

  const response = await client.embeddings.create({
    model: process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text",
    input: text,
  });

  return response.data[0].embedding;
}
