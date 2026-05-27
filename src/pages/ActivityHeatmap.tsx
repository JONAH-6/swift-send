import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { ActivityHeatmap as HeatmapComponent } from '@/components/ActivityHeatmap';
import { BottomNav } from '@/components/BottomNav';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ActivityHeatmapPage() {
  const [months, setMonths] = useState('3');

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-6 pt-6 pb-4 border-b border-border/40">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Activity Heatmap</h1>
            </div>
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Month</SelectItem>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Visualize your spending activity patterns over time
          </p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 pt-6">
        <HeatmapComponent months={Number(months)} />
      </main>

      <BottomNav />
    </div>
  );
}
