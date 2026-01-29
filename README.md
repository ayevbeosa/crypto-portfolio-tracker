# Crypto Portfolio Tracker API

A professional-grade cryptocurrency portfolio tracking system built with NestJS, featuring real-time price updates, comprehensive analytics, and secure authentication.

## 🚀 Features

- **User Authentication & Authorization**: JWT-based authentication with refresh tokens
- **Portfolio Management**: Create and manage multiple cryptocurrency portfolios
- **Real-time Price Updates**: WebSocket integration for live price tracking
- **Transaction Tracking**: Record buy/sell transactions with profit/loss calculations
- **Performance Analytics**: Historical performance tracking and portfolio analytics
- **Price Alerts**: Set custom price alerts for cryptocurrencies
- **Rate Limiting**: Built-in request throttling for API protection
- **Caching**: Redis-based caching for optimized performance
- **API Documentation**: Auto-generated Swagger documentation
- **Error Handling**: Comprehensive error handling and logging

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose (optional)

## 🛠️ Installation

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/ayevbeosa/crypto-portfolio-tracker
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
│   ├── filters/
│   └── pipes/
├── modules/
│   ├── auth/           # Authentication & authorization
│   ├── users/          # User management
│   ├── portfolios/     # Portfolio CRUD operations
│   ├── transactions/   # Transaction management
│   ├── crypto/         # Cryptocurrency data & prices
│   ├── alerts/         # Price alerts
│   ├── analytics/      # Portfolio analytics
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

Your Name - [Your Email]