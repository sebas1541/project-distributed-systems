import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async create(userId: string, createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      userId,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
    });
    return this.tasksRepository.save(task);
  }

  async findAll(userId: string): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id, userId },
    });
    
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    
    return task;
  }

  async update(id: string, userId: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id, userId);
    
    if (updateTaskDto.status === TaskStatus.COMPLETED && !task.completedAt) {
      task.completedAt = new Date();
    }
    
    Object.assign(task, updateTaskDto);
    
    if (updateTaskDto.dueDate) {
      task.dueDate = new Date(updateTaskDto.dueDate);
    }
    
    return this.tasksRepository.save(task);
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id, userId);
    await this.tasksRepository.remove(task);
  }

  async findByStatus(userId: string, status: TaskStatus): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { userId, status },
      order: { createdAt: 'DESC' },
    });
  }

  async findUpcoming(userId: string): Promise<Task[]> {
    const now = new Date();
    return this.tasksRepository
      .createQueryBuilder('task')
      .where('task.userId = :userId', { userId })
      .andWhere('task.dueDate >= :now', { now })
      .andWhere('task.status != :status', { status: TaskStatus.COMPLETED })
      .orderBy('task.dueDate', 'ASC')
      .getMany();
  }
}
