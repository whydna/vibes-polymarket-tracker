export interface Market {
  id: string;
  question: string;
  slug: string;
  conditionId: string;
  outcomes: string | string[];
  outcomePrices: string | string[];
  volume: string;
  volumeNum: number;
  liquidity: string;
  liquidityNum: number;
  active: boolean;
  closed: boolean;
  image?: string;
  icon?: string;
  endDate?: string;
  createdAt: string;
  oneDayPriceChange?: number;
  groupItemTitle?: string;
}

export interface PolymarketEvent {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  description: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  volume?: string;
  volumeNum?: number;
  liquidity?: string;
  liquidityNum?: number;
  markets: Market[];
  image?: string;
}

export interface Trade {
  name: string;
  pseudonym: string;
  profileImage?: string;
  side: 'BUY' | 'SELL';
  size: number;
  price: number;
  outcome: string;
  title: string;
  timestamp: number;
  eventSlug: string;
  icon?: string;
  transactionHash?: string;
}
