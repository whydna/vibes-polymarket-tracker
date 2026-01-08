'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Trade } from '@/types';

const DATA_API_URL = '/api/data';
const GAMMA_API_URL = '/api/polymarket';

interface EventResolution {
  closed: boolean;
  winningOutcome?: string;
}

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

function getWinningOutcome(outcomes: string[], outcomePrices: string[]): string | undefined {
  // The winning outcome has price ~1, losing has price ~0
  const winningIndex = outcomePrices.findIndex(p => parseFloat(p) > 0.5);
  return winningIndex >= 0 ? outcomes[winningIndex] : undefined;
}

async function fetchEventResolutions(slugs: string[]): Promise<Map<string, EventResolution>> {
  const resolutions = new Map<string, EventResolution>();
  if (slugs.length === 0) return resolutions;

  try {
    // Fetch events in batches to avoid URL length limits
    const batchSize = 20;
    for (let i = 0; i < slugs.length; i += batchSize) {
      const batch = slugs.slice(i, i + batchSize);
      const slugQuery = batch.map(s => `slug=${encodeURIComponent(s)}`).join('&');
      const response = await fetch(`${GAMMA_API_URL}/events?${slugQuery}`);
      if (!response.ok) continue;

      const events = await response.json();
      for (const event of events) {
        if (event.closed && event.markets?.length > 0) {
          const market = event.markets[0];
          const outcomes = typeof market.outcomes === 'string' ? JSON.parse(market.outcomes) : market.outcomes;
          const outcomePrices = typeof market.outcomePrices === 'string' ? JSON.parse(market.outcomePrices) : market.outcomePrices;
          resolutions.set(event.slug, {
            closed: true,
            winningOutcome: getWinningOutcome(outcomes, outcomePrices),
          });
        } else {
          resolutions.set(event.slug, { closed: false });
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch event resolutions:', err);
  }

  return resolutions;
}

export default function TradesPage() {
  return (
    <Suspense fallback={<div className="loading"><div className="spinner"></div><p>Loading...</p></div>}>
      <TradesContent />
    </Suspense>
  );
}

function TradesContent() {
  const searchParams = useSearchParams();
  const amt = searchParams.get('amt');
  const user = searchParams.get('user');

  const filterAmount = amt ? parseInt(amt, 10) : undefined;

  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [sortColumn, setSortColumn] = useState<'value' | 'odds' | 'time'>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [userName, setUserName] = useState<string | null>(null);
  const [eventResolutions, setEventResolutions] = useState<Map<string, EventResolution>>(new Map());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const sortedTrades = useMemo(() => {
    const sorted = [...allTrades].sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortColumn) {
        case 'value':
          aVal = a.size * a.price;
          bVal = b.size * b.price;
          break;
        case 'odds':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'time':
        default:
          aVal = a.timestamp;
          bVal = b.timestamp;
          break;
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  }, [allTrades, sortColumn, sortDirection]);

  const handleSort = (column: 'value' | 'odds' | 'time') => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  useEffect(() => {
    async function fetchTrades() {
      try {
        let url = `${DATA_API_URL}/trades?limit=500`;
        if (filterAmount) {
          url += `&filterType=CASH&filterAmount=${filterAmount}`;
        }
        if (user) {
          url += `&user=${user}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data: Trade[] = await response.json();

        // Get username from first trade if filtering by user
        if (user && data.length > 0) {
          setUserName(data[0].name || data[0].pseudonym);
        }

        // Get unique event slugs that we don't have resolution data for
        const newSlugs = Array.from(new Set(data.map(t => t.eventSlug))).filter(
          slug => !eventResolutions.has(slug)
        );

        // Fetch resolution data for new events
        if (newSlugs.length > 0) {
          const newResolutions = await fetchEventResolutions(newSlugs);
          setEventResolutions(prev => {
            const updated = new Map(prev);
            newResolutions.forEach((value, key) => updated.set(key, value));
            return updated;
          });
        }

        setAllTrades((prevTrades) => {
          const existingHashes = new Set(prevTrades.map((t) => t.transactionHash));
          const newTrades = data.filter((t) => !existingHashes.has(t.transactionHash));
          const merged = [...newTrades, ...prevTrades];
          return merged.slice(0, 1000);
        });

        setError(null);
        setLastUpdate(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch trades');
      } finally {
        setLoading(false);
      }
    }

    // Reset trades when filter changes
    setAllTrades([]);
    setLoading(true);
    setLastUpdate(0);
    setUserName(null);

    fetchTrades();
    intervalRef.current = setInterval(fetchTrades, 30000);

    // Count up timer for "last update"
    countdownRef.current = setInterval(() => {
      setLastUpdate((prev) => prev + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [filterAmount, user]);

  return (
    <div className="live-trades">
      <div className="live-header">
        <h2>
          {user ? `Trades by ${userName || 'User'}` : 'Live Trades'}
        </h2>
        <div className="live-indicator">
          <span className="live-dot" />
          <span>last update {lastUpdate}s ago</span>
        </div>
      </div>

      <div className="price-filters">
        <Link href="/" className={`price-filter-btn ${!amt && !user ? 'active' : ''}`}>
          All
        </Link>
        <Link
          href="/?amt=1000"
          className={`price-filter-btn ${amt === '1000' ? 'active' : ''}`}
        >
          🐳 $1K+
        </Link>
        <Link
          href="/?amt=5000"
          className={`price-filter-btn ${amt === '5000' ? 'active' : ''}`}
        >
          🐳 $5K+
        </Link>
        <Link
          href="/?amt=10000"
          className={`price-filter-btn ${amt === '10000' ? 'active' : ''}`}
        >
          🐳 $10K+
        </Link>
        {user && (
          <Link href="/" className="price-filter-btn clear-filter">
            ✕ Clear user
          </Link>
        )}
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
          <p>No trades found</p>
        </div>
      )}

      {!loading && !error && allTrades.length > 0 && (
        <div className="trades-table-container">
          <table className="trades-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('time')}>
                  Time {sortColumn === 'time' ? (sortDirection === 'desc' ? '▼' : '▲') : '⇅'}
                </th>
                <th>User</th>
                <th>Market</th>
                <th>Side</th>
                <th>Outcome</th>
                <th>Result</th>
                <th className="sortable" onClick={() => handleSort('odds')}>
                  Odds {sortColumn === 'odds' ? (sortDirection === 'desc' ? '▼' : '▲') : '⇅'}
                </th>
                <th className="sortable" onClick={() => handleSort('value')}>
                  Value {sortColumn === 'value' ? (sortDirection === 'desc' ? '▼' : '▲') : '⇅'}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTrades.map((trade, index) => (
                <tr
                  key={`${trade.transactionHash}-${index}`}
                  className="trade-row"
                >
                  <td className="time-cell">{formatTimeAgo(trade.timestamp)}</td>
                  <td className="user-cell">
                    <Link
                      href={`/?user=${trade.proxyWallet}`}
                      onClick={(e) => e.stopPropagation()}
                      className="user-link"
                    >
                      {trade.profileImage ? (
                        <img src={trade.profileImage} alt="" className="trade-avatar" />
                      ) : (
                        <div className="trade-avatar-placeholder" />
                      )}
                      <span>{trade.name || trade.pseudonym}</span>
                    </Link>
                  </td>
                  <td
                    className="market-cell"
                    onClick={() => window.open(`https://polymarket.com/event/${trade.eventSlug}`, '_blank')}
                    style={{ cursor: 'pointer' }}
                  >
                    {trade.title}
                  </td>
                  <td className={`side-cell ${trade.side.toLowerCase()}`}>
                    {trade.side === 'BUY' ? 'Buy' : 'Sell'}
                  </td>
                  <td>{trade.outcome}</td>
                  <td className="status-cell">
                    {(() => {
                      const resolution = eventResolutions.get(trade.eventSlug);
                      if (!resolution) return <span className="status-loading">-</span>;
                      if (!resolution.closed) return <span className="status-active">Active</span>;
                      const won = resolution.winningOutcome === trade.outcome;
                      return (
                        <span className={`status-resolved ${won ? 'won' : 'lost'}`}>
                          {resolution.winningOutcome}
                        </span>
                      );
                    })()}
                  </td>
                  <td>{(trade.price * 100).toFixed(0)}%</td>
                  <td className="size-cell">{formatSize(trade.size * trade.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
