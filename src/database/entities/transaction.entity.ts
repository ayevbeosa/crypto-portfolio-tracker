import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Cryptocurrency } from './cryptocurrency.entity';

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

@Entity('transactions')
@Index(['portfolioId', 'createdAt'])
@Index(['cryptoId', 'type'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'uuid' })
  portfolioId: string;

  @Column({ type: 'uuid' })
  cryptoId: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  quantity: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  pricePerUnit: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  feeAmount: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'timestamp' })
  @Index()
  transactionDate: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Portfolio, (portfolio) => portfolio.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'portfolioId' })
  portfolio: Portfolio;

  @ManyToOne(() => Cryptocurrency, (crypto) => crypto.transactions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'cryptoId' })
  cryptocurrency: Cryptocurrency;
}
