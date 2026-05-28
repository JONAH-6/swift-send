import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Bell, CheckCheck, Shield, Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

type AlertSeverity = "critical" | "high" | "medium" | "low";

interface AdminAlert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  transferId?: string;
  userId?: string;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

interface AlertStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  unacknowledged: number;
}

const severityConfig: Record<AlertSeverity, { color: string; bg: string; label: string }> = {
  critical: { color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", label: "Critical" },
  high: { color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30", label: "High" },
  medium: { color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30", label: "Medium" },
  low: { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", label: "Low" },
};

const typeLabels: Record<string, string> = {
  transfer_failed: "Transfer Failure",
  queue_failure: "Queue Failure",
  fraud_flagged: "Fraud Flag",
};

export default function AdminFailureAlerts() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const fetchAlerts = useCallback(async (severity?: string) => {
    setLoading(true);
    try {
      const url = severity && severity !== "all"
        ? `/admin/alerts?limit=100&severity=${severity}`
        : "/admin/alerts?limit=100";
      const response = await apiFetch(url);
      if (response.ok) {
        setAlerts(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiFetch("/admin/alerts/stats");
      if (response.ok) {
        setStats(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch alert stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchAlerts(activeTab);
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchAlerts, fetchStats, activeTab]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await apiFetch(`/admin/alerts/${alertId}/acknowledge`, {
        method: "POST",
      });
      if (response.ok) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId ? { ...a, acknowledgedAt: new Date().toISOString() } : a,
          ),
        );
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to acknowledge alert:", error);
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    const config = severityConfig[severity];
    return (
      <Badge className={`${config.bg} ${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant="outline" className="text-xs">
        {typeLabels[type] || type}
      </Badge>
    );
  };

  const filteredAlerts = activeTab === "all"
    ? alerts
    : activeTab === "unacknowledged"
      ? alerts.filter((a) => !a.acknowledgedAt)
      : alerts.filter((a) => a.severity === activeTab);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Failure Alerts
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time transaction failure alerts and notifications
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.high}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unacknowledged</CardTitle>
              <Shield className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.unacknowledged}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {stats.total - stats.unacknowledged}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alert History</CardTitle>
          <CardDescription>
            {filteredAlerts.length} alerts{activeTab !== "all" ? ` (${activeTab})` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unacknowledged">Unacknowledged</TabsTrigger>
              <TabsTrigger value="critical">Critical</TabsTrigger>
              <TabsTrigger value="high">High</TabsTrigger>
              <TabsTrigger value="medium">Medium</TabsTrigger>
              <TabsTrigger value="low">Low</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading alerts...
                    </div>
                  ) : filteredAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No alerts found
                    </div>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border ${
                          alert.acknowledgedAt
                            ? "bg-muted/20 border-border/50"
                            : "bg-card border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getSeverityBadge(alert.severity)}
                              {getTypeBadge(alert.type)}
                              {!alert.acknowledgedAt && (
                                <span className="text-xs font-medium text-yellow-500 animate-pulse">
                                  New
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-sm">{alert.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {alert.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>
                                {formatDistanceToNow(new Date(alert.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                              {alert.transferId && (
                                <span className="font-mono">
                                  Transfer: {alert.transferId.slice(0, 8)}...
                                </span>
                              )}
                              {alert.acknowledgedAt && (
                                <span className="text-green-600 flex items-center gap-1">
                                  <CheckCheck className="w-3 h-3" />
                                  Acknowledged
                                </span>
                              )}
                            </div>
                          </div>
                          {!alert.acknowledgedAt && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAcknowledge(alert.id)}
                              className="shrink-0"
                            >
                              <CheckCheck className="w-4 h-4 mr-1" />
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
