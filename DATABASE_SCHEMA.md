# Database Schema Documentation

## Entity Relationship Diagram

```
┌─────────────────┐
│     Users       │
├─────────────────┤
│ id (PK)         │
│ email (UQ)      │
│ firstName       │
│ lastName        │
│ password        │
│ refreshToken    │
│ isActive        │
│ emailVerified   │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
        │
        │ 1:N
        ├─────────────────────────────┐
        │                             │
        ▼                             ▼
┌─────────────────┐          ┌─────────────────┐
│   Portfolios    │          │     Alerts      │
├─────────────────┤          ├─────────────────┤
│ id (PK)         │          │ id (PK)         │
│ userId (FK)     │          │ userId (FK)     │
│ name            │          │ cryptoId (FK)   │
│ description     │          │ condition       │
│ totalValue      │          │ targetPrice     │
│ totalCost       │          │ status          │
│ totalProfitLoss │          │ message         │
│ isActive        │          │ triggeredAt     │
│ createdAt       │          │ createdAt       │
│ updatedAt       │          │ updatedAt       │
└─────────────────┘          └─────────────────┘
        │                             │
        │ 1:N                         │
        ├──────────┬──────────────────┘
        │          │
        ▼          ▼                 ┌──────────────────────┐
┌─────────────────┐                 │  Cryptocurrencies    │
│  Transactions   │                 ├──────────────────────┤
├─────────────────┤                 │ id (PK)              │
│ id (PK)         │                 │ coinGeckoId (UQ)     │
│ portfolioId(FK) │◄────────────────│ symbol (UQ)          │
│ cryptoId (FK)   │                 │ name                 │
│ type            │                 │ image                │
│ quantity        │                 │ currentPrice         │
│ pricePerUnit    │                 │ marketCap            │
│ totalAmount     │                 │ marketCapRank        │
│ feeAmount       │                 │ totalVolume          │
│ notes           │                 │ priceChange24h       │
│ transactionDate │                 │ priceChangePerc24h   │
│ createdAt       │                 │ priceChangePerc7d    │
│ updatedAt       │                 │ priceChangePerc30d   │
└─────────────────┘                 │ ath / athDate        │
                                    │ atl / atlDate        │
┌─────────────────┐                 │ lastUpdated          │
│Portfolio Holdings│                │ createdAt            │
├─────────────────┤                 │ updatedAt            │
│ id (PK)         │                 └──────────────────────┘
│ portfolioId(FK) │                          │
│ cryptoId (FK)   │◄─────────────────────────┤
│ quantity        │                          │ 1:N
│ averageBuyPrice │                          │
│ totalCost       │                          ▼
│ currentValue    │                 ┌──────────────────────┐
│ profitLoss      │                 │   Price History      │
│ profitLossPct   │                 ├──────────────────────┤
│ createdAt       │                 │ id (PK)              │
│ updatedAt       │                 │ cryptoId (FK)        │
└─────────────────┘                 │ price                │
                                    │ marketCap            │
                                    │ volume               │
                                    │ timestamp            │
                                    │ createdAt            │
                                    └──────────────────────┘
```

## Table Descriptions

### Users
Stores user account information with secure password hashing.
- **Key Indexes**: email
- **Relations**: One-to-Many with Portfolios and Alerts

### Portfolios
Represents a user's cryptocurrency portfolio.
- **Key Indexes**: userId
- **Relations**: 
  - Many-to-One with Users
  - One-to-Many with Transactions and Holdings

### Transactions
Records all buy/sell transactions for tracking purposes.
- **Key Indexes**: portfolioId + createdAt, cryptoId + type, transactionDate
- **Relations**: Many-to-One with Portfolio and Cryptocurrency

### Portfolio Holdings
Current aggregated holdings per cryptocurrency in a portfolio.
- **Key Indexes**: portfolioId + cryptoId (unique)
- **Relations**: Many-to-One with Portfolio and Cryptocurrency

### Cryptocurrencies
Master table of supported cryptocurrencies with current market data.
- **Key Indexes**: coinGeckoId, symbol
- **Relations**: One-to-Many with Transactions, Holdings, Alerts, Price History

### Alerts
User-defined price alerts for notifications.
- **Key Indexes**: userId + status, cryptoId + status, status
- **Relations**: Many-to-One with User and Cryptocurrency

### Price History
Historical price data for analytics and charting.
- **Key Indexes**: cryptoId + timestamp, timestamp
- **Relations**: Many-to-One with Cryptocurrency

## Migration Commands

```bash
# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration (after entity changes)
npm run migration:generate -- src/database/migrations/MigrationName

# Seed initial data
npm run seed
```

## Indexes Strategy

1. **Primary Keys**: All tables use UUID for better distribution
2. **Foreign Keys**: Indexed for join performance
3. **Composite Indexes**: Used for common query patterns
4. **Unique Constraints**: Prevent data duplication

## Data Integrity

1. **CASCADE DELETE**: User deletion removes all portfolios, alerts
2. **RESTRICT DELETE**: Cannot delete cryptocurrency if referenced
3. **NOT NULL**: Required fields enforced at database level
4. **UNIQUE**: Email, coin symbols, and coinGeckoId are unique
