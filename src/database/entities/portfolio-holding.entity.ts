import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Cryptocurrency } from './cryptocurrency.entity';

@Entity('portfolio_holdings')
@Unique(['portfolioId', 'cryptoId'])
@Index(['portfolioId', 'cryptoId'])
export class PortfolioHolding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  portfolioId: string;

  @Column({ type: 'uuid' })
  cryptoId: string;

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  averageBuyPrice: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  totalCost: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  currentValue: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  profitLoss: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  profitLossPercentage: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Portfolio, (portfolio) => portfolio.holdings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'portfolioId' })
  portfolio: Portfolio;

  @ManyToOne(() => Cryptocurrency, (crypto) => crypto.holdings, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'cryptoId' })
  cryptocurrency: Cryptocurrency;
}
