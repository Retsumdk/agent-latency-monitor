export interface LatencyMetric {
  provider: string;
  model: string;
  latencyMs: number;
  timestamp: number;
  tokens?: number;
  tokensPerSecond?: number;
  statusCode: number;
  success: boolean;
  error?: string;
}

export interface AnomalyReport {
  metric: LatencyMetric;
  zScore: number;
  isAnomaly: boolean;
  threshold: number;
  averageLatency: number;
}

export interface ProviderConfig {
  name: string;
  apiKey: string;
  baseUrl?: string;
  models: string[];
}

export interface MonitorConfig {
  providers: ProviderConfig[];
  intervalMs: number;
  historyLimit: number;
  anomalyThreshold: number;
  alertEmail?: string;
}

export interface LatencySummary {
  provider: string;
  model: string;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  p95Latency: number;
  successRate: number;
  count: number;
}
