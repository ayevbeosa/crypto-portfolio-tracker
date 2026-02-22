# 🚀 Crypto Portfolio Tracker API

A professional-grade cryptocurrency portfolio tracking system built with NestJS, featuring real-time price updates, multi-channel notifications, comprehensive analytics, and secure authentication.

[![NestJS](https://img.shields.io/badge/NestJS-v10-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7+-red)](https://redis.io/)

## ✨ Features

### 🔐 Authentication & Security

- JWT-based authentication with **access + refresh tokens**
- Secure password hashing with bcrypt
- Rate limiting (100 req/min per IP)
- Helmet security headers
- CORS configuration
- Request validation with class-validator

### 💼 Portfolio Management

- Create and manage **multiple portfolios**
- Track holdings across different cryptocurrencies
- Automatic portfolio value calculations
- Real-time profit/loss tracking
- Portfolio summaries with ROI metrics

### 💰 Transaction Tracking

- Record **BUY/SELL** transactions
- Automatic holding updates on transaction
- Fee tracking and calculation
- Historical transaction records
- Profit/loss per transaction

### 📊 Cryptocurrency Data

- **CoinGecko API** integration (300+ cryptocurrencies)
- Real-time price updates (every 5 minutes)
- Redis caching (5-min prices, 1-hour history)
- Price history storage
- Market cap, volume, and 24h change tracking
- Search and filtering

### 📡 Real-Time Updates (WebSocket)

- Live price streaming via **Socket.IO**
- Subscription-based updates (subscribe to specific symbols)
- Portfolio value updates
- Alert notifications
- Connection management and stats
- JWT authentication support

### 🔔 Price Alerts

- Set alerts for **ABOVE/BELOW** price targets
- Automatic monitoring (every minute)
- Alert history tracking
- Duplicate alert prevention
- Alert statistics

### 📧 Multi-Channel Notifications

- **Email** notifications (HTML templates, SMTP/Gmail/SendGrid)
- **SMS** notifications (Twilio integration)
- **Push** notifications (Firebase Cloud Messaging - iOS + Android)
- **WebSocket** real-time notifications
- Per-user notification preferences
- Test notification endpoints

### 📈 Analytics & Insights

- **ROI time-series** with data points
- **Asset allocation** breakdown
- **Performance ranking** (top/bottom performers)
- **Transaction history** charts
- **Fee analytics**
- **Dashboard summary** with aggregate metrics
- Portfolio-specific or account-wide analytics

### 🏥 Production-Ready Infrastructure

- Health checks (readiness, liveness)
- Comprehensive error handling
- Request/response logging
- Global exception filters
- Response transformation interceptors
- **Swagger/OpenAPI** documentation
- Docker & Docker Compose setup

## 📋 Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+
- **Redis** 7+
- **Docker** (optional but recommended)

## 🛠️ Installation

### Quick Start (Recommended)

The fastest way to get started is using our quick start script:

```bash
# Run the quick start script
./quick-start.sh
```

This will:

1. Create `.env` file from template
2. Start PostgreSQL and Redis with Docker
3. Install dependencies
4. Run database migrations
5. Seed initial data

Then start the development server:

```bash
npm run start:dev
```

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd crypto-portfolio-tracker

# Copy environment file
cp .env.example .env

# Start services with Docker Compose
docker-compose up -d
```

### Manual Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start PostgreSQL and Redis (if not using Docker)
# Update .env with your database credentials

# Run migrations
npm run migration:run

# Start the application
npm run start:dev
```

## 📚 API Documentation

Once the application is running, visit:

- Swagger UI: `http://localhost:3000/api/docs`
- API: `http://localhost:3000/api/v1`

## 🏗️ Project Structure

```
src/
├── config/              # Configuration files
├── common/              # Shared utilities, decorators, guards
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   └── filters/
├── modules/
│   ├── auth/           # Authentication & authorization
│   ├── users/          # User management
│   ├── portfolios/     # Portfolio CRUD operations
│   ├── transactions/   # Transaction management
│   ├── crypto/         # Cryptocurrency data & prices
│   ├── alerts/         # Price alerts
│   ├── analytics/      # Portfolio analytics
|   |–– notifications/  # Multi-channel notifications
│   └── websocket/      # Real-time updates
├── database/
│   ├── entities/       # TypeORM entities
│   └── migrations/     # Database migrations
└── main.ts             # Application entry point
```

## 🔑 Environment Variables

See `.env.example` for all required environment variables.

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Available Scripts

- `npm run start:dev` - Start development server
- `npm run start:prod` - Start production server
- `npm run build` - Build for production
- `npm run lint` - Lint code
- `npm run format` - Format code
- `npm run migration:generate` - Generate new migration
- `npm run migration:run` - Run migrations

## 🔐 Authentication Flow

1. Register: `POST /api/v1/auth/register`
2. Login: `POST /api/v1/auth/login` (returns access & refresh tokens)
3. Use access token in Authorization header: `Bearer <token>`
4. Refresh token: `POST /api/v1/auth/refresh`

## 📊 Key Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### Portfolios

- `GET /api/v1/portfolios` - Get all user portfolios
- `POST /api/v1/portfolios` - Create new portfolio
- `GET /api/v1/portfolios/:id` - Get portfolio details
- `PATCH /api/v1/portfolios/:id` - Update portfolio
- `DELETE /api/v1/portfolios/:id` - Delete portfolio

### Transactions

- `POST /api/v1/transactions` - Add transaction
- `GET /api/v1/transactions` - Get all transactions
- `GET /api/v1/transactions/:id` - Get transaction details

### Crypto Prices

- `GET /api/v1/crypto/prices` - Get current prices
- `GET /api/v1/crypto/:symbol` - Get crypto details
- `GET /api/v1/crypto/:symbol/history` - Get price history

### Analytics

- `GET /api/v1/analytics/portfolio/:id` - Get portfolio analytics
- `GET /api/v1/analytics/performance/:id` - Get performance metrics

## 🌐 WebSocket Events

Connect to `ws://localhost:3001`

### Subscribe to price updates:

```javascript
socket.emit('subscribe', { symbols: ['BTC', 'ETH'] });
```

### Receive price updates:

```javascript
socket.on('price-update', (data) => {
  console.log(data); // { symbol: 'BTC', price: 45000, change24h: 2.5 }
});
```

## 🚀 Deployment

The application is containerized and ready for deployment to any platform supporting Docker:

- AWS ECS/EKS
- Google Cloud Run
- Azure Container Instances
- Heroku
- DigitalOcean App Platform

## 📝 License

MIT

## 👨‍💻 Author

Ayevbeosa Iyamu - [ayevbeosa.j@gmail.com]
