import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  CalendarDays,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchActivityHeatmap } from '@/lib/activity';
import type { ActivityHeatmapData } from '@/lib/activity';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${i.toString().padStart(2, '0')}:00`,
);

const HEATMAP_COLORS = [
  'bg-blue-50 dark:bg-blue-950/30',
  'bg-blue-200 dark:bg-blue-800/40',
  'bg-blue-400 dark:bg-blue-600/60',
  'bg-blue-600 dark:bg-blue-500/80',
  'bg-blue-800 dark:bg-blue-400',
];

function getHeatLevel(value: number, max: number): number {
  if (max === 0) return 0;
  const ratio = value / max;
  if (ratio === 0) return 0;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

interface ActivityHeatmapProps {
  months?: number;
}

export function ActivityHeatmap({ months = 3 }: ActivityHeatmapProps) {
  const { data, isLoading, error } = useQuery<ActivityHeatmapData>({
    queryKey: ['activity-heatmap', months],
    queryFn: () => fetchActivityHeatmap(months),
    staleTime: 2 * 60 * 1000,
  });

  const maxCount = useMemo(() => {
    if (!data?.daily.length) return 0;
    return Math.max(...data.daily.map((d) => d.count), 1);
  }, [data]);

  const hourTotals = useMemo(() => {
    if (!data?.daily.length) return [];
    const byHour = new Array(24).fill(0);
    data.daily.forEach((d) => {
      byHour[d.hour] += d.count;
    });
    return byHour.map((count, hour) => ({ hour: `${hour.toString().padStart(2, '0')}:00`, count }));
  }, [data]);

  const dayTotals = useMemo(() => {
    if (!data?.daily.length) return [];
    const byDay = new Array(7).fill(0);
    data.daily.forEach((d) => {
      byDay[d.dayOfWeek] += d.count;
    });
    return byDay.map((count, i) => ({ day: DAYS[i], count }));
  }, [data]);

  if (error) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-6 text-sm text-destructive text-center">
          Could not load activity heatmap. Please try again later.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-primary" />
            Activity Heatmap
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : data ? (
          <>
            <DailyHeatmapGrid
              daily={data.daily}
              maxCount={maxCount}
              months={months}
            />
            <HourlyActivityChart data={hourTotals} />
            <DayOfWeekChart data={dayTotals} />
            <MonthlyAnalytics data={data} />
            <ActivitySummary summary={data.summary} />
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground text-center">
            No activity data available for the selected period.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DailyHeatmapGrid({
  daily,
  maxCount,
  months,
}: {
  daily: ActivityHeatmapData['daily'];
  maxCount: number;
  months: number;
}) {
  const weeks = useMemo(() => {
    const grouped = new Map<string, typeof daily>();
    daily.forEach((d) => {
      const existing = grouped.get(d.date) || [];
      existing.push(d);
      grouped.set(d.date, existing);
    });

    const sortedDates = Array.from(grouped.keys()).sort();
    const result: Array<{
      date: string;
      dayOfWeek: number;
      totalCount: number;
      hours: typeof daily;
    }> = [];

    for (const date of sortedDates) {
      const entries = grouped.get(date)!;
      result.push({
        date,
        dayOfWeek: new Date(date + 'T00:00:00Z').getUTCDay(),
        totalCount: entries.reduce((s, e) => s + e.count, 0),
        hours: entries,
      });
    }

    return result;
  }, [daily]);

  if (weeks.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No heatmap data for the last {months} months.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <CalendarDays className="w-3 h-3" />
        Daily Activity ({weeks.length} active days)
      </h4>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1 min-w-max">
          {weeks.slice(-28).map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-muted-foreground w-6 text-center">
                {new Date(day.date + 'T00:00:00Z').getDate()}
              </span>
              <div
                className={`w-6 h-6 rounded-sm ${HEATMAP_COLORS[getHeatLevel(day.totalCount, maxCount)]}`}
                title={`${day.date}: ${day.totalCount} transaction${day.totalCount !== 1 ? 's' : ''}`}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Less</span>
        {HEATMAP_COLORS.map((color, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function HourlyActivityChart({ data }: { data: Array<{ hour: string; count: number }> }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Activity by Hour
      </h4>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            interval={3}
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: 12,
            }}
            formatter={(value: number) => [value, 'Transactions']}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={`hsl(var(--primary) / ${0.3 + (data[i].count / Math.max(...data.map(d => d.count), 1)) * 0.7})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DayOfWeekChart({ data }: { data: Array<{ day: string; count: number }> }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <BarChart3 className="w-3 h-3" />
        Activity by Day of Week
      </h4>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: 12,
            }}
            formatter={(value: number) => [value, 'Transactions']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MonthlyAnalytics({ data }: { data: ActivityHeatmapData }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <TrendingUp className="w-3 h-3" />
        Monthly Analytics
      </h4>
      <div className="grid gap-2">
        {data.monthly.map((m) => (
          <div
            key={m.month}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs font-mono">
                {m.month}
              </Badge>
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{m.count}</span> txns
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                ${m.total.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                ~{m.avgPerDay.toFixed(1)}/day
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitySummary({
  summary,
}: {
  summary: ActivityHeatmapData['summary'];
}) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
      <h4 className="text-xs font-medium text-muted-foreground">Summary</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Total Transactions: </span>
          <span className="font-semibold text-foreground">
            {summary.totalTransactions}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Busiest Day: </span>
          <span className="font-semibold text-foreground">
            {summary.busiestDay}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Peak Hour: </span>
          <span className="font-semibold text-foreground">
            {summary.mostActiveHour.toString().padStart(2, '0')}:00
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Most Active Date: </span>
          <span className="font-semibold text-foreground">
            {summary.mostActiveDay || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}
