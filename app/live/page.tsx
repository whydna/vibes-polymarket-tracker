'use client';

import { useState, useEffect, useRef } from 'react';
import type { Trade } from '@/types';
import { TradeCard } from '@/components/TradeCard';

const DATA_API_URL = '/api/data';

export default function LiveTradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchTrades() {
      try {
        const response = await fetch(`${DATA_API_URL}/trades?limit=50`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        setTrades(data);
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

  return (
    <div className="live-trades">
      <div className="live-header">
        <h2>Live Trades</h2>
        <div className="live-indicator">
          <span className="live-dot" />
          <span>Live</span>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading trades...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {!loading && !error && trades.length === 0 && (
        <div className="empty">
          <p>No trades found</p>
        </div>
      )}

      {!loading && !error && trades.length > 0 && (
        <div className="trades-list">
          {trades.map((trade, index) => (
            <TradeCard key={`${trade.transactionHash}-${index}`} trade={trade} />
          ))}
        </div>
      )}
    </div>
  );
}
