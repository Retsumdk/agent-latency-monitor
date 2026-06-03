import { LatencyMetric, AnomalyReport, LatencySummary } from "./types";

export class AnalyticsEngine {
  public static calculateAnomaly(
    metric: LatencyMetric,
    history: LatencyMetric[],
    threshold: number
  ): AnomalyReport {
    if (history.length < 5) {
      return {
        metric,
        zScore: 0,
        isAnomaly: false,
        threshold,
        averageLatency: metric.latencyMs,
      };
    }

    const latencies = history.map((m) => m.latencyMs);
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const stdDev = Math.sqrt(
      latencies.map((x) => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / latencies.length
    );

    const zScore = stdDev === 0 ? 0 : (metric.latencyMs - avg) / stdDev;

    return {
      metric,
      zScore,
      isAnomaly: Math.abs(zScore) > threshold,
      threshold,
      averageLatency: Math.round(avg),
    };
  }

  public static summarize(metrics: LatencyMetric[]): LatencySummary[] {
    const groups = new Map<string, LatencyMetric[]>();

    for (const m of metrics) {
      const key = `${m.provider}:${m.model}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(m);
    }

    const summaries: LatencySummary[] = [];

    for (const [key, group] of groups) {
      const [provider, model] = key.split(":");
      const latencies = group.map((m) => m.latencyMs).sort((a, b) => a - b);
      const successes = group.filter((m) => m.success).length;

      summaries.push({
        provider,
        model,
        avgLatency: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
        minLatency: latencies[0],
        maxLatency: latencies[latencies.length - 1],
        p95Latency: latencies[Math.floor(latencies.length * 0.95)],
        successRate: (successes / group.length) * 100,
        count: group.length,
      });
    }

    return summaries;
  }
}
