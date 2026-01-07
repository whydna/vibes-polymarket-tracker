'use client';

import type { PolymarketEvent } from '@/types';

interface EventCardProps {
  event: PolymarketEvent;
}

function formatVolume(num: number | undefined): string {
  if (num == null) return '$0';
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}K`;
  }
  return `$${num.toFixed(0)}`;
}

function formatPrice(price: string): string {
  const num = parseFloat(price);
  return `${(num * 100).toFixed(0)}%`;
}

export function EventCard({ event }: EventCardProps) {
  const handleClick = () => {
    window.open(`https://polymarket.com/event/${event.slug}`, '_blank');
  };

  // Get Yes price for a market
  const getYesPrice = (market: (typeof event.markets)[0]) => {
    if (!market.outcomePrices) return '—';
    const prices =
      typeof market.outcomePrices === 'string'
        ? JSON.parse(market.outcomePrices)
        : market.outcomePrices;
    if (!prices || !prices[0]) return '—';
    return formatPrice(prices[0]);
  };

  // Filter to active markets and limit display
  const activeMarkets = event.markets.filter((m) => !m.closed).slice(0, 4);

  // Sum volume and liquidity from all markets
  const totalVolume =
    event.volumeNum ??
    event.markets.reduce((sum, m) => sum + (m.volumeNum || 0), 0);
  const totalLiquidity =
    event.liquidityNum ??
    event.markets.reduce((sum, m) => sum + (m.liquidityNum || 0), 0);

  return (
    <div className="event-card" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="event-header">
        {event.image && (
          <img src={event.image} alt={event.title} className="event-image" />
        )}
        <div className="event-info">
          <h3 className="event-title">{event.title}</h3>
          {event.category && (
            <span className="event-category">{event.category}</span>
          )}
        </div>
      </div>

      {activeMarkets.length > 0 && (
        <div className="market-outcomes">
          {activeMarkets.map((market) => (
            <div key={market.id} className="outcome">
              <span className="outcome-name">
                {market.groupItemTitle || market.question}
              </span>
              <span className="outcome-price outcome-yes">{getYesPrice(market)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="event-stats">
        <div className="stat">
          <span className="stat-label">Volume</span>
          <span className="stat-value">{formatVolume(totalVolume)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Liquidity</span>
          <span className="stat-value">{formatVolume(totalLiquidity)}</span>
        </div>
      </div>

      {event.endDate && (
        <div className="event-end-date">
          Ends: {new Date(event.endDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
