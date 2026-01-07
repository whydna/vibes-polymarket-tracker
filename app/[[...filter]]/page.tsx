'use client';

import { useState, useEffect, useRef } from 'react';
import { notFound, usePathname } from 'next/navigation';
import Link from 'next/link';
import type { Trade } from '@/types';

const FILTERS: Record<string, number> = {
  'whale-1k': 1000,
  'whale-5k': 5000,
  'whale-10k': 10000,
};

const DATA_API_URL = '/api/data';

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatSize(size: number): string {
  if (size >= 1000) {
    return `$${size.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }
  return `$${size.toFixed(2)}`;
}

export default function TradesPage({
  params,
}: {
  params: { filter?: string[] };
}) {
  const pathname = usePathname();
  const slug = params.filter?.[0];
  const filterAmount = slug ? FILTERS[slug] : undefined;

  // 404 for invalid slugs
  if (slug && filterAmount === undefined) {
    notFound();
  }

  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchTrades() {
      try {
        const url = filterAmount
          ? `${DATA_API_URL}/trades?limit=500&filterType=CASH&filterAmount=${filterAmount}`
          : `${DATA_API_URL}/trades?limit=500`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data: Trade[] = await response.json();

        setAllTrades((prevTrades) => {
          const existingHashes = new Set(prevTrades.map((t) => t.transactionHash));
          const newTrades = data.filter((t) => !existingHashes.has(t.transactionHash));
          const merged = [...newTrades, ...prevTrades];
          return merged.slice(0, 1000);
        });

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch trades');
      } finally {
        setLoading(false);
      }
    }

    // Reset trades when filter changes
    setAllTrades([]);
    setLoading(true);

    fetchTrades();
    intervalRef.current = setInterval(fetchTrades, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [filterAmount]);

  const currentLabel = slug
    ? `$${slug.replace('whale-', '').toUpperCase()}+`
    : 'All';

  return (
    <div className="live-trades">
      <div className="live-header">
        <h2>Live Trades</h2>
        <div className="live-indicator">
          <span className="live-dot" />
          <span>{currentLabel}</span>
        </div>
      </div>

      <div className="price-filters">
        <Link href="/" className={`price-filter-btn ${pathname === '/' ? 'active' : ''}`}>
          All
        </Link>
        <Link
          href="/whale-1k"
          className={`price-filter-btn ${pathname === '/whale-1k' ? 'active' : ''}`}
        >
          🐳 $1K+
        </Link>
        <Link
          href="/whale-5k"
          className={`price-filter-btn ${pathname === '/whale-5k' ? 'active' : ''}`}
        >
          🐳 $5K+
        </Link>
        <Link
          href="/whale-10k"
          className={`price-filter-btn ${pathname === '/whale-10k' ? 'active' : ''}`}
        >
          🐳 $10K+
        </Link>
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

      {!loading && !error && allTrades.length === 0 && (
        <div className="empty">
          <p>No trades found{filterAmount ? ` (waiting for ${currentLabel} trades)` : ''}</p>
        </div>
      )}

      {!loading && !error && allTrades.length > 0 && (
        <div className="trades-table-container">
          <table className="trades-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Side</th>
                <th>Outcome</th>
                <th>Size</th>
                <th>Price</th>
                <th>Market</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {allTrades.map((trade, index) => (
                <tr
                  key={`${trade.transactionHash}-${index}`}
                  onClick={() => window.open(`https://polymarket.com/event/${trade.eventSlug}`, '_blank')}
                  className="trade-row"
                >
                  <td className="user-cell">
                    {trade.profileImage ? (
                      <img src={trade.profileImage} alt="" className="trade-avatar" />
                    ) : (
                      <div className="trade-avatar-placeholder" />
                    )}
                    <span>{trade.name || trade.pseudonym}</span>
                  </td>
                  <td className={`side-cell ${trade.side.toLowerCase()}`}>
                    {trade.side === 'BUY' ? 'Buy' : 'Sell'}
                  </td>
                  <td>{trade.outcome}</td>
                  <td className="size-cell">{formatSize(trade.size * trade.price)}</td>
                  <td>{(trade.price * 100).toFixed(0)}%</td>
                  <td className="market-cell">{trade.title}</td>
                  <td className="time-cell">{formatTimeAgo(trade.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
