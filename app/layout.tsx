import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Polymarket Tracker',
  description: 'Track Polymarket events and trades',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="app">
          <header className="header">
            <h1>Polymarket Tracker</h1>
          </header>

          <main className="main">{children}</main>

          <footer className="footer">
            <p>
              Data from{' '}
              <a
                href="https://polymarket.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Polymarket
              </a>
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
