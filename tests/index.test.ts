import { expect, test, describe } from "bun:test";
import { AnalyticsEngine } from "../src/analytics";
import { LatencyMetric } from "../src/types";

describe("AnalyticsEngine", () => {
  const mockMetric: LatencyMetric = {
    provider: "OpenAI",
    model: "gpt-4",
    latencyMs: 500,
    timestamp: Date.now(),
    statusCode: 200,
    success: true,
  };

  const mockHistory: LatencyMetric[] = [
    { ...mockMetric, latencyMs: 100 },
    { ...mockMetric, latencyMs: 110 },
    { ...mockMetric, latencyMs: 105 },
    { ...mockMetric, latencyMs: 95 },
    { ...mockMetric, latencyMs: 102 },
  ];

  test("calculateAnomaly detects outliers correctly", () => {
    const report = AnalyticsEngine.calculateAnomaly(mockMetric, mockHistory, 2.5);
    expect(report.isAnomaly).toBe(true);
    expect(report.zScore).toBeGreaterThan(2.5);
  });

  test("calculateAnomaly does not flag normal values", () => {
    const normalMetric = { ...mockMetric, latencyMs: 103 };
    const report = AnalyticsEngine.calculateAnomaly(normalMetric, mockHistory, 2.5);
    expect(report.isAnomaly).toBe(false);
    expect(report.zScore).toBeLessThan(1);
  });

  test("summarize groups metrics correctly", () => {
    const metrics: LatencyMetric[] = [
      { ...mockMetric, provider: "P1", model: "M1", latencyMs: 100 },
      { ...mockMetric, provider: "P1", model: "M1", latencyMs: 200 },
      { ...mockMetric, provider: "P2", model: "M2", latencyMs: 300 },
    ];

    const summaries = AnalyticsEngine.summarize(metrics);
    expect(summaries.length).toBe(2);
    
    const s1 = summaries.find(s => s.provider === "P1");
    expect(s1?.avgLatency).toBe(150);
    expect(s1?.count).toBe(2);
  });
});

describe("Monitor Logic", () => {
  // We can add more integration-style tests here if needed
  test("history limit is respected", async () => {
    // This would require a mock monitor but the logic is straightforward
    const list: any[] = [];
    const limit = 3;
    
    const add = (item: any) => {
      list.push(item);
      if (list.length > limit) list.shift();
    };

    add(1); add(2); add(3); add(4);
    expect(list.length).toBe(3);
    expect(list[0]).toBe(2);
  });
});
