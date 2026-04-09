import Anthropic from "@anthropic-ai/sdk";

export function getAnthropicClient() {
  return new Anthropic();
}
