import { Routes, Route, NavLink } from 'react-router-dom';
import { Events } from './pages/Events';
import { LiveTrades } from './pages/LiveTrades';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Polymarket Tracker</h1>
        <nav className="nav">
          <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end>
            Events
          </NavLink>
          <NavLink to="/live" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Live Trades
          </NavLink>
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<Events />} />
          <Route path="/live" element={<LiveTrades />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>
          Data from{' '}
          <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer">
            Polymarket
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
