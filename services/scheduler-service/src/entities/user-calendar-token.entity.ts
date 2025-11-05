import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_calendar_tokens')
export class UserCalendarToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: string;

  @Column('text')
  accessToken: string;

  @Column('text')
  refreshToken: string;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  calendarId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
