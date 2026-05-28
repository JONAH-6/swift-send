import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Gauge,
  TrendingUp,
  Clock,
  Server,
  BarChart3,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiFetch } from "@/lib/api";

interface LatencySample {
  timestamp: string;
  route: string;
  latencyMs: number;
  statusCode: number;
}

interface ThroughputSample {
  timestamp: string;
  count: number;
  periodSeconds: number;
}

interface OperationalMetrics {
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

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds % 60}s`);
  return parts.join(" ");
}

function getLatencyColor(ms: number): string {
  if (ms >= 2000) return "text-red-500";
  if (ms >= 1000) return "text-yellow-500";
  if (ms >= 500) return "text-orange-500";
  return "text-green-500";
}

function getThroughputColor(count: number): string {
  if (count > 50) return "text-green-500";
  if (count > 20) return "text-yellow-500";
  return "text-muted-foreground";
}

export default function AdminOperationalMetrics() {
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/admin/metrics");
      if (response.ok) {
        setMetrics(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15_000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const maxLatency = metrics
    ? Math.max(...metrics.latency.samples.map((s) => s.latencyMs), 1)
    : 1;

  const maxThroughput = metrics
    ? Math.max(...metrics.throughput.samples.map((s) => s.count), 1)
    : 1;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Operational Metrics
          </h1>
          <p className="text-muted-foreground mt-2">
            System-level performance monitoring
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Auto-refreshing
        </Badge>
      </div>

      {loading && !metrics ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading metrics...
          </CardContent>
        </Card>
      ) : metrics ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatUptime(metrics.uptime.currentUptimeSeconds)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Since {new Date(metrics.uptime.startTime).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Latency</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getLatencyColor(metrics.latency.current)}`}>
                  {metrics.latency.current}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg: {metrics.latency.average}ms | P95: {metrics.latency.p95}ms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Throughput</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.throughput.averagePerMinute}/min
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.throughput.totalRequests.toLocaleString()} total requests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">P99 Latency</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getLatencyColor(metrics.latency.p99)}`}>
                  {metrics.latency.p99}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  P95: {metrics.latency.p95}ms
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  API Latency (last 100 samples)
                </CardTitle>
                <CardDescription>
                  Response time per request in milliseconds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1">
                    {metrics.latency.samples.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No latency data yet
                      </p>
                    ) : (
                      [...metrics.latency.samples]
                        .reverse()
                        .map((sample, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2 rounded bg-muted/20"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-mono truncate">
                                {sample.route}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(sample.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 rounded bg-primary/20"
                                style={{
                                  width: `${Math.max(4, (sample.latencyMs / maxLatency) * 100)}px`,
                                }}
                              />
                              <span
                                className={`text-xs font-mono w-16 text-right ${getLatencyColor(sample.latencyMs)}`}
                              >
                                {sample.latencyMs}ms
                              </span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Transaction Throughput
                </CardTitle>
                <CardDescription>
                  Requests per minute over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1">
                    {metrics.throughput.samples.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No throughput data yet
                      </p>
                    ) : (
                      [...metrics.throughput.samples]
                        .reverse()
                        .map((sample, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2 rounded bg-muted/20"
                          >
                            <span className="text-xs text-muted-foreground w-20">
                              {new Date(sample.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <div className="flex-1">
                              <div
                                className="h-4 rounded bg-primary/30"
                                style={{
                                  width: `${Math.max(4, (sample.count / maxThroughput) * 100)}%`,
                                }}
                              />
                            </div>
                            <span
                              className={`text-xs font-mono w-12 text-right ${getThroughputColor(sample.count)}`}
                            >
                              {sample.count}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Failed to load metrics data
          </CardContent>
        </Card>
      )}
    </div>
  );
}
