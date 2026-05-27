const CACHE_KEY = 'swift_send_fx_rates_v2';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const STALE_TTL_MS = 4 * 60 * 60 * 1000; // serve stale for up to 4 hours while revalidating

export interface FxRates {
  [currency: string]: number;
}

interface CacheEntry {
  rates: FxRates;
  fetchedAt: number;
  source: 'network' | 'fallback';
}

export const DEFAULT_FX_RATES: FxRates = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  MXN: 17.25,
  PHP: 56.5,
  GTQ: 7.85,
  NGN: 1580.0,
  KES: 129.0,
  GHS: 15.5,
  ZAR: 18.6,
  INR: 83.5,
  BRL: 5.0,
};

export const currencyRateCache = {
  read(): CacheEntry | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as CacheEntry;
    } catch {
      return null;
    }
  },

  write(rates: FxRates, source: CacheEntry['source'] = 'network'): void {
    try {
      const entry: CacheEntry = { rates, fetchedAt: Date.now(), source };
      localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch {
      // Ignore storage errors (private browsing, quota exceeded)
    }
  },

  isFresh(entry: CacheEntry): boolean {
    return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
  },

  isUsable(entry: CacheEntry): boolean {
    return Date.now() - entry.fetchedAt < STALE_TTL_MS;
  },

  invalidate(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      // ignore
    }
  },
};

const FX_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

export async function fetchFxRates(): Promise<FxRates> {
  const response = await fetch(FX_API_URL);
  if (!response.ok) throw new Error(`FX API returned ${response.status}`);
  const data = (await response.json()) as { rates: FxRates };
  return data.rates;
}

/**
 * Returns rates from cache when fresh.
 * If stale-but-usable, returns cached rates immediately and triggers a background revalidation.
 * Falls back to DEFAULT_FX_RATES when the cache is empty or too old.
 */
export async function getRatesWithCache(
  onUpdate?: (rates: FxRates) => void,
): Promise<FxRates> {
  const cached = currencyRateCache.read();

  if (cached && currencyRateCache.isFresh(cached)) {
    return cached.rates;
  }

  if (cached && currencyRateCache.isUsable(cached)) {
    // Background revalidation — return stale immediately, update asynchronously
    fetchFxRates()
      .then((fresh) => {
        currencyRateCache.write(fresh);
        onUpdate?.(fresh);
      })
      .catch(() => {
        // Keep using stale on network failure
      });
    return cached.rates;
  }

  // No usable cache — fetch synchronously
  try {
    const rates = await fetchFxRates();
    currencyRateCache.write(rates);
    return rates;
  } catch {
    if (cached) return cached.rates;
    currencyRateCache.write(DEFAULT_FX_RATES, 'fallback');
    return DEFAULT_FX_RATES;
  }
}
