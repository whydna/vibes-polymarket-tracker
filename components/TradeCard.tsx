'use client';

import type { Trade } from '@/types';

interface TradeCardProps {
  trade: Trade;
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

export function TradeCard({ trade }: TradeCardProps) {
  const handleClick = () => {
    window.open(`https://polymarket.com/event/${trade.eventSlug}`, '_blank');
  };

  return (
    <div className="trade-card" onClick={handleClick}>
      <div className="trade-user">
        {trade.profileImage ? (
          <img src={trade.profileImage} alt="" className="trade-avatar" />
        ) : (
          <div className="trade-avatar-placeholder" />
        )}
        <span className="trade-username">{trade.name || trade.pseudonym}</span>
      </div>

      <div className="trade-action">
        <span className={`trade-side ${trade.side.toLowerCase()}`}>
          {trade.side === 'BUY' ? 'Bought' : 'Sold'}
        </span>
        <span className="trade-outcome">{trade.outcome}</span>
      </div>

      <div className="trade-details">
        <span className="trade-size">{formatSize(trade.size)}</span>
        <span className="trade-price">@ {(trade.price * 100).toFixed(0)}%</span>
      </div>

      <div className="trade-event">
        {trade.icon && (
          <img src={trade.icon} alt="" className="trade-event-icon" />
        )}
        <span className="trade-event-title">{trade.title}</span>
      </div>

      <div className="trade-time">{formatTimeAgo(trade.timestamp)}</div>
    </div>
  );
}
