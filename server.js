const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, '..', '..', '.openclaw', 'workspace', 'polymarket_trades.db');

// Serve static files
app.use(express.static('public'));

// API Routes
app.get('/api/trades', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  
  db.all(
    `SELECT * FROM trades 
     WHERE isSports = 0 
     ORDER BY timestamp DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
      db.close();
    }
  );
});

app.get('/api/stats', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  db.get(
    `SELECT 
      COUNT(*) as totalTrades,
      COUNT(DISTINCT traderAddress) as uniqueTraders,
      SUM(size) as totalVolume,
      AVG(size) as avgSize,
      MAX(size) as maxSize,
      SUM(CASE WHEN isNewAccount = 1 THEN 1 ELSE 0 END) as newAccountTrades
    FROM trades 
    WHERE isSports = 0`,
    [],
    (err, stats) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(stats);
      }
      db.close();
    }
  );
});

app.get('/api/alerts', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  
  db.all(
    `SELECT a.*, t.marketQuestion, t.size, t.traderAddress, t.timestamp
     FROM alerts a
     JOIN trades t ON a.tradeId = t.id
     ORDER BY a.createdAt DESC
     LIMIT 50`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
      db.close();
    }
  );
});

app.get('/api/traders', (req, res) => {
  const db = new sqlite3.Database(DB_PATH);
  
  db.all(
    `SELECT 
      traderAddress,
      COUNT(*) as tradeCount,
      SUM(size) as totalVolume,
      AVG(size) as avgSize,
      MAX(size) as maxSize,
      MIN(timestamp) as firstTrade,
      MAX(timestamp) as lastTrade
    FROM trades 
    WHERE isSports = 0
    GROUP BY traderAddress
    ORDER BY totalVolume DESC
    LIMIT 100`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
      db.close();
    }
  );
});

// WebSocket for real-time updates
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial data
  const db = new sqlite3.Database(DB_PATH);
  db.get('SELECT COUNT(*) as count FROM trades', [], (err, row) => {
    if (!err) {
      ws.send(JSON.stringify({ type: 'stats', data: row }));
    }
    db.close();
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Broadcast updates to all clients
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

server.listen(PORT, () => {
  console.log(`Polymarket Dashboard running on http://localhost:${PORT}`);
});
