import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/** Server-only OpenAI-compatible provider controlled by this deployment. */
export function createAiGatewayProvider(apiKey: string, baseURL: string) {
  return createOpenAICompatible({
    name: "app-ai-gateway",
    baseURL,
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}
