import { memo } from 'react';
import { CheckCircle2, Circle, Clock, Loader2, XCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TransactionStatus } from '@/types';

interface TimelineStep {
  key: TransactionStatus | 'initiated';
  label: string;
  description: string;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    key: 'initiated',
    label: 'Initiated',
    description: 'Transaction submitted to the network',
  },
  {
    key: 'pending',
    label: 'Pending',
    description: 'Awaiting blockchain confirmation',
  },
  {
    key: 'processing',
    label: 'Processing',
    description: 'Confirming on Stellar ledger',
  },
  {
    key: 'completed',
    label: 'Completed',
    description: 'Funds delivered to recipient',
  },
];

type StepState = 'completed' | 'active' | 'pending' | 'failed' | 'cancelled';

function getStepStates(status: TransactionStatus, retries?: number): StepState[] {
  if (status === 'failed') {
    return ['completed', 'completed', 'failed', 'pending'];
  }
  if (status === 'cancelled') {
    return ['completed', 'cancelled', 'pending', 'pending'];
  }

  const activeIndex = status === 'completed' ? 3 : status === 'processing' ? 2 : status === 'pending' ? 1 : 0;

  return TIMELINE_STEPS.map((_, i) => {
    if (i < activeIndex) return 'completed';
    if (i === activeIndex) return status === 'completed' ? 'completed' : 'active';
    return 'pending';
  });
}

function StepIcon({ state }: { state: StepState }) {
  switch (state) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'active':
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'cancelled':
      return <AlertCircle className="w-5 h-5 text-amber-500" />;
    default:
      return <Circle className="w-5 h-5 text-muted-foreground/40" />;
  }
}

interface TransactionStatusTimelineProps {
  status: TransactionStatus;
  className?: string;
  retryCount?: number;
  maxRetries?: number;
  lastError?: string;
}

function TransactionStatusTimelineComponent({ status, className, retryCount, maxRetries, lastError }: TransactionStatusTimelineProps) {
  const stepStates = getStepStates(status, retryCount);
  const hasRetries = retryCount !== undefined && retryCount > 0;

  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/80 mb-3 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        Transaction Lifecycle
      </p>
      <div className="relative">
        {TIMELINE_STEPS.map((step, index) => {
          const state = stepStates[index];
          const isLast = index === TIMELINE_STEPS.length - 1;

          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StepIcon state={state} />
                {!isLast && (
                  <div
                    className={cn(
                      'w-0.5 flex-1 min-h-[1.5rem] my-0.5 rounded-full',
                      state === 'completed' ? 'bg-green-400' : 'bg-border/50',
                    )}
                  />
                )}
              </div>
              <div className={cn('pb-3', isLast && 'pb-0')}>
                <p
                  className={cn(
                    'text-sm font-medium leading-5',
                    state === 'completed' && 'text-green-700 dark:text-green-400',
                    state === 'active' && 'text-blue-700 dark:text-blue-400',
                    state === 'failed' && 'text-red-700 dark:text-red-400',
                    state === 'cancelled' && 'text-amber-700 dark:text-amber-400',
                    state === 'pending' && 'text-muted-foreground/60',
                  )}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {hasRetries && (
        <div className="mt-3 p-3 rounded-lg border border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
              Retry Status
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-amber-200 dark:bg-amber-800">
              <div
                className="h-2 rounded-full bg-amber-500"
                style={{
                  width: `${maxRetries && maxRetries > 0 ? Math.min(100, (retryCount / maxRetries) * 100) : 0}%`,
                }}
              />
            </div>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              {retryCount}/{maxRetries || 3} retries
            </span>
          </div>
          {lastError && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Last error: {lastError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export const TransactionStatusTimeline = memo(TransactionStatusTimelineComponent);
