import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Cryptocurrency } from './cryptocurrency.entity';

@Entity('price_history')
@Index(['cryptoId', 'timestamp'])
export class PriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  cryptoId: string;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  price: number;

  @Column({ type: 'bigint' })
  marketCap: string;

  @Column({ type: 'bigint' })
  volume: string;

  @Column({ type: 'timestamp' })
  @Index()
  timestamp: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Cryptocurrency, (crypto) => crypto.priceHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cryptoId' })
  cryptocurrency: Cryptocurrency;
}
