import { BaseProvider } from "./base";
import { LatencyMetric } from "../types";

export class AnthropicProvider extends BaseProvider {
  async testLatency(model: string): Promise<LatencyMetric> {
    const timestamp = Date.now();
    const result = await this.measureRequest(async () => {
      if (!this.config.apiKey || this.config.apiKey === "mock") {
        // Simulation mode for testing
        await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 300));
        return { statusCode: 200, tokens: 40 };
      }

      const response = await fetch(this.config.baseUrl || "https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
        }),
      });

      if (!response.ok) {
        throw { status: response.status, message: await response.text() };
      }

      const data = await response.json();
      return {
        statusCode: response.status,
        tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      };
    });

    const tokensPerSecond =
      result.tokens && result.latencyMs > 0 ? (result.tokens / result.latencyMs) * 1000 : undefined;

    return {
      provider: this.getName(),
      model,
      latencyMs: result.latencyMs,
      timestamp,
      tokens: result.tokens,
      tokensPerSecond,
      statusCode: result.statusCode,
      success: !result.error,
      error: result.error,
    };
  }
}
