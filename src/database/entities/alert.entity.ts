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
import { User } from './user.entity';
import { Cryptocurrency } from './cryptocurrency.entity';

export enum AlertCondition {
  ABOVE = 'ABOVE',
  BELOW = 'BELOW',
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  TRIGGERED = 'TRIGGERED',
  CANCELLED = 'CANCELLED',
}

@Entity('alerts')
@Index(['userId', 'status'])
@Index(['cryptoId', 'status'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  cryptoId: string;

  @Column({ type: 'enum', enum: AlertCondition })
  condition: AlertCondition;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  targetPrice: number;

  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.ACTIVE })
  @Index()
  status: AlertStatus;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'timestamp', nullable: true })
  triggeredAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.alerts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Cryptocurrency, (crypto) => crypto.alerts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cryptoId' })
  cryptocurrency: Cryptocurrency;
}
