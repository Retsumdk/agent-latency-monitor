import { LatencyMetric, ProviderConfig } from "../types";

export abstract class BaseProvider {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract testLatency(model: string): Promise<LatencyMetric>;

  public getName(): string {
    return this.config.name;
  }

  public getModels(): string[] {
    return this.config.models;
  }

  protected async measureRequest(
    fn: () => Promise<{ statusCode: number; tokens?: number }>
  ): Promise<{ latencyMs: number; statusCode: number; tokens?: number; error?: string }> {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      return {
        latencyMs: Math.round(end - start),
        statusCode: result.statusCode,
        tokens: result.tokens,
      };
    } catch (err: any) {
      const end = performance.now();
      return {
        latencyMs: Math.round(end - start),
        statusCode: err.status || 500,
        error: err.message || "Unknown error",
      };
    }
  }
}
