#!/usr/bin/env bun
/**
 * agent-latency-monitor - Real-time tracking of agent response latency across different LLM providers with anomaly detection
 * Built by Retsumdk
 */

import { Command } from "commander";
import { loadConfig } from "./utils";
import { LatencyMonitor } from "./monitor";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { BaseProvider } from "./providers/base";

async function main() {
  const program = new Command();

  program
    .name("agent-latency-monitor")
    .description("Real-time tracking of agent response latency across different LLM providers with anomaly detection")
    .version("1.0.0")
    .option("-c, --config <path>", "Config file path", "config.json")
    .option("-i, --interval <ms>", "Monitoring interval in ms")
    .option("-t, --threshold <zscore>", "Anomaly detection threshold (Z-score)")
    .option("-v, --verbose", "Enable verbose logging")
    .action(async (options) => {
      const config = loadConfig(options.config);
      
      if (options.interval) config.intervalMs = parseInt(options.interval);
      if (options.threshold) config.anomalyThreshold = parseFloat(options.threshold);

      const providers: BaseProvider[] = [];

      for (const p of config.providers) {
        if (p.name.toLowerCase() === "openai") {
          providers.push(new OpenAIProvider(p));
        } else if (p.name.toLowerCase() === "anthropic") {
          providers.push(new AnthropicProvider(p));
        } else {
          console.warn(`[Main] Unsupported provider: ${p.name}`);
        }
      }

      if (providers.length === 0) {
        console.error("[Main] No valid providers configured. Exiting.");
        process.exit(1);
      }

      const monitor = new LatencyMonitor(config, providers);

      process.on("SIGINT", () => {
        console.log("\n[Main] Gracefully shutting down...");
        monitor.stop();
        const summary = monitor.getSummary();
        console.table(summary);
        process.exit(0);
      });

      await monitor.start();
    });

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error("[Main] Fatal error:", err);
  process.exit(1);
});
