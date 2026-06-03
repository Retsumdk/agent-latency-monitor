import { LatencyMetric, MonitorConfig, AnomalyReport } from "./types";
import { BaseProvider } from "./providers/base";
import { AnalyticsEngine } from "./analytics";

export class LatencyMonitor {
  private providers: BaseProvider[];
  private config: MonitorConfig;
  private history: Map<string, LatencyMetric[]>;
  private isRunning: boolean = false;

  constructor(config: MonitorConfig, providers: BaseProvider[]) {
    this.config = config;
    this.providers = providers;
    this.history = new Map();
  }

  public async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[Monitor] Starting latency monitor with ${this.providers.length} providers...`);

    while (this.isRunning) {
      await this.runIteration();
      await new Promise((resolve) => setTimeout(resolve, this.config.intervalMs));
    }
  }

  public stop() {
    this.isRunning = false;
    console.log("[Monitor] Stopping latency monitor...");
  }

  private async runIteration() {
    for (const provider of this.providers) {
      for (const model of provider.getModels()) {
        try {
          const metric = await provider.testLatency(model);
          this.recordMetric(metric);

          const report = this.checkAnomaly(metric);
          if (report.isAnomaly) {
            this.handleAnomaly(report);
          }

          console.log(
            `[${metric.provider}] ${metric.model}: ${metric.latencyMs}ms | ${
              metric.success ? "OK" : "FAIL"
            }`
          );
        } catch (err) {
          console.error(`[Monitor] Error testing ${provider.getName()} (${model}):`, err);
        }
      }
    }
  }

  private recordMetric(metric: LatencyMetric) {
    const key = `${metric.provider}:${metric.model}`;
    if (!this.history.has(key)) {
      this.history.set(key, []);
    }
    const list = this.history.get(key)!;
    list.push(metric);

    if (list.length > this.config.historyLimit) {
      list.shift();
    }
  }

  private checkAnomaly(metric: LatencyMetric): AnomalyReport {
    const key = `${metric.provider}:${metric.model}`;
    const history = this.history.get(key) || [];
    return AnalyticsEngine.calculateAnomaly(metric, history, this.config.anomalyThreshold);
  }

  private handleAnomaly(report: AnomalyReport) {
    console.warn(
      `[ANOMALY] Detected in ${report.metric.provider} (${report.metric.model})!`
    );
    console.warn(
      `Latency: ${report.metric.latencyMs}ms | Avg: ${report.averageLatency}ms | Z-Score: ${report.zScore.toFixed(
        2
      )}`
    );
    // Here we could trigger emails, Slack alerts, etc.
  }

  public getSummary() {
    const allMetrics = Array.from(this.history.values()).flat();
    return AnalyticsEngine.summarize(allMetrics);
  }
}
