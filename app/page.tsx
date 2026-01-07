'use client';

import { useState, useEffect } from 'react';
import type { PolymarketEvent } from '@/types';
import { EventCard } from '@/components/EventCard';

const GAMMA_API_URL = '/api/polymarket';

export default function EventsPage() {
  const [events, setEvents] = useState<PolymarketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('active');

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          limit: '50',
          active: filter === 'active' ? 'true' : filter === 'closed' ? 'false' : '',
          closed: filter === 'closed' ? 'true' : 'false',
          order: 'startDate',
          ascending: 'false',
        });

        // Remove empty params
        for (const [key, value] of [...params.entries()]) {
          if (value === '') params.delete(key);
        }

        const response = await fetch(`${GAMMA_API_URL}/events?${params}`);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setEvents(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch events');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [filter]);

  return (
    <>
      <div className="filters">
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`filter-btn ${filter === 'closed' ? 'active' : ''}`}
          onClick={() => setFilter('closed')}
        >
          Closed
        </button>
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading events...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="empty">
          <p>No events found</p>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="events-grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </>
  );
}
