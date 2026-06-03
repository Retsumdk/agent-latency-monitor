import { writeFileSync, readFileSync, existsSync } from "fs";
import { MonitorConfig } from "./types";

export function loadConfig(path: string): MonitorConfig {
  const defaults: MonitorConfig = {
    providers: [
      {
        name: "OpenAI",
        apiKey: process.env.OPENAI_API_KEY || "mock",
        models: ["gpt-3.5-turbo", "gpt-4"],
      },
      {
        name: "Anthropic",
        apiKey: process.env.ANTHROPIC_API_KEY || "mock",
        models: ["claude-3-haiku-20240307", "claude-3-opus-20240229"],
      },
    ],
    intervalMs: 60000,
    historyLimit: 100,
    anomalyThreshold: 2.5,
  };

  if (existsSync(path)) {
    try {
      const userConfig = JSON.parse(readFileSync(path, "utf-8"));
      return { ...defaults, ...userConfig };
    } catch (err) {
      console.warn(`[Utils] Failed to parse config at ${path}, using defaults.`);
    }
  }

  return defaults;
}

export function saveMetrics(path: string, metrics: any) {
  try {
    writeFileSync(path, JSON.stringify(metrics, null, 2));
  } catch (err) {
    console.error(`[Utils] Failed to save metrics to ${path}:`, err);
  }
}

export function formatMs(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
