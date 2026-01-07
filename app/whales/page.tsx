'use client';

import { useState, useEffect, useRef } from 'react';
import type { Trade } from '@/types';
import { TradeCard } from '@/components/TradeCard';

const DATA_API_URL = '/api/data';

const PRICE_POINTS = [
  { value: 1000, label: '$1K+' },
  { value: 5000, label: '$5K+' },
  { value: 10000, label: '$10K+' },
] as const;

export default function WhalesPage() {
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [threshold, setThreshold] = useState(5000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const filteredTrades = allTrades.filter((trade) => trade.size >= threshold);

  useEffect(() => {
    async function fetchTrades() {
      try {
        const response = await fetch(`${DATA_API_URL}/trades?limit=100&sizeMin=1000`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data: Trade[] = await response.json();
        setAllTrades(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch trades');
      } finally {
        setLoading(false);
      }
    }

    fetchTrades();

    // Auto-refresh every 5 seconds
    intervalRef.current = setInterval(fetchTrades, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const currentLabel = PRICE_POINTS.find((p) => p.value === threshold)?.label || '$5K+';

  return (
    <div className="live-trades">
      <div className="live-header">
        <h2>Whale Trades</h2>
        <div className="live-indicator whale-indicator">
          <span className="live-dot" />
          <span>{currentLabel}</span>
        </div>
      </div>

      <div className="price-filters">
        {PRICE_POINTS.map((point) => (
          <button
            key={point.value}
            className={`price-filter-btn ${threshold === point.value ? 'active' : ''}`}
            onClick={() => setThreshold(point.value)}
          >
            {point.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading whale trades...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {!loading && !error && filteredTrades.length === 0 && (
        <div className="empty">
          <p>No whale trades found (waiting for {currentLabel} bets)</p>
        </div>
      )}

      {!loading && !error && filteredTrades.length > 0 && (
        <div className="trades-list">
          {filteredTrades.map((trade, index) => (
            <TradeCard key={`${trade.transactionHash}-${index}`} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
}
