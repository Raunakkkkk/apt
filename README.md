# Real-Time Orders System

A real-time order tracking system built with Node.js, PostgreSQL, and WebSockets. **Why this approach?** Instead of traditional polling or client-side refresh mechanisms, I leveraged PostgreSQL's native NOTIFY/LISTEN feature to push database changes directly to connected clients, eliminating unnecessary network requests and providing true real-time updates.

## Key Features

- 🚀 **Zero-polling real-time updates**: PostgreSQL NOTIFY/LISTEN eliminates client-side polling
- 📡 **WebSocket communication**: Bidirectional real-time communication
- 🗄️ **Database-level triggers**: Change detection happens at the database layer
- 🎨 **React frontend**: Modern UI with webpack dev server
- 📊 **Activity logging**: Live feed of all database operations
- 🔄 **Auto-reconnection**: Graceful handling of connection drops

## Why This Architecture?

**Traditional approach**: Client polls server → Server queries database → Response sent back
**My approach**: Database change → NOTIFY → Server receives → WebSocket broadcast → Client updates

This eliminates polling overhead and provides instant updates with minimal latency.

## Project Structure

```
├── server.js              # Main server with Express + WebSocket
├── src/                   # React frontend
│   ├── App.js            # Main React component
│   ├── components/       # UI components
│   └── hooks/           # Custom React hooks
├── config/               # Configuration management
├── database/             # PostgreSQL LISTEN/NOTIFY setup
├── websocket/           # WebSocket server management
├── routes/              # API endpoints
└── init.sql             # Database schema with triggers
```

**Modular design**: Each directory has a single responsibility for maintainability.

## Quick Start

### 1. Database Setup

```sql
-- Create database and user
CREATE DATABASE orders_db;
CREATE USER orders_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE orders_db TO orders_user;
\c orders_db;
GRANT ALL ON SCHEMA public TO orders_user;
```

```bash
# Initialize schema with triggers
psql -U orders_user -d orders_db -f init.sql
```

### 2. Install & Run

```bash
npm install
npm run dev  # Starts both backend and frontend
```

- **Backend**: `http://localhost:3000` (API + WebSocket)
- **Frontend**: `http://localhost:3001` (React dev server)

### 3. Environment (Optional)

Create `.env` for custom configuration:

```env
PORT=3000
WS_PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_NAME=orders_db
DB_USER=orders_user
DB_PASSWORD=your_password
```

## How It Works

### The Magic: PostgreSQL NOTIFY/LISTEN

1. **Database Trigger**: When an order changes, PostgreSQL automatically fires a trigger
2. **NOTIFY**: The trigger sends a JSON notification to the `orders_changes` channel
3. **LISTEN**: Node.js server listens for these notifications via persistent connection
4. **WebSocket Broadcast**: Server forwards the notification to all connected clients
5. **Real-time UI Update**: React components update instantly without page refresh

### Key Components

- **`init.sql`**: Contains the trigger function that sends NOTIFY on any order change
- **`database/index.js`**: Maintains the LISTEN connection to PostgreSQL
- **`websocket/index.js`**: Manages WebSocket connections and broadcasts
- **`src/hooks/useWebSocket.js`**: React hook for WebSocket communication

## API Endpoints

- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `GET /api/health` - Health check

## Testing Real-time Updates

Open multiple browser tabs and try these:

```bash
# Create order (watch it appear in all tabs instantly)
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customer_name": "John Doe", "product_name": "Laptop", "status": "pending"}'

# Update order (watch status change in real-time)
curl -X PUT http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'
```

Or directly in the database:

```sql
INSERT INTO orders (customer_name, product_name, status)
VALUES ('Test Customer', 'Test Product', 'pending');
```

## Why This Approach Works Better

### Traditional Real-time Solutions:

- **Polling**: Client asks server every X seconds → Inefficient, delayed updates
- **Server-Sent Events**: One-way only, limited functionality
- **Message Queues**: Complex setup, additional infrastructure

### My PostgreSQL NOTIFY/LISTEN Solution:

- **Database-level triggers**: Changes detected instantly at the source
- **Zero polling**: Updates pushed only when changes occur
- **Built into PostgreSQL**: No additional infrastructure needed
- **Bidirectional**: Full WebSocket support for interactive features
- **Minimal latency**: Direct database → server → client pipeline

## Troubleshooting

**Database connection failed?**

- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify credentials in `.env` file

**WebSocket not connecting?**

- Ensure port 8080 is available
- Check browser console for errors

**Triggers not working?**

- Verify triggers exist: `\dft` in psql
- Check PostgreSQL logs for errors

## License

MIT License - feel free to use this code for your projects!
