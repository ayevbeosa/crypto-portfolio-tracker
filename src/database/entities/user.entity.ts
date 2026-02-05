import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Portfolio } from './portfolio.entity';
import { Alert } from './alert.entity';
import { NotificationPreferences } from './notification-preferences.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  @Index()
  email: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column()
  @Exclude() // Exclude from JSON responses
  password: string;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Portfolio, (portfolio) => portfolio.user, {
    cascade: true,
  })
  portfolios: Portfolio[];

  @OneToMany(() => Alert, (alert) => alert.user, {
    cascade: true,
  })
  alerts: Alert[];

  @OneToOne(() => NotificationPreferences, (prefs) => prefs.user, {
    cascade: true,
  })
  notificationPreferences: NotificationPreferences;
}
