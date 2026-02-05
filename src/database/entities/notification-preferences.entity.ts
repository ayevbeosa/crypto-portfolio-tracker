import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('notification_preferences')
export class NotificationPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  // Channel toggles
  @Column({ default: true })
  emailEnabled: boolean;

  @Column({ default: false })
  smsEnabled: boolean;

  @Column({ default: false })
  pushEnabled: boolean;

  @Column({ default: true })
  websocketEnabled: boolean;

  // Contact information
  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber: string;

  // Push notification device tokens (JSON array)
  @Column({ type: 'jsonb', nullable: true })
  pushTokens: string[];

  // Alert-specific preferences
  @Column({ default: true })
  priceAlerts: boolean;

  @Column({ default: true })
  portfolioUpdates: boolean;

  @Column({ default: false })
  marketNews: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
