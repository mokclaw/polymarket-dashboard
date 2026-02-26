# Polymarket Dashboard

Web dashboard for monitoring large Polymarket trades (>$25,000) from new accounts.

## Features

- **Real-time Stats** — Total trades, volume, unique traders, new account activity
- **Trade History** — Browse recent large trades with market details
- **Trader Leaderboard** — Top traders by volume and activity
- **Alerts** — Notifications for large trades from new accounts
- **Auto-refresh** — Data updates every 30 seconds

## Screenshots

![Dashboard Preview](screenshot.png)

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

Then open http://localhost:3000

## Requirements

- Node.js 16+
- SQLite database from [polymarket-monitor](https://github.com/mokclaw/polymarket-monitor)

## Database Setup

The dashboard expects the SQLite database at:
```
../polymarket-monitor/polymarket_trades.db
```

You can change this in `server.js` by modifying the `DB_PATH` variable.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/stats` | Overall statistics |
| `GET /api/trades` | Recent trades (query: `limit`, `offset`) |
| `GET /api/traders` | Top traders by volume |
| `GET /api/alerts` | Alert history |

## Tech Stack

- **Backend**: Node.js, Express, SQLite3
- **Frontend**: Vanilla JS, CSS Grid/Flexbox
- **Real-time**: WebSocket for live updates

## Related Projects

- [polymarket-monitor](https://github.com/mokclaw/polymarket-monitor) — Data collection backend

## License

MIT
