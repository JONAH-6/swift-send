import { useState, useEffect, useCallback } from 'react';
import { getRatesWithCache, currencyRateCache, DEFAULT_FX_RATES, type FxRates } from '@/lib/currencyRateCache';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // re-check every 5 minutes

function calculateChanges(prev: FxRates, next: FxRates): Record<string, number> {
  const changes: Record<string, number> = {};
  for (const currency of Object.keys(next)) {
    const previous = prev[currency];
    const current = next[currency];
    if (typeof previous === 'number' && previous > 0) {
      changes[currency] = ((current - previous) / previous) * 100;
    }
  }
  return changes;
}

export function useExchangeRate() {
  const [rates, setRates] = useState<FxRates>(() => {
    const cached = currencyRateCache.read();
    return cached ? cached.rates : DEFAULT_FX_RATES;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<number | null>(() => {
    const cached = currencyRateCache.read();
    return cached ? cached.fetchedAt : null;
  });

  const applyRates = useCallback((incoming: FxRates) => {
    setRates((prev) => {
      setChanges(calculateChanges(prev, incoming));
      return incoming;
    });
    setLastUpdated(Date.now());
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    const refresh = async () => {
      try {
        const fresh = await getRatesWithCache((bgRates) => {
          if (!cancelled) applyRates(bgRates);
        });
        if (!cancelled) {
          applyRates(fresh);
          setError(null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError('Using cached rates');
          setLoading(false);
        }
      }

      if (!cancelled) {
        timerId = setTimeout(refresh, POLL_INTERVAL_MS);
      }
    };

    void refresh();

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [applyRates]);

  const convert = useCallback(
    (amount: number, toCurrency: string) => amount * (rates[toCurrency] ?? 1),
    [rates],
  );

  const invalidateCache = useCallback(() => {
    currencyRateCache.invalidate();
  }, []);

  return { rates, loading, error, convert, changes, lastUpdated, invalidateCache };
}
