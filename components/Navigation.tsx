'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      <Link
        href="/"
        className={`nav-link ${pathname === '/' ? 'active' : ''}`}
      >
        Events
      </Link>
      <Link
        href="/live"
        className={`nav-link ${pathname === '/live' ? 'active' : ''}`}
      >
        Live Trades
      </Link>
      <Link
        href="/whales"
        className={`nav-link ${pathname === '/whales' ? 'active' : ''}`}
      >
        Whales
      </Link>
    </nav>
  );
}
