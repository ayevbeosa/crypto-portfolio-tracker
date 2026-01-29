import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';
import { PortfolioHolding } from './portfolio-holding.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  totalValue: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  totalCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalProfitLoss: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalProfitLossPercentage: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.portfolios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.portfolio, {
    cascade: true,
  })
  transactions: Transaction[];

  @OneToMany(() => PortfolioHolding, (holding) => holding.portfolio, {
    cascade: true,
  })
  holdings: PortfolioHolding[];
}
