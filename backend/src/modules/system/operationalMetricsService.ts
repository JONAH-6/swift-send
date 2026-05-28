import { createLogger } from '../../logger';

export interface LatencySample {
  timestamp: string;
  route: string;
  latencyMs: number;
  statusCode: number;
}

export interface ThroughputSample {
  timestamp: string;
  count: number;
  periodSeconds: number;
}

export interface OperationalMetrics {
  uptime: {
    startTime: string;
    currentUptimeSeconds: number;
    uptimePercent: number;
  };
  latency: {
    current: number;
    average: number;
    p95: number;
    p99: number;
    samples: LatencySample[];
  };
  throughput: {
    current: number;
    averagePerMinute: number;
    totalRequests: number;
    samples: ThroughputSample[];
  };
}

export class OperationalMetricsService {
  private startTime = Date.now();
  private latencySamples: LatencySample[] = [];
  private throughputBuckets: Map<string, number> = new Map();
  private totalRequests = 0;
  private logger = createLogger({ component: 'operationalMetricsService' });

  recordLatency(route: string, latencyMs: number, statusCode: number): void {
    const sample: LatencySample = {
      timestamp: new Date().toISOString(),
      route,
      latencyMs,
      statusCode,
    };
    this.latencySamples.push(sample);
    this.totalRequests++;

    if (this.latencySamples.length > 1000) {
      this.latencySamples = this.latencySamples.slice(-500);
    }

    const bucketKey = this.getBucketKey();
    this.throughputBuckets.set(bucketKey, (this.throughputBuckets.get(bucketKey) || 0) + 1);
  }

  getMetrics(): OperationalMetrics {
    const now = Date.now();
    const uptimeSeconds = Math.floor((now - this.startTime) / 1000);
    const uptimePercent = uptimeSeconds > 0 ? 100 : 0;

    const recentSamples = this.latencySamples.filter(
      (s) => now - new Date(s.timestamp).getTime() < 300000,
    );

    const currentLatency = recentSamples.length > 0
      ? recentSamples[recentSamples.length - 1].latencyMs
      : 0;

    const averageLatency = recentSamples.length > 0
      ? Math.round(recentSamples.reduce((sum, s) => sum + s.latencyMs, 0) / recentSamples.length)
      : 0;

    const sortedLatencies = [...recentSamples].map((s) => s.latencyMs).sort((a, b) => a - b);
    const p95Index = Math.ceil(sortedLatencies.length * 0.95) - 1;
    const p99Index = Math.ceil(sortedLatencies.length * 0.99) - 1;
    const p95 = sortedLatencies.length > 0 ? sortedLatencies[Math.max(0, p95Index)] : 0;
    const p99 = sortedLatencies.length > 0 ? sortedLatencies[Math.max(0, p99Index)] : 0;

    const throughputSamples: ThroughputSample[] = Array.from(this.throughputBuckets.entries())
      .map(([bucket, count]) => ({
        timestamp: bucket,
        count,
        periodSeconds: 60,
      }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .slice(-30);

    const recentThroughput = throughputSamples.filter((s) => {
      const bucketTime = new Date(s.timestamp).getTime();
      return now - bucketTime < 300000;
    });
    const totalRecentThroughput = recentThroughput.reduce((sum, s) => sum + s.count, 0);
    const averagePerMinute = recentThroughput.length > 0
      ? Math.round(totalRecentThroughput / recentThroughput.length)
      : 0;

    const currentThroughput = recentThroughput.length > 0
      ? recentThroughput[recentThroughput.length - 1].count
      : 0;

    return {
      uptime: {
        startTime: new Date(this.startTime).toISOString(),
        currentUptimeSeconds: uptimeSeconds,
        uptimePercent,
      },
      latency: {
        current: currentLatency,
        average: averageLatency,
        p95,
        p99,
        samples: recentSamples.slice(-100),
      },
      throughput: {
        current: currentThroughput,
        averagePerMinute,
        totalRequests: this.totalRequests,
        samples: throughputSamples,
      },
    };
  }

  private getBucketKey(): string {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString();
  }
}
