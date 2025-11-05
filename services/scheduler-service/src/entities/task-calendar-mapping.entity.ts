import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('task_calendar_mappings')
@Index(['taskId', 'userId'], { unique: true })
export class TaskCalendarMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  taskId: string;

  @Column()
  userId: string;

  @Column()
  googleEventId: string;

  @Column({ nullable: true })
  calendarId: string;

  @CreateDateColumn()
  createdAt: Date;
}
