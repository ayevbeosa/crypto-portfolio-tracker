import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Transaction } from './transaction.entity';
import { PortfolioHolding } from './portfolio-holding.entity';
import { Alert } from './alert.entity';
import { PriceHistory } from './price-history.entity';

@Entity('cryptocurrencies')
export class Cryptocurrency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  @Index()
  coinGeckoId: string;

  @Column({ unique: true, length: 10 })
  @Index()
  symbol: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  image: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  currentPrice: number;

  @Column({ type: 'bigint', default: 0 })
  marketCap: string;

  @Column({ type: 'int', nullable: true })
  marketCapRank: number;

  @Column({ type: 'bigint', default: 0 })
  totalVolume: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceChange24h: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceChangePercentage24h: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceChangePercentage7d: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceChangePercentage30d: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  ath: number;

  @Column({ type: 'timestamp', nullable: true })
  athDate: Date | null;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  atl: number;

  @Column({ type: 'timestamp', nullable: true })
  atlDate: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastUpdated: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Transaction, (transaction) => transaction.cryptocurrency)
  transactions: Transaction[];

  @OneToMany(() => PortfolioHolding, (holding) => holding.cryptocurrency)
  holdings: PortfolioHolding[];

  @OneToMany(() => Alert, (alert) => alert.cryptocurrency)
  alerts: Alert[];

  @OneToMany(() => PriceHistory, (history) => history.cryptocurrency, {
    cascade: true,
  })
  priceHistory: PriceHistory[];
}
