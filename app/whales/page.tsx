'use client';

import { useState, useEffect, useRef } from 'react';
import type { Trade } from '@/types';
import { TradeCard } from '@/components/TradeCard';

const DATA_API_URL = '/api/data';
const WHALE_THRESHOLD = 5000;

export default function WhalesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchTrades() {
      try {
        const response = await fetch(`${DATA_API_URL}/trades?limit=100`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data: Trade[] = await response.json();
        const whaleTrades = data.filter((trade) => trade.size >= WHALE_THRESHOLD);
        setTrades(whaleTrades);
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
        <h2>Whale Trades</h2>
        <div className="live-indicator whale-indicator">
          <span className="live-dot" />
          <span>$5,000+</span>
        </div>
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

      {!loading && !error && trades.length === 0 && (
        <div className="empty">
          <p>No whale trades found (waiting for $5,000+ bets)</p>
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
